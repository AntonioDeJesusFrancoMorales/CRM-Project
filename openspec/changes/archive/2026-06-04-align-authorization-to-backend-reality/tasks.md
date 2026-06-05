# Tasks — Change: align-authorization-to-backend-reality

**Status**: completed
**Modo**: Standard (cambio mínimo: eliminación + documentación + manejo de 403)
**Runner**: `pnpm test:run` (NO ejecutar build automático — regla del proyecto)
**Fecha**: 2026-06-04

---

## T1 — Quitar el gate del router

- [x] **T1** [IMPL] `src/routes/router.tsx`: eliminar el wrapper `{ element: <RoleGuard role="admin" />, children: [...] }`. Colocar `{ path: 'usuarios', element: <UsuariosListPage /> }` y `{ path: 'configuracion', element: <RolesListPage /> }` directamente como children de las rutas autenticadas. Quitar el import de `RoleGuard`.
  - Archivos: `src/routes/router.tsx`

## T2 — Eliminar RoleGuard

- [x] **T2** [IMPL] Borrar `src/components/layout/RoleGuard.tsx` y `src/components/layout/__tests__/RoleGuard.test.tsx`. Verificar que no queden imports colgados (solo `router.tsx` lo usaba).
  - Archivos: `src/components/layout/RoleGuard.tsx` (del), `src/components/layout/__tests__/RoleGuard.test.tsx` (del)

## T3 — Abrir el Sidebar

- [x] **T3** [IMPL] `src/components/layout/Sidebar.tsx`: quitar `adminOnly` de los ítems "Usuarios" y "Configuración", eliminar `isAdmin` y el `.filter(...)` por rol. Agregar comentario: la visibilidad ya no representa permisos (el back no los enforza). Mantener "Mis tareas" como está.
  - Archivos: `src/components/layout/Sidebar.tsx`

## T4 — Manejo honesto de 403 en client.ts

- [x] **T4** [IMPL] `src/api/client.ts`: agregar rama explícita para `403` (mensaje honesto, sin logout, sin atribuir a rol del front). Comentario dejando claro que la autorización real vive en el back y hoy es solo autenticación.
  - Archivos: `src/api/client.ts`

## T5 — Actualizar tests afectados

- [x] **T5** [TEST] Actualizar `src/components/layout/__tests__/Sidebar.test.tsx`: los ítems "Usuarios"/"Configuración" ahora se muestran a cualquier autenticado (el caso "usuario normal NO ve" se invierte a "SÍ ve"). Revisar otros tests que asumían el gate (`ProtectedRoute.test.tsx`, `routing.test.tsx`, `UsuariosListPage.test.tsx`, `RolesListPage.test.tsx`) y ajustarlos para que no dependan de `super_usuario_id` para acceder.
  - Archivos: `src/components/layout/__tests__/Sidebar.test.tsx` (+ los que apliquen)

---

## Verificación

- [x] Sin referencias colgadas a `RoleGuard`.
- [x] `/usuarios` y `/configuracion` accesibles a `super_usuario_id: null`.
- [x] `client.ts` maneja 401 y 403 distinto y honesto.
- [x] NO ejecutar build automático (regla del proyecto). Tests a criterio del usuario.
