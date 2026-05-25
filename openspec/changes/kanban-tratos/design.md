# Design: Kanban de Tratos (Change 7)

**Change**: `kanban-tratos`  
**Fecha**: 2026-05-25  
**Artifact store**: hybrid

---

## Technical Approach

Agregar vista kanban a `/tratos` como default mediante `@dnd-kit/core` (solo core). La lógica de drag-and-drop se aisla en `resolverDragEnd()` como función pura (testeable sin render). El estado del board se deriva exclusivamente del query cache de TanStack Query: sin optimistic update, sin estado local de tarjetas. El flujo de modal-interrupt para `perdido` usa `pendingDrag` en TratosKanban para controlar `TratoPerderDialog` sin modificar ese componente. Toggle tabla↔kanban vía extensión mínima de `useTabSync` con `paramKey` opcional.

---

## Architecture Decisions

| # | Decisión | Opción elegida | Alternativa rechazada | Razón |
|---|----------|---------------|-----------------------|-------|
| 1 | **Firma `resolverDragEnd`** | Recibe `estadoOrigen` explícito del caller | Derivar estado internamente | Función pura sin acceso a store; el caller tiene el trato y puede leer `trato.estado`; facilita test unitario |
| 2 | **Árbol de componentes DnD** | `KanbanBoard → KanbanColumna (useDroppable) → KanbanCard (useDraggable)` | Componente monolítico | Feature-plana requiere separación; `DndContext` en `KanbanBoard`, sensores (pointer + keyboard) en el mismo nivel |
| 3 | **Modal-interrupt sin optimistic update** | `pendingDrag` state en `KanbanBoard`; tarjeta no se mueve hasta `onSuccess` | Optimistic update con rollback en cancel | Ningún CRUD del proyecto usa optimistic; sin rollback a gestionar; `TratoPerderDialog` ya gestiona su propia mutación |
| 4 | **Mutación para cada acción de drag** | Reusar `useGanarTrato`, `usePerderTrato` (vía dialog), `useUpdateTrato` (reabrir) | Hook nuevo `usePatchEstadoTrato` | Los hooks ya existen, invalidan `tratosKeys.all`, emiten toasts — cero duplicación |
| 5 | **`useColumnasKanban` seam** | Interface `ColumnaKanban` con `requiereModal` — v1 hardcodeada | Columnas hardcodeadas inline | Desacopla reglas de columna del componente; permite futura config por instancia sin reescritura |
| 6 | **`useTabSync` paramKey** | Tercer argumento opcional `paramKey = 'tab'` | Hook alternativo / rename | Cambio de 3 líneas; backward-compatible; URL `?vista=tabla` más semántica |
| 7 | **MSW handlers** | Reusar handlers existentes de `GET /tratos`, `PATCH /ganar`, `PATCH /perder`, `PATCH /:id` | Handlers específicos para kanban | Los endpoints son los mismos; solo se agregan fixtures |

---

## `resolverDragEnd` — Firma definitiva

```ts
// src/features/tratos/hooks/resolverDragEnd.ts

export type AccionDrag =
  | { accion: 'ignorar' }
  | { accion: 'ganar'; tratoId: string }
  | { accion: 'reabrir'; tratoId: string }
  | { accion: 'abrir-modal-perder'; tratoId: string; nombre: string };

export function resolverDragEnd(
  tratoId: string,
  estadoOrigen: EstadoTrato,
  estadoDestino: EstadoTrato | null,
  columnas: ColumnaKanban[],
  nombre: string,
): AccionDrag
```

**Casos cubiertos por la función (8 escenarios — todos mapeados a unit tests):**

| estadoOrigen | estadoDestino | Resultado |
|---|---|---|
| cualquiera | `null` | `{ accion: 'ignorar' }` |
| `abierto` | `abierto` | `{ accion: 'ignorar' }` |
| `ganado` | `ganado` | `{ accion: 'ignorar' }` |
| `perdido` | `perdido` | `{ accion: 'ignorar' }` |
| `abierto` | `ganado` | `{ accion: 'ganar', tratoId }` |
| `ganado` | `abierto` | `{ accion: 'reabrir', tratoId }` |
| `perdido` | `abierto` | `{ accion: 'reabrir', tratoId }` |
| `perdido` | `ganado` | `{ accion: 'ignorar' }` (terminal→terminal) |
| cualquiera | `perdido` | `{ accion: 'abrir-modal-perder', tratoId, nombre }` |

La función lee `columna.requiereModal` del array `columnas` para el caso `perdido`; no hardcodea el valor `'perdido'`.

---

## Data Flow

```
TratosListPage
  useTabSync(['kanban','tabla'], 'kanban', 'vista')
  ├── vista='kanban' → KanbanBoard
  │     useColumnasKanban() → columnas[3]
  │     useTratos(filters)  → tratos[]
  │     DndContext(sensors=[pointer,keyboard], onDragEnd=handleDragEnd)
  │       KanbanColumna × 3 (useDroppable)
  │         KanbanCard × N (useDraggable) → click navega /tratos/:id
  │     handleDragEnd:
  │       resolverDragEnd(tratoId, estadoOrigen, estadoDestino, columnas, nombre)
  │       ├── 'ignorar'              → noop
  │       ├── 'ganar'                → ganarMutation.mutate(tratoId)
  │       ├── 'reabrir'              → updateMutation.mutate({ id, data: { estado:'abierto', motivo_perdida:null } })
  │       └── 'abrir-modal-perder'   → setPendingDrag({ tratoId, nombre })
  │     TratoPerderDialog (open=!!pendingDrag)
  │       confirm → usePerderTrato (interno al dialog) → invalida tratosKeys.all → tarjeta en 'perdido'
  │       cancel  → setPendingDrag(null) → noop
  └── vista='tabla' → TratosTable (sin cambios)

Invalidación onSuccess:
  ganarMutation   → tratosKeys.all + tratosKeys.detail(id)  [ya en useGanarTrato]
  updateMutation  → tratosKeys.all + tratosKeys.detail(id)  [ya en useUpdateTrato]
  usePerderTrato  → tratosKeys.all + tratosKeys.detail(id)  [ya en usePerderTrato]
```

---

## File Changes

| Archivo | Acción | Descripción |
|---------|--------|-------------|
| `src/lib/useTabSync.ts` | Modificar | Agregar `paramKey = 'tab'` como tercer argumento; cambiar 3 ocurrencias de `'tab'` por la variable |
| `src/features/tratos/hooks/useColumnasKanban.ts` | Crear | Seam `ColumnaKanban[]` hardcodeado del enum — v1 |
| `src/features/tratos/hooks/resolverDragEnd.ts` | Crear | Función pura; discriminated union `AccionDrag`; importa `ColumnaKanban`, `EstadoTrato` |
| `src/features/tratos/components/KanbanBoard.tsx` | Crear | `DndContext` + sensores + estado `pendingDrag`; orquesta columnas y `TratoPerderDialog` |
| `src/features/tratos/components/KanbanColumna.tsx` | Crear | `useDroppable`; header con título + WIP counter; lista de `KanbanCard` |
| `src/features/tratos/components/KanbanCard.tsx` | Crear | `useDraggable`; nombre clickeable → navega `/tratos/:id`; `TratoEstadoBadge` |
| `src/features/tratos/pages/TratosListPage.tsx` | Modificar | Agregar `useTabSync(..., 'vista')`, toggle UI (botones Kanban/Tabla), renderizado condicional `KanbanBoard \| TratosTable` |
| `src/mocks/fixtures/tratos.ts` | Modificar | +1 fixture `estado:'ganado'` (id `d4444444-...`), +1 fixture `estado:'perdido'` (id `d5555555-...`) |
| `src/features/tratos/__tests__/resolverDragEnd.test.ts` | Crear | 9 unit tests (todos los casos de `AccionDrag`) sin render |
| `src/features/tratos/__tests__/useColumnasKanban.test.ts` | Crear | Unit test: 3 columnas, `requiereModal`, `esTerminal` |
| `src/features/tratos/__tests__/KanbanBoard.test.tsx` | Crear | Integration tests: columnas, WIP counters, distribución, modal-interrupt, PATCH ganar/reabrir |
| `src/features/tratos/__tests__/TratosListPage.test.tsx` | Modificar | +4 tests: default=kanban, `?vista=tabla`=tabla, toggle agrega/limpia param |
| `src/lib/__tests__/useTabSync.test.tsx` | Modificar | +4 tests: `paramKey='vista'` escribe `?vista=`; retro-compat sin paramKey |
| `package.json` | Modificar | Agregar `@dnd-kit/core@^6.3.1` |

---

## Interfaces / Contracts

```ts
// src/features/tratos/hooks/useColumnasKanban.ts
import type { EstadoTrato } from '@/api/types';

export interface ColumnaKanban {
  id: EstadoTrato;
  label: string;
  color: string;        // token Tailwind: 'blue' | 'green' | 'red'
  esTerminal: boolean;
  requiereModal: boolean;
}

export function useColumnasKanban(): ColumnaKanban[]
```

```ts
// src/features/tratos/hooks/resolverDragEnd.ts
import type { EstadoTrato } from '@/api/types';
import type { ColumnaKanban } from './useColumnasKanban';

export type AccionDrag =
  | { accion: 'ignorar' }
  | { accion: 'ganar';              tratoId: string }
  | { accion: 'reabrir';            tratoId: string }
  | { accion: 'abrir-modal-perder'; tratoId: string; nombre: string };

export function resolverDragEnd(
  tratoId: string,
  estadoOrigen: EstadoTrato,
  estadoDestino: EstadoTrato | null,
  columnas: ColumnaKanban[],
  nombre: string,
): AccionDrag
```

```ts
// useTabSync firma extendida (src/lib/useTabSync.ts)
export function useTabSync(
  allowed: readonly string[],
  fallback: string,
  paramKey: string = 'tab',
): readonly [string, (next: string) => void]
```

```ts
// Estado local en KanbanBoard
interface PendingDrag {
  tratoId: string;
  nombre: string;
}
// useState<PendingDrag | null>(null)
```

---

## Testing Strategy

| Capa | ¿Qué se testea? | Approach |
|------|----------------|----------|
| Unit | `resolverDragEnd` — 9 casos (noop ×4, ganar, reabrir ×2, abrir-modal-perder ×1, terminal→terminal) | Test puro `.test.ts` sin render; input directo a la función |
| Unit | `useColumnasKanban` — 3 columnas, `requiereModal`, `esTerminal` | `renderHook`; sin MSW |
| Unit | `useTabSync` con `paramKey='vista'` — leer `?vista=`, escribir `?vista=tabla`, URL limpia al fallback; retro-compat | `renderHook` + `MemoryRouter` |
| Integration | `KanbanBoard` — 3 columnas visibles, WIP counters, tarjetas en columna correcta | Render + MSW (fixtures con ganado+perdido); `waitFor` |
| Integration | `KanbanBoard` modal-interrupt — drag a `perdido` abre dialog; cancelar = noop; confirmar = PATCH `/perder` | Invocar `handleDragEnd` directamente (no simular gestos pointer); `waitFor` en mutación |
| Integration | `KanbanBoard` drag sin modal — ganar: PATCH `/ganar`; reabrir: PATCH `/:id` | Mismo patrón: invocar `handleDragEnd`; verificar handler MSW fue llamado |
| Integration | `TratosListPage` toggle — default=kanban, `?vista=tabla`=tabla, toggle escribe/limpia URL | `MemoryRouter` con `initialEntries`; `userEvent.click` |
| Regression | `useTabSync` sin `paramKey` sigue usando `?tab=` | Ejecutar tests existentes sin cambio |

**Nota**: jsdom no simula gestos pointer de @dnd-kit. La estrategia es exportar `handleDragEnd` o acceder a él vía el componente renderizado e invocarlo directamente con el objeto `DragEndEvent` sintético. Todos los `waitFor` envuelven assertions sobre elementos asíncronos (patrón `test-cross-link-async`).

---

## Migration / Rollout

No se requiere migración de datos. La vista tabla sigue disponible en `?vista=tabla`. Rollback: revertir `package.json` + borrar archivos nuevos + revertir `TratosListPage` y `useTabSync`.

---

## Open Questions

- Ninguna. Todas las decisiones de diseño están resueltas y documentadas.
