# Change: list-pagination-ui

## Intent
Expose the server-side pagination and sorting contract in CRM list screens so users can navigate large datasets intentionally.

## Scope
- Add shared frontend pagination controls.
- Add sortable table headers for supported columns.
- Connect Empresas, Contactos, Tratos, and Tareas list views to paginated hooks.
- Preserve Kanban behavior for Tratos/Tareas using unpaginated datasets.

## Out of Scope
- Backend changes.
- RBAC/users.
- Global backend search.
