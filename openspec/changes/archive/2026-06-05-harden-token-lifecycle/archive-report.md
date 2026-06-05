# Archive Report — harden-token-lifecycle

**Fecha de archivo**: 2026-06-05
**Estado**: completed (tests escritos, NO ejecutados — regla del proyecto)
**Decisión**: refresh en 3 capas (intervalo con margen + proactivo on-demand + onTokenExpired) — elegida por el usuario.

## Resumen

Se endureció el ciclo de vida del token de Keycloak en el front. El refresh corría al filo
(intervalo 300s contra lifespan 300s), lo que podía dejar salir requests con token vencido
(401 espurios). Ahora el token se renueva con margen (~2 min antes de expirar), con defensa en
profundidad de 3 capas, y la sesión expirada irrecuperable corta limpio (logout + redirect +
mensaje) de forma idempotente.

## Tiempos finales

| Parámetro | Valor | Origen |
|---|---|---|
| `accessTokenLifespan` | 300s | realm (no se toca) |
| `MIN_VALIDITY` (margen) | 120s | front |
| `REFRESH_INTERVAL` (chequeo) | 60s | front |
| `ssoSessionIdleTimeout` | 1800s (30 min) | realm |
| `ssoSessionMaxLifespan` | 36000s (10 h) | realm |

## Cambios de código

| Archivo | Cambio |
|---|---|
| `src/lib/keycloak.ts` | Constantes de lifecycle; `refreshToken(minValidity=120)`; `registerOnTokenExpired()` con cleanup. Fix: `false` ahora significa solo "refresh imposible" (antes el bool de `updateToken` podía deslogar con token sano) |
| `src/store/authStore.ts` | Estado `isLoggingOut`; `refreshKeycloakToken(minValidity?)`; `handleSessionExpired()` idempotente |
| `src/features/auth/hooks/useTokenRefresh.ts` | Intervalo 60s (era 300s); refresh con margen; registro/limpieza de `onTokenExpired` |
| `src/api/client.ts` | Refresh proactivo previo a request (Capa 2); 401 single-retry → corte limpio; 403 honesto conservado |
| `src/store/__tests__/authStore.test.ts` | +idempotencia de `handleSessionExpired`; +propagación de `minValidity` |
| `src/api/__tests__/client.test.ts` | +403 honesto; +401 sin sesión sin loop |
| `src/features/auth/hooks/__tests__/useTokenRefresh.test.tsx` | NUEVO: margen, corte, cleanup de `onTokenExpired` |

## Sincronización de specs maestras

- **CREADA** `openspec/specs/token-lifecycle/spec.md` — capability nueva: refresh con margen,
  3 capas, corte limpio idempotente, 401/403 sin loops.

## Verificación

- **CORS del back VERIFICADO** (T5): `AR-CRM/.../security/CorsConfig.java` permite
  GET/POST/PUT/PATCH/DELETE/OPTIONS + `allowedHeaders("*")` desde `localhost:5173`. Sin acción
  pendiente del back.
- Lifespans del realm confirmados leyendo `AR-CRM/Keycloak/realm-export.json`.
- Build/tests NO ejecutados automáticamente (regla del proyecto). Validación a cargo del usuario.

## Deuda / siguiente

- Ejecutar `pnpm test:run` para validar la suite antes de dar por cerrado el ciclo.
- Si en producción se decide subir el `accessTokenLifespan`, es cambio en el realm del back.
