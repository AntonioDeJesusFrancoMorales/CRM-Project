# tratos-kanban Specification

**Capability**: tratos-kanban

## Purpose

Provee la vista kanban drag-and-drop de tratos en `/tratos` como vista primaria. Permite visualizar el pipeline por columna de estado y cambiar el estado de un trato arrastrando su tarjeta a otra columna, incluyendo el flujo modal obligatorio al marcar como `perdido` (ADR-043 aplicado a DnD). La fuente de columnas está abstraída en `useColumnasKanban()` como seam configurable (ADR-059). La lógica de decisión de drag está aislada en `resolverDragEnd()` como función pura (ADR-061).

---

## Requirements

### Requirement: Board kanban con 3 columnas

El sistema MUST renderizar un tablero kanban con exactamente 3 columnas provenientes de `useColumnasKanban()`: `abierto`, `ganado`, `perdido`. Cada columna MUST mostrar su título y un contador WIP (cantidad de tarjetas en esa columna). Las columnas MUST mantener el mismo conjunto de filtros activos que la vista de tabla homóloga.

#### Scenario: Board muestra las 3 columnas con títulos [integration test]

- GIVEN `GET /tratos` devuelve tratos en varios estados
- WHEN el usuario accede a `/tratos` (sin query params)
- THEN se renderizan exactamente 3 columnas: "Abierto", "Ganado", "Perdido"
- AND cada columna muestra su contador WIP correcto

#### Scenario: WIP counter refleja cantidad real de tarjetas [integration test]

- GIVEN existen 2 tratos en `'abierto'`, 1 en `'ganado'`, 1 en `'perdido'`
- WHEN se renderiza el board
- THEN la columna "Abierto" muestra contador 2, "Ganado" muestra 1, "Perdido" muestra 1

#### Scenario: Error en GET /tratos muestra estado de error [integration test]

- GIVEN `GET /tratos` responde 500
- WHEN se renderiza el board
- THEN se muestra mensaje de error con opción de reintentar

---

### Requirement: Distribución de tarjetas por estado

El sistema MUST colocar cada trato en la columna cuyo `id` coincide con su campo `estado`. Una tarjeta MUST NOT aparecer en más de una columna simultáneamente.

#### Scenario: Tarjeta aparece en su columna correspondiente [integration test]

- GIVEN un trato `d-ganado` tiene `estado: 'ganado'` y un trato `d-perdido` tiene `estado: 'perdido'`
- WHEN se renderiza el board
- THEN `d-ganado` aparece solo en la columna "Ganado"
- AND `d-perdido` aparece solo en la columna "Perdido"

#### Scenario: Filtros activos aplican igualmente al kanban [integration test]

- GIVEN el filtro `estado='abierto'` está activo
- WHEN se renderiza el board
- THEN solo se muestran tarjetas con `estado: 'abierto'` (el resto de columnas queda vacía)

---

### Requirement: Función pura resolverDragEnd (ADR-061)

El sistema MUST exponer `resolverDragEnd(tratoId, estadoOrigen, estadoDestino, columnas, nombre)` como función pura, sin efectos secundarios. Recibe `tratoId` (id del trato), `estadoOrigen` (estado actual del trato), `estadoDestino` (estado de la columna destino o `null` si se soltó fuera de columna), `columnas` (`ColumnaKanban[]`, fuente de `requiereModal`/`esTerminal`) y `nombre` (del trato, para el payload del modal). Retorna una discriminated union `AccionDrag`:

```ts
type AccionDrag =
  | { accion: 'ignorar' }
  | { accion: 'ganar'; tratoId: string }
  | { accion: 'reabrir'; tratoId: string }
  | { accion: 'abrir-modal-perder'; tratoId: string; nombre: string };
```

La detección del caso modal MUST leerse de `columnaDestino.requiereModal` (NO hardcodear `'perdido'`) y MUST tener precedencia sobre la regla terminal→terminal.

#### Scenario: Drop en misma columna retorna ignorar [unit test]

- WHEN `resolverDragEnd(tratoId, 'abierto', 'abierto', columnas, nombre)` se invoca
- THEN retorna `{ accion: 'ignorar' }`

#### Scenario: Drop fuera de columna (estadoDestino=null) retorna ignorar [unit test]

- WHEN `resolverDragEnd(tratoId, 'abierto', null, columnas, nombre)` se invoca
- THEN retorna `{ accion: 'ignorar' }`

#### Scenario: Drop en 'ganado' desde 'abierto' retorna ganar [unit test]

- WHEN `resolverDragEnd(tratoId, 'abierto', 'ganado', columnas, nombre)` se invoca
- THEN retorna `{ accion: 'ganar', tratoId }`

#### Scenario: Drop en 'abierto' desde 'ganado' retorna reabrir [unit test]

- WHEN `resolverDragEnd(tratoId, 'ganado', 'abierto', columnas, nombre)` se invoca
- THEN retorna `{ accion: 'reabrir', tratoId }`

#### Scenario: Drop en 'abierto' desde 'perdido' retorna reabrir [unit test]

- WHEN `resolverDragEnd(tratoId, 'perdido', 'abierto', columnas, nombre)` se invoca
- THEN retorna `{ accion: 'reabrir', tratoId }`

#### Scenario: Drop en 'perdido' desde 'abierto' retorna abrir-modal-perder [unit test]

- WHEN `resolverDragEnd(tratoId, 'abierto', 'perdido', columnas, nombre)` se invoca
- THEN retorna `{ accion: 'abrir-modal-perder', tratoId, nombre }`

#### Scenario: Drop de 'perdido' a 'ganado' retorna ignorar (terminal→terminal prohibido) [unit test]

- WHEN `resolverDragEnd(tratoId, 'perdido', 'ganado', columnas, nombre)` se invoca
- THEN retorna `{ accion: 'ignorar' }` (ADR-060: drop entre terminales deshabilitado)

#### Scenario: Drop de 'ganado' a 'perdido' retorna abrir-modal-perder (ADR-060 excepción) [unit test]

- WHEN `resolverDragEnd(tratoId, 'ganado', 'perdido', columnas, nombre)` se invoca
- THEN retorna `{ accion: 'abrir-modal-perder', tratoId, nombre }` (destino perdido siempre requiere modal, con precedencia sobre terminal→terminal)

---

### Requirement: Reglas de columnas terminales (ADR-060)

El sistema MUST aplicar las siguientes reglas de transición en el tablero kanban, homologadas con `TratoEstadoMenu`:

| Origen | Destino | Permitido | Acción |
|--------|---------|-----------|--------|
| `abierto` | `ganado` | Sí | PATCH `/ganar` |
| `abierto` | `perdido` | Sí (con modal) | `TratoPerderDialog` → PATCH `/perder` |
| `ganado` | `abierto` | Sí | PATCH `{ estado: 'abierto' }` (reabrir) |
| `ganado` | `perdido` | Sí (con modal) | `TratoPerderDialog` → PATCH `/perder` |
| `perdido` | `abierto` | Sí | PATCH `{ estado: 'abierto' }` (reabrir) |
| `perdido` | `ganado` | No | Drop ignorado (noop) |

El drop `perdido → ganado` MUST ser ignorado sin UI feedback (la tarjeta regresa a su columna original). El drop de cualquier estado hacia `perdido` MUST siempre abrir `TratoPerderDialog`.

#### Scenario: Drag de ganado a abierto ejecuta reabrir [integration test]

- GIVEN un trato `d-ganado` está en la columna "Ganado"
- WHEN `resolverDragEnd` retorna `'reabrir'` y se ejecuta la acción
- THEN se invoca `PATCH /tratos/d-ganado` con `{ estado: 'abierto', motivo_perdida: null }`
- AND tras `onSuccess` la tarjeta aparece en la columna "Abierto"

#### Scenario: Drag de perdido a ganado es ignorado [integration test]

- GIVEN un trato `d-perdido` está en la columna "Perdido"
- WHEN `resolverDragEnd` retorna `{ accion: 'ignorar' }`
- THEN no se invoca ningún endpoint
- AND la tarjeta permanece en "Perdido"

---

### Requirement: Drag directo entre columnas (sin modal) — sin optimistic update (ADR-058)

Cuando el drop es válido y no requiere modal (`'ganar'` o `'reabrir'`), el sistema MUST invocar el endpoint correspondiente y MUST NOT mover la tarjeta visualmente hasta que el servidor responda `onSuccess`. Si el servidor responde con error, la tarjeta permanece en su columna original y se muestra un toast de error.

#### Scenario: Drag a 'ganado' invoca PATCH /ganar y tarjeta se mueve tras onSuccess [integration test]

- GIVEN un trato `d1111111` está en `'abierto'`
- WHEN `resolverDragEnd` retorna `'ganar'` y se invoca la mutación
- THEN se invoca `PATCH /tratos/d1111111/ganar`
- AND tras `onSuccess` la query `['tratos']` se invalida
- AND la tarjeta aparece en la columna "Ganado"

#### Scenario: Error en mutación no mueve la tarjeta [integration test]

- GIVEN `PATCH /tratos/:id/ganar` responde 500
- WHEN se intenta el drag
- THEN la tarjeta permanece en su columna original
- AND se muestra un toast de error

---

### Requirement: Flujo drag-to-perdido con modal interrupt (ADR-043 + ADR-058)

Cuando `resolverDragEnd` retorna `'abrir-modal-perder'`, el sistema MUST guardar el estado `pendingDrag` con `{ tratoId, nombre }` y abrir `TratoPerderDialog` SIN invocar ningún endpoint. La tarjeta NO DEBE moverse visualmente hasta confirmar en el modal y recibir respuesta del servidor.

- Confirmar con motivo MUST invocar `PATCH /tratos/:id/perder` con `{ motivo_perdida }` vía `usePerderTrato`. Tras `onSuccess`, la query se invalida y la tarjeta aparece en "Perdido".
- Cancelar MUST limpiar `pendingDrag` sin invocar ningún endpoint. La tarjeta permanece en su columna original.

#### Scenario: Drag a 'perdido' abre TratoPerderDialog [integration test]

- GIVEN un trato `d1111111` está en `'abierto'`
- WHEN `resolverDragEnd` retorna `'abrir-modal-perder'`
- THEN `TratoPerderDialog` se abre con el nombre del trato
- AND no se invoca ningún endpoint

#### Scenario: Confirmar en modal invoca /perder y mueve tarjeta [integration test]

- GIVEN `TratoPerderDialog` está abierto para `d1111111`
- WHEN el usuario ingresa motivo y confirma
- THEN se invoca `PATCH /tratos/d1111111/perder` con `{ motivo_perdida }`
- AND tras `onSuccess` la tarjeta aparece en la columna "Perdido"
- AND `pendingDrag` queda en `null`

#### Scenario: Cancelar en modal no mueve la tarjeta [integration test]

- GIVEN `TratoPerderDialog` está abierto para `d1111111` (en estado `'abierto'`)
- WHEN el usuario cancela
- THEN no se invoca ningún endpoint
- AND la tarjeta permanece en la columna "Abierto"
- AND `pendingDrag` queda en `null`

---

### Requirement: Seam useColumnasKanban (ADR-059)

El sistema MUST exponer `useColumnasKanban(): ColumnaKanban[]` en `src/features/tratos/hooks/useColumnasKanban.ts`. En v1 MUST retornar las 3 columnas hardcodeadas del enum. La interfaz `ColumnaKanban` MUST incluir: `id: EstadoTrato`, `label: string`, `color: string`, `esTerminal: boolean`, `requiereModal: boolean`. La propiedad `requiereModal: true` MUST estar activa únicamente en la columna `'perdido'`. La propiedad `esTerminal: true` MUST estar activa en `'ganado'` y `'perdido'`.

#### Scenario: useColumnasKanban retorna 3 columnas con estructura correcta [unit test]

- WHEN se invoca `useColumnasKanban()`
- THEN retorna un array de 3 elementos con `id` en `['abierto', 'ganado', 'perdido']`
- AND `perdido.requiereModal === true`
- AND `ganado.requiereModal === false`
- AND `ganado.esTerminal === true` y `perdido.esTerminal === true`
- AND `abierto.esTerminal === false`

---

### Requirement: Fixtures de prueba para estados no-abierto

Los fixtures de tratos MUST incluir al menos 1 trato en estado `'ganado'` y al menos 1 trato en estado `'perdido'` para que los tests de distribución de columnas sean verificables.

#### Scenario: Fixture incluye tratos en ganado y perdido [unit test]

- WHEN se importa el array de fixtures de tratos
- THEN existe al menos 1 fixture con `estado: 'ganado'`
- AND existe al menos 1 fixture con `estado: 'perdido'`

---

## API Contract Reference

| Método | Path | Uso en kanban |
|--------|------|---------------|
| GET | `/api/v1/tratos` | Carga tarjetas del board (misma query que la tabla) |
| PATCH | `/api/v1/tratos/:id/ganar` | Drag a columna 'ganado' |
| PATCH | `/api/v1/tratos/:id/perder` | Confirmar modal drag-to-perdido (requiere `motivo_perdida`) |
| PATCH | `/api/v1/tratos/:id` | Reabrir: `{ estado: 'abierto', motivo_perdida: null }` |

## Out of Scope

- Orden manual de tarjetas dentro de una columna (requiere campo `orden`)
- Badge de tareas pendientes en tarjetas (evita N+1; ya existe en detail page)
- `TratoEstadoMenu` en la tarjeta (v1: click navega al detalle)
- WIP limits por columna
- Analytics / pipeline metrics
- Etapas configurables por instancia (seam preparado en `useColumnasKanban`)
