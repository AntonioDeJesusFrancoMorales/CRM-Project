# Change: Tareas advanced filters and local presets

## Why

Tareas already had client-side filters, but they were scoped to the Lista tab and lacked reusable local presets. Product convention now requires that any module with Kanban exposes filters outside the tabs and applies them to both Lista and Kanban.

## What changes

- Move Tareas filters above the Lista/Kanban tabs.
- Keep filtering frontend-only; do not add backend query params or new endpoints.
- Add local filter presets using the shared list-presets utility.
- Apply filtered task ids to the embedded Tareas Kanban via `allowedEntityIds`.
- Keep Kanban columns visible even when filters leave zero cards.

## Out of scope

- Backend filtering or persisted server-side views.
- New task fields or changes to task creation/editing.
- Build execution.
