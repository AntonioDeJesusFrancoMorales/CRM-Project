# Exploración: kanban-tratos (Change 7)

**Fecha**: 2026-05-25 — Hybrid (file + engram)

---

## Estado actual

### Estructura de la feature `tratos`

```
src/features/tratos/
├── schemas/
│   └── trato.schema.ts          # tratoCreateSchema, tratoUpdateSchema, EstadoTrato enum
├── hooks/
│   ├── useTratos.ts             # GET /tratos con filtros server-side + tratosKeys
│   ├── useTrato.ts              # GET /tratos/:id
│   ├── useCreateTrato.ts
│   ├── useUpdateTrato.ts        # PATCH /tratos/:id — incluye estado + motivo_perdida
│   ├── useGanarTrato.ts         # PATCH /tratos/:id/ganar
│   ├── usePerderTrato.ts        # PATCH /tratos/:id/perder (motivo obligatorio)
│   └── useDeleteTrato.ts
├── components/
│   ├── TratosTable.tsx          # Tabla principal, gestiona TratoPerderDialog
│   ├── TratoEstadoMenu.tsx      # ADR-044: dropdown 3 ítems (ganar/perder/reabrir)
│   ├── TratoEstadoBadge.tsx     # Badge visual por estado
│   ├── TratoPerderDialog.tsx    # ADR-043: modal obligatorio con motivo_perdida
│   ├── TratoCreateDialog.tsx
│   ├── TratoEditDialog.tsx
│   ├── TratoDeleteDialog.tsx
│   ├── TratoForm.tsx
│   ├── TratoInfoTab.tsx
│   └── TratoTareasTab.tsx
└── pages/
    ├── TratosListPage.tsx       # /tratos — lista con 4 filtros + búsqueda client-side
    └── TratoDetailPage.tsx      # /tratos/:id — tabbed (info / tareas)
```

### `TratosListPage` hoy

- Ruta: `/tratos` (sin toggle de vista, solo tabla).
- Filtros: búsqueda por nombre (client-side), estado, cliente, prospecto, responsable.
- Estado de filtros: `useState` local (no URL-driven).
- No usa `useTabSync`; sin query params en la URL.

### `useTabSync` (src/lib/useTabSync.ts)

```ts
export function useTabSync(
  allowed: readonly string[],
  fallback: string,
): readonly [string, (next: string) => void]
```

- Usa `useSearchParams` y hardcodea el parámetro como **`?tab=`**.
- Si el valor es el fallback, elimina el param (URL limpia).
- Usado hoy en: `TratoDetailPage` (`['info','tareas']`), `ClienteDetailPage` (`['info','tratos']`).

**HALLAZGO CLAVE**: El hook usa `?tab=`, no `?vista=`. Para el toggle tabla↔kanban en el listado se propone usar `useTabSync(['kanban', 'tabla'], 'kanban')` con param `?tab=tabla` cuando se cambia a tabla. El fallback `'kanban'` (vista primaria) no escribe nada en la URL; `?tab=tabla` aparece solo al elegir la vista secundaria. Esto es coherente con el diseño existente del hook.

### Transiciones de estado y columnas terminales

`EstadoTrato = 'abierto' | 'ganado' | 'perdido'`

Endpoints dedicados:
- `PATCH /tratos/:id/ganar` → pasa a `ganado` sin condición
- `PATCH /tratos/:id/perder` → requiere `motivo_perdida` (valida 422)
- `PATCH /tratos/:id` con `{ estado: 'abierto', motivo_perdida: null }` → **reabrir**

`TratoEstadoMenu` deshabilita:
- "Marcar ganado" si `estado === 'ganado'`
- "Marcar perdido…" si `estado === 'perdido'`
- "Reabrir" si `estado === 'abierto'`

**Regla de terminales**: `ganado` y `perdido` son terminales solo en el sentido de que la acción hacia el mismo estado está deshabilitada. "Reabrir" sí permite salir de ambos estados terminales hacia `abierto`. Esto significa que en el kanban:
- Arrastrar desde `ganado` → `abierto`: **debe ser permitido** (equivale a "Reabrir").
- Arrastrar desde `perdido` → `abierto`: **permitido**, pero sin modal (PATCH estado='abierto').
- Arrastrar desde `perdido` → `ganado`: técnicamente posible vía PATCH, pero el modal solo aplica a perdido. Se recomienda **deshabilitarlo** para mantener coherencia con el menú existente que solo ofrece "Reabrir" desde terminal.
- Arrastrar **hacia** `perdido`: **SIEMPRE abre `TratoPerderDialog`** antes de confirmar (ADR-043).

### `TratoPerderDialog`

Props: `{ open, onOpenChange, tratoId, nombre }`

- Internamente instancia `usePerderTrato()`.
- Al confirmar: llama `mutation.mutate({ id, motivo_perdida })`, cierra en `onSuccess`.
- Al cancelar: llama `onOpenChange(false)` sin acción.
- Reset del form en cada apertura (`useEffect` sobre `open`).
- Ya **gestiona su propia mutación** — el Kanban solo necesita controlar `open` y proveer `tratoId` + `nombre`.

### `usePerderTrato`

- Endpoint: `PATCH /tratos/:id/perder`
- Invalida: `tratosKeys.all` + `tratosKeys.detail(id)`
- Emite toast en success/error; silencia 422 (el modal lo mapea inline).

### MSW — handlers tratos

Endpoints relevantes para kanban:
| Endpoint | Lógica mock |
|---|---|
| `PATCH /tratos/:id/ganar` | Muta fixture, devuelve trato |
| `PATCH /tratos/:id/perder` | Valida `motivo_perdida` (422 si vacío), muta fixture |
| `PATCH /tratos/:id` | Update genérico (acepta `estado`, `motivo_perdida`) |
| `GET /tratos` | Filtra por `estado`, `responsable_id`, etc. |

**No existe** handler `PATCH /tratos/:id/columna` — el drag-to-state usa los endpoints ya existentes.

### Fixture de tratos

Los 3 fixtures actuales están todos en estado `'abierto'`. Para testear las columnas `ganado` y `perdido` en el kanban habrá que agregar fixtures en esos estados **o** usar `server.use(...)` en los tests para preparar el estado deseado.

---

## Áreas afectadas

| Archivo/ruta | Tipo de cambio |
|---|---|
| `src/features/tratos/pages/TratosListPage.tsx` | Refactor: agregar toggle de vista + renderizar `TratosKanban` o `TratosTable` |
| `src/features/tratos/components/TratosKanban.tsx` | Nuevo componente de tablero kanban (columnas + tarjetas + DnD) |
| `src/features/tratos/components/TratosKanbanCard.tsx` | Nueva tarjeta kanban reutilizable |
| `src/features/tratos/hooks/getColumnasKanban.ts` | Nueva función/seam de columnas (o `useColumnasKanban`) |
| `src/features/tratos/__tests__/TratosListPage.test.tsx` | Ampliar: tests del toggle tabla↔kanban |
| `src/features/tratos/__tests__/TratosKanban.test.tsx` | Nuevo: tests del tablero (handler lógica, columnas, modal) |
| `src/mocks/fixtures/tratos.ts` | Ampliar: agregar fixtures en estados ganado/perdido |
| `package.json` | Nueva dep: `@dnd-kit/core` (+ posiblemente `@dnd-kit/utilities`) |

---

## Approaches

### A. Librería @dnd-kit: paquetes mínimos vs set completo

**Contexto**: No hay orden persistido dentro de columnas (`v1 = agrupación sin orden`). Solo se necesita drag de una tarjeta a otra columna (swap de estado).

#### Opción A1 — `@dnd-kit/core` únicamente

- Pros:
  - Mínimo bundle.
  - Suficiente: `useDraggable` (tarjeta) + `useDroppable` (columna) cubren el caso sin orden.
  - A11y built-in vía Accessibility Manager del core.
  - Touch support nativo (pointer events).
  - React 18 compatible (≥ v6.0).
- Cons:
  - Si en el futuro se agrega orden manual, habrá que añadir `@dnd-kit/sortable` y refactorizar.
- Esfuerzo: Bajo

#### Opción A2 — `@dnd-kit/core` + `@dnd-kit/sortable`

- Pros: Preparado para orden futuro desde v1.
- Cons: Bundle mayor; `SortableContext` + estrategias de sorting añaden complejidad innecesaria cuando no hay campo `orden`.
- Esfuerzo: Medio

**Recomendación**: **A1 — solo `@dnd-kit/core`**. El requisito lock dice explícitamente "NO orden manual". Agregar sortable sería over-engineering. La costura futura para orden estará en el modelo de columnas (`getColumnasKanban`), no en el DnD library.

**Versiones compatibles con React 18**:
- `@dnd-kit/core@^6.3.1` — es la rama estable que soporta React 18 (peerDep `"react": ">=16"`).
- Verificado: no requiere React 19; sin breaking changes con ^18.3.x.

---

### B. Flujo de drag-to-perdido (modal interrupt)

Este es el flujo más crítico del change (ADR-043 aplicado al drag).

#### Opción B1 — `onDragEnd` stateful + revert en cancelación (RECOMENDADO)

```
onDragEnd(event):
  if (over === null) → noop
  if (over.id === card.estado) → noop (misma columna)
  if (over.id === 'perdido'):
    → guardar { pendingDrag: { tratoId, nombre } }
    → abrir TratoPerderDialog
    → NO disparar mutación todavía
  else:
    → despachar mutación (ganar o update estado='abierto')

TratoPerderDialog.onConfirm:
  → mutation.mutate({ id: pendingDrag.tratoId, motivo_perdida })
  → en onSuccess: limpiar pendingDrag
  → en error: limpiar pendingDrag (card regresa por invalidación del query)

TratoPerderDialog.onCancel:
  → limpiar pendingDrag
  → NO despachar mutación
  → card regresa a su columna original (la UI se deriva del query, no hay estado optimista)
```

- Pros:
  - **No hay rollback complicado**: el kanban deriva su estado de `useTratos()`. Si no se hace PATCH, el query no cambia y la tarjeta permanece en su columna original.
  - Reutiliza `TratoPerderDialog` sin modificaciones (mismo contrato de props).
  - Sin optimistic update para `perdido` → sin riesgo de UI divergente.
- Cons:
  - La tarjeta "vuela" visualmente a la columna destino durante el drag, pero regresa si se cancela. Este es el comportamiento estándar de @dnd-kit cuando no hay optimistic UI.
- Esfuerzo: Bajo

#### Opción B2 — Optimistic update para todos los drags

- Mutar el cache de TanStack Query en `onDragEnd` antes de la confirmación para que la tarjeta aparezca inmediatamente en la columna destino.
- Pros: UI más fluida.
- Cons:
  - Rollback obligatorio si el usuario cancela el modal de `perdido` → `queryClient.setQueryData(...)` para revertir.
  - Más complejo; doble-path (success / cancel) para la misma acción.
  - El resto de los listados del CRM no usan optimistic update → rompe homologación.
- Esfuerzo: Alto

**Recomendación**: **B1 — sin optimistic update**. La ausencia de optimistic update es la norma en el proyecto (ningún CRUD existente la usa). Consistente con `TratoEstadoMenu` que también espera el settle del servidor. El comportamiento de "tarjeta regresa si cancelas" es estándar y comprensible.

---

### C. Costura futura `getColumnasKanban()`

El contrato dice que la fuente de columnas debe ser una función/hook que hoy devuelve el enum y mañana podría devolver config por instancia.

**Diseño propuesto**:

```ts
// src/features/tratos/hooks/useColumnasKanban.ts
export interface ColumnaKanban {
  id: EstadoTrato;           // 'abierto' | 'ganado' | 'perdido'
  label: string;             // 'Abierto' | 'Ganado' | 'Perdido'
  color: string;             // clase Tailwind o token
  esTerminal: boolean;       // ganado + perdido = true
  requiereModal: boolean;    // perdido = true (abre TratoPerderDialog en drop)
}

// v1: devuelve el enum hardcoded
export function useColumnasKanban(): ColumnaKanban[] {
  return [
    { id: 'abierto', label: 'Abierto', color: 'blue', esTerminal: false, requiereModal: false },
    { id: 'ganado',  label: 'Ganado',  color: 'green', esTerminal: true, requiereModal: false },
    { id: 'perdido', label: 'Perdido', color: 'red',   esTerminal: true, requiereModal: true },
  ];
}
```

En el futuro (self-hosted, instancia configurable): `useColumnasKanban()` hace `useQuery(...)` al endpoint de etapas configuradas → misma interfaz, cambio aditivo, sin reescritura del componente `TratosKanban`.

`requiereModal: true` permite que `onDragEnd` consulte la columna destino para decidir si abrir el modal, en lugar de comparar `over.id === 'perdido'` hardcodeado.

---

### D. Toggle tabla↔kanban en `TratosListPage` con `useTabSync`

**Problema identificado**: `useTabSync` hardcodea `?tab=` como param key. El requisito habla de `?vista=`. Opciones:

#### Opción D1 — Usar `useTabSync` tal cual, con `['kanban','tabla']`

```
/tratos              → kanban (fallback, sin query param)
/tratos?tab=tabla    → tabla
```

- Pros: Sin modificar la librería existente. Cero cambios a `useTabSync`.
- Cons: El param se llama `tab` en lugar de `vista`. Semánticamente menos claro para un toggle de vista de listado.
- Esfuerzo: Nulo para la librería

#### Opción D2 — Extender `useTabSync` para aceptar param key configurable

```ts
export function useTabSync(
  allowed: readonly string[],
  fallback: string,
  paramKey = 'tab',    // nuevo arg opcional con default
): readonly [string, (next: string) => void]
```

- Pros: URL `?vista=tabla` más semántica; backward compatible (default `'tab'`).
- Cons: Toca `useTabSync` y sus tests; introduce nuevo argumento.
- Esfuerzo: Muy bajo (cambio de 3 líneas en el hook)

**Recomendación**: **D2** — extender `useTabSync` con `paramKey` opcional. El beneficio semántico (URL `?vista=tabla` vs `?tab=tabla`) vale el costo mínimo. Los usos existentes no se afectan. Los tests del hook se amplían con un caso para `paramKey` personalizado.

---

### E. Estrategia de testing bajo Strict TDD (riesgo crítico)

**Problema**: Los gestos de drag-and-drop no se simulan confiablemente en jsdom con `userEvent` o `fireEvent`. @dnd-kit usa Pointer Events que jsdom soporta parcialmente.

**Estrategia recomendada — testear la lógica, no el pixel**:

1. **Handler `onDragEnd` en aislamiento**:
   - Extraer `handleDragEnd(event, tratos, callbacks)` como función pura o con callbacks inyectados.
   - Testear directamente: `handleDragEnd({ active: { id: tratoId }, over: { id: 'perdido' } }, ...)`.
   - Verificar: qué mutación se llama, qué modal se abre, qué pasa si `over === null`.

2. **Componente `TratosKanban` con stubs**:
   - Renderizar con `@dnd-kit/core` en jsdom (no lanza errores, solo no ejecuta gestos).
   - Verificar: columnas renderizadas (Abierto, Ganado, Perdido), contadores WIP, tarjetas en columna correcta.
   - No simular drag; testear estructura y datos.

3. **Flujo modal interrupt**:
   - Simular `handleDragEnd` con `over.id === 'perdido'` → verificar que el dialog se abre (`open === true`).
   - Renderizar `TratoPerderDialog` abierto → completar form → verificar que `usePerderTrato` se llama con el payload correcto.
   - Simular cancelación → verificar que `pendingDrag` queda en null y no se llama la mutación.

4. **Mutaciones por estado**:
   - Tests existentes `useGanarTrato.test.tsx` y `usePerderTrato.test.tsx` ya cubren la capa de red.
   - Agregar test para `handleDragEnd` con `over.id === 'ganado'` → verifica que llama `ganarMutation.mutate(tratoId)`.

5. **Fixtures adicionales**:
   - Agregar 1-2 tratos en estado `ganado` y 1 en `perdido` al fixture para que los tests de kanban puedan verificar distribución de columnas.

**Seam testeable concreto**:
```ts
// Exportar la función de handler para tests unitarios
export function resolverDragEnd(
  activeId: string,
  overId: string | null,
  columnas: ColumnaKanban[],
): 'noop' | 'ganar' | 'reabrir' | 'modal-perder'
```
Esta función pura no tiene dependencias React → testeable sin render.

---

## Hallazgos relevantes adicionales

1. **Fixture insuficiente para tests kanban**: Los 3 tratos del fixture están todos en `'abierto'`. Hay que agregar al menos 1 `ganado` y 1 `perdido` para cubrir todas las columnas.

2. **`TratosListPage` no usa `useTabSync` hoy** — ningún query param. El wiring de `?vista` es completamente nuevo para esta ruta.

3. **`useTabSync` hardcodea `?tab=`** — confirmado por lectura directa del código. La propuesta es extenderlo con `paramKey` opcional.

4. **Arrastrar desde terminal hacia `ganado`** (desde `perdido` → `ganado`): No existe endpoint `PATCH /tratos/:id/ganar` con validaciones adicionales — técnicamente funcionaría. Sin embargo, para mantener coherencia con `TratoEstadoMenu` (que en estado `perdido` solo habilita "Reabrir"), se recomienda **deshabilitar** el drop en `ganado` cuando la tarjeta viene de `perdido`. Solo se puede salir de `perdido` → `abierto`.

5. **Sin contador de tareas en tarjeta kanban (v1)**: La `TratoTareasTab` requiere una query por trato individual. En el kanban con N tratos, hacer N queries es un N+1. Para v1, no mostrar el badge de tareas en la tarjeta kanban (ya existe en la detail page).

6. **`TratoEstadoMenu` no aparece en la tarjeta kanban (v1)**: La tarjeta es más simple — click navega al detalle (igual que la tabla). El estado se cambia solo por drag.

---

## Recomendación final

| Decisión | Opción elegida |
|---|---|
| Paquetes @dnd-kit | `@dnd-kit/core@^6.3.1` únicamente |
| Drag-to-perdido | Stateful sin optimistic update (B1) |
| Costura columnas | `useColumnasKanban()` con interfaz `ColumnaKanban` |
| Toggle lista | Extender `useTabSync` con `paramKey` opcional (D2) → `?vista=tabla` |
| Testing | Handler puro + stubs de DnD (sin simular gestos) |
| Arrastrar desde `perdido` | Solo permitir hacia `abierto` |
| Badge tareas en tarjeta | No en v1 (evita N+1) |

---

## Riesgos

1. **Testing @dnd-kit en jsdom**: Pointer Events no totalmente soportados. Mitigado con handler puro testeable en aislamiento. No se simulan gestos de drag en tests.

2. **Optimistic UI vs rollback**: Al NO usar optimistic update, la tarjeta no "salta" visualmente hasta que el servidor responde. Para el flujo modal-interrupt de `perdido`, la tarjeta no se mueve mientras el modal está abierto, lo cual es correcto. El trade-off es UX ligeramente más lenta vs seguridad de datos.

3. **Kanban como vista default**: `/tratos` ya no arranca en tabla — diverge de todos los demás listados del CRM. Aceptado explícitamente por el usuario (engram #204). Documentar en ADR.

4. **@dnd-kit peer deps con React 18**: `@dnd-kit/core@^6` tiene peerDep `"react": ">=16"`. Compatible con `^18.3.1`. No hay conflicto.

5. **Columna `perdido` puede acumular tarjetas**: Sin WIP limit (fuera de scope), la columna `perdido` crece indefinidamente. La vista de tabla (toggle) sirve como alternativa para trabajar con ese volumen.

6. **N+1 si se muestra badge de tareas**: Resuelto descartando badge de tareas en tarjetas kanban para v1.

7. **`useTabSync` extensión**: Cambio mínimo con alto beneficio semántico. Si se decide no extenderlo, la alternativa (usar `?tab=tabla`) es igualmente válida sin tocar ningún código existente.

---

## Listo para Propuesta

**Sí.** Todos los aspectos técnicos están resueltos:
- Paquetes y versiones definidos.
- Flujo de modal interrupt diseñado.
- Costura futura modelada.
- Estrategia de testing concreta bajo Strict TDD.
- Riesgos identificados y mitigados.

El siguiente paso es `sdd-propose` para formalizar intención, alcance y approach.
