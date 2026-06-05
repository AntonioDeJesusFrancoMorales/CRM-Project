# Proposal: align-authorization-to-backend-reality (Change 2 — auth track)

## Intent

Hacer que el modelo de autorización del front sea **honesto** respecto a lo que el
back realmente enforza. Hoy el front oculta `/usuarios` y `/configuracion` a quien no
sea "admin" (vía `RoleGuard` + `Sidebar.adminOnly`), pero el back **NO** enforza nada
de eso: `/api/**` solo exige estar autenticado. El guard da **falsa sensación de
seguridad**. Este change elimina ese gate cosmético (Opción B) y alinea el manejo de
errores de autorización.

## Realidad del back (VERIFICADA leyendo AR-CRM)

- `ActorContext.isSuperUsuario()` y `hasRole()` existen pero **no se invocan** en ningún service.
- **No** hay `@PreAuthorize` en los controllers.
- Todo `/api/**` solo requiere autenticación (`SecurityConfig.java:57` → `.authenticated()`).
- Único guard de rol: `POST /api/superusuarios/create` → `ROLE_SUPER_USUARIO` (bootstrap técnico).

Conclusión: el back NO distingue permisos por rol de negocio. (Ver memoria `back-modelo-permisos-real`.)

## Estado actual del front (VERIFICADO — corrige el texto original del change)

El texto original hablaba de `rol_sistema === 'admin'`, pero el front **ya migró** al modelo
`ActorContext` (Change 1 `align-session-model-to-backend`, commit `ee6b98d`):

- `RoleGuard.tsx:19` deriva el acceso de `super_usuario_id !== null` (no de `rol_sistema`).
- `Sidebar.tsx:26` deriva `isAdmin` de `super_usuario_id`; ítems "Usuarios" y "Configuración" con `adminOnly: true`.
- `rol_sistema` solo sobrevive en mocks (marcado "mock-only, no existe en el front").
- `api/client.ts` maneja 401 (refresh/logout) pero **no** 403.

## Decisión

**Opción B: eliminar el `RoleGuard`** (elegida por el usuario). Más honesto: no mantener
seguridad cosmética. Las pantallas `/usuarios` y `/configuracion` quedan accesibles a
cualquier autenticado, igual que la API. Cuando el back implemente autorización real,
será otro change.

## Scope

### In Scope

- Eliminar `src/components/layout/RoleGuard.tsx` y su test.
- `src/routes/router.tsx`: quitar el wrapper `<RoleGuard role="admin">`; `/usuarios` y `/configuracion` cuelgan directo de las rutas autenticadas.
- `src/components/layout/Sidebar.tsx`: quitar `adminOnly` y la derivación `isAdmin`; los ítems se muestran a todo usuario autenticado (coherente con rutas abiertas).
- `src/api/client.ts`: agregar manejo explícito de **403** — mensaje honesto, sin engañar (no es "no tenés permisos de rol"; es "el servidor rechazó la operación").
- Actualizar tests afectados (`Sidebar.test.tsx`, y los que asumían el gate).
- Documentar en código/comentario que la autorización real vive en el back y hoy es solo autenticación.

### Out of Scope

- Implementar autorización de negocio (trabajo del BACK; futuro change).
- Cambiar el back.
- Tocar el guard técnico `POST /api/superusuarios/create` (no lo usa el front).

## Capabilities

### New Capabilities

- `frontend-authorization`: el modelo de autorización del front es honesto — no gatea rutas por rol (el back no lo respalda) y maneja 401/403 sin engañar.

### Modified Capabilities

- `roles-management` (Change 9): se DEROGA el requirement "Area de Configuración admin-only en Sidebar y router". La Configuración deja de estar protegida por `RoleGuard`.

## Approach

1. Quitar el wrapper `RoleGuard` del router; reubicar `/usuarios` y `/configuracion` como rutas autenticadas normales.
2. Borrar `RoleGuard.tsx` + test.
3. Limpiar `Sidebar.tsx`: sin `adminOnly`, sin `isAdmin`; todos los ítems visibles.
4. Manejar 403 en `client.ts` de forma coherente con 401 (toast honesto; sin logout automático).
5. Comentario en `client.ts`/router dejando claro: autorización real = responsabilidad del back; hoy solo autenticación.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/components/layout/RoleGuard.tsx` | Removed | Eliminado (era falsa seguridad) |
| `src/components/layout/__tests__/RoleGuard.test.tsx` | Removed | Test del guard eliminado |
| `src/routes/router.tsx` | Modified | Sin wrapper RoleGuard; rutas /usuarios y /configuracion directas |
| `src/components/layout/Sidebar.tsx` | Modified | Sin adminOnly/isAdmin; ítems visibles a todos |
| `src/components/layout/__tests__/Sidebar.test.tsx` | Modified | Tests del gate actualizados (ya no oculta por rol) |
| `src/api/client.ts` | Modified | Manejo explícito de 403 + comentario sobre autorización del back |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Tests existentes asumen el gate (RoleGuard, Sidebar) | High | Se actualizan/eliminan en este change |
| Percepción de "perder seguridad" | Med | Documentar: nunca fue seguridad real; el back no la enforzaba |
| Otros usos de RoleGuard fuera del router | Low | Verificado: solo `router.tsx:60` lo usa |

## Rollback Plan

Cambios aislados y mecánicos. Revertir vía `git revert` del commit del change.

## Dependencies

- Change 1 `align-session-model-to-backend` (completado, commit `ee6b98d`).

## Success Criteria

- [ ] `RoleGuard.tsx` y su test eliminados; sin referencias colgadas.
- [ ] `/usuarios` y `/configuracion` accesibles a cualquier usuario autenticado.
- [ ] Sidebar muestra "Usuarios" y "Configuración" a todo autenticado.
- [ ] `client.ts` maneja 403 de forma coherente y no engañosa.
- [ ] El código documenta que la autorización real es responsabilidad del back.
