# Change: Empresas advanced filters and local presets

## Why

Empresas only had a basic client-side search inside `EmpresasTable`. Tratos, Tareas and Contactos now use page-level filters and local presets. Empresas should follow the same frontend-only pattern for consistency.

## What changes

- Move Empresas search/filtering ownership to `EmpresasListPage`.
- Add filters for estadoRelacion, sector, responsable and sitio web availability.
- Add local filter presets using the shared list-presets utility.
- Keep filtering frontend-only without backend query params.

## Out of scope

- Backend filtering or server-side saved views.
- Kanban integration; Empresas has no Kanban view.
- Changes to empresa create/edit/delete contracts.
