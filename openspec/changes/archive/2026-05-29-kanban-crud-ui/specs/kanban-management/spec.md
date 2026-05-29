# Delta for kanban-management

**Change**: kanban-crud-ui (Change 5)
**Capability**: kanban-management
**Base spec**: openspec/specs/kanban-management/spec.md (Change 4)

---

## MODIFIED Requirements

### Requirement: Crear ficha de trato

El sistema MUST exponer un dialog (`FichaCreateDialog`) abierto desde el botón "+" del header de cada `KanbanColumn`, con `columnaId` precargado. El formulario MUST incluir: selector de trato (solo tratos sin ficha activa, derivados de `useTratos()` filtrado contra `useFichas()`) y selector de responsable (`useUsuarios()`). El body enviado a `POST /api/fichas/create` MUST incluir `tipoFicha: 'TRATO'`, `tratoId`, `columnaId`, `responsableId`, y `creadoPor: '00000000-0000-0000-0000-000000000001'` (UUID fijo). Los errores 422 del servidor MUST mostrarse como `serverErrors` en el campo correspondiente. Tras éxito, la query `['fichas']` MUST invalidarse y el dialog cerrarse.

(Previously: req solo definía el endpoint y campos básicos — sin UI, sin creadoPor UUID, sin selector responsable, sin 422 handling.)

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

### Requirement: Eliminar ficha de trato

El sistema MUST exponer un `AlertDialog` de confirmación accesible desde un menú/dropdown en `KanbanCard`. Tras confirmación, MUST invocar `DELETE /api/fichas/delete?id={fichaId}`. Tras éxito (204), la query `['fichas']` MUST invalidarse. Si el usuario cancela, NO MUST invocarse el endpoint.

(Previously: req definía el endpoint y la invalidación, pero no especificaba la UI AlertDialog ni el punto de acceso desde KanbanCard.)

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

### Requirement: Gestionar columnas del tablero

El sistema MUST permitir asignar una columna del catálogo al tablero vía `POST /api/tableros/asignar-columna?id={tableroId}&columnaId={columnaId}`. El body MUST incluir `limiteWip` (`@NotNull`, `@Min(1)` — validado client-side antes de enviar), `estadoTrato` (opcional, uno de `ABIERTO | GANADO | PERDIDO`), `totalValorEstimado` (`@NotNull`, BigDecimal). El sistema MUST permitir quitar una columna del tablero vía `DELETE /api/tableros/eliminar-columna?id={tableroId}&columnaId={columnaId}` con botón en el header de `KanbanColumn`. Una respuesta 409 MUST mostrarse con mensaje claro que indique que la columna tiene fichas (distinto del mensaje genérico 422). Tras éxito de cualquiera de las dos operaciones, la query `['tableros', tableroId]` MUST invalidarse.

(Previously: req no validaba limiteWip @Min(1); no especificaba botón en header de KanbanColumn; no distinguía 409 de 422.)

#### Scenario: Asignar columna valida limiteWip >= 1 [component test]

- GIVEN el formulario de asignar columna
- WHEN el usuario introduce `limiteWip: 0` o negativo y envía
- THEN se muestra error de validación en el campo `limiteWip`
- AND no se invoca el backend

#### Scenario: Asignar columna exitosa invoca asignar-columna [integration test]

- GIVEN el tablero t1 y la columna col1
- WHEN el usuario asigna col1 con `limiteWip: 3`, `totalValorEstimado: 0`, `estadoTrato: 'ABIERTO'`
- THEN se invoca `POST /api/tableros/asignar-columna?id=t1&columnaId=col1` con el body requerido
- AND NO se invoca `/agregar-columna`
- AND la query `['tableros', 't1']` se invalida

#### Scenario: Quitar columna con fichas muestra error 409 [integration test]

- GIVEN el tablero t1 tiene la columna c1 que contiene fichas
- WHEN el usuario hace clic en "Quitar columna" y confirma
- THEN se invoca `DELETE /api/tableros/eliminar-columna?id=t1&columnaId=c1`
- AND el back responde 409
- THEN se muestra mensaje que indica que la columna tiene fichas (distinto del mensaje 422 genérico)
- AND la UI no rompe

#### Scenario: Quitar columna vacía exitosa [integration test]

- GIVEN el tablero t1 tiene la columna c1 sin fichas
- WHEN el usuario hace clic en "Quitar columna" y confirma
- THEN se invoca `DELETE /api/tableros/eliminar-columna?id=t1&columnaId=c1`
- AND la columna desaparece del tablero
- AND la query `['tableros', 't1']` se invalida
