# token-lifecycle Specification

**Capability**: token-lifecycle
**Change**: harden-token-lifecycle
**Status**: implemented
**Fecha**: 2026-06-05

---

## Contexto

El access token del realm Keycloak `crm2-local` dura **300s (5 min)**
(`accessTokenLifespan`). La sesión SSO muere tras **30 min de inactividad**
(`ssoSessionIdleTimeout=1800s`) y tiene un tope duro de **10 h**
(`ssoSessionMaxLifespan=36000s`). No hay un lifespan separado para el refresh token: su vida
útil está atada al idle/max de la SSO session. El client `crm2-frontend` es `publicClient`
(PKCE) sin overrides de lifespan (verificado en `AR-CRM/Keycloak/realm-export.json`).

El front renovaba el token **al filo** (intervalo de 300s contra un lifespan de 300s), lo que
podía dejar salir requests con token vencido ante latencia o timers throttleados (tab en
background) → 401 espurios. Esta capability define un ciclo de vida **robusto**: refresco con
margen, defensa en profundidad y corte limpio de sesión expirada.

Estrategia elegida (por el usuario): refresco en **3 capas** —
(1) intervalo con margen, (2) refresh proactivo on-demand antes de cada request,
(3) red de seguridad `keycloak.onTokenExpired`.

Constantes: `ACCESS_TOKEN_LIFESPAN=300s` (del realm, no se toca), `MIN_VALIDITY=120s`
(margen), `REFRESH_INTERVAL=60s` (tick de chequeo).

---

## Requirements

---

### Requirement: Refresh del access token con margen antes de expirar

El sistema MUST renovar el access token **antes** de su vencimiento, con margen suficiente
para que ninguna request salga con token vencido en uso normal. El intervalo de refresh MUST
ser sensiblemente menor al `accessTokenLifespan` (300s) y el refresh MUST usar un `minValidity`
que dispare la renovación con margen (~120s antes de expirar), NO al filo.

#### Scenario: El token se renueva con margen, no al filo [unit test]

- GIVEN un access token con `accessTokenLifespan` de 300s
- WHEN el hook de refresh corre en su intervalo (~60s)
- THEN llama a `keycloak.updateToken(minValidity)` con `minValidity` ~120s
- AND el token se renueva cuando le quedan ≤120s de validez (≈2 min de margen)

#### Scenario: No hay 401 espurios por timing en uso normal [integration test]

- GIVEN un usuario autenticado y activo
- WHEN realiza requests al back de forma continua durante varios ciclos de refresh
- THEN ninguna request recibe 401 por token vencido por timing del refresh

---

### Requirement: Refresh proactivo on-demand previo a cada request

El sistema MUST asegurar un token fresco **antes** de enviar cada request autenticada,
invocando `updateToken(minValidity)` al inicio de `src/api/client.ts`. Esta verificación MUST
ser un no-op barato (sin red) cuando el token aún es válido, y solo renovar cuando está cerca
de expirar. Cubre el caso de timers throttleados (tab en background).

#### Scenario: Request con token por vencer se refresca antes de salir [unit test]

- GIVEN un token al que le quedan <120s de validez (ej. tab volvió de background)
- WHEN se inicia una request en `api/client.ts`
- THEN se refresca el token proactivamente antes de enviar
- AND la request sale con el token renovado

#### Scenario: Request con token válido no genera red extra [unit test]

- GIVEN un token con validez holgada (>120s)
- WHEN se inicia una request
- THEN `updateToken(minValidity)` resuelve sin llamada de red (no refresca)

---

### Requirement: Red de seguridad ante expiración (onTokenExpired)

El sistema MUST registrar `keycloak.onTokenExpired` como último recurso: si el token expira
pese a las capas anteriores, MUST intentar un refresh y, si falla, MUST disparar el corte de
sesión expirada. El handler MUST limpiarse al desmontar para no fugar callbacks.

#### Scenario: Token expira pese al intervalo y se recupera [unit test]

- GIVEN un token que expiró sin que el intervalo lo renovara
- WHEN dispara `onTokenExpired`
- THEN se intenta un refresh
- AND si el refresh tiene éxito, la sesión continúa sin intervención del usuario

#### Scenario: El handler se desregistra al desmontar [unit test]

- GIVEN el hook `useTokenRefresh` montado con `onTokenExpired` registrado
- WHEN el componente se desmonta
- THEN se ejecuta la función de limpieza y `keycloak.onTokenExpired` deja de apuntar al callback

---

### Requirement: Corte limpio de sesión expirada irrecuperable

Cuando el refresh falla porque el refresh token / SSO session de Keycloak venció
(idle 30 min `ssoSessionIdleTimeout`, o max 10 h `ssoSessionMaxLifespan`), el sistema MUST
desloguear de forma limpia, redirigir a `/login` y mostrar un mensaje claro de sesión
expirada. El logout MUST ser **idempotente**: múltiples disparos (intervalo + client +
onTokenExpired) NO deben producir estados inconsistentes ni redirects/toasts duplicados.

#### Scenario: Refresh token vencido desloguea limpio [integration test]

- GIVEN una sesión cuyo refresh token venció (30 min idle o 10 h max)
- WHEN cualquier capa intenta refrescar y falla
- THEN se ejecuta logout limpio (estado de auth en null)
- AND se redirige a `/login`
- AND se muestra un mensaje claro de "sesión expirada"

#### Scenario: Disparos concurrentes de logout no duplican efectos [unit test]

- GIVEN un corte de sesión ya en curso
- WHEN otra capa intenta disparar el corte nuevamente
- THEN el logout no se ejecuta dos veces (idempotente)
- AND no hay redirects ni toasts duplicados

---

### Requirement: Manejo de 401/403 sin loops

El sistema MUST reintentar una request fallida con 401 **a lo sumo una vez** tras refrescar
el token; si el reintento vuelve a fallar, MUST ir al corte de sesión sin recursión infinita.
El 403 MUST seguir propagándose como `HttpError` honesto (sin logout, sin atribuirlo a rol),
conservando el comportamiento de la capability `frontend-authorization`.

#### Scenario: 401 reintenta una sola vez [unit test]

- GIVEN una request que recibe 401 estando autenticado
- WHEN `api/client.ts` refresca y reintenta
- THEN el reintento se hace con `retryAfterRefresh=false`
- AND si vuelve a dar 401, NO se reintenta de nuevo (sin loop)

#### Scenario: 403 se propaga honesto [unit test]

- GIVEN una request que recibe 403 del back
- WHEN `api/client.ts` procesa la respuesta
- THEN propaga `HttpError` con el mensaje del back
- AND NO dispara logout ni mensaje de "rol"

---

## Out of Scope

- Cambiar los lifespans del realm Keycloak (config del back; ya verificados). Si hiciera falta
  subir el `accessTokenLifespan`, es coordinación con el dev del back (`realm-export.json`).
- Modelo de sesión (`align-session-model-to-backend`, commit `ee6b98d`) y autorización
  (`align-authorization-to-backend-reality`).
- Modificar el código del back. El CORS de `/api/**` fue VERIFICADO (permite
  GET/POST/PUT/PATCH/DELETE/OPTIONS desde `localhost:5173`); sin acción pendiente.
