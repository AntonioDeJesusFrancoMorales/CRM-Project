# Delta Specification: Kanban Workflow Source

## MODIFIED Requirements

### Requirement: Kanban schemas MUST NOT require removed semantic state fields

The frontend MUST continue to model `ColumnaTablero` using fields exposed by the backend and MUST NOT require removed `estadoTarea` or `estadoTrato` fields.

#### Scenario: Tablero response omits semantic state fields

- GIVEN `GET /api/tableros/get-by-id?id={id}` returns columns with `id`, `nombre`, `color`, `limiteWip`, `nota`, and `totalValorEstimado`
- WHEN the frontend parses the response
- THEN parsing MUST succeed
- AND workflow status/stage MUST be resolved through ficha position and column metadata
