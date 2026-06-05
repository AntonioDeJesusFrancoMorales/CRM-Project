# Design — Change: harden-token-lifecycle

## Decisión de diseño: refresh en 3 capas (elegida por el usuario)

Defensa en profundidad. Cada capa cubre un modo de falla distinto del timing de refresh:

| Capa | Dónde | Cubre | Mecanismo |
|------|-------|-------|-----------|
| 1. Intervalo con margen | `useTokenRefresh` | Uso normal (tab activo) | `setInterval ~60s` → `updateToken(120)` |
| 2. Proactivo on-demand | `api/client.ts` | Tab en background / timers throttleados | `await updateToken(120)` al inicio de `request()` |
| 3. Red de seguridad | `keycloak.onTokenExpired` | Token vencido pese a 1 y 2 | refresh → si falla, corte de sesión |

### Constantes

```
ACCESS_TOKEN_LIFESPAN  = 300s   (realm, NO se toca acá)
REFRESH_INTERVAL       = 60s    (era 300s)
MIN_VALIDITY           = 120s    (margen: refresca cuando quedan ≤120s → ~2 min de colchón)
```

`MIN_VALIDITY` (120s) < `ACCESS_TOKEN_LIFESPAN` (300s): siempre hay ventana para renovar.
`REFRESH_INTERVAL` (60s) ≪ `MIN_VALIDITY` (120s): entre dos ticks el token nunca cae bajo
el margen sin que un tick lo agarre. Margen sobre margen.

## Por qué `updateToken(minValidity)` y no `updateToken(300)`

`keycloak.updateToken(minValidity)` solo va a la red **si** al token le quedan < `minValidity`
segundos. Con el `updateToken(300)` actual y lifespan 300, siempre refresca (siempre quedan
≤300). Con `updateToken(120)`, refresca solo cuando entra en el margen → menos red, semántica
correcta de "renová si está por vencer".

## Logout idempotente (guard anti-doble-disparo)

Tres capas pueden detectar expiración casi simultáneamente. Para que el corte sea único:

- Un flag de "sesión en corte" (`isLoggingOut`) en el `authStore` o módulo de auth.
- `handleSessionExpired()` chequea el flag; si ya está en curso, retorna sin repetir
  logout/redirect/toast.
- El flag se levanta al iniciar el corte y se baja al completar (o queda hasta el reload de
  `/login`). Evita redirects y toasts duplicados.

## Flujo de `api/client.ts` (endurecido)

```
request(method, path, body, retryAfterRefresh=true):
  if autenticado:
    await refreshKeycloakToken(MIN_VALIDITY)   // Capa 2: proactivo (no-op si válido)
  token = getCurrentToken()
  res = fetch(...)
  if !res.ok:
    if 401:
      if autenticado && retryAfterRefresh:
        if await refreshKeycloakToken():        // refresh reactivo
          return request(..., retryAfterRefresh=false)   // single retry
      handleSessionExpired()                    // refresh imposible → corte limpio
    if 403: throw HttpError (honesto, sin logout)   // conserva Change 2
    throw HttpError
```

Clave: el reintento usa `retryAfterRefresh=false` → como mucho **un** retry, jamás loop.

## onTokenExpired wiring

- Registrar en `useTokenRefresh` (o en init de keycloak) vía `registerOnTokenExpired(cb)`.
- El callback intenta `refreshKeycloakToken()`; si falla → `handleSessionExpired()`.
- Limpiar el handler en el cleanup del `useEffect` para no fugar callbacks entre renders.

## Verificación de CORS del back (no se cambia el back)

El front pega directo a `http://localhost:8080` con GET/POST/PATCH/DELETE. Hay que confirmar
que el `SecurityConfig` (CORS de Spring) del AR-CRM permita TODOS esos métodos + el header
`Authorization` desde el origin del front, no solo GET. Es verificación; si falta algún
método, se abre pedido al dev del back (fuera del alcance de este change del front).

## Alternativas descartadas

- **Solo subir el intervalo a 60s sin margen real**: no resuelve el tab-en-background.
- **Solo confiar en el retry de 401**: funciona pero genera un 401 visible y un round-trip
  extra por cada expiración; preferimos prevenir, no curar.
- **2 capas (sin proactivo on-demand)**: descartada por el usuario; se eligió robustez total.
