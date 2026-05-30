# Proposal: usuarios-contrato-rpc (Change 7)

## Intent

El feature `usuarios` usa convenciones REST legacy (path params, PATCH) y un tipo `Usuario` inventado (`rol_sistema`/`rol_empresa`) que no existe en el back. Homologar al contrato RPC real de `UsuarioController` (igual que Change 1 con empresas/tareas), incorporando el consumo real de `RolController` para resolver `rolId`. El back es la fuente de la verdad.

## Scope

### In Scope
- Bloque `usuarios` en `src/api/endpoints.ts` (get-all, get-by-id, create, edit?id=, delete?id=).
- Hooks RPC: `useUsuarios`, `useCreateUsuario`, `useEditUsuario` (renombra `useUpdateUsuario`), `useDeleteUsuario`.
- Tipo `Usuario` alineado al back: `id, nombre, correo, rolId, creadoEn, activo, keycloakId` (sin `rol_sistema`/`rol_empresa`).
- Tipo `UsuarioSesion` separado para el authStore (preserva `rol_sistema`/`rol_empresa`).
- Feature de roles COMPLETO (D4): hook `useRoles` → `GET /api/roles/get-all`, fixture y handler MSW. Form con `<select>` de roles reales; tabla muestra nombre del rol.
- `activo` como badge READ-ONLY en la tabla.
- MSW handlers RPC de usuarios + roles, fixtures, y tests reescritos (TDD).

### Out of Scope
- Auth (login, `/auth/me`, JWT). Solo se adapta el shape compartido vía `UsuarioSesion`, sin tocar la lógica de auth.
- CRUD de roles desde la UI (solo se consume `get-all`). create/edit/delete de roles: diferido.
- Cambiar `activo` (desactivar/reactivar): el back no lo modela en edit (`EditUsuarioService:55` hardcodea `existing.isActivo()`, lo gestiona Keycloak). Se ELIMINA `useDesactivarUsuario` y el reactivar inline.

## Capabilities

### New Capabilities
- `usuarios-rpc`: CRUD de usuarios sobre el contrato RPC del back (get-all, get-by-id, create, edit, delete) con tipo alineado al `UsuarioResponse`.
- `roles-lookup`: lectura de roles (`GET /api/roles/get-all`) para poblar selectores y resolver `rolId → nombre`.

### Modified Capabilities
- None (el feature usuarios legacy no tiene spec previa; se reemplaza por las nuevas capabilities).

## Approach

Migración directa homologando empresas/tareas + tipo `UsuarioSesion` separado para aislar el authStore del contrato del back. Los hooks pasan al patrón RPC con query params. La tabla y el form resuelven `rolId` contra la lista de `useRoles`. El fixture mantiene `rol_sistema`/`rol_empresa`/`password` SOLO para la auth mock (interfaz `UsuarioMock` extendida).

## Contrato verificado de /api/roles (Java real)

`RolController.java:38` → `@RequestMapping("/api/roles")`:
- `GET /get-all` (línea 61) → `List<RolResponse>` — CONFIRMA el endpoint asumido.
- `GET /get-by-id?id=UUID` (72), `POST /create` (51), `PUT /edit?id=UUID` (81), `DELETE /delete?id=UUID` (91) — fuera de alcance.

`RolResponse.java:11` — **el shape difiere del asumido** (el explore asumió solo `id, nombre`):
```java
record RolResponse(UUID id, String nombre, String descripcion, boolean activo)
```
Confirmado contra `Rol.java:28-31` (id, nombre, descripcion, activo). CORRECCIÓN al plan: el tipo `Rol` del front debe incluir `descripcion: string | null` y `activo: boolean`, no solo `id`/`nombre`. Para el lookup de la tabla se usa `nombre`; `descripcion`/`activo` son metadatos disponibles. Endpoint del front: `roles.getAll: () => '/roles/get-all'`.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/api/endpoints.ts` | Modified | + bloque `usuarios` y `roles` |
| `src/api/types.ts` | Modified | `Usuario` al back; nuevo `Rol`; nuevo `UsuarioSesion`; `LoginResponse` usa `UsuarioSesion` |
| `src/store/authStore.ts` | Modified | `AuthUser` deriva de `UsuarioSesion`, no de `Usuario` |
| `src/features/usuarios/schemas/usuario.schema.ts` | Modified | reescribir (nombre, correo, rolId, initialPassword en create) |
| `src/features/usuarios/hooks/useUsuarios.ts` | Modified | `/usuarios/get-all` |
| `src/features/usuarios/hooks/useCreateUsuario.ts` | Modified | `/usuarios/create`, nuevo payload |
| `src/features/usuarios/hooks/useUpdateUsuario.ts` | Modified | → `useEditUsuario`, `PUT /usuarios/edit?id=` |
| `src/features/usuarios/hooks/useDeleteUsuario.ts` | Modified | `/usuarios/delete?id=` |
| `src/features/usuarios/hooks/useDesactivarUsuario.ts` | Removed | endpoint inexistente (D1) |
| `src/features/usuarios/hooks/useRoles.ts` | New | `GET /roles/get-all` |
| `src/features/usuarios/components/UsuariosTable.tsx` | Modified | rolId→nombre lookup, creadoEn, activo badge read-only |
| `src/features/usuarios/components/UsuarioForm.tsx` | Modified | `<select>` de roles, sin rol_empresa |
| `src/features/usuarios/components/UsuarioFormDialog.tsx` | Modified | propagar roles/campos |
| `src/features/usuarios/pages/UsuariosListPage.tsx` | Modified | eliminar desactivar/reactivar |
| `src/mocks/fixtures/usuarios.ts` | Modified | `UsuarioMock` con rolId + campos auth |
| `src/mocks/fixtures/roles.ts` | New | fixture roles |
| `src/mocks/handlers/usuarios.ts` | Modified | rutas RPC, sin /desactivar |
| `src/mocks/handlers/roles.ts` | New | `GET /roles/get-all` |
| `src/mocks/handlers/auth.ts` | Modified | adaptar a `UsuarioSesion` sin romper login |
| `src/features/usuarios/__tests__/*` | Modified | reescribir; eliminar `useDesactivarUsuario.test` |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Romper login mock (fixture comparte `findUsuarioByCreds`, `LoginResponse`, authStore usan rol_sistema/rol_empresa) | High | `UsuarioSesion` separado; el fixture conserva rol_sistema/rol_empresa/password vía `UsuarioMock`; tests de auth verdes antes de cerrar |
| `Rol` con shape incompleto en el front (asumido id/nombre) | Med | RESUELTO: `Rol` incluye descripcion + activo per `RolResponse.java:11` |
| Lookup rolId→nombre si la lista de roles aún no cargó | Med | fallback a rolId/placeholder mientras `useRoles` está pending |
| Tests legacy usan campos viejos | High | reescritura TDD por archivo |

## Rollback Plan

Cambios aislados en `src/features/usuarios/`, `src/mocks/{handlers,fixtures}/{usuarios,roles}`, `src/api/{types,endpoints}.ts` y `authStore.ts`. Revertir vía `git revert` del rango de commits del change. Sin migraciones ni estado persistido externo; el rollback restaura el feature legacy intacto.

## Dependencies

- Back AR-CRM con `UsuarioController` y `RolController` (ambos verificados, ya existen).

## Success Criteria

- [ ] `pnpm test:run` verde (incluida la suite de auth) sin `useDesactivarUsuario`.
- [ ] Hooks de usuarios consumen rutas RPC; tipo `Usuario` == `UsuarioResponse` del back.
- [ ] `useRoles` consume `/roles/get-all`; form muestra roles reales; tabla muestra nombre del rol y `activo` read-only.
- [ ] Login mock funciona end-to-end con `UsuarioSesion`.
