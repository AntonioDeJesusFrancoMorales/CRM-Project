# Proposal: clientes-management (Change 5)

> Fecha: 2026-05-23 — Modo: hybrid — Strict TDD: ACTIVO

## Intent

Implementar la gestión completa de Clientes en el CRM Pipely: listado filtrable, detalle con tabs (Información | Tratos), creación manual via diálogo modal, edición, y eliminación con bloqueo 409 si hay tratos vinculados. Cierra el bucle iniciado por Change 4 (prospectos → conversión → cliente) y desbloquea Change 6 (tratos).

## Motivation

Change 4 (prospectos-crud) quedó cerrado con un hook temporal `useClientes.ts` en `features/prospectos/` documentado como "Change 5 lo moverá". El embudo CRM requiere que el cliente sea entidad de primer nivel: navegable, editable y con visibilidad de sus tratos. Habilitar el link `Clientes` en sidebar es prerequisito para Changes 6-8.

## Scope

### In Scope
- CRUD completo de `Cliente`: crear (diálogo), editar (diálogo), eliminar (con validación 409), leer.
- Página `/clientes` — tabla filtrable (búsqueda por nombre, filtro por empresa, filtro por origen).
- Página `/clientes/:id` — detalle con tabs `Información | Tratos`.
- Hook nuevo `useTratosByCliente(id)` — read-only, lazy via `enabled` (ADR-027).
- Migración `src/features/prospectos/hooks/useClientes.ts` → `src/features/clientes/hooks/useClientes.ts` + extender con `useCliente`, `useCreateCliente`, `useUpdateCliente`, `useDeleteCliente`.
- MSW: override `DELETE /clientes/:id` con validación 409; agregar filtros a `GET /clientes` (`empresa_id`, `origen`).
- Sidebar: quitar `disabled + badge` del item `Clientes` (línea 18).
- Router: wirear `/clientes` y `/clientes/:id` (NO `/clientes/nuevo` — el create es diálogo).
- Nombre clickeable en `ClientesTable` (patrón homologado).
- Badge clickeable `prospecto_origen_id` en header del detalle (link a `/prospectos/:id` o texto `Origen: Manual`).

### Out of Scope
- CRUD de Tratos (Change 6).
- Tableros / Kanban de clientes (Change 7).
- Tags y comentarios (Change 8).
- Soft delete / campo `activo`.
- Cascading delete.
- Operaciones bulk.
- Export / import.

## Capabilities

### New Capabilities
- `clientes-management`: CRUD de clientes (lista filtrable, detalle con tabs, crear/editar via diálogo, eliminar con bloqueo 409, badge de origen prospecto/manual, tab Tratos read-only, hook `useTratosByCliente`, migración del hook `useClientes`, wiring de sidebar y router).

### Modified Capabilities
- None.

## Approach

Layer-by-layer siguiendo Strict TDD (RED→GREEN) homologado con `empresas/` y `prospectos/`:

1. **MSW handlers** (`clientes.ts`) — override `DELETE` con check de tratos en `tratosFixture`; agregar filtros a `GET /clientes`.
2. **Schemas** (`cliente.schema.ts`) — Zod con `como_nos_conocio` como `.optional()` (NO `.default()`) — aplicar lección WARN-03 de Change 4.
3. **Hooks** — migración atómica (mover + actualizar import en `ProspectosListPage.tsx` línea 22 en mismo commit) + nuevos hooks CRUD + `useTratosByCliente`.
4. **Components** — `ClienteForm` compartido entre `ClienteCreateDialog` y `ClienteEditDialog` (mismo patrón que empresas/prospectos), `ClientesTable`, `ClienteInfoTab`, `ClienteTratosTab`, `ClienteDeleteDialog` (mensaje 409).
5. **Pages** — `ClientesListPage` (tabla + filtros + botón "Nuevo cliente" que abre diálogo), `ClienteDetailPage` (header con badge de origen + tabs).
6. **Router + Sidebar** — wiring final + habilitar link.

`clientesKeys.list()` debe retornar `['clientes'] as const` para mantener compatibilidad con `useConvertirProspecto` que invalida hardcoded `['clientes']`.

## Affected Areas

| Área | Impacto | Descripción |
|------|---------|-------------|
| `src/features/clientes/` | Nuevo | Feature completa (hooks, components, pages, schemas) |
| `src/features/prospectos/hooks/useClientes.ts` | Movido | A `src/features/clientes/hooks/useClientes.ts` + extendido |
| `src/features/prospectos/pages/ProspectosListPage.tsx` | Modificado | Actualizar import línea 22 |
| `src/mocks/handlers/clientes.ts` | Modificado | Filtros en GET, validación 409 en DELETE |
| `src/routes/router.tsx` | Modificado | Wirear `clientes`, `clientes/:id` |
| `src/routes/placeholders.tsx` | Modificado | Eliminar `ClientesPlaceholder` |
| `src/components/layout/Sidebar.tsx` | Modificado | Quitar `disabled + badge` línea 18 |

## Risks

| # | Riesgo | Likelihood | Mitigación |
|---|--------|------------|------------|
| R1 | Migración cross-feature rompe import en `ProspectosListPage.tsx` | High | Mover + actualizar import en mismo commit; test de regresión del tab Convertidos |
| R2 | Zod v4 + `como_nos_conocio` `.optional()` se comporta distinto con RHF resolver v5 | Med | Usar patrón exacto de `prospecto.schema.ts` (ya en producción); `value={field.value ?? ''}` en Select |
| R3 | DELETE MSW sin 409 — mock no simula realidad del diseño | High | Override custom de `makeCrudHandlers` con check de `tratosFixture.cliente_id === id` |
| R4 | `clientesKeys.list()` rompe invalidación de `useConvertirProspecto` | Low | Mantener `['clientes'] as const` literal |
| R5 | Form compartido (create + edit) requiere `EMPTY_DEFAULTS` correctos | Med | Aplicar lección WARN-03 de Change 4; mock defaults explícitos en test |
| R6 | Badge `prospecto_origen_id` anidado dentro de elementos clickeables del header | Low | Verificar estructura del header en sdd-design; aplicar `stopPropagation` si necesario (lección Change 4) |
| R7 | Sidebar olvido del unblock del item Clientes (patrón recurrente) | Med | Tarea explícita en sdd-tasks + test que verifique link navegable |

## Rollback Plan

Revert atómico por commit. La feature `clientes/` es nueva; el único punto frágil es la migración del hook. Si falla:
1. Restaurar `src/features/prospectos/hooks/useClientes.ts` desde git.
2. Restaurar import original en `ProspectosListPage.tsx`.
3. Revertir cambios en `Sidebar.tsx` (volver `disabled + badge`).
4. Revertir wiring en `router.tsx` + restaurar `ClientesPlaceholder`.
5. Revertir handler `clientes.ts` a versión `makeCrudHandlers` pura.

## Dependencies

- Change 4 (prospectos-crud) — DONE (archivado 2026-05-22).
- Handler `GET /tratos?cliente_id=X` y `GET /clientes/:id/tratos` — VERIFICADOS en exploración (ambos existen en `tratos.ts` y `clientes.ts`).

## Success Criteria

- [ ] `pnpm test:run` — todos los tests verdes (incluidos nuevos hooks y pages).
- [ ] `pnpm type-check` — exit 0.
- [ ] `pnpm lint` — 0 errores nuevos.
- [ ] Smoke manual: crear cliente manual via diálogo desde `/clientes`.
- [ ] Smoke manual: editar cliente via diálogo desde detalle.
- [ ] Smoke manual: eliminar cliente sin tratos → éxito; con tratos → toast 409 con mensaje "tiene N tratos asociados".
- [ ] Navegación desde tabla `/clientes` al detalle por click en nombre.
- [ ] Badge `prospecto_origen_id` en detalle: si existe origen, link a `/prospectos/:id`; si null, texto "Origen: Manual".
- [ ] Tab Tratos en detalle muestra lista read-only (lazy load).
- [ ] Sidebar `Clientes` link navegable (sin disabled, sin badge).
- [ ] Sin regresión en `ProspectosListPage` tab Convertidos (consumidor de `useClientes`).
