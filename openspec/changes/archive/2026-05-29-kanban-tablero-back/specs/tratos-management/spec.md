# Delta for tratos-management

**Change**: kanban-tablero-back (Change 4)
**Fecha**: 2026-05-29

## ADDED Requirements

---

### Requirement: Estado del trato derivado de la columna Kanban

El sistema MUST derivar el estado del ciclo de vida del Trato a partir de la columna donde se encuentra su Ficha en el tablero Kanban, no de un campo propio del Trato. El modelo `Trato` (`TratoResponse`) MUST NOT tener campo `estado`. El estado MUST calcularse client-side como: buscar la `Ficha` donde `ficha.tratoId === trato.id` y `ficha.tipoFicha === 'TRATO'`, obtener la `ColumnaTableroDto` cuyo `id === ficha.columnaId`, y leer su campo `estadoTrato`. Los valores posibles son `ABIERTO`, `GANADO` o `PERDIDO` (enum `TipoEstadoColumnaTableroTrato` — confirmado contra Java AR-CRM). Si el trato no tiene ficha asociada, el estado es indeterminado (sin ciclo de vida asignado).

#### Scenario: Estado se deriva de la columna ABIERTO [unit test]

- GIVEN la ficha del trato d1 esta en la columna c1 con `estadoTrato: 'ABIERTO'`
- WHEN se deriva el estado de d1
- THEN el resultado es `'ABIERTO'`

#### Scenario: Estado se deriva de la columna GANADO [unit test]

- GIVEN la ficha del trato d2 esta en la columna c2 con `estadoTrato: 'GANADO'`
- WHEN se deriva el estado de d2
- THEN el resultado es `'GANADO'`

#### Scenario: Estado se deriva de la columna PERDIDO [unit test]

- GIVEN la ficha del trato d3 esta en la columna c3 con `estadoTrato: 'PERDIDO'`
- WHEN se deriva el estado de d3
- THEN el resultado es `'PERDIDO'`

#### Scenario: Trato sin ficha tiene estado indeterminado [unit test]

- GIVEN no existe ninguna Ficha con `tratoId: d99`
- WHEN se deriva el estado de d99
- THEN el resultado es `null` o `undefined`

#### Scenario: TratoResponse no contiene campo estado [unit test]

- GIVEN el schema Zod de Trato y el tipo TypeScript `Trato`
- WHEN se inspeccionan sus campos
- THEN no existe ningun campo `estado`, `cicloDeVida`, ni equivalente
- AND TypeScript no compila si se intenta acceder a `trato.estado`
