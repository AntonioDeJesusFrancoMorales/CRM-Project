# Delta for contactos-management

**Change**: kanban-tablero-back (Change 4)
**Fecha**: 2026-05-29

## MODIFIED Requirements

---

### Requirement: Validacion client-side de transiciones de estadoRelacion

El sistema MUST bloquear en UI las transiciones de estadoRelacion que el dominio del back rechazaria. El front es la unica linea de defensa mientras exista el bug de `EditContactoService.reconstitute()` (que bypasea `cambiarEstadoRelacion()` en el back). Las transiciones bloqueadas son:

- **Bloqueo 1**: No se puede cambiar `estadoRelacion` a `PROSPECTO` si el estado actual es `ACTIVO` o `INACTIVO`.
- **Bloqueo 2**: No se puede cambiar `estadoRelacion` a `INACTIVO` si el contacto tiene tratos activos. Un trato se considera activo cuando existe una Ficha con `tipoFicha === 'TRATO'` y `tratoId === trato.id` en una columna cuyo `estadoTrato === 'ABIERTO'` (`TipoEstadoColumnaTableroTrato.ABIERTO`). La evaluacion MUST cargar `GET /api/fichas/get-all` y cruzar `ficha.tratoId` con los tratos del contacto; MUST NOT usar `trato.estado` (campo inexistente).

La UI MUST explicar al usuario por que la opcion esta deshabilitada cuando posiciona el cursor sobre ella.

(Previously: Bloqueo 2 usaba `trato.estado === 'abierto'` — campo que no existe en el modelo Trato. Causaba que cualquier trato (incluso GANADO/PERDIDO) bloqueara la transicion a INACTIVO porque `tieneTratosActivos = tratosDelContacto.length > 0`.)

#### Scenario: Opcion PROSPECTO deshabilitada si estado actual es ACTIVO [component test]

- GIVEN el form de edicion de un contacto con `estadoRelacion: 'ACTIVO'`
- WHEN se inspecciona el select de estadoRelacion
- THEN la opcion `PROSPECTO` esta deshabilitada (disabled)
- AND al hacer hover sobre la opcion se muestra un tooltip o mensaje explicando la restriccion

#### Scenario: Opcion PROSPECTO deshabilitada si estado actual es INACTIVO [component test]

- GIVEN el form de edicion de un contacto con `estadoRelacion: 'INACTIVO'`
- WHEN se inspecciona el select de estadoRelacion
- THEN la opcion `PROSPECTO` esta deshabilitada (disabled)

#### Scenario: Opcion INACTIVO deshabilitada si el contacto tiene tratos con ficha en columna ABIERTO [component test]

- GIVEN el contacto c1 tiene el trato d1
- AND existe una Ficha con `tratoId: 'd1'` y `columnaId: c1`
- AND la columna c1 tiene `estadoTrato: 'ABIERTO'`
- WHEN se inspecciona el select de estadoRelacion en el form de edicion de c1
- THEN la opcion `INACTIVO` esta deshabilitada (disabled)
- AND la UI muestra explicacion de por que no se puede inactivar

#### Scenario: Opcion INACTIVO habilitada si todos los tratos del contacto tienen ficha en columna GANADO o PERDIDO [component test]

- GIVEN el contacto c1 tiene tratos d1 y d2
- AND la ficha de d1 esta en columna con `estadoTrato: 'GANADO'`
- AND la ficha de d2 esta en columna con `estadoTrato: 'PERDIDO'`
- WHEN se inspecciona el select de estadoRelacion
- THEN la opcion `INACTIVO` esta habilitada

#### Scenario: Opcion INACTIVO habilitada si el contacto no tiene tratos [component test]

- GIVEN el contacto c2 no tiene ningun trato asociado
- WHEN se inspecciona el select de estadoRelacion
- THEN la opcion `INACTIVO` esta habilitada

#### Scenario: Opcion INACTIVO habilitada si los tratos del contacto no tienen ficha asignada [component test]

- GIVEN el contacto c3 tiene el trato d3
- AND no existe ninguna Ficha con `tratoId: 'd3'`
- WHEN se inspecciona el select de estadoRelacion
- THEN la opcion `INACTIVO` esta habilitada (sin ficha, estado es indeterminado, no bloquea)

#### Scenario: Cambio de PROSPECTO a ACTIVO es siempre permitido [component test]

- GIVEN el form de edicion de un contacto con `estadoRelacion: 'PROSPECTO'`
- WHEN se inspecciona el select de estadoRelacion
- THEN las opciones `ACTIVO` e `INACTIVO` estan habilitadas
- AND la opcion `PROSPECTO` (estado actual) se puede seleccionar (idempotente)
