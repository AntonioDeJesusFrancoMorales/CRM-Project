# Tasks — Change 9: roles-management-crud

**Status**: completed
**Modo**: Standard (implementacion inline; T11 con cierre de cobertura posterior)
**Runner**: `pnpm test:run`
**Type-check**: `pnpm type-check`
**Fecha**: 2026-06-04

---

## Resumen de fases

| Fase | Descripcion | Tareas |
|------|-------------|--------|
| T1 | Endpoints roles (CRUD completo) | 1 |
| T2 | Schemas Zod | 1 |
| T3 | Hooks CRUD (useRoles centralizado + mutaciones) | 1 |
| T4 | MSW handlers con store mutable + 409 | 1 |
| T5 | RolesTable.tsx | 1 |
| T6 | RolFormDialog.tsx | 1 |
| T7 | RolDeleteDialog.tsx | 1 |
| T8 | RolesListPage.tsx | 1 |
| T9 | Ítem Configuración en Sidebar | 1 |
| T10 | Ruta /configuracion con RoleGuard | 1 |
| T11 | Tests (hooks + handler + schema + componentes + Sidebar) | 1 |
| **Total** | | **11** |

---

## T1 — Endpoints roles (CRUD completo)

- [x] **T1** [IMPL] Ampliar `src/api/endpoints.ts`: agregar `roles.getById(id: string)`, `roles.create()`, `roles.edit(id: string)`, `roles.delete(id: string)` al bloque `roles` existente (que ya tenia `getAll`). Seguir el shape exacto del patron RPC del repo (query param `?id=UUID`).
  - Archivos: `src/api/endpoints.ts`

---

## T2 — Schemas Zod

- [x] **T2** [IMPL] Crear `src/features/roles/schemas/rol.schema.ts`: `rolCreateSchema` con `nombre` (string, min1, max80) + `descripcion` (string opcional, puede ser vacío); `rolUpdateSchema` (nombre y descripcion ambos opcionales, mismo max80). Exportar `RolCreateInput` y `RolUpdateInput`.
  - Archivos: `src/features/roles/schemas/rol.schema.ts` (nuevo)

---

## T3 — Hooks CRUD (useRoles centralizado + mutaciones)

- [x] **T3** [IMPL] Crear hooks en `src/features/roles/hooks/`:
  - `useRoles.ts`: factory `rolesKeys = { all: ['roles'], list: () => ['roles'], detail: (id) => ['roles', id] }`; `useRoles()` con `queryKey: rolesKeys.list()` → `GET /api/roles/get-all`.
  - `useCreateRol.ts`: `POST /api/roles/create`; invalida `rolesKeys.list()`.
  - `useEditRol.ts`: `PUT /api/roles/edit?id=`; invalida `rolesKeys.list()` + remueve `rolesKeys.detail(id)`.
  - `useDeleteRol.ts`: `DELETE /api/roles/delete?id=`; invalida `rolesKeys.list()`.
  - Eliminar `src/features/usuarios/hooks/useRoles.ts` (y su test en `__tests__`). Actualizar imports en `src/features/usuarios/` a `@/features/roles/hooks/useRoles`.
  - Archivos: `src/features/roles/hooks/{useRoles,useCreateRol,useEditRol,useDeleteRol}.ts` (nuevos); `src/features/usuarios/hooks/useRoles.ts` (eliminado); imports en `UsuarioForm.tsx`, `UsuariosListPage.tsx`, `UsuariosTable.tsx` actualizados.

---

## T4 — MSW handlers con store mutable + 409

- [x] **T4** [IMPL] Reescribir `src/mocks/handlers/roles.ts`: store mutable inicializado desde `rolesFixture`; handlers completos: `GET /get-all`, `GET /get-by-id?id=`, `POST /create` (201), `PUT /edit?id=` (200), `DELETE /delete?id=` (204 o 409 si el rol tiene usuarios asignados simulados). La regla 409 se implementa verificando si el `rolId` del rol a eliminar está referenciado en el fixture de usuarios (`usuariosFixture`). Handler se resetea entre tests con `beforeEach`.
  - Archivos: `src/mocks/handlers/roles.ts`

---

## T5 — RolesTable.tsx

- [x] **T5** [IMPL] Crear `src/features/roles/components/RolesTable.tsx`: tabla con columnas nombre, descripcion, activo (badge read-only), acciones (editar/eliminar). Props: `roles: Rol[]`, `onEdit: (rol: Rol) => void`, `onDelete: (rol: Rol) => void`. Sin funcionalidad de toggle de activo.
  - Archivos: `src/features/roles/components/RolesTable.tsx` (nuevo)

---

## T6 — RolFormDialog.tsx

- [x] **T6** [IMPL] Crear `src/features/roles/components/RolFormDialog.tsx`: dialog para crear y editar rol. Props: `open`, `onOpenChange`, `rol?: Rol` (si presente → modo edit), `onSuccess`. Formulario con `nombre` (req, max80) y `descripcion` (opcional). Usa `useCreateRol` o `useEditRol` segun el modo. Cierra solo en éxito.
  - Archivos: `src/features/roles/components/RolFormDialog.tsx` (nuevo)

---

## T7 — RolDeleteDialog.tsx

- [x] **T7** [IMPL] Crear `src/features/roles/components/RolDeleteDialog.tsx`: AlertDialog de confirmacion para eliminar rol. Usa `useDeleteRol`. En exito (204): cierra el dialog, muestra toast "Rol eliminado". En 409: muestra toast con `ROL_CON_USUARIOS_MSG = "Este rol tiene usuarios asignados y no puede eliminarse"`, NO cierra el dialog. Cualquier otro error: toast generico.
  - Archivos: `src/features/roles/components/RolDeleteDialog.tsx` (nuevo)

---

## T8 — RolesListPage.tsx

- [x] **T8** [IMPL] Crear `src/features/roles/pages/RolesListPage.tsx`: container que orquesta `useRoles`, `RolesTable`, `RolFormDialog` (create + edit) y `RolDeleteDialog`. Estado local para dialogs abiertos y rol seleccionado. Boton "Nuevo Rol" en el header.
  - Archivos: `src/features/roles/pages/RolesListPage.tsx` (nuevo)

---

## T9 — Ítem Configuración en Sidebar

- [x] **T9** [IMPL] Agregar ítem "Configuración" en `src/components/layout/Sidebar.tsx`: icono `Settings` de lucide-react, `adminOnly: true`, ruta `/configuracion`. Posicionado al final de la lista de items (antes del logout o en zona de configuracion del sistema).
  - Archivos: `src/components/layout/Sidebar.tsx`

---

## T10 — Ruta /configuracion con RoleGuard

- [x] **T10** [IMPL] Agregar en `src/routes/router.tsx` la ruta `/configuracion` protegida con `RoleGuard role="admin"`. La ruta renderiza `RolesListPage` (o una futura `ConfiguracionPage` que la contenga). Usar lazy import si el resto del router lo hace.
  - Archivos: `src/routes/router.tsx`

---

## T11 — Tests

- [x] **T11** [TEST] Cubrir el change con tests:
  - `src/features/roles/__tests__/useRoles.test.tsx`: GET /roles/get-all, queryKey, tipo Rol[].
  - `src/features/roles/__tests__/useCreateRol.test.tsx`: POST /roles/create, 201, invalida lista.
  - `src/features/roles/__tests__/useEditRol.test.tsx`: PUT /roles/edit?id=, 200, invalida lista + detalle.
  - `src/features/roles/__tests__/useDeleteRol.test.tsx`: DELETE /roles/delete?id=, 204, invalida lista; 409 rechaza con mensaje.
  - `src/mocks/handlers/__tests__/roles.handler.test.ts`: actualizado con CRUD completo + 409.
  - `src/features/roles/__tests__/rol.schema.test.ts`: validaciones nombre (req, max80) y descripcion (opt).
  - `src/features/roles/__tests__/RolesTable.test.tsx`: render columnas, callbacks onEdit/onDelete.
  - `src/features/roles/__tests__/RolFormDialog.test.tsx`: create mode (submit + validacion); edit mode (prefilled).
  - `src/features/roles/__tests__/RolDeleteDialog.test.tsx`: 204 cierra + toast; 409 NO cierra + toast ROL_CON_USUARIOS_MSG.
  - `src/components/layout/__tests__/Sidebar.test.tsx` (extendido): admin ve "Configuración"; usuario normal no ve "Configuración".
  - Archivos: todos los tests listados arriba (nuevos o extendidos).
  - **RESULTADO**: `pnpm test:run` → 911 passed / 0 failed / 108 test files. Type-check: 0 errores nuevos. Lint: 0 errores (7 warnings pre-existentes).

---

## Dependencias entre tareas

```
T1 (endpoints)
  └─► T2 (schemas)
  └─► T3 (hooks: useRoles centralizado + mutaciones)
        └─► T4 (handler MSW mutable)
              └─► T5 (RolesTable)
              └─► T6 (RolFormDialog)
              └─► T7 (RolDeleteDialog)
                    └─► T8 (RolesListPage)
T9 (Sidebar) ──────────► T10 (ruta /configuracion)
                                └─► T8
T11 (tests — cubre T1-T10)
```
