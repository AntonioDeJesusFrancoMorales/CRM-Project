# Apply Progress — usuarios-contrato-rpc (Change 7)

**Batch**: 2 de 2 — COMPLETO
**Alcance**: F1–F8 (todos los componentes, limpieza y verificación final)
**Modo**: Strict TDD — test rojo → implementación verde → refactor
**Fecha**: 2026-05-30

---

## Estado de tareas

### F1 — Tipos + endpoints (fuente de verdad) ✅ COMPLETO

| Tarea | Estado | Evidencia TDD |
|-------|--------|---------------|
| F1.1 TEST endpoints.usuarios/roles | ✅ | ROJO: 6 tests; VERDE: 21 tests |
| F1.2 IMPL endpoints.ts | ✅ | VERDE tras impl |
| F1.3 IMPL types.ts | ✅ | Compilado, tipos correctos |
| F1.4 IMPL authStore.ts | ✅ | AuthUser = UsuarioSesion |

### F2 — Fixtures y handlers MSW ✅ COMPLETO

| Tarea | Estado | Evidencia TDD |
|-------|--------|---------------|
| F2.1 TEST usuarios.handler.test.ts | ✅ | ROJO: 14 failed; VERDE: 16 tests |
| F2.2 TEST roles.handler.test.ts | ✅ | ROJO: fallo; VERDE: 4 tests |
| F2.3 IMPL fixtures/roles.ts | ✅ | Creado con 2 roles; UUIDs coinciden con usuarios |
| F2.4 IMPL fixtures/usuarios.ts | ✅ | UsuarioMock con rolId/creadoEn/keycloakId; toUsuarioDto omite 3 campos auth |
| F2.5 IMPL handlers/usuarios.ts | ✅ | RPC completo; LEGACY PATCH /desactivar conservado (ver nota) |
| F2.6 IMPL handlers/roles.ts | ✅ | Creado |
| F2.7 IMPL handlers/index.ts | ✅ | rolesHandlers registrado |
| F2.8 IMPL handlers/auth.ts | ✅ | UsuarioSesion construido directo desde UsuarioMock; login mock VERDE |

**Nota F2.5**: Se conservó provisionalmente el handler legacy `PATCH /api/usuarios/:id/desactivar` para que `useDesactivarUsuario.test.tsx` no se rompa antes de Batch 2/F7.1. Se elimina junto con el hook en F7.

### F3 — Hooks de usuarios RPC ✅ COMPLETO

| Tarea | Estado | Evidencia TDD |
|-------|--------|---------------|
| F3.1 TEST useUsuarios | ✅ | ROJO → VERDE: 3 tests |
| F3.2 IMPL useUsuarios.ts | ✅ | endpoints.usuarios.getAll() |
| F3.3 TEST useCreateUsuario | ✅ | ROJO → VERDE: 3 tests |
| F3.4 IMPL useCreateUsuario.ts | ✅ | endpoints.usuarios.create() |
| F3.5 TEST useEditUsuario | ✅ | ROJO → VERDE: 4 tests |
| F3.6 IMPL useEditUsuario.ts | ✅ | Creado nuevo; useUpdateUsuario.ts conservado hasta F7.2 |
| F3.7 TEST useDeleteUsuario | ✅ | ROJO → VERDE: 4 tests |
| F3.8 IMPL useDeleteUsuario.ts | ✅ | endpoints.usuarios.delete() |

### F4 — Hook de roles + helper lookup ✅ COMPLETO

| Tarea | Estado | Evidencia TDD |
|-------|--------|---------------|
| F4.1 TEST useRoles | ✅ | ROJO → VERDE: 3 tests |
| F4.2 IMPL useRoles.ts | ✅ | queryKey ['roles'] |
| F4.3 TEST rolLookup | ✅ | ROJO → VERDE: 4 tests |
| F4.4 IMPL rolLookup.ts | ✅ | resolveRolNombre pura con fallback |

### F5 — Schema Zod de usuario ✅ COMPLETO

| Tarea | Estado | Evidencia TDD |
|-------|--------|---------------|
| F5.1 TEST usuario.schema | ✅ | ROJO → VERDE: 11 tests |
| F5.2 IMPL usuario.schema.ts | ✅ | rolId + initialPassword; sin rol_sistema/activo |

---

## Resultados de tests (pnpm test:run)

**Baseline**: 74 archivos, 582 tests, 0 failed
**Batch 1 final**: 80 archivos, 630 tests, **1 failed**

### Test fallido esperado (Batch 2):

- `src/features/usuarios/__tests__/UsuariosListPage.test.tsx > filtra por rol al cambiar el select de filtro a "admin"`
  - **Causa**: `UsuariosTable.tsx` filtra por `u.rol_sistema` que fue eliminado del tipo `Usuario`. El componente será reescrito en F6.5 (Batch 2).
  - **Estado**: ESPERADO — lo arregla Batch 2 / F6.

---

## Type-check (pnpm type-check)

**Pre-existentes** (5 errores en contactos/__tests__, FUERA DE ALCANCE):
- `contactos/__tests__/ComoNosConocioInput.test.tsx(2,18)` — TS6133
- `contactos/__tests__/ContactoForm.test.tsx(93,23)` — TS2532
- `contactos/__tests__/ContactosTable.test.tsx(79,21)` — TS6133
- `contactos/__tests__/ContactosTable.test.tsx(83,22)` — TS2345
- `contactos/__tests__/EstadoRelacionSelect.test.tsx(136,11)` — TS6133

**Nuevos por cambios de Batch 1 (componentes UI — arregla Batch 2 / F6)**:
- `src/features/usuarios/components/UsuarioForm.tsx(45,3)` — TS2353: `rol_sistema` no existe en schema nuevo
- `src/features/usuarios/components/UsuarioForm.tsx(133,11)` — TS2322: idem
- `src/features/usuarios/components/UsuarioForm.tsx(187,11)` — TS2322: `rol_empresa` idem
- `src/features/usuarios/components/UsuarioFormDialog.tsx(94,26)` — TS2339: `usuario.rol_sistema` no existe en `Usuario`
- `src/features/usuarios/components/UsuarioFormDialog.tsx(95,26)` — TS2339: `usuario.rol_empresa` idem
- `src/features/usuarios/components/UsuariosTable.tsx(67,54)` — TS2339: `u.rol_sistema` idem
- `src/features/usuarios/components/UsuariosTable.tsx(129,30)` — TS2339: idem
- `src/features/usuarios/components/UsuariosTable.tsx(135,39)` — TS2339: `u.rol_empresa` idem
- `src/features/usuarios/components/UsuariosTable.tsx(153,58)` — TS2551: `creado_en` → debe ser `creadoEn`

**Errores de plumbing resueltos en Batch 1**:
- `src/mocks/utils/fake-jwt.ts` — arreglado: importa `RolSistema` directamente en lugar de `Usuario['rol_sistema']`

---

## Archivos creados / modificados / conservados

### Creados (nuevos)
- `src/api/__tests__/endpoints.test.ts` — ampliado con bloques usuarios + roles
- `src/mocks/fixtures/roles.ts` — fixture de roles (2 roles, UUIDs coherentes)
- `src/mocks/handlers/roles.ts` — handler GET /api/roles/get-all
- `src/mocks/handlers/__tests__/usuarios.handler.test.ts` — tests RPC de usuarios
- `src/mocks/handlers/__tests__/roles.handler.test.ts` — tests RPC de roles
- `src/features/usuarios/hooks/useRoles.ts` — useQuery ['roles']
- `src/features/usuarios/hooks/useEditUsuario.ts` — PUT /usuarios/edit?id=
- `src/features/usuarios/lib/rolLookup.ts` — resolveRolNombre pura
- `src/features/usuarios/__tests__/useRoles.test.tsx` — 3 tests
- `src/features/usuarios/__tests__/useEditUsuario.test.tsx` — 4 tests
- `src/features/usuarios/__tests__/rolLookup.test.ts` — 4 tests
- `src/features/usuarios/__tests__/usuario.schema.test.ts` — 11 tests

### Modificados
- `src/api/endpoints.ts` — bloques usuarios + roles agregados
- `src/api/types.ts` — Usuario realineado; UsuarioSesion + Rol nuevos; LoginResponse.usuario: UsuarioSesion
- `src/store/authStore.ts` — AuthUser = UsuarioSesion
- `src/mocks/fixtures/usuarios.ts` — UsuarioMock + rolId/creadoEn/keycloakId + toUsuarioDto omite 3 campos auth
- `src/mocks/handlers/usuarios.ts` — RPC completo + legacy PATCH conservado
- `src/mocks/handlers/index.ts` — rolesHandlers registrado
- `src/mocks/handlers/auth.ts` — UsuarioSesion construido directo desde UsuarioMock
- `src/mocks/utils/fake-jwt.ts` — importa RolSistema en lugar de Usuario['rol_sistema']
- `src/features/usuarios/hooks/useUsuarios.ts` — endpoints.usuarios.getAll()
- `src/features/usuarios/hooks/useCreateUsuario.ts` — endpoints.usuarios.create()
- `src/features/usuarios/hooks/useDeleteUsuario.ts` — endpoints.usuarios.delete()
- `src/features/usuarios/schemas/usuario.schema.ts` — rolId + initialPassword; sin rol_sistema/activo
- `src/features/usuarios/__tests__/useUsuarios.test.tsx` — ruta RPC + campos nuevos
- `src/features/usuarios/__tests__/useCreateUsuario.test.tsx` — rolId + initialPassword
- `src/features/usuarios/__tests__/useDeleteUsuario.test.tsx` — ruta query param
- `src/features/kanban/__tests__/KanbanCard.test.tsx` — handlers /api/usuarios → /api/usuarios/get-all

### Conservados sin cambios (pendientes Batch 2)
- `src/features/usuarios/hooks/useUpdateUsuario.ts` — eliminar en F7.2
- `src/features/usuarios/hooks/useDesactivarUsuario.ts` — eliminar en F7.1
- `src/features/usuarios/components/UsuarioForm.tsx` — reescribir en F6.2
- `src/features/usuarios/components/UsuarioFormDialog.tsx` — adaptar en F6.3
- `src/features/usuarios/components/UsuariosTable.tsx` — actualizar en F6.5
- `src/features/usuarios/pages/UsuariosListPage.tsx` — actualizar en F6.6
- `src/features/usuarios/__tests__/useDesactivarUsuario.test.tsx` — eliminar en F7.1

---

## Suite de auth — CRITICO ✅ VERDE

- `src/components/layout/__tests__/ProtectedRoute.test.tsx` — 2/2 VERDE
- Login mock retorna UsuarioSesion con rol_sistema ✅
- authStore usa UsuarioSesion con rol_sistema ✅
- RoleGuard sigue funcionando ✅

---

---

## F6 — Componentes y page ✅ COMPLETO (Batch 2)

| Tarea | Estado | Evidencia TDD |
|-------|--------|---------------|
| F6.1 TEST UsuarioForm.test.tsx | ✅ | ROJO: 2 failed; VERDE: 7 tests |
| F6.2 IMPL UsuarioForm.tsx | ✅ | CreateForm + EditForm internos; select dinámico useRoles(); initialPassword solo en create |
| F6.3 IMPL UsuarioFormDialog.tsx | ✅ | useEditUsuario en lugar de useUpdateUsuario; sin isOwnAccount; defaultValues desde rolId |
| F6.4 TEST UsuariosTable.test.tsx | ✅ | ROJO: 2 failed; VERDE: 6 tests |
| F6.5 IMPL UsuariosTable.tsx | ✅ | prop `roles: Rol[]`; resolveRolNombre; badge activo READ-ONLY; creadoEn; sin rol_empresa/desactivar |
| F6.6 IMPL UsuariosListPage.tsx | ✅ | useRoles(); sin desactivarMutation/reactivarMutation; sin isOwnAccount |

**Nota F6.1/F6.4**: Test UsuariosListPage existente actualizado: filtro por rol usa nombre de rol ("Administrador") en lugar de "admin"; test de bloqueo actualizado para verificar ausencia de Desactivar/Reactivar.

**Nota F6.2 — Decisión de implementación**: UsuarioForm se dividió en dos sub-componentes internos (`CreateForm` + `EditForm`) en lugar de un único componente con unión de tipos. Esto evita errores de incompatibilidad entre `UseFormReturn<UsuarioCreateInput>` y `UseFormReturn<UsuarioUpdateInput>` cuando el componente `Form` de shadcn/ui no acepta la unión de tipos de react-hook-form. Patrón idéntico al de `UsuarioFormDialog` (CreateDialog / EditDialog).

---

## F7 — Limpieza ✅ COMPLETO (Batch 2)

| Tarea | Estado | Evidencia |
|-------|--------|-----------|
| F7.1 DELETE useDesactivarUsuario.ts | ✅ | Eliminado; verificado: 0 imports restantes |
| F7.1 DELETE useDesactivarUsuario.test.tsx | ✅ | Eliminado |
| F7.2 DELETE useUpdateUsuario.ts | ✅ | Eliminado; verificado: 0 imports restantes |
| F7.3 LINT rutas legacy | ✅ | 0 rutas legacy en feature usuarios; handler PATCH /desactivar eliminado de handlers/usuarios.ts |

---

## F8 — Verificación final ✅ COMPLETO (Batch 2)

| Verificación | Resultado |
|---|---|
| `pnpm test:run` | **81 archivos, 641 tests, 0 failed** |
| Auth suite (ProtectedRoute, login mock) | ✅ VERDE |
| `pnpm type-check` | **Solo 5 errores pre-existentes en contactos/__tests__ — 0 nuevos** |
| UsuariosListPage E2E (roles cargados, badge read-only, sin desactivar) | ✅ VERDE |

---

## Pulido W1/W2 — Mini-batch post-verify ✅ COMPLETO (2026-05-30)

### Cambios realizados

| Tarea | Tipo | Descripción |
|-------|------|-------------|
| W1 — spec text | Corrección spec | `spec.md` scenario "Listado vacio muestra empty state": texto corregido de "No hay usuarios todavia" → "Aún no hay usuarios registrados." (texto real del componente) |
| W1 — test empty state | Test nuevo | `UsuariosListPage.test.tsx`: test de integración con handler MSW retornando `[]` → asserta texto "Aún no hay usuarios registrados." + botón "Crear primer usuario" |
| W2 — test error 500 | Test nuevo | `UsuariosListPage.test.tsx`: test de integración con handler MSW retornando status 500 → asserta botón "Reintentar" + ausencia de tabla |

### Hallazgos

- El botón de empty state tiene texto exacto "Crear primer usuario" (sin `aria-label` extra; se consulta por `name: /crear primer usuario/i`).
- El botón de reintentar en error state tiene texto exacto "Reintentar" (rol `button`).
- La tabla (`<table>`) NO se renderiza en estado de error — confirmado con `queryByRole('table')`.
- No se encontró ningún empty state ni estado de error NO implementado en el componente — W1/W2 solo faltaban tests, no código.

### Resultados finales

| Verificación | Antes pulido | Después pulido |
|---|---|---|
| Tests | 81 archivos, 641 passed, 0 failed | **81 archivos, 643 passed, 0 failed** |
| Tests nuevos | — | +2 (W1 empty state + W2 error 500) |
| type-check | 5 errores pre-existentes (contactos) | **5 errores pre-existentes — 0 nuevos** |
| Auth suite | VERDE | ✅ VERDE |

---

## Resultados de tests finales (pnpm test:run)

**Baseline Batch 1 final**: 80 archivos, 630 tests, 1 failed
**Batch 2 final**: 81 archivos, 641 tests, **0 failed**

Diferencia:
- +1 archivo test nuevo: `UsuarioForm.test.tsx` (7 tests)
- +1 archivo test nuevo: `UsuariosTable.test.tsx` (6 tests)
- -1 archivo eliminado: `useDesactivarUsuario.test.tsx` (2 tests eliminados)
- +1 test arreglado en UsuariosListPage (el test "filtra por rol" que fallaba en Batch 1)
- Neto: +11 tests, +1 archivo

---

## Type-check final (pnpm type-check)

**Pre-existentes** (5 errores en contactos/__tests__, FUERA DE ALCANCE) — sin cambios:
- `contactos/__tests__/ComoNosConocioInput.test.tsx(2,18)` — TS6133
- `contactos/__tests__/ContactoForm.test.tsx(93,23)` — TS2532
- `contactos/__tests__/ContactosTable.test.tsx(79,21)` — TS6133
- `contactos/__tests__/ContactosTable.test.tsx(83,22)` — TS2345
- `contactos/__tests__/EstadoRelacionSelect.test.tsx(136,11)` — TS6133

**Nuevos errores**: 0 (todos los 9 errores de Batch 1 en usuarios/components resueltos)

---

## Archivos creados / modificados / eliminados (Batch 2)

### Creados (nuevos en Batch 2)
- `src/features/usuarios/__tests__/UsuarioForm.test.tsx` — 7 tests para CreateForm/EditForm con select dinámico
- `src/features/usuarios/__tests__/UsuariosTable.test.tsx` — 6 tests: resolveRolNombre, fallback, badge read-only

### Modificados (Batch 2)
- `src/features/usuarios/components/UsuarioForm.tsx` — reescrito: CreateForm + EditForm internos; useRoles() interno; initialPassword solo en create; sin rol_sistema/rol_empresa
- `src/features/usuarios/components/UsuarioFormDialog.tsx` — useEditUsuario en lugar de useUpdateUsuario; sin isOwnAccount; defaultValues desde rolId/nombre/correo
- `src/features/usuarios/components/UsuariosTable.tsx` — prop `roles: Rol[]`; resolveRolNombre; badge activo READ-ONLY; creadoEn; sin onDesactivar/onReactivar
- `src/features/usuarios/pages/UsuariosListPage.tsx` — useRoles(); sin desactivarMutation/reactivarMutation; sin isOwnAccount
- `src/features/usuarios/__tests__/UsuariosListPage.test.tsx` — filtro por "Administrador" (no "admin"); test bloqueo actualizado (solo Eliminar, sin Desactivar)
- `src/mocks/handlers/usuarios.ts` — eliminado PATCH /usuarios/:id/desactivar legacy
- `openspec/changes/usuarios-contrato-rpc/tasks.md` — F6-F8 marcadas [x]

### Eliminados (Batch 2)
- `src/features/usuarios/hooks/useDesactivarUsuario.ts` — eliminado (F7.1)
- `src/features/usuarios/__tests__/useDesactivarUsuario.test.tsx` — eliminado (F7.1)
- `src/features/usuarios/hooks/useUpdateUsuario.ts` — eliminado (F7.2)

---

## Suite de auth — CRITICO ✅ VERDE

- `src/components/layout/__tests__/ProtectedRoute.test.tsx` — 2/2 VERDE
- Login mock retorna UsuarioSesion con rol_sistema ✅
- authStore usa UsuarioSesion con rol_sistema ✅
- RoleGuard sigue funcionando ✅
- UsuarioSesion y fixture conservan rol_sistema/rol_empresa ✅

---

## Verificación rutas legacy (F7.3)

- `src/features/usuarios/` — 0 rutas literales `/api/usuarios` ni `/usuarios/:id`
- `src/mocks/handlers/usuarios.ts` — solo rutas RPC: `/usuarios/get-all`, `/usuarios/get-by-id`, `/usuarios/create`, `/usuarios/edit`, `/usuarios/delete`
- `rol_sistema`/`rol_empresa` en src/features/usuarios/ — solo en tests como assertiones negativas y en authStore (UsuarioSesion intencional)
