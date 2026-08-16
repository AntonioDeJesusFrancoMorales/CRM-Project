# Design: list-pagination-ui

## Architecture
- Feature pages remain containers: they own list query state (`page`, `pageSize`, `sortBy`, `sortDirection`) and pass data to presentational tables.
- Tables stay presentational: sortable headers receive current sort and emit sort requests.
- Shared pagination controls live in `src/components/shared`.

## Tratos/Tareas Kanban
- List tab uses paginated hooks.
- Kanban tab keeps unpaginated query results so board filtering does not hide cards outside the current page.
