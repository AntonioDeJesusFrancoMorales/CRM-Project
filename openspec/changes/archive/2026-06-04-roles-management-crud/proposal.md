# Proposal: roles-management-crud (Change 9)

## Intent

El Change 7 (`usuarios-contrato-rpc`) diferio el CRUD de roles a un change futuro. El diseño original ubicó `useRoles` dentro de `src/features/usuarios/` como lectura auxiliar. Este change promueve `roles` a feature propio (`src/features/roles/`) con CRUD completo, y expone el area de **Configuración** en el sidebar (admin-only) con la sub-sección Roles. Un superusuario puede listar, crear, editar y eliminar roles de dominio del CRM, que son entidades separadas de los roles de Keycloak.

## Scope

### In Scope

- Bloque completo `roles` en `src/api/endpoints.ts`: `getAll`, `getById`, `create`, `edit`, `delete`.
- Schemas Zod en `src/features/roles/schemas/rol.schema.ts`: `rolCreateSchema` (nombre min1/max80 + descripcion opcional); `rolUpdateSchema`.
- Hook centralizado `useRoles` en `src/features/roles/hooks/useRoles.ts` con factory `rolesKeys` (all / list / detail). **Migración**: `src/features/usuarios/hooks/useRoles.ts` se elimina; sus imports se actualizan a `@/features/roles/hooks/useRoles`.
- Hooks de mutación: `useCreateRol`, `useEditRol`, `useDeleteRol`.
- Handler MSW `src/mocks/handlers/roles.ts` actualizado: store mutable con create/edit/delete + regla 409 al intentar borrar un rol con usuarios asignados.
- Componentes: `RolesTable.tsx`, `RolFormDialog.tsx` (create + edit), `RolDeleteDialog.tsx` (maneja 409).
- Page container: `RolesListPage.tsx`.
- Navegación: ítem "Configuración" (icono Settings, `adminOnly: true`) en `Sidebar.tsx` apuntando a `/configuracion`.
- Ruta `/configuracion` protegida con `RoleGuard role="admin"` en `router.tsx`.
- Tests completos (T11): hooks + handler + schema + componentes RTL + Sidebar.test extendido.

### Out of Scope

- Toggle del campo `activo` (el back no expone endpoint de cambio de activo para roles; `activo` es display-only).
- Gate de autorización en el back para `/api/roles/**` (deuda back conocida; el back acepta cualquier JWT válido).
- Gestión de roles de Keycloak (son entidades separadas).
- Asignación de roles a usuarios (ya existe vía `UsuarioFormDialog`; el selector usa `useRoles` — se beneficia del cambio de ubicación sin esfuerzo adicional).

## Capabilities

### New Capabilities

- `roles-management`: CRUD completo de roles de dominio del CRM (create, edit, delete, list, get-by-id) via contrato RPC del back. Área de Configuración admin-only en el sidebar.

### Modified Capabilities

- `usuarios-management` (Change 7): el hook `useRoles` se mueve de `src/features/usuarios/hooks/useRoles.ts` a `src/features/roles/hooks/useRoles.ts`. Los requisitos de lookup de rol en el form y tabla de usuarios siguen vigentes, resueltos ahora desde el hook centralizado.

## Approach

1. Crear `src/features/roles/` como feature-flat propio (promotion desde la lectura auxiliar del Change 7).
2. Centralizar `useRoles` con un factory `rolesKeys` que comparte `['roles']` como queryKey base — esto resuelve el problema de caché doble: la invalidación tras create/edit/delete en la pantalla de Roles refresca también el selector de roles en `UsuarioFormDialog`.
3. Handler MSW con store mutable en memoria para soportar el CRUD completo en tests.
4. RoleGuard existente en el router protege `/configuracion`; solo se agrega la ruta y el ítem en el sidebar.

## Contrato verificado de /api/roles (RolController.java de AR-CRM)

`RolController.java` → `@RequestMapping("/api/roles")`:
- `POST /create` — body `{ nombre (req, max80), descripcion? }` → 201 `RolResponse`
- `GET /get-all` → 200 `RolResponse[]`
- `GET /get-by-id?id=UUID` → 200 `RolResponse`
- `PUT /edit?id=UUID` — body `{ nombre? (max80), descripcion? }` → 200 `RolResponse`
- `DELETE /delete?id=UUID` → 204; si el rol tiene usuarios asignados → 409 Conflict

`RolResponse`: `{ id: UUID, nombre: string, descripcion: string | null, activo: boolean }`.

Autorización: cualquier JWT válido (el back NO gatea `/api/roles` por rol → el gate admin-only es responsabilidad del front vía `RoleGuard`). Deuda de back conocida y registrada.

`activo` siempre `true` al crear; sin endpoint de toggle → campo display-only en el front.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/api/endpoints.ts` | Modified | + roles.getById, roles.create, roles.edit, roles.delete (getAll ya existia) |
| `src/features/roles/` | Created | Feature completo: schemas, hooks, components, pages |
| `src/features/usuarios/hooks/useRoles.ts` | Removed | Migrado a `src/features/roles/hooks/useRoles.ts` |
| `src/features/usuarios/` (imports) | Modified | Imports actualizados a `@/features/roles/hooks/useRoles` |
| `src/mocks/handlers/roles.ts` | Modified | Store mutable con CRUD completo + 409 |
| `src/components/layout/Sidebar.tsx` | Modified | Ítem Configuración (Settings, adminOnly, /configuracion) |
| `src/routes/router.tsx` | Modified | Ruta /configuracion bajo RoleGuard role="admin" |
| `src/mocks/handlers/index.ts` | Modified | Sin cambio estructural (rolesHandlers ya registrado) |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Caché doble: invalidar ['roles'] no refresca el selector del UsuarioFormDialog si usa queryKey distinto | High | `rolesKeys` factory garantiza `rolesKeys.list() === ['roles']` compartido entre features |
| 409 en delete confunde al usuario si no hay feedback claro | Med | `RolDeleteDialog` muestra toast con `ROL_CON_USUARIOS_MSG` y NO cierra el dialog en caso de 409 |
| Sidebar.test rompe por el ítem nuevo | Low | T11 extiende el test existente con el ítem Configuración |
| Handler MSW con store mutable puede ensuciarse entre tests | Low | `beforeEach` en cada test de handler resetea el store |

## Rollback Plan

Cambios aislados en `src/features/roles/`, `src/mocks/handlers/roles.ts`, `src/components/layout/Sidebar.tsx` y `src/routes/router.tsx`. Migración de imports en `src/features/usuarios/` es mecánica. Revertir vía `git revert` del rango de commits del change.

## Dependencies

- Back AR-CRM con `RolController` (CRUD verificado).
- `RoleGuard` existente (ya implementado, no cambia).
- Change 7 (`usuarios-contrato-rpc`) completado: tipo `Rol`, `endpoints.roles.getAll` ya existen.

## Success Criteria

- [x] `pnpm test:run` verde (911 tests, 0 failed, 108 archivos).
- [x] Super usuario ve "Configuración" en el sidebar y puede acceder a `/configuracion`.
- [x] Usuario normal NO ve "Configuración" y es redirigido por `RoleGuard`.
- [x] CRUD de roles funciona contra los handlers MSW (list, create, edit, delete).
- [x] Delete con 409 muestra toast "Este rol tiene usuarios asignados y no puede eliminarse".
- [x] Form valida nombre requerido (max 80), descripción opcional.
