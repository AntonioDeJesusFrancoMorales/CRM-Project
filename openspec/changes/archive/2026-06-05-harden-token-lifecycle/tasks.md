# Tasks — Change: harden-token-lifecycle

**Status**: applied (tests escritos, NO ejecutados — regla del proyecto: a criterio del usuario)
**Modo**: Standard (endurecer flujo existente; 4 archivos del front + 1 verificación)
**Runner**: `pnpm test:run` (NO ejecutar build automático — regla del proyecto)
**Decisión**: refresh en 3 capas (intervalo + proactivo on-demand + onTokenExpired)

---

## T1 — `keycloak.ts`: refresh con margen + helper onTokenExpired

- [x] **T1** [IMPL] `src/lib/keycloak.ts`: parametrizar `refreshToken(minValidity = 120)` →
  `keycloak.updateToken(minValidity)`. Agregar `registerOnTokenExpired(cb: () => void)` que
  setea `keycloak.onTokenExpired = cb` y devuelve una función para limpiarlo. Definir
  `MIN_VALIDITY = 120` y `REFRESH_INTERVAL = 60_000` como constantes exportadas (o en un
  módulo de config de auth).
  - Archivos: `src/lib/keycloak.ts`

## T2 — `authStore.ts`: propagar el margen

- [x] **T2** [IMPL] `src/store/authStore.ts`: `refreshKeycloakToken(minValidity?: number)`
  pasa el margen a `refreshToken`. Agregar guard idempotente de corte de sesión: flag
  `isLoggingOut` + `handleSessionExpired()` que (si no está en curso) ejecuta `logout()` y
  marca el corte. Mantener `getCurrentToken()` como está.
  - Archivos: `src/store/authStore.ts`

## T3 — `useTokenRefresh.ts`: intervalo corto + onTokenExpired

- [x] **T3** [IMPL] `src/features/auth/hooks/useTokenRefresh.ts`: cambiar
  `TOKEN_REFRESH_INTERVAL` a `REFRESH_INTERVAL` (~60s). En cada tick:
  `refreshKeycloakToken(MIN_VALIDITY)`; si falla → `handleSessionExpired()` + redirect
  `/login`. Registrar `registerOnTokenExpired(() => refresh→si falla corte)` y limpiarlo en
  el cleanup del `useEffect`.
  - Archivos: `src/features/auth/hooks/useTokenRefresh.ts`

## T4 — `api/client.ts`: proactivo on-demand + 401 single-retry + corte

- [x] **T4** [IMPL] `src/api/client.ts`: al inicio de `request()`, si autenticado,
  `await refreshKeycloakToken(MIN_VALIDITY)` (Capa 2, no-op si válido). Mantener la rama 401
  (refresh→retry **una** vez con `retryAfterRefresh=false`→`handleSessionExpired()`). 403 se
  conserva honesto (sin logout). Verificar que no haya recursión más allá del single retry.
  - Archivos: `src/api/client.ts`

## T5 — Verificación CORS del back (no se cambia el back)

- [x] **T5** [VERIFY] CORS del back VERIFICADO ✅. El AR-CRM tiene
  `infrastructure/src/main/java/com/ar/crm2/security/CorsConfig.java` con
  `allowedMethods("GET","POST","PUT","PATCH","DELETE","OPTIONS")` + `allowedHeaders("*")`
  para `/api/**` desde `http://localhost:5173`. Cubre TODOS los métodos del front. NO hay
  acción pendiente del lado del back.
  - Archivos: (verificación; back read-only)

---

## Tests

- [x] **T6** [TEST] `useTokenRefresh.test.tsx`: refresca con `MIN_VALIDITY`; al fallar dispara
  `handleSessionExpired`; registra y limpia `onTokenExpired` en unmount.
- [x] **T7** [TEST] `client.test.ts`: 403 propaga `HttpError` honesto (sin logout); 401 sin
  sesión lanza sin loop (un solo fetch). NOTA: el escenario 401→single-retry-con-refresh y el
  no-op del proactivo quedan como cobertura manual/integration (requieren mockear auth+refresh;
  cubiertos por el test del hook y de authStore).
- [x] **T8** [TEST] `authStore.test.ts`: `handleSessionExpired` idempotente (3 disparos →
  1 logout + 1 toast); `refreshKeycloakToken(minValidity)` propaga el margen.

---

## Verificación final

- [ ] Sin 401 espurios por timing en uso normal (manual/integration).
- [ ] Renovación con margen (~2 min) verificada, no al filo de los 300s.
- [ ] Sesión expirada de verdad (idle/max) → logout limpio + redirect + mensaje.
- [ ] 401/403 sin loops ni doble logout.
- [ ] CORS del back documentado (T5).
- [ ] NO ejecutar build automático (regla del proyecto). Tests a criterio del usuario.
