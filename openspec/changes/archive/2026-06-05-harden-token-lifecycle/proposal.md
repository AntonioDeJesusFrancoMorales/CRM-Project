# Proposal: harden-token-lifecycle (Change 3 — auth track)

## Intent

Hacer **robusto** el ciclo de vida del token en el front. Hoy el refresh corre con un
timing tan justo que puede dejar salir requests con el access token ya vencido, generando
401 espurios en uso normal. Este change introduce **margen** en el refresh, endurece el
manejo de 401/403 en `api/client.ts` (sin loops), y define un corte **limpio** cuando la
sesión de Keycloak realmente expira (logout + redirect a `/login` con mensaje claro).

## Realidad de Keycloak (VERIFICADA leyendo AR-CRM/Keycloak/realm-export.json)

Lifespans reales del realm `crm2-local` (NO estimados — leídos del export):

| Parámetro | Valor | Significado |
|-----------|-------|-------------|
| `accessTokenLifespan` | **300s (5 min)** | Vida del access token que viaja en cada request al back. |
| `ssoSessionIdleTimeout` | **1800s (30 min)** | La sesión muere tras 30 min de **inactividad**. Cada refresh resetea el contador. |
| `ssoSessionMaxLifespan` | **36000s (10 h)** | Tope **duro**: re-login obligatorio a las 10 h, haya o no actividad. |

- El client `crm2-frontend` es `publicClient` (PKCE, `standardFlow`) y **no tiene overrides**
  de lifespan → valen los valores del realm.
- **No hay** un `refreshTokenLifespan` separado: la vida útil del refresh token está atada a
  `ssoSessionIdleTimeout` (30 min idle) y acotada por `ssoSessionMaxLifespan` (10 h).

Conclusión: el margen para refrescar es **cómodo** (refresh aguanta hasta 30 min idle),
así que el bug actual es puro timing del front, NO una limitación de Keycloak.

## Estado actual del front (VERIFICADO)

- `src/features/auth/hooks/useTokenRefresh.ts:6,34` → `TOKEN_REFRESH_INTERVAL = 300s` y el
  token dura 300s: el refresh corre **al filo** del vencimiento. Si un tick se atrasa
  (tab en background, throttling de timers del browser), una request puede salir vencida.
- `src/lib/keycloak.ts:99` → `refreshToken()` hace `keycloak.updateToken(300)`. Como al
  token SIEMPRE le quedan ≤300s, esto siempre refresca; el margen que falta está en el
  **intervalo**, no en `updateToken`.
- `src/api/client.ts:32-45` → ante 401, si autenticado y `retryAfterRefresh`, refresca y
  reintenta **una** vez; si la sesión Keycloak está ausente y había token, desloguea. 403 se
  propaga como `HttpError` sin desloguear (correcto: el back no autoriza por rol).
- `src/store/authStore.ts:54-71` → `refreshKeycloakToken()` actualiza el token tras refresh;
  `getCurrentToken()` devuelve el token vigente de keycloak/estado.
- No hay manejo de `keycloak.onTokenExpired`, ni refresh proactivo previo a cada request, ni
  un corte explícito para "refresh token vencido" (idle 30 min / max 10 h).

## Decisión

Estrategia de refresh en **tres capas** que se complementan (defensa en profundidad):

1. **Intervalo con margen** en `useTokenRefresh`: refrescar cada ~60s usando
   `updateToken(minValidity)` con `minValidity` ~120s. Así se renueva ~2 min antes de vencer,
   no al filo de los 300s.
2. **Refresh proactivo on-demand** en `api/client.ts`: antes de cada request, asegurar token
   fresco vía `updateToken(minValidity)` (no-op barato si aún es válido). Cubre el caso de
   tab en background donde el `setInterval` quedó throttleado.
3. **Red de seguridad** con `keycloak.onTokenExpired`: si igual se vence, intentar un refresh;
   si falla, ir al corte de sesión expirada.

Corte de sesión expirada (irrecuperable): cuando `updateToken`/refresh **falla** porque el
refresh token/SSO session venció (idle 30 min o max 10 h) → logout limpio + redirect a
`/login` con mensaje claro. Un **solo** retry por request para no entrar en loops.

## Scope

### In Scope

- `src/features/auth/hooks/useTokenRefresh.ts`: intervalo corto (~60s) + `updateToken` con
  margen (`minValidity` ~120s); registrar/limpiar `keycloak.onTokenExpired`.
- `src/lib/keycloak.ts`: parametrizar `refreshToken(minValidity)` con margen configurable;
  exponer un helper para registrar `onTokenExpired`.
- `src/api/client.ts`: refresh proactivo previo a la request (margen) + endurecer 401
  (refresh→retry **una** vez→logout) y mantener 403 honesto; garantizar no-loops.
- Corte limpio de sesión expirada: logout + redirect a `/login` con mensaje (toast/estado).
- Verificar (lado back) que el CORS de Spring (`:8080`) permita GET/POST/PATCH/DELETE desde
  el front, no solo GET — Tarea de verificación, NO se cambia el back en este change.

### Out of Scope

- Cambiar los lifespans del realm (config de Keycloak, lado del back). Ya verificados; si
  hubiera que subir el access token lifespan, es coordinación con el dev del back.
- Modelo de sesión (Change 1, completado `ee6b98d`) y autorización (Change 2, archivado).
- Modificar el código del back. La verificación de CORS puede derivar en un pedido al back,
  pero el cambio en sí vive fuera de este change del front.

## Capabilities

### New Capabilities

- `token-lifecycle`: el front mantiene el access token válido con margen, evita 401 espurios
  por timing, y corta limpio (logout + redirect + mensaje) cuando la sesión de Keycloak
  expira de verdad, sin loops ni estados inconsistentes.

### Modified Capabilities

- Ninguna capability previa se deroga. Se endurece el flujo de auth ya existente.

## Approach

1. `keycloak.ts`: `refreshToken(minValidity = 120)` → `updateToken(minValidity)`; agregar
   `registerOnTokenExpired(cb)` que setea `keycloak.onTokenExpired`.
2. `authStore.refreshKeycloakToken(minValidity?)`: pasar el margen hacia `refreshToken`.
3. `useTokenRefresh`: bajar el intervalo a ~60s; en cada tick `refreshKeycloakToken(120)`;
   registrar `onTokenExpired` → si el refresh falla, disparar el corte de sesión.
4. `api/client.ts`: al inicio de `request()`, si autenticado, `await refreshKeycloakToken(120)`
   (proactivo). Mantener la rama 401 (refresh→retry una vez→logout) y 403 honesto. Asegurar
   que el corte de sesión (logout + redirect/mensaje) sea único y no recursivo.
5. Verificación de CORS del back para todos los métodos (curl/preflight o leer `SecurityConfig`
   del AR-CRM); documentar el resultado. Si falta un método, abrir pedido al back.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/features/auth/hooks/useTokenRefresh.ts` | Modified | Intervalo ~60s + refresh con margen + `onTokenExpired` |
| `src/lib/keycloak.ts` | Modified | `refreshToken(minValidity)` parametrizable + helper `onTokenExpired` |
| `src/store/authStore.ts` | Modified | `refreshKeycloakToken(minValidity?)` propaga el margen |
| `src/api/client.ts` | Modified | Refresh proactivo previo + 401 endurecido (single retry) + corte limpio |
| AR-CRM `SecurityConfig` (CORS) | Verify-only | Confirmar GET/POST/PATCH/DELETE desde el front (no se cambia acá) |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Refresh proactivo en cada request agrega latencia | Med | `updateToken(minValidity)` es no-op si el token aún es válido (sin red); solo refresca cerca del vencimiento |
| Loop de refresh/retry/logout | Med | Single retry por request (`retryAfterRefresh=false` en el reintento); corte de sesión idempotente |
| Tests existentes asumen intervalo de 300s / `updateToken(300)` | Med | Se actualizan en este change |
| Doble disparo de logout (interval + client + onTokenExpired) | Low | Logout idempotente; guard de "ya deslogueando" |
| CORS del back solo permite GET | Low | Se verifica explícitamente; si falla, pedido al back (fuera de este change) |

## Rollback Plan

Cambios aislados en 4 archivos del front. Revertir vía `git revert` del commit del change.
No hay migraciones ni cambios de contrato con el back.

## Dependencies

- Change 1 `align-session-model-to-backend` (completado, commit `ee6b98d`) — VERIFICADO en
  código: `UsuarioSesion`/`getKeycloakUserFromToken` ya isomorfos al ActorContext.
- Change 2 `align-authorization-to-backend-reality` (archivado 2026-06-04) — el manejo de 403
  honesto en `client.ts` ya existe y se conserva.

## Success Criteria

- [ ] En uso normal, el usuario NO recibe 401 espurios por timing de refresh.
- [ ] El access token se renueva con margen (~2 min antes de expirar), no al filo de los 300s.
- [ ] Al expirar la sesión de verdad (refresh/SSO vencido: 30 min idle o 10 h max), se
      desloguea limpio y redirige a `/login` con mensaje claro.
- [ ] El manejo de 401/403 no genera loops ni estados inconsistentes (single retry).
- [ ] CORS del back verificado para GET/POST/PATCH/DELETE (documentado; pedido al back si falta).
