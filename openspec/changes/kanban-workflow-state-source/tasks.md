# Tasks: Kanban Workflow State Source

## 1. Types and selectors

- [x] 1.1 Add RED tests for task workflow selector: resolved column, missing ficha, missing column.
- [x] 1.2 Implement task workflow selector/helper using fichas + TAREAS columns.

## 2. Tareas UI

- [x] 2.1 Add/adjust tests proving task badge/menu no longer read/write localStorage.
- [x] 2.2 Update `TareaEstadoBadge` to render derived column status.
- [x] 2.3 Update `TareaEstadoMenu` to move the task ficha through `useMoverFicha`.
- [x] 2.4 Update `TareasTable` and `TareasListPage` to pass derived workflow state.
- [x] 2.5 Update task filters to use derived workflow column/status.
- [x] 2.6 Remove unused `useTareaEstado` usages; delete hook/tests only if no consumers remain.

## 3. Tratos UI

- [x] 3.1 Audit wording: `estado` remains commercial outcome; column is `Etapa`.
- [x] 3.2 Ensure Kanban movement does not trigger win/loss endpoints.
- [ ] 3.3 Optionally display pipeline stage in list/detail only if data is already loaded cheaply. Deferred: no extra Tratos stage UI added in this slice.

## 4. Mocks and contract tests

- [x] 4.1 Keep `ColumnaTablero` mock shape aligned with backend fields only.
- [x] 4.2 Update affected tests and fixtures.

## 5. Verification

- [x] 5.1 Run targeted Vitest suites and type-check/lint if touched paths require it. Do not run build.
