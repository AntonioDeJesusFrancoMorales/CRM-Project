# Design: Tareas advanced filters and local presets

## Approach

Reuse the Tratos pattern, but adapt it to the existing Tareas model:

- Introduce pure filtering helpers in `src/features/tareas/lib/tareaFilters.ts`.
- Store a single `TareaFilters` object in `TareasListPage` instead of separate state per filter.
- Persist local presets under `crm:list-presets:tareas` with `listPresets.ts`.
- Compute `filteredTareaIds` from the filtered list and pass them to `KanbanTabContent tipo="TAREAS"`.

## Filter semantics

- Search: task title, case-insensitive.
- Estado: local task state via `getTareaEstado(tarea.id)`.
- Prioridad, tipo, responsable and trato: exact field matches.
- Vencidas: tasks with `fechaCompletada === null` and `fechaLimite < now`.
- Próximas: tasks with `fechaLimite` within the next 7 days.

## Tradeoffs

- Local presets are progressive enhancement: if `localStorage` fails, the page still works.
- Estado remains local/client-only, matching the existing task state behavior.
- Filtering Kanban by ids avoids changing Kanban internals and preserves columns.
