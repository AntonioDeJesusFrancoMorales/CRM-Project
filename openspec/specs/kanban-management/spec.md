# kanban-management Specification

**Capability**: kanban-management
**Change**: kanban-tareas (Change 6)
**Status**: active
**Last updated**: 2026-05-29

## Purpose

Provee el tablero Kanban del CRM Pipely. Modela el ciclo de vida del Trato (ABIERTO / GANADO / PERDIDO) y de la Tarea (PENDIENTE / EN_CURSO / FINALIZADA) mediante el contrato real del back AR-CRM: Tablero / ColumnaTableroDto / Ficha. Soporta tableros `TipoTablero.TRATOS` y `TipoTablero.TAREAS`. El estado del Trato o la Tarea se deriva exclusivamente de la columna donde se encuentra su Ficha (campo `estadoTrato` o `estadoTarea` de `ColumnaTableroDto`), no es un campo del modelo.

## Requirements

---

### Requirement: Listar tableros de tipo TRATOS

El sistema MUST consumir `GET /api/tableros/get-all` y filtrar client-side los tableros con `tipoTablero === 'TRATOS'`. La queryKey MUST ser `['tableros']`. Los tableros de tipo `TAREAS` MUST NOT mostrarse en esta feature. La entrada "Tableros" del Sidebar MUST navegar a `/tableros`.

#### Scenario: Solo tableros TRATOS aparecen en la lista [integration test]

- GIVEN `GET /api/tableros/get-all` retorna tableros con `tipoTablero: 'TRATOS'` y `tipoTablero: 'TAREAS'`
- WHEN el usuario navega a `/tableros`
- THEN solo se muestran los tableros con `tipoTablero === 'TRATOS'`
- AND los tableros TAREAS no aparecen en la lista

#### Scenario: Lista vacia muestra empty state [integration test]

- GIVEN `GET /api/tableros/get-all` retorna array vacio o sin tableros TRATOS
- WHEN el usuario navega a `/tableros`
- THEN se muestra mensaje "No hay tableros de tratos todavia" o equivalente

#### Scenario: Error 500 muestra boton reintentar [integration test]

- GIVEN `GET /api/tableros/get-all` responde 500
- WHEN se monta la pagina
- THEN se muestra mensaje de error con boton "Reintentar"

---

### Requirement: Listar tableros de tipo TAREAS en lista unificada con badge

El sistema MUST incluir tableros `tipoTablero === 'TAREAS'` en la lista `/tableros` junto a los TRATOS. Cada card MUST mostrar un badge de tipo (`TRATOS` | `TAREAS`) para distinguirlos visualmente. Los tableros TAREAS MUST navegar a `/tableros/:id` igual que los TRATOS.

#### Scenario: Lista unificada muestra ambos tipos con badge [integration test]

- GIVEN `GET /api/tableros/get-all` retorna tableros con `tipoTablero: 'TRATOS'` y `tipoTablero: 'TAREAS'`
- WHEN el usuario navega a `/tableros`
- THEN se muestran tableros de ambos tipos
- AND cada card muestra badge `TRATOS` o `TAREAS` segun corresponda

#### Scenario: Lista vacia sin tableros de ningun tipo muestra empty state [integration test]

- GIVEN `GET /api/tableros/get-all` retorna array vacio
- WHEN el usuario navega a `/tableros`
- THEN se muestra mensaje de empty state

---

### Requirement: Ver tablero con columnas

El sistema MUST consumir `GET /api/tableros/get-by-id?id={tableroId}` para obtener el tablero con su lista de `ColumnaTableroDto`. La queryKey MUST ser `['tableros', tableroId]`. Cada columna MUST mostrar: `nombre`, `color`, `limiteWip` (si no es null), `estadoTrato` como badge visual (`ABIERTO` | `GANADO` | `PERDIDO`). El orden de las columnas MUST respetar el orden del array `columnas` devuelto por el back.

#### Scenario: Tablero renderiza columnas en orden del back [integration test]

- GIVEN `GET /api/tableros/get-by-id?id=t1` retorna tablero con columnas `[Prospectando, Propuesta, Cerrado Ganado]`
- WHEN el usuario navega a `/tableros/t1`
- THEN se renderizan tres columnas en ese orden exacto
- AND cada columna muestra su nombre y badge de estadoTrato

#### Scenario: Columna muestra limiteWip cuando no es null [component test]

- GIVEN una columna tiene `limiteWip: 5`
- WHEN se renderiza la columna en el tablero
- THEN se muestra el indicador de limite WIP con el valor 5

#### Scenario: 404 tablero redirige a lista [integration test]

- WHEN `GET /api/tableros/get-by-id?id=inexistente` responde 404
- THEN se muestra toast de error
- AND el router navega a `/tableros`

---

### Requirement: Listar fichas del tablero

El sistema MUST consumir `GET /api/fichas/get-all` y filtrar client-side las fichas cuyo `columnaId` este incluido en las columnas del tablero activo. La queryKey MUST ser `['fichas']`. En tableros TRATOS, las fichas con `tipoFicha !== 'TRATO'` MUST NOT mostrarse. En tableros TAREAS, las fichas con `tipoFicha !== 'TAREA'` MUST NOT mostrarse. El orden de fichas dentro de una columna MUST ser estable y derivado del back (campo `creadoEn` ascendente).

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

### Requirement: Crear ficha de trato

El sistema MUST exponer un dialog (`FichaCreateDialog`) abierto desde el botón "+" del header de cada `KanbanColumn`, con `columnaId` precargado. El formulario MUST incluir: selector de trato (solo tratos sin ficha activa, derivados de `useTratos()` filtrado contra `useFichas()`) y selector de responsable (`useUsuarios()`). El body enviado a `POST /api/fichas/create` MUST incluir `tipoFicha: 'TRATO'`, `tratoId`, `columnaId`, `responsableId`, y `creadoPor: '00000000-0000-0000-0000-000000000001'` (UUID fijo). Los errores 422 del servidor MUST mostrarse como `serverErrors` en el campo correspondiente. Tras éxito, la query `['fichas']` MUST invalidarse y el dialog cerrarse.

#### Scenario: Dialog abre con columnaId precargado [component test]

- GIVEN el usuario hace clic en "+" en el header de la columna c1
- WHEN se abre `FichaCreateDialog`
- THEN el campo `columnaId` está precargado con el id de c1
- AND el campo no es editable por el usuario

#### Scenario: Selector de trato solo muestra tratos sin ficha [component test]

- GIVEN existen tratos t1 (sin ficha) y t2 (con ficha activa)
- WHEN se abre el selector de trato en el form
- THEN solo aparece t1 en las opciones

#### Scenario: Creación exitosa envía creadoPor UUID válido [integration test]

- GIVEN el usuario selecciona trato t1 y responsable u1
- WHEN confirma la creación
- THEN se invoca `POST /api/fichas/create` con `creadoPor: '00000000-0000-0000-0000-000000000001'`, `responsableId: u1`, `tipoFicha: 'TRATO'`, `tratoId: t1`, `columnaId` precargado
- AND la query `['fichas']` se invalida
- AND el dialog se cierra

#### Scenario: Error 422 muestra serverError en campo [integration test]

- GIVEN el back responde 422 con error en campo `tratoId`
- WHEN el usuario envía el form
- THEN se muestra el mensaje de error bajo el campo `tratoId`
- AND el dialog permanece abierto

#### Scenario: tratoId requerido para ficha de tipo TRATO [component test]

- GIVEN el formulario de creación de ficha
- WHEN el usuario no selecciona un trato
- THEN se muestra error de validación en el campo tratoId
- AND no se invoca el backend

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

### Requirement: Editar ficha de trato

El sistema MUST permitir editar una ficha existente vía `PUT /api/fichas/edit?id={fichaId}`. El body MUST incluir todos los campos de `EditFichaRequest`: `columnaId`, `tipoFicha`, `tratoId`, `tareaId`, `responsableId`. Tras exito, la query `['fichas']` se invalida.

#### Scenario: Edicion exitosa de ficha [integration test]

- GIVEN existe la ficha f1 con responsableId u1
- WHEN el usuario cambia el responsable a u2 y guarda
- THEN se invoca `PUT /api/fichas/edit?id=f1` con el body completo incluyendo `responsableId: u2`
- AND la query `['fichas']` se invalida

---

### Requirement: Eliminar ficha de trato

El sistema MUST exponer un `AlertDialog` de confirmación accesible desde un menú/dropdown en `KanbanCard`. Tras confirmación, MUST invocar `DELETE /api/fichas/delete?id={fichaId}`. Tras éxito (204), la query `['fichas']` MUST invalidarse. Si el usuario cancela, NO MUST invocarse el endpoint.

#### Scenario: Eliminación exitosa desde KanbanCard [integration test]

- GIVEN existe la ficha f1 en la columna c1 y el usuario abre el menú de la tarjeta
- WHEN el usuario selecciona "Eliminar" y confirma en el AlertDialog
- THEN se invoca `DELETE /api/fichas/delete?id=f1`
- AND la tarjeta desaparece de la columna c1
- AND la query `['fichas']` se invalida

#### Scenario: Cancelar no invoca DELETE [component test]

- WHEN el usuario hace clic en "Cancelar" en el dialog de confirmación
- THEN se cierra el dialog
- AND no se invoca `DELETE`

---

### Requirement: Mover ficha entre columnas con drag and drop

El sistema MUST permitir mover una tarjeta (ficha) de una columna a otra mediante drag and drop usando `@dnd-kit/core`. El movimiento MUST invocar `PUT /api/fichas/edit?id={fichaId}` con el nuevo `columnaId` y todos los demas campos de la ficha (estado completo en cliente). El drag MUST ser solo ENTRE columnas; no se permite reordenar fichas dentro de la misma columna. Tras exito, la query `['fichas']` se invalida.

#### Scenario: Drag exitoso mueve la ficha a nueva columna [integration test]

- GIVEN el tablero muestra la ficha f1 en la columna c1 (estadoTrato: ABIERTO)
- WHEN el usuario arrastra f1 a la columna c2 (estadoTrato: GANADO)
- THEN se invoca `PUT /api/fichas/edit?id=f1` con `columnaId: c2` y el resto de campos sin cambios
- AND la query `['fichas']` se invalida
- AND f1 aparece en c2

#### Scenario: Drag a misma columna es un no-op idempotente [integration test]

- GIVEN el usuario arrastra la ficha f1 sobre su misma columna c1
- WHEN suelta la ficha
- THEN NO se invoca ninguna peticion HTTP al backend

#### Scenario: Drag no reordena dentro de columna [component test]

- GIVEN la columna c1 tiene fichas f1 y f2
- WHEN el usuario intenta arrastrar f1 sobre f2 dentro de c1
- THEN la operacion no cambia el orden de las fichas en c1

---

### Requirement: Derivar estado del trato desde la columna

El sistema MUST derivar el estado del trato cruzando `ficha.tratoId → columna.estadoTrato`. El estado es el valor del campo `estadoTrato` de la `ColumnaTableroDto` donde se encuentra la ficha con `tratoId == trato.id` y `tipoFicha == 'TRATO'`. Los valores posibles del enum `TipoEstadoColumnaTableroTrato` son exactamente: `ABIERTO`, `GANADO`, `PERDIDO` (confirmados contra Java). El modelo `Trato` MUST NOT tener campo `estado`; la derivacion es client-side.

#### Scenario: Estado ABIERTO se deriva correctamente [unit test]

- GIVEN la ficha f1 tiene `tratoId: d1` y `columnaId: c1`; la columna c1 tiene `estadoTrato: 'ABIERTO'`
- WHEN se evalua el estado del trato d1
- THEN el resultado es `'ABIERTO'`

#### Scenario: Estado GANADO se deriva cuando la ficha esta en columna GANADO [unit test]

- GIVEN la ficha f2 tiene `tratoId: d2` y `columnaId: c2`; la columna c2 tiene `estadoTrato: 'GANADO'`
- WHEN se evalua el estado del trato d2
- THEN el resultado es `'GANADO'`

#### Scenario: Estado PERDIDO se deriva cuando la ficha esta en columna PERDIDO [unit test]

- GIVEN la ficha f3 tiene `tratoId: d3` y `columnaId: c3`; la columna c3 tiene `estadoTrato: 'PERDIDO'`
- WHEN se evalua el estado del trato d3
- THEN el resultado es `'PERDIDO'`

#### Scenario: Trato sin ficha no tiene estado derivado [unit test]

- GIVEN no existe ninguna ficha con `tratoId: d99`
- WHEN se evalua el estado del trato d99
- THEN el resultado es `null` o `undefined` (sin estado)

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

### Requirement: Gestionar columnas del tablero

El sistema MUST permitir asignar una columna del catalogo al tablero vía `POST /api/tableros/asignar-columna?id={tableroId}&columnaId={columnaId}`. El body MUST incluir `limiteWip` (`@NotNull`, `@Min(1)`), `totalValorEstimado` (`@NotNull`, BigDecimal), y EXACTAMENTE UNO de: `estadoTrato` (tableros TRATOS: `ABIERTO | GANADO | PERDIDO`) O `estadoTarea` (tableros TAREAS: `PENDIENTE | EN_CURSO | FINALIZADA`). Enviar ambos estados o ninguno MUST ser rechazado por validacion client-side antes de invocar el back (el back lanzaria `InvariantViolationException`). En tableros TAREAS, `totalValorEstimado` MUST fijarse en `0` automaticamente (no editable). El sistema MUST permitir quitar una columna vía `DELETE /api/tableros/eliminar-columna?id={tableroId}&columnaId={columnaId}`. Una respuesta 409 MUST mostrarse con mensaje claro de que la columna tiene fichas. Tras exito, la query `['tableros', tableroId]` MUST invalidarse.

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

### Requirement: Reordenar columnas del tablero

El sistema MUST permitir reordenar las columnas del tablero mediante `PUT /api/tableros/reordenar-columnas?id={tableroId}` con body `ReordenarColumnasRequest { nuevoOrden: UUID[] }`. La lista MUST contener todos los IDs de columnas del tablero exactamente una vez (permutacion completa: mismo length, mismos elementos sin duplicados, sin ids ajenos). Tras exito, la query `['tableros', tableroId]` se invalida.

#### Scenario: Reordenar columnas invoca endpoint con lista completa [integration test]

- GIVEN el tablero t1 tiene columnas [c1, c2, c3]
- WHEN el usuario reordena a [c2, c1, c3]
- THEN se invoca `PUT /api/tableros/reordenar-columnas?id=t1` con `nuevoOrden: ['c2', 'c1', 'c3']`
- AND la lista tiene exactamente 3 elementos (todos los IDs del tablero)
- AND la query `['tableros', 't1']` se invalida

#### Scenario: Lista incompleta no se envia al backend [component test]

- GIVEN el tablero t1 tiene 3 columnas
- WHEN la lista de reordenamiento tiene solo 2 IDs
- THEN NO se invoca el endpoint de reordenar
- AND se muestra error de validacion

#### Scenario: Lista con duplicados no se envia al backend [component test]

- GIVEN el tablero t1 tiene columnas [c1, c2, c3]
- WHEN la lista de reordenamiento contiene un ID duplicado
- THEN NO se invoca el endpoint de reordenar

#### Scenario: Lista con IDs ajenos no se envia al backend [component test]

- GIVEN el tablero t1 tiene columnas [c1, c2, c3]
- WHEN la lista de reordenamiento contiene un ID que no pertenece al tablero
- THEN NO se invoca el endpoint de reordenar

---

### Requirement: Limite WIP visual en columna

El sistema MUST mostrar una advertencia visual en la columna cuando el numero de fichas supera el `limiteWip`. La validacion MUST ser solo client-side (el back no rechaza el movimiento por WIP). El limite WIP proviene del campo `ColumnaTableroDto.limiteWip`; si es null, no se muestra limite.

#### Scenario: Columna sobre limite WIP muestra indicador visual [component test]

- GIVEN una columna tiene `limiteWip: 2` y contiene 3 fichas
- WHEN se renderiza la columna
- THEN se muestra un indicador visual de advertencia de limite WIP superado

#### Scenario: Columna sin limiteWip no muestra indicador [component test]

- GIVEN una columna tiene `limiteWip: null`
- WHEN se renderiza la columna
- THEN no se muestra ningun indicador de limite WIP

---

### Requirement: Habilitar Tableros en Sidebar y routing

El sistema MUST habilitar la entrada "Tableros" en el Sidebar (remover `disabled: true` y el badge "Proximamente"). El sistema MUST reemplazar `TablerosPlaceholder` en `src/routes/placeholders.tsx` con las rutas reales `/tableros` y `/tableros/:id`. La feature reside en `src/features/kanban/` siguiendo ADR-040 (feature-flat).

#### Scenario: Sidebar muestra Tableros habilitado [component test]

- WHEN se renderiza el Sidebar
- THEN el item "Tableros" esta habilitado (sin `disabled`)
- AND el badge "Proximamente" no aparece
- AND el item navega a `/tableros`

#### Scenario: Ruta /tableros renderiza la lista de tableros [integration test]

- WHEN el usuario navega a `/tableros`
- THEN se renderiza la pagina de lista de tableros
- AND NO se muestra `TablerosPlaceholder`

---

## API Contract Reference

| Metodo | Path | Descripcion |
|---|---|---|
| GET | `/api/tableros/get-all` | Lista todos los tableros |
| GET | `/api/tableros/get-by-id?id={uuid}` | Obtiene tablero con columnas |
| PUT | `/api/tableros/edit?id={uuid}` | Edita nombre/descripcion del tablero |
| POST | `/api/tableros/asignar-columna?id={uuid}&columnaId={uuid}` | Asigna columna del catalogo al tablero |
| DELETE | `/api/tableros/eliminar-columna?id={uuid}&columnaId={uuid}` | Quita columna del tablero |
| PUT | `/api/tableros/reordenar-columnas?id={uuid}` | Reordena columnas del tablero |
| GET | `/api/fichas/get-all` | Lista todas las fichas |
| POST | `/api/fichas/create` | Crea ficha |
| PUT | `/api/fichas/edit?id={uuid}` | Edita ficha (incluye mover entre columnas via columnaId) |
| DELETE | `/api/fichas/delete?id={uuid}` | Elimina ficha |

**Enums confirmados contra Java (AR-CRM)**:
- `TipoTablero`: `TAREAS | TRATOS`
- `TipoFicha`: `TRATO | TAREA`
- `TipoEstadoColumnaTableroTrato`: `ABIERTO | GANADO | PERDIDO`
- `TipoEstadoColumnaTableroTarea`: `PENDIENTE | EN_CURSO | FINALIZADA`

**Invariantes Java (InvariantViolationException si se violan)**:
- `estadoTarea` y `estadoTrato` son mutuamente excluyentes y REQUERIDOS segun `tipoTablero`.
- `totalValorEstimado` MUST ser ZERO en tableros TAREAS.
- `Tarea.titulo` (1-200 chars) = label de la card en tableros TAREAS.
- `Tarea.tratoId` es `@NotNull` → tareas existentes siempre tienen `tratoId`.

## Out of Scope

- Persistencia de orden intra-columna (DnD solo ENTRE columnas; orden por `creadoEn` derivado del back).
- Creacion y edicion de tableros desde la UI (futuro change).
- Creacion y edicion de columnas del catalogo desde la UI de Kanban.
- Edicion de fichas desde la UI (formulario de edicion completa — futuro change).
- Auth y gestion de usuarios.
