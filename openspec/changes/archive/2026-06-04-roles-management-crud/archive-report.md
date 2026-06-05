# Archive Report — Change 9: roles-management-crud

**Status**: Completado y archivado
**Fecha**: 2026-06-04
**Cambio**: Change 9 — CRUD completo de roles de dominio del CRM con area de Configuracion admin-only
**Modo**: Standard (implementacion inline; cobertura T11 cerrada en un segundo pass)
**Verificacion final**: PASS — 911 tests / 0 failed / 108 archivos; type-check 0 errores nuevos; lint 0 errores

**Nota de materializacion**: El change fue implementado y verificado ANTES de crear los artefactos openspec. Los artefactos (proposal, tasks, design, specs, verify-report, archive-report) se crearon retroactivamente en 2026-06-04 para dejar el historial SDD completo y fiel al estado real del codigo.

---

## Resumen ejecutivo

El Change 9 `roles-management-crud` promueve `roles` de lectura auxiliar (Change 7) a feature propio con CRUD completo, y expone el area de **Configuracion** (admin-only) en el sidebar. Los cambios clave son:

1. **CRUD completo de roles**: `POST /create`, `GET /get-all`, `GET /get-by-id?id=`, `PUT /edit?id=`, `DELETE /delete?id=` via `endpoints.roles.*`.
2. **`useRoles` centralizado con factory `rolesKeys`**: migrado de `features/usuarios/hooks/useRoles.ts` a `features/roles/hooks/useRoles.ts`. La factory garantiza que `rolesKeys.list() === ['roles']` es compartida entre el feature roles y el `UsuarioFormDialog`, eliminando el bug de cache doble/stale.
3. **Manejo de 409**: `RolDeleteDialog` diferencia el 409 (rol con usuarios asignados) de errores genericos: muestra toast `"Este rol tiene usuarios asignados y no puede eliminarse"` sin cerrar el dialog.
4. **Handler MSW con store mutable**: soporta el ciclo completo create/edit/delete en tests, con regla 409 simulada.
5. **Area Configuracion admin-only**: item "Configuracion" (Settings) en `Sidebar.tsx` con `adminOnly: true`; ruta `/configuracion` bajo `RoleGuard role="admin"` en `router.tsx`.
6. **`activo` display-only**: campo informativo en la tabla; sin toggle (coherente con D1 del Change 7).

---

## Conteo final

| Metrica | Valor |
|---------|-------|
| Tests totales | 911 passed |
| Tests failed | 0 |
| Test files | 108 |
| Type errors nuevos | 0 |
| Lint errores | 0 (7 warnings pre-existentes) |
| Tasks completadas | 11/11 |
| CRITICAL | 0 |
| WARNING | 0 |
| SUGGESTION | 2 (S1 handler 409 dependencia fixture; S2 test de RolesListPage completo) |

---

## Capabilities canonicas

### Nueva — roles-management

**Archivo**: `openspec/specs/roles-management/spec.md`

**Estado**: Creada e implementada. Consolida el CRUD de roles, la regla 409, el gate admin-only del sidebar y la ruta protegida.

**Requirements incluidos**:

| # | Requirement | Origen |
|---|-------------|--------|
| 1 | endpoints.ts CRUD completo de roles | Change 9 |
| 2 | useRoles centralizado con factory rolesKeys | Change 9 |
| 3 | Crear rol via POST /roles/create | Change 9 |
| 4 | Editar rol via PUT /roles/edit?id= | Change 9 |
| 5 | Eliminar rol con 409 si tiene usuarios asignados | Change 9 |
| 6 | activo display-only, sin toggle | Change 9 |
| 7 | Area Configuracion admin-only en Sidebar | Change 9 |
| 8 | Ruta /configuracion bajo RoleGuard | Change 9 |
| 9 | Handler MSW mutable + regla 409 | Change 9 |

**Total**: 9 requirements, todos implementados y verificados.

### Spec actualizada — usuarios-management

El Change 9 no modifica los requirements de `usuarios-management`. La migracion de `useRoles` es una decision de diseno interna (D1 del design). La spec `openspec/specs/usuarios-management/spec.md` permanece vigente sin cambios; el behavior del feature usuarios es identico al Change 7.

### Specs canonicas intactas

- `openspec/specs/contactos-management/spec.md`
- `openspec/specs/empresas-management/spec.md`
- `openspec/specs/kanban-management/spec.md`
- `openspec/specs/prospecto-conversion/spec.md`
- `openspec/specs/tareas-management/spec.md`
- `openspec/specs/tratos-management/spec.md`
- `openspec/specs/usuarios-management/spec.md`

---

## Tareas completadas

| Tarea | Descripcion | Estado |
|-------|-------------|--------|
| T1 | Endpoints roles CRUD completo | Done |
| T2 | Schemas Zod (rolCreateSchema + rolUpdateSchema) | Done |
| T3 | Hooks CRUD + useRoles centralizado con rolesKeys | Done |
| T4 | MSW handler roles con store mutable + 409 | Done |
| T5 | RolesTable.tsx | Done |
| T6 | RolFormDialog.tsx (create + edit) | Done |
| T7 | RolDeleteDialog.tsx (204/409) | Done |
| T8 | RolesListPage.tsx | Done |
| T9 | Sidebar.tsx — item Configuracion adminOnly | Done |
| T10 | router.tsx — /configuracion bajo RoleGuard | Done |
| T11 | Tests (hooks + handler + schema + componentes + Sidebar) | Done |

---

## Archivos de codigo impactados

### Creados (nuevos)

| Archivo | Descripcion |
|---------|-------------|
| `src/features/roles/schemas/rol.schema.ts` | rolCreateSchema (nombre req min1/max80, descripcion opt) + rolUpdateSchema |
| `src/features/roles/hooks/useRoles.ts` | useRoles con factory rolesKeys (all/list/detail) |
| `src/features/roles/hooks/useCreateRol.ts` | POST /roles/create; invalida rolesKeys.list() |
| `src/features/roles/hooks/useEditRol.ts` | PUT /roles/edit?id=; invalida list + detail |
| `src/features/roles/hooks/useDeleteRol.ts` | DELETE /roles/delete?id=; invalida list; distingue 409 |
| `src/features/roles/components/RolesTable.tsx` | Tabla con activo badge read-only, callbacks onEdit/onDelete |
| `src/features/roles/components/RolFormDialog.tsx` | Dialog create/edit con validacion Zod |
| `src/features/roles/components/RolDeleteDialog.tsx` | AlertDialog con logica 204/409 |
| `src/features/roles/pages/RolesListPage.tsx` | Container page que orquesta tabla y dialogs |
| `src/features/roles/__tests__/useRoles.test.tsx` | Tests del hook centralizado |
| `src/features/roles/__tests__/useCreateRol.test.tsx` | Tests de mutacion create |
| `src/features/roles/__tests__/useEditRol.test.tsx` | Tests de mutacion edit |
| `src/features/roles/__tests__/useDeleteRol.test.tsx` | Tests de mutacion delete + 409 |
| `src/features/roles/__tests__/rol.schema.test.ts` | Tests de validacion Zod |
| `src/features/roles/__tests__/RolesTable.test.tsx` | Tests de componente tabla |
| `src/features/roles/__tests__/RolFormDialog.test.tsx` | Tests create/edit modes |
| `src/features/roles/__tests__/RolDeleteDialog.test.tsx` | Tests 204/409 scenarios |

### Modificados

| Archivo | Cambio |
|---------|--------|
| `src/api/endpoints.ts` | roles.getById, create, edit, delete agregados |
| `src/mocks/handlers/roles.ts` | Store mutable + handlers CRUD completo + regla 409 |
| `src/mocks/handlers/__tests__/roles.handler.test.ts` | Tests actualizados con CRUD + 409 |
| `src/components/layout/Sidebar.tsx` | Item Configuracion (Settings, adminOnly, /configuracion) |
| `src/components/layout/__tests__/Sidebar.test.tsx` | Tests extendidos: admin ve Configuracion; user no ve |
| `src/routes/router.tsx` | Ruta /configuracion con RoleGuard role="admin" |
| `src/features/usuarios/components/UsuarioForm.tsx` | Import useRoles desde @/features/roles/hooks/useRoles |
| `src/features/usuarios/pages/UsuariosListPage.tsx` | Import useRoles desde @/features/roles/hooks/useRoles |

### Eliminados

| Archivo | Motivo |
|---------|--------|
| `src/features/usuarios/hooks/useRoles.ts` | Migrado a src/features/roles/hooks/useRoles.ts (D1) |
| `src/features/usuarios/__tests__/useRoles.test.tsx` | Test migrado a src/features/roles/__tests__/useRoles.test.tsx |

---

## Decisiones de diseno documentadas

1. **D1 — rolesKeys factory centralizado**: `rolesKeys.list() === ['roles']` compartido entre el feature roles y `UsuarioFormDialog`. Elimina el bug de cache doble donde invalidar roles desde la pantalla de Configuracion no refrescaba el selector de roles en el form de usuarios.

2. **D2 — 409 en delete: toast sin cerrar dialog**: El `RolDeleteDialog` diferencia el 409 de errores genericos. En 409: toast `ROL_CON_USUARIOS_MSG` + dialog permanece abierto. En error generico: toast + dialog cierra. El usuario mantiene el contexto y puede cancelar explicitamente.

3. **D3 — Gate admin-only en front**: El back no gatea `/api/roles/**` por rol (deuda conocida). El front implementa: `adminOnly: true` en el Sidebar + `RoleGuard role="admin"` en la ruta. Patron consistente con `RoleGuard` ya existente en el repo.

4. **D4 — activo display-only**: Coherente con D1 del Change 7 (`activo` en Usuario). El back no expone endpoint de toggle para roles; `activo` es badge informativo en la tabla.

---

## Verificacion final

**Verify Report Status**: PASS

| Metrica | Valor |
|---------|-------|
| Tests | 911 passed / 0 failed / 108 archivos |
| Type errors nuevos | 0 |
| Lint errores | 0 (7 warnings pre-existentes) |
| CRITICAL | 0 |
| WARNING | 0 |
| SUGGESTION | 2 (S1 handler 409; S2 test page completa) |
| Criterios de aceptacion | 6/6 cumplidos |

---

## Deuda tecnica registrada

### S1 — Regla 409 en handler MSW hardcodeada contra fixture de usuarios

La regla 409 verifica si el `rolId` a eliminar esta en el fixture de usuarios. Si el fixture de usuarios cambia, la regla puede quedar desactualizada. Recomendacion: usar un store mutable de usuarios si se implementa CRUD de usuarios en MSW. No bloquea.

### S2 — Falta test de integracion de RolesListPage completa

Los tests individuales de componente cubren el comportamiento aislado. Un test que orqueste la page completa (lista + crear + editar + eliminar con 409) daria mayor confianza. No bloquea.

### Deuda back — Gate de autorizacion para /api/roles

El back deberia gatear `/api/roles/**` con `@PreAuthorize("hasRole('ADMIN')")`. Actualmente cualquier JWT valido puede hacer CRUD de roles. El front mitiga esto con `RoleGuard`, pero la seguridad real requiere la validacion en el back. Registrado para el equipo de backend.

---

## SDD Cycle Completion

| Fase | Estado |
|------|--------|
| Explore | N/A (change sencillo, sin fase de explore formal) |
| Propose | Done (retroactivo) |
| Spec (delta) | Done (retroactivo) |
| Design | Done (retroactivo) |
| Tasks | Done (retroactivo — 11/11) |
| Apply | Done (implementacion inline) |
| Verify | PASS |
| Archive | Done (2026-06-04) |

**Directorio archivado**: `openspec/changes/archive/2026-06-04-roles-management-crud/`
**Spec canonica nueva**: `openspec/specs/roles-management/spec.md`

---

## Artifact Store (openspec)

**Archivo**: `openspec/changes/archive/2026-06-04-roles-management-crud/archive-report.md` (este archivo)

Change 9 completamente archivado. Artefactos materializados retroactivamente el 2026-06-04.
