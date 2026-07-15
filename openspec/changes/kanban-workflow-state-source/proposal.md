# Proposal: Kanban Workflow State Source

## Intent

Problem: frontend state is split and contradictory. TAREAS uses localStorage as operational status, old specs mention removed `estadoTarea/estadoTrato`, and TRATOS risks confusing Kanban position with `Trato.estado`. The UI must derive workflow from Kanban columns and leave commercial outcome separate.

## Scope

### In Scope
- Replace task localStorage status with status derived from TAREAS fichas/columns.
- Treat TRATOS column as pipeline stage; keep `Trato.estado` as commercial outcome from backend.
- Update list/detail filters, badges, and Kanban display semantics.
- Use existing API flows: `GET /api/tableros/get-all`, `GET /api/tableros/get-by-id?id={id}`, `GET /api/fichas/get-all`, `PUT /api/fichas/edit?id={id}` or move endpoint if current API exposes it.

### Out of Scope
- WhatsApp.
- Backend implementation.
- Adding task status to `Tarea` payloads.
- Calling `/tratos/ganar` or `/tratos/perder` from Kanban drag/drop.

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `kanban-management`: column/ficha position is workflow source; obsolete `estadoTarea/estadoTrato` assumptions are removed.
- `tareas-management`: operational status comes from TAREAS column, not localStorage.
- `tratos-management`: pipeline stage comes from TRATOS column; `Trato.estado` remains commercial outcome.

## Approach

Create/adjust derived selectors that join `tareas|tratos + fichas + tablero columns`. For tasks, remove `useTareaEstado` as source of truth and compute status from the TAREAS column name/position. For deals, show/filter pipeline stage from TRATOS column while preserving backend `Trato.estado` for outcome-only UI.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/features/kanban` | Modified | Column/ficha joins, drag/drop semantics, no outcome mutation. |
| `src/features/tareas` | Modified | Remove localStorage state source, update filters/KPIs/badges. |
| `src/features/tratos` | Modified | Separate pipeline stage display/filter from commercial outcome. |
| `src/api`, `src/mocks` | Modified | Types/fixtures/handlers reflect real column DTO without removed semantic fields. |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Extra client joins create loading gaps | Med | Centralize selectors and handle missing ficha/column as “Sin columna”. |
| Specs currently encode removed fields | High | Delta specs must explicitly replace `estadoTarea/estadoTrato`. |
| Stage/outcome wording confuses users | Med | Labels: “Etapa” for column, “Resultado” for `Trato.estado`. |

## Rollback Plan

Revert selectors/UI changes and restore localStorage status hook usage. No backend data migration is required from frontend rollback.

## Dependencies

- Backend must reject invalid ficha moves and keep `Trato.estado` separate.

## Success Criteria

- [ ] Task status survives reload because it is resolved from Kanban data.
- [ ] Deal Kanban movement does not call outcome endpoints.
- [ ] Specs no longer rely on `estadoTarea/estadoTrato` fields.
