# Delta Specification: Tareas Kanban Workflow Status

## MODIFIED Requirements

### Requirement: Task status MUST be derived from Kanban column

The frontend MUST use the task's `TAREA` ficha and its current TAREAS tablero column as the source of operational status.

#### Scenario: Task has a matching ficha and column

- GIVEN a tarea appears in the tareas list
- AND `GET /api/fichas/get-all?tipoFicha=TAREA` returns a ficha referencing that tarea
- AND the ficha `columnaId` matches a column in a TAREAS tablero
- WHEN the list renders the tarea status
- THEN the UI MUST display the column name as the operational status
- AND it MUST NOT read status from `localStorage`

#### Scenario: Task status is changed from the menu

- GIVEN a tarea has a matching `TAREA` ficha
- AND the status menu lists columns from the active TAREAS tablero
- WHEN the user chooses a different column
- THEN the frontend MUST call `PUT /api/fichas/mover-columna?id={fichaId}`
- AND it MUST NOT write `tarea-estado-{id}` to `localStorage`

#### Scenario: Task has no matching ficha or column

- GIVEN a tarea has no matching ficha or its column cannot be resolved
- WHEN the tareas list renders
- THEN the UI SHOULD display a safe fallback such as `Sin columna`
- AND filters MUST NOT crash

### Requirement: Task filters MUST use derived workflow status

Task status filters MUST filter by the resolved Kanban column identity or normalized column label, not by local client state.

#### Scenario: User filters by a task workflow column

- GIVEN tareas are displayed with resolved workflow columns
- WHEN the user selects a status/workflow filter
- THEN the list and Kanban views MUST filter using the resolved ficha column data
