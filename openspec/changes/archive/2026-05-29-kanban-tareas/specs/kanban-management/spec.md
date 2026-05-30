# Delta for kanban-management

**Change**: kanban-tareas (Change 6)
**Base spec**: openspec/specs/kanban-management/spec.md (12 requirements, Change 5)

---

## ADDED Requirements

---

### Requirement: Listar tableros de tipo TAREAS en lista unificada con badge

El sistema MUST incluir tableros `tipoTablero === 'TAREAS'` en la lista `/tableros` junto a los TRATOS. Cada card MUST mostrar un badge de tipo (`TRATOS` | `TAREAS`) para distinguirlos visualmente. Los tableros TAREAS MUST navegar a `/tableros/:id` igual que los TRATOS.

#### Scenario: Lista unificada muestra ambos tipos con badge [integration test]

- GIVEN `GET /api/tableros/get-all` retorna tableros con `tipoTablero: 'TRATOS'` y `tipoTablero: 'TAREAS'`
- WHEN el usuario navega a `/tableros`
- THEN se muestran tableros de ambos tipos
- AND cada card muestra badge `TRATOS` o `TAREAS` según corresponda

#### Scenario: Lista vacia sin tableros de ningun tipo muestra empty state [integration test]

- GIVEN `GET /api/tableros/get-all` retorna array vacio
- WHEN el usuario navega a `/tableros`
- THEN se muestra mensaje de empty state

---

### Requirement: Derivar estado de la tarea desde la columna

El sistema MUST derivar el estado de la tarea cruzando `ficha.tareaId → columna.estadoTarea`. El estado es el valor del campo `estadoTarea` de la `ColumnaTableroDto` donde se encuentra la ficha con `tareaId == tarea.id` y `tipoFicha == 'TAREA'`. Los valores posibles del enum `TipoEstadoColumnaTableroTarea` son exactamente: `PENDIENTE`, `EN_CURSO`, `FINALIZADA`. El modelo `Tarea` MUST NOT tener campo `estado`; la derivacion es client-side via `deriveEstadoTarea.ts`.

#### Scenario: Estado PENDIENTE se deriva correctamente [unit test]

- GIVEN la ficha f1 tiene `tareaId: ta1`, `columnaId: c1`; la columna c1 tiene `estadoTarea: 'PENDIENTE'`
- WHEN se evalua el estado de la tarea ta1
- THEN el resultado es `'PENDIENTE'`

#### Scenario: Estado EN_CURSO se deriva correctamente [unit test]

- GIVEN la ficha f2 tiene `tareaId: ta2`, `columnaId: c2`; c2 tiene `estadoTarea: 'EN_CURSO'`
- WHEN se evalua el estado de ta2
- THEN el resultado es `'EN_CURSO'`

#### Scenario: Estado FINALIZADA se deriva correctamente [unit test]

- GIVEN la ficha f3 tiene `tareaId: ta3`, `columnaId: c3`; c3 tiene `estadoTarea: 'FINALIZADA'`
- WHEN se evalua el estado de ta3
- THEN el resultado es `'FINALIZADA'`

#### Scenario: Tarea sin ficha no tiene estado derivado [unit test]

- GIVEN no existe ninguna ficha con `tareaId: ta99`
- WHEN se evalua el estado de ta99
- THEN el resultado es `null` o `undefined`

---

### Requirement: Crear ficha de tarea

El sistema MUST exponer `FichaCreateDialog` parametrizado para `tipoFicha='TAREA'`, abierto desde el "+" del header de cada `KanbanColumn` en tableros TAREAS. El formulario MUST incluir: selector de tarea (solo tareas sin ficha activa, derivadas de `useTareasSinFicha()` que cruza `useTareas()` + `useFichas()`) y selector de responsable (`useUsuarios()`). El body enviado a `POST /api/fichas/create` MUST incluir `tipoFicha: 'TAREA'`, `tareaId`, `columnaId`, `responsableId`, `creadoPor: '00000000-0000-0000-0000-000000000001'`. `tratoId` MUST NOT enviarse en fichas TAREA. Tras exito, la query `['fichas']` MUST invalidarse.

#### Scenario: Selector de tarea solo muestra tareas sin ficha [component test]

- GIVEN existen tareas ta1 (sin ficha) y ta2 (con ficha activa)
- WHEN se abre el selector de tarea en tablero TAREAS
- THEN solo aparece ta1 en las opciones

#### Scenario: Creacion exitosa envia tipoFicha TAREA con tareaId [integration test]

- GIVEN el usuario selecciona tarea ta1 y responsable u1 en tablero TAREAS
- WHEN confirma la creacion
- THEN se invoca `POST /api/fichas/create` con `tipoFicha: 'TAREA'`, `tareaId: ta1`, `columnaId` precargado, `creadoPor: '00000000-0000-0000-0000-000000000001'`
- AND la query `['fichas']` se invalida
- AND el dialog se cierra

#### Scenario: tareaId requerido para ficha de tipo TAREA [component test]

- GIVEN el formulario de creacion en tablero TAREAS
- WHEN el usuario no selecciona una tarea
- THEN se muestra error de validacion en `tareaId`
- AND no se invoca el backend

#### Scenario: Error 422 del back muestra serverError en campo [integration test]

- GIVEN el back responde 422 con error en campo `tareaId`
- WHEN el usuario envia el form
- THEN se muestra el mensaje de error bajo el campo `tareaId`
- AND el dialog permanece abierto

---

## MODIFIED Requirements

---

### Requirement: Listar fichas del tablero

El sistema MUST consumir `GET /api/fichas/get-all` y filtrar client-side las fichas cuyo `columnaId` este incluido en las columnas del tablero activo. La queryKey MUST ser `['fichas']`. En tableros TRATOS, las fichas con `tipoFicha !== 'TRATO'` MUST NOT mostrarse. En tableros TAREAS, las fichas con `tipoFicha !== 'TAREA'` MUST NOT mostrarse. El orden de fichas dentro de una columna MUST ser estable y derivado del back (campo `creadoEn` ascendente).
(Previously: solo filtraba fichas `tipoFicha !== 'TRATO'` para todos los tableros — ahora el filtro es por tipo de tablero.)

#### Scenario: Fichas se distribuyen en sus columnas correctas [integration test]

- GIVEN el tablero t1 tiene columnas c1 y c2; fichas f1(`columnaId: c1`) y f2(`columnaId: c2`)
- WHEN se renderiza el tablero
- THEN f1 aparece bajo la columna c1 y f2 bajo la columna c2

#### Scenario: Fichas de tipo TAREA no aparecen en tablero TRATOS [integration test]

- GIVEN existe una ficha con `tipoFicha: 'TAREA'` en una columna del tablero TRATOS
- WHEN se renderiza el tablero
- THEN esa ficha NO aparece en ninguna columna

#### Scenario: Fichas de tipo TRATO no aparecen en tablero TAREAS [integration test]

- GIVEN existe una ficha con `tipoFicha: 'TRATO'` en una columna del tablero TAREAS
- WHEN se renderiza el tablero TAREAS
- THEN esa ficha NO aparece en ninguna columna

#### Scenario: Orden de fichas es por creadoEn ascendente [component test]

- GIVEN dos fichas en la misma columna con `creadoEn` distintos
- WHEN se renderiza la columna
- THEN la ficha con `creadoEn` mas antiguo aparece primero

---

### Requirement: Gestionar columnas del tablero

El sistema MUST permitir asignar una columna del catalogo al tablero vía `POST /api/tableros/asignar-columna?id={tableroId}&columnaId={columnaId}`. El body MUST incluir `limiteWip` (`@NotNull`, `@Min(1)`), `totalValorEstimado` (`@NotNull`, BigDecimal), y EXACTAMENTE UNO de: `estadoTrato` (tableros TRATOS: `ABIERTO | GANADO | PERDIDO`) O `estadoTarea` (tableros TAREAS: `PENDIENTE | EN_CURSO | FINALIZADA`). Enviar ambos estados o ninguno MUST ser rechazado por validacion client-side antes de invocar el back (el back lanzaria `InvariantViolationException`). En tableros TAREAS, `totalValorEstimado` MUST fijarse en `0` automaticamente (no editable). El sistema MUST permitir quitar una columna vía `DELETE /api/tableros/eliminar-columna?id={tableroId}&columnaId={columnaId}`. Una respuesta 409 MUST mostrarse con mensaje claro de que la columna tiene fichas. Tras exito, la query `['tableros', tableroId]` MUST invalidarse.
(Previously: solo contemplaba `estadoTrato` en el body; no habia validacion de exclusividad ni restriccion de `totalValorEstimado` por tipo de tablero.)

#### Scenario: Asignar columna valida limiteWip >= 1 [component test]

- GIVEN el formulario de asignar columna
- WHEN el usuario introduce `limiteWip: 0` o negativo y envia
- THEN se muestra error de validacion en `limiteWip`
- AND no se invoca el backend

#### Scenario: Asignar columna en tablero TRATOS envia estadoTrato [integration test]

- GIVEN el tablero t1 es tipo TRATOS y la columna col1
- WHEN el usuario asigna col1 con `limiteWip: 3`, `totalValorEstimado: 5000`, `estadoTrato: 'ABIERTO'`
- THEN se invoca `POST /api/tableros/asignar-columna?id=t1&columnaId=col1` con `estadoTrato: 'ABIERTO'` y sin `estadoTarea`
- AND la query `['tableros', 't1']` se invalida

#### Scenario: Asignar columna en tablero TAREAS envia estadoTarea y totalValorEstimado=0 [integration test]

- GIVEN el tablero t2 es tipo TAREAS y la columna col2
- WHEN el usuario asigna col2 con `limiteWip: 2`, `estadoTarea: 'PENDIENTE'`
- THEN se invoca `POST /api/tableros/asignar-columna?id=t2&columnaId=col2` con `estadoTarea: 'PENDIENTE'`, `totalValorEstimado: 0` y sin `estadoTrato`
- AND la query `['tableros', 't2']` se invalida

#### Scenario: Enviar estadoTarea=null en tablero TAREAS no se permite [component test]

- GIVEN el tablero t2 es tipo TAREAS
- WHEN el usuario intenta asignar una columna sin seleccionar `estadoTarea`
- THEN se muestra error de validacion en el campo `estadoTarea`
- AND no se invoca el backend

#### Scenario: Quitar columna con fichas muestra error 409 [integration test]

- GIVEN el tablero t1 tiene la columna c1 que contiene fichas
- WHEN el usuario hace clic en "Quitar columna" y confirma
- THEN se invoca `DELETE /api/tableros/eliminar-columna?id=t1&columnaId=c1`
- AND el back responde 409
- THEN se muestra mensaje que indica que la columna tiene fichas (distinto del mensaje 422 generico)
- AND la UI no rompe

#### Scenario: Quitar columna vacia exitosa [integration test]

- GIVEN el tablero t1 tiene la columna c1 sin fichas
- WHEN el usuario hace clic en "Quitar columna" y confirma
- THEN se invoca `DELETE /api/tableros/eliminar-columna?id=t1&columnaId=c1`
- AND la columna desaparece del tablero
- AND la query `['tableros', 't1']` se invalida

---

## API Contract Reference (additions)

| Metodo | Path | Descripcion |
|---|---|---|
| (existentes) | (sin cambios) | Ver spec base |

**Enums adicionales confirmados contra Java (AR-CRM)**:
- `TipoEstadoColumnaTableroTarea`: `PENDIENTE | EN_CURSO | FINALIZADA`

**Invariantes Java (InvariantViolationException si se violan)**:
- `estadoTarea` y `estadoTrato` son mutuamente excluyentes y REQUERIDOS segun `tipoTablero`.
- `totalValorEstimado` MUST ser ZERO en tableros TAREAS.
- `Tarea.titulo` (1-200 chars) = label de la card en tableros TAREAS.
- `Tarea.tratoId` es `@NotNull` → tareas existentes siempre tienen `tratoId`.
