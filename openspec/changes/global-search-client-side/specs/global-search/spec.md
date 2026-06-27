# Spec: global-search

## Requirements

### R1 — Acceso global desde Topbar

The system MUST expose a global search entry point from the protected application Topbar.

#### Scenarios

- WHEN the user is in any protected route rendered inside `AppShell`, THEN the Topbar SHALL show a search action.
- WHEN the user activates the search action, THEN the global search dialog SHALL open.
- WHEN the global search dialog opens, THEN the search input SHALL receive focus.

### R2 — Atajo de teclado

The system MUST allow opening the global search dialog with `Ctrl+K` on Windows/Linux and `Cmd+K` on macOS.

#### Scenarios

- WHEN the user presses `Ctrl+K`, THEN the global search dialog SHALL open.
- WHEN the user presses `Cmd+K`, THEN the global search dialog SHALL open.
- WHEN the shortcut is handled, THEN the browser default action SHALL be prevented.

### R3 — Búsqueda client-side multi-entidad

The system MUST search client-side across empresas, contactos, tratos and tareas using existing list hooks.

#### Scenarios

- WHEN the query has fewer than 2 non-whitespace characters, THEN the system SHALL NOT show entity results.
- WHEN the query matches an empresa by searchable fields, THEN the result SHALL appear under the Empresas group.
- WHEN the query matches a contacto by searchable fields, THEN the result SHALL appear under the Contactos group.
- WHEN the query matches a trato by searchable fields, THEN the result SHALL appear under the Tratos group.
- WHEN the query matches a tarea by searchable fields, THEN the result SHALL appear under the Tareas group.

### R4 — Resultados agrupados y limitados

The system MUST group results by entity type and limit the number of visible results per group.

#### Scenarios

- WHEN multiple entity types match, THEN the dialog SHALL render separate sections by entity type.
- WHEN a group has more matches than the configured limit, THEN only the first configured results SHALL be shown.
- WHEN no entity has matches for a valid query, THEN the dialog SHALL show a no-results state including the query.

### R5 — Navegación directa

The system MUST navigate to the selected entity detail route.

#### Scenarios

- WHEN the user selects an empresa result, THEN the app SHALL navigate to `/empresas/:id`.
- WHEN the user selects a contacto result, THEN the app SHALL navigate to `/contactos/:id`.
- WHEN the user selects a trato result, THEN the app SHALL navigate to `/tratos/:id`.
- WHEN the user selects a tarea result, THEN the app SHALL navigate to `/tareas/:id`.
- WHEN navigation is triggered, THEN the dialog SHALL close.

### R6 — Estados de datos

The system MUST handle loading and partial errors without breaking the Topbar.

#### Scenarios

- WHEN one or more data hooks are loading, THEN the dialog SHALL show a loading hint.
- WHEN one or more data hooks fail but others succeed, THEN the dialog SHALL still show available results and a non-blocking warning.
- WHEN all loaded data sets are empty, THEN the dialog SHALL show a neutral empty state for valid queries.

### R7 — Accesibilidad básica

The system MUST keep the search interaction keyboard and screen-reader friendly.

#### Scenarios

- WHEN the dialog opens, THEN it SHALL have an accessible title.
- WHEN result items render, THEN each result SHALL be a button with a clear accessible name.
- WHEN the user presses Escape, THEN the dialog SHALL close using the existing dialog behavior.
