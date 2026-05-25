# Proposal: tareas-management (Change 6b)

## Intent

Convertir `Tarea` en entidad operativa de primer nivel del CRM Pipely: CRUD completo, listado global filtrable `/tareas`, integración como tab dentro del detalle de Trato, y cambio de estado inline (Iniciar / Completar / Reabrir). Cierra la última brecha del ciclo comercial — hoy las tareas existen en el contrato API y en el backend mock (5/6 endpoints) pero no tienen UI. Sucesor directo de Change 6a (`tratos-management`, commit 966a606), que dejó el detalle de Trato sin la dimensión de seguimiento operativo.

Plan macro #104 listaba "Change 6 = Tratos + Tareas". Se partió en **6a = Tratos** (cerrado) y **6b = Tareas** (este Change) para mantener PRs digeribles. 6b completa esa partición.

## Scope

### In Scope
- Feature greenfield `src/features/tareas/` (ADR-040, estructura plana): schemas Zod, `useTareas` paramétrico + mutations (create/update/delete/completar), componentes, `TareasListPage`, `TareaDetailPage`, tests Strict TDD.
- Listado global `/tareas` con **6 filtros**: estado, prioridad, responsable, vencimiento, trato vinculado, búsqueda client-side.
- `TareaEstadoMenu` inline (homologa `TratoEstadoMenu`, ADR-044): Iniciar / Completar / Reabrir, disabled-by-state, sin modal.
- **Refactor `TratoDetailPage` plano → tabbed** con `useTabSync(['info','tareas'],'info')`; acciones de estado del trato (Ganar/Perder/Reabrir) conviven en el header; reescribir `TratoDetailPage.test.tsx`.
- **Badge de pendientes** en header del trato, derivado del mismo query del tab (sin tercera query).
- Sidebar **"Mis tareas"** usando `useAuthStore.usuario.id` como `responsable_id`.
- Título de tarea en tabla → navega a `TareaDetailPage` (homologación completa, no edit-dialog).
- Backend: agregar **`GET /tareas` con filtros** (único endpoint MSW faltante) + ampliar `tareasFixture.ts`.
- DELETE simple 204 (sin 409).

### Out of Scope
- Notificaciones / recordatorios de vencimiento.
- Recurrencia de tareas (tareas repetitivas).
- Kanban / dnd-kit (Change 7).
- Etiquetas, comentarios, adjuntos (Change 8+).
- Creación de tareas sin trato (el contrato exige `trato_id` no-nullable).

## Capabilities

### New Capabilities
- `tareas-management`: listado global filtrable, CRUD, cambio de estado inline (Iniciar/Completar/Reabrir), detalle, vista "Mis tareas".

### Modified Capabilities
- `tratos-management`: el requirement del detalle de Trato pasa de layout plano a **tabbed** (tab Info + tab Tareas con badge de pendientes); las acciones de estado del trato se relocalizan al header del detalle.

## Approach

`useTratos` y `TratoEstadoMenu` (de 6a) son plantillas directas para `useTareas` y `TareaEstadoMenu`. `ClienteDetailPage` es la plantilla del patrón tabbed (`useTabSync`). Backend mock ya cubre 5/6 endpoints (`POST /tratos/:id/tareas`, `GET /tareas/:id`, `PATCH /tareas/:id`, `PATCH /tareas/:id/completar` con auto-relleno de `fecha_completada`, `DELETE /tareas/:id`, `GET /tratos/:id/tareas`); solo falta `GET /tareas` con filtros server-side. El filtro `trato_id` resuelve nombres con `useTratos()`. Detalle técnico (firmas de filtros, ADRs) → `sdd-design`.

## Affected Areas

| Área | Impacto | Descripción |
|---|---|---|
| `src/features/tareas/` | Nuevo | Feature greenfield (schemas, hooks, components, pages, __tests__) |
| `src/routes/router.tsx` | Modificado | Wirear `/tareas` y `/tareas/:id`; no existe placeholder previo |
| `src/components/layout/Sidebar.tsx` | Modificado | NavItem "Mis tareas" con `responsable_id` del authStore |
| `src/mocks/handlers/tareas.ts` | Modificado | Agregar `GET /tareas` con filtros (incl. vencimiento server-side) |
| `src/mocks/fixtures/tareasFixture.ts` | Modificado | Ampliar para cubrir 6 filtros + ambos usuarios (`22222222`, admin `11111111`) |
| `src/features/tratos/TratoDetailPage.tsx` | Modificado | Refactor plano → tabbed (`useTabSync`), tab Tareas + badge, acciones al header |
| `src/features/tratos/.../TratoDetailPage.test.tsx` | Reescrito | Tests del nuevo layout tabbed (Strict TDD) |
| `openspec/specs/tratos-management/spec.md` | Delta | Requirement detalle plano → tabbed con tab Tareas + badge |

## Risks

| Riesgo | Probabilidad | Mitigación |
|---|---|---|
| Fixture insuficiente → tests de filtros fallan | Alta | Ampliar fixture (+4-5 tareas) ANTES de implementar filtros; lote propio |
| Refactor `TratoDetailPage` rompe tests existentes | Alta | Lote aislado; reescribir test en TDD primero (regresión 6a) |
| Badge de pendientes — reactividad/doble fetch | Media | Derivar count del mismo query del tab (`estado:'pendiente'`) |
| Icono sidebar inexistente en lucide-react | Baja | Confirmar disponibilidad (ClipboardList/ListTodo) en `package.json` |
| Select `trato_id` en listado global sin labels | Media | `useTratos()` para resolver nombres trato→label |
| `trato_id` obligatorio en create desde `/tareas` | Media | Select de trato REQUERIDO en form (Zod), validado contra contrato |

## Rollback Plan

Lotes como commits atómicos por capa (fixture/handler → schema → hooks → components → pages → wiring/sidebar → refactor TratoDetailPage). Cada commit revertible vía `git revert <sha>` sin tocar 6a. El refactor de `TratoDetailPage` es **un único commit** (página + test reescrito) → revertir restaura el layout plano en un paso. La feature `tareas/` es greenfield: revertir su wiring (router + sidebar) la deja inerte sin afectar el resto.

## Dependencies

- Change 6a (`tratos-management`) cerrado y archivado ✅
- Contrato API `Tarea` en `types.ts:84-97` ✅
- `useAuthStore` con `usuario.id` (responsable actual) ✅
- MSW handler `tareas.ts` al 83% (5/6 endpoints) ✅
- `useTabSync` disponible (`src/lib/useTabSync.ts`) ✅

## Success Criteria

- [ ] Sidebar "Mis tareas" navega a `/tareas` filtrado por `responsable_id` del usuario logueado.
- [ ] CRUD Tarea funciona: crear (con Select trato requerido), editar, eliminar (204).
- [ ] Listado `/tareas` con los 6 filtros operativos (vencimiento server-side, trato con labels).
- [ ] Cambio de estado inline: Iniciar/Completar/Reabrir disabled-by-state, sin modal; Completar auto-rellena `fecha_completada`.
- [ ] `TratoDetailPage` tabbed: tab Info + tab Tareas, badge de pendientes, acciones de estado en header.
- [ ] Título de tarea navega a `TareaDetailPage`.
- [ ] `pnpm test:run` verde (Strict TDD por hook/componente/página + handler `GET /tareas`).
- [ ] `pnpm tsc --noEmit` exit 0; lint sin errores nuevos.
- [ ] Spec delta `tratos-management` actualizado al archivar.

## Open Questions for sdd-design

1. **Filtro vencimiento — semántica exacta**: ¿enum (vencidas / hoy / próximos 7 días / sin fecha)? ¿comparación `fecha_limite` vs `now` server-side en el handler?
2. **`UseTareasFilters` — firma**: ¿incluye `vencimiento` como param tipado o se traduce a rango de fechas antes del handler?
3. **Badge de pendientes — fuente del count**: confirmar derivación del query del tab (`useTareas({trato_id, estado:'pendiente'})`) vs `byTrato` queryKey.
4. **TareaForm — Select de trato**: ¿siempre editable, o prefilled+readonly cuando se crea desde el tab de un trato?
5. **Icono sidebar**: elegir entre ClipboardList / ListTodo / CheckSquare (confirmar en lucide-react).
6. **Relocalización de acciones de estado del trato**: layout exacto en el header del `TratoDetailPage` tabbed (homologar con ClienteDetailPage).

## ADR Candidates (numeración continúa desde ADR-047 de Change 6a)

- ADR-048: Hook paramétrico `useTareas({ filters })` + queryKeys `tareasKeys` (`all`/`list`/`detail`/`byTrato`) — homologa ADR-040.
- ADR-049: `useCompletarTarea` (PATCH `/completar`) con doble invalidación `all` + `byTrato` — homologa `useGanarTrato`.
- ADR-050: `TareaEstadoMenu` DropdownMenu inline disabled-by-state, sin modal — homologa ADR-044.
- ADR-051: Refactor `TratoDetailPage` plano → tabbed con `useTabSync`; acciones de estado al header.
- ADR-052: Badge de pendientes derivado del query del tab (sin tercera query).
- ADR-053: `GET /tareas` con filtros server-side (incl. vencimiento) en MSW handler.
- ADR-054: Vista "Mis tareas" en sidebar parametrizada por `useAuthStore.usuario.id`.

## Test Surface (Strict TDD activo — runner `pnpm test:run`)

Tests requeridos por capa, todos escritos **antes** de la implementación:
- Hooks: `useTareas`, `useTarea`, `useCreate/Update/DeleteTarea`, `useCompletarTarea`.
- Componentes: `TareasTable`, `TareaForm` (modos create/edit, Select trato requerido), `TareaEstadoMenu` (transiciones disabled-by-state).
- Páginas: `TareasListPage` (6 filtros + lista), `TareaDetailPage` (load, 404, acciones).
- MSW handler: `GET /tareas` con cada filtro.
- Regresión: reescribir `TratoDetailPage.test.tsx` (layout tabbed, tab Tareas, badge, acciones en header).
