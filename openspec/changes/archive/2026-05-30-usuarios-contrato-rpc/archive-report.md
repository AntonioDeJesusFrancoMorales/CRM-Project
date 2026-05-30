# Archive Report — Change 7: usuarios-contrato-rpc

**Status**: Completado y archivado
**Fecha**: 2026-05-30
**Cambio**: Change 7 — Homologacion del feature `usuarios` al contrato RPC real del back AR-CRM
**Modo**: Strict TDD (8 fases, 38 tareas, 2 batches)
**Verificacion final**: PASS — 643 tests/0 failed, type-check 5 pre-existentes/0 nuevos, auth verde

---

## Resumen ejecutivo

El Change 7 `usuarios-contrato-rpc` homologa el feature `usuarios` al contrato RPC real de `UsuarioController` y `RolController` (AR-CRM), siguiendo el patron ya establecido por los Changes 1-6. Los cambios clave son:

1. **Tipo `Usuario` realineado** al shape exacto de `UsuarioResponse`: elimina `rol_sistema`/`rol_empresa` del tipo de dominio y agrega `rolId`, `creadoEn`, `keycloakId`.
2. **`UsuarioSesion` independiente** para el authStore: preserva `rol_sistema`/`rol_empresa` para el `RoleGuard` sin contaminar el tipo de dominio.
3. **CRUD RPC completo**: GET /get-all, GET /get-by-id?id=, POST /create, PUT /edit?id=, DELETE /delete?id= via `endpoints.usuarios.*`.
4. **Feature `roles` integrado**: `useRoles` + `resolveRolNombre` + handler/fixture MSW de roles. El select de roles en el form muestra opciones reales del back.
5. **`activo` READ-ONLY**: badge de solo lectura en la tabla; `useDesactivarUsuario` eliminado del codebase.
6. **Login mock intacto**: `UsuarioMock = Usuario & { password, rol_sistema, rol_empresa }`; `LoginResponse.usuario: UsuarioSesion`; auth suite verde.

---

## Conteo final

| Metrica | Valor |
|---------|-------|
| Tests totales | 643 passed |
| Tests failed | 0 |
| Test files | 81 |
| Type errors nuevos | 0 |
| Type errors pre-existentes | 5 (en contactos/__tests__, fuera de alcance) |
| Tasks completadas | 38/38 |
| CRITICAL | 0 |
| WARNING cerrados | 2 (W1 empty state text + W2 error 500 render test — cerrados en mini-batch post-verify) |
| SUGGESTION | 2 (S1, S2 — fuera de alcance) |

---

## Capabilities canonicas

### Nueva — usuarios-management

**Archivo**: `openspec/specs/usuarios-management/spec.md`

**Estado**: Creada e implementada. Consolida las dos delta specs del change (`usuarios-rpc` + `roles-lookup`) siguiendo la convencion `{dominio}-management` del repositorio.

**Justificacion de consolidacion**: `roles` no es un feature propio en este change (solo lectura auxiliar de `usuarios` via `get-all`). Por el design D4, `useRoles` vive dentro de `src/features/usuarios/`. Crear `openspec/specs/roles-lookup/` separada romperia la convencion del repo.

**Requirements incluidos**:

| # | Requirement | Origen delta |
|---|-------------|--------------|
| 1 | endpoints.ts fuente unica de rutas de usuarios | usuarios-rpc |
| 2 | endpoints.ts expone ruta de roles | roles-lookup |
| 3 | Tipo Usuario alineado a UsuarioResponse del back | usuarios-rpc |
| 4 | Tipo Rol alineado a RolResponse del back | roles-lookup |
| 5 | Listado de usuarios con ruta RPC | usuarios-rpc |
| 6 | useRoles consume GET /roles/get-all | roles-lookup |
| 7 | Form de usuario muestra select de roles reales | roles-lookup |
| 8 | Tabla muestra nombre del rol resolviendo rolId | roles-lookup |
| 9 | Crear usuario con ruta RPC y rolId | usuarios-rpc |
| 10 | Editar usuario con PUT y ruta RPC | usuarios-rpc |
| 11 | Eliminar usuario con ruta RPC | usuarios-rpc |
| 12 | useDesactivarUsuario eliminado | usuarios-rpc |
| 13 | Handlers MSW fieles al contrato RPC | usuarios-rpc |
| 14 | Fixture y handler de roles para MSW | roles-lookup |
| 15 | Login mock no se rompe tras UsuarioSesion | roles-lookup |

**Total**: 15 requirements, todos implementados y verificados.

### Specs canonicas intactas

Las siguientes specs NO fueron tocadas por este change:

- `openspec/specs/contactos-management/spec.md`
- `openspec/specs/empresas-management/spec.md`
- `openspec/specs/kanban-management/spec.md`
- `openspec/specs/prospecto-conversion/spec.md`
- `openspec/specs/tareas-management/spec.md`
- `openspec/specs/tratos-management/spec.md`

---

## Fases completadas

| Fase | Descripcion | Tareas | Estado |
|------|-------------|--------|--------|
| F1 | Tipos + endpoints (fuente de verdad) | 4 | ✅ |
| F2 | Fixtures y handlers MSW (usuarios + roles) | 8 | ✅ |
| F3 | Hooks de usuarios (RPC) | 8 | ✅ |
| F4 | Hook de roles + helper lookup | 4 | ✅ |
| F5 | Schema Zod de usuario | 2 | ✅ |
| F6 | Componentes y page | 6 | ✅ |
| F7 | Limpieza | 3 | ✅ |
| F8 | Verificacion final | 3 | ✅ |
| **Total** | | **38/38** | ✅ |

---

## Archivos de codigo impactados

### Creados (nuevos)

| Archivo | Descripcion |
|---------|-------------|
| `src/mocks/fixtures/roles.ts` | Fixture de roles (2 roles, UUIDs coherentes con usuarios) |
| `src/mocks/handlers/roles.ts` | Handler GET /api/roles/get-all |
| `src/mocks/handlers/__tests__/usuarios.handler.test.ts` | Tests RPC de usuarios (16 tests) |
| `src/mocks/handlers/__tests__/roles.handler.test.ts` | Tests RPC de roles (4 tests) |
| `src/features/usuarios/hooks/useRoles.ts` | useQuery ['roles'] — GET /roles/get-all |
| `src/features/usuarios/hooks/useEditUsuario.ts` | PUT /usuarios/edit?id= |
| `src/features/usuarios/lib/rolLookup.ts` | resolveRolNombre pura con fallback a rolId |
| `src/features/usuarios/__tests__/useRoles.test.tsx` | 3 tests |
| `src/features/usuarios/__tests__/useEditUsuario.test.tsx` | 4 tests |
| `src/features/usuarios/__tests__/rolLookup.test.ts` | 4 tests |
| `src/features/usuarios/__tests__/usuario.schema.test.ts` | 11 tests |
| `src/features/usuarios/__tests__/UsuarioForm.test.tsx` | 7 tests (select roles dinamico) |
| `src/features/usuarios/__tests__/UsuariosTable.test.tsx` | 6 tests (resolveRolNombre, fallback, badge read-only) |

### Modificados

| Archivo | Cambio |
|---------|--------|
| `src/api/endpoints.ts` | Bloques `usuarios` (getAll/getById/create/edit/delete) y `roles` (getAll) |
| `src/api/types.ts` | `Usuario` realineado; nuevos `UsuarioSesion`, `Rol`; `LoginResponse.usuario: UsuarioSesion` |
| `src/store/authStore.ts` | `AuthUser = UsuarioSesion` |
| `src/mocks/fixtures/usuarios.ts` | `UsuarioMock = Usuario & { password, rol_sistema, rol_empresa }`; rolId/creadoEn/keycloakId; toUsuarioDto omite 3 campos auth |
| `src/mocks/handlers/usuarios.ts` | RPC completo; eliminado PATCH /desactivar |
| `src/mocks/handlers/index.ts` | rolesHandlers registrado |
| `src/mocks/handlers/auth.ts` | UsuarioSesion construido directo desde UsuarioMock |
| `src/mocks/utils/fake-jwt.ts` | Importa RolSistema en lugar de Usuario['rol_sistema'] |
| `src/features/usuarios/hooks/useUsuarios.ts` | endpoints.usuarios.getAll() |
| `src/features/usuarios/hooks/useCreateUsuario.ts` | endpoints.usuarios.create(); body con rolId/initialPassword |
| `src/features/usuarios/hooks/useDeleteUsuario.ts` | endpoints.usuarios.delete() |
| `src/features/usuarios/schemas/usuario.schema.ts` | rolId + initialPassword; sin rol_sistema/activo |
| `src/features/usuarios/components/UsuarioForm.tsx` | CreateForm + EditForm internos; useRoles() interno; sin rol_sistema/rol_empresa |
| `src/features/usuarios/components/UsuarioFormDialog.tsx` | useEditUsuario; sin isOwnAccount; defaultValues desde rolId |
| `src/features/usuarios/components/UsuariosTable.tsx` | prop `roles: Rol[]`; resolveRolNombre; badge activo READ-ONLY; creadoEn |
| `src/features/usuarios/pages/UsuariosListPage.tsx` | useRoles(); sin desactivarMutation/reactivarMutation |
| `src/features/usuarios/__tests__/useUsuarios.test.tsx` | Ruta RPC + campos nuevos |
| `src/features/usuarios/__tests__/useCreateUsuario.test.tsx` | rolId + initialPassword |
| `src/features/usuarios/__tests__/useDeleteUsuario.test.tsx` | Ruta query param |
| `src/features/usuarios/__tests__/UsuariosListPage.test.tsx` | Filtro por "Administrador"; W1/W2 tests agregados |
| `src/features/kanban/__tests__/KanbanCard.test.tsx` | Handlers /api/usuarios → /api/usuarios/get-all |
| `src/api/__tests__/endpoints.test.ts` | Bloques usuarios + roles |

### Eliminados

| Archivo | Motivo |
|---------|--------|
| `src/features/usuarios/hooks/useDesactivarUsuario.ts` | Endpoint inexistente en el back (D1) |
| `src/features/usuarios/__tests__/useDesactivarUsuario.test.tsx` | Idem |
| `src/features/usuarios/hooks/useUpdateUsuario.ts` | Reemplazado por useEditUsuario |

---

## Decisiones de diseno documentadas

1. **D1 — activo READ-ONLY**: El campo `activo` en `Usuario` es read-only porque `EditUsuarioService.java:55` hardcodea `existing.isActivo()` — el back no modela el cambio de activo via API REST; lo gestiona Keycloak. `useDesactivarUsuario` eliminado.

2. **D2 — roles dentro de features/usuarios/**: `roles` no tiene pages, CRUD, ni UI propia en este change — solo lectura auxiliar para poblar el select y resolver `rolId → nombre`. Un feature propio seria anemico. Si aparece CRUD de roles, se promueve a `src/features/roles/` (refactor barato: 2-3 archivos).

3. **D3 — endpoints.ts como fuente unica de verdad**: Mismo patron que Changes 1-6. Todos los hooks y handlers importan desde `endpoints.ts`. Cero rutas literales legacy en el feature.

4. **D4 — lookup rolId → nombre via funcion pura**: `resolveRolNombre(rolId, roles ?? [])` en `rolLookup.ts`. Fallback = `rolId` (no string vacio ni null). Tabla usa `roles ?? []` mientras `useRoles` esta pending.

5. **D5 — UsuarioSesion independiente**: No deriva de `Usuario` via `Pick`. Auth y CRUD evolucionan por separado. `LoginResponse.usuario: UsuarioSesion`; `AuthUser = UsuarioSesion` en authStore. Login mock conserva `rol_sistema`/`rol_empresa` via `UsuarioMock`.

6. **CreateForm/EditForm separados en UsuarioForm**: Sub-componentes internos en lugar de union de tipos para evitar incompatibilidad entre `UseFormReturn<UsuarioCreateInput>` y `UseFormReturn<UsuarioUpdateInput>` en el `Form` de shadcn/ui. Mismo patron que `UsuarioFormDialog`.

---

## Verificacion final

**Verify Report Status**: PASS

| Metrica | Valor |
|---------|-------|
| Tests | 643 passed / 0 failed / 81 archivos |
| Type errors nuevos | 0 |
| Type errors pre-existentes | 5 (contactos/__tests__ — fuera de alcance) |
| CRITICAL | 0 |
| WARNING cerrados | 2 (W1 texto empty state; W2 test error 500) |
| SUGGESTION | 2 (S1 cobertura rolLookup; S2 act() wraps Radix — pre-existente) |
| Auth suite | VERDE (ProtectedRoute 2/2, login mock, RoleGuard) |

---

## Deuda tecnica registrada

### S1 — rolLookup con array vacio (pending)

Test implicito via `roles ?? []` en tabla. Puede agregarse un caso explicito en `rolLookup.test.ts`. No bloquea.

### S2 — act() wraps en tests Radix Select

Warnings de act() en `UsuariosListPage.test.tsx` y otros features (kanban, tareas). Pre-existente al change. Recomendacion: limpiar en pass dedicado de test-quality.

---

## SDD Cycle Completion

| Fase | Estado |
|------|--------|
| Explore | ✅ Done |
| Propose | ✅ Done |
| Spec (delta) | ✅ Done |
| Design | ✅ Done |
| Tasks | ✅ Done (38/38) |
| Apply | ✅ Done (2 batches + mini-batch W1/W2, Strict TDD) |
| Verify | ✅ PASS |
| Archive | ✅ Done (2026-05-30) |

**Directorio archivado**: `openspec/changes/archive/2026-05-30-usuarios-contrato-rpc/` ✅
**Spec canonica nueva**: `openspec/specs/usuarios-management/spec.md` ✅

---

## Artifact Store (openspec)

**Archivo**: `openspec/changes/archive/2026-05-30-usuarios-contrato-rpc/archive-report.md` (este archivo)

Change 7 completamente archivado. Siguiente cambio disponible segun backlog.
