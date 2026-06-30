# Change: Contactos advanced filters and local presets

## Why

Contactos only had a basic search scoped through `ContactosTable`, while Tratos and Tareas now share page-level filters and local presets. Contactos should follow the same frontend-only pattern for consistency.

## What changes

- Move Contactos search/filtering ownership to `ContactosPage`.
- Add filters for empresa, responsable and cómo nos conoció.
- Add local filter presets using the shared list-presets utility.
- Keep the existing estadoRelacion tabs and apply advanced filters inside the active tab.

## Out of scope

- Backend filtering or persisted server-side views.
- Kanban integration; Contactos has no Kanban view.
- Changes to Contacto create/edit/delete contracts.
