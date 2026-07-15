# Delta Specification: Tratos Pipeline Stage vs Outcome

## MODIFIED Requirements

### Requirement: Deal pipeline stage MUST be separate from commercial outcome

The frontend MUST treat the TRATOS Kanban column as pipeline stage and `Trato.estado` as commercial outcome.

#### Scenario: Deal moves across pipeline columns

- GIVEN a trato appears in a TRATOS Kanban board
- WHEN the user drags its ficha to another column
- THEN the frontend MUST call `PUT /api/fichas/mover-columna?id={fichaId}`
- AND it MUST NOT call `PUT /api/tratos/ganar?id={tratoId}`
- AND it MUST NOT call `PUT /api/tratos/perder?id={tratoId}`

#### Scenario: Deal list displays outcome and stage

- GIVEN a trato has `estado = ABIERTO`
- AND its TRATO ficha is in a column named `Propuesta`
- WHEN the list renders the trato
- THEN the UI SHOULD label `ABIERTO` as commercial result/outcome
- AND it MAY show `Propuesta` as pipeline stage
