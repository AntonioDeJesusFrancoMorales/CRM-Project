# Proposal: Kanban de Tratos (Change 7)

**Change**: `kanban-tratos`
**Fecha**: 2026-05-25
**Artifact store**: hybrid

---

## Intent

Agregar una vista kanban de tratos a `/tratos` como vista primaria (default), con soporte de drag-and-drop para cambiar el estado del trato entre columnas. El usuario puede visualizar su pipeline como tablero y ejecutar transiciones de estado directamente arrastrando tarjetas — incluyendo el flujo modal obligatorio al marcar como `perdido` (ADR-043 aplicado a DnD).

---

## Scope

### In Scope

- Instalación de `@dnd-kit/core@^6.3.1` (única dependencia nueva).
- `TratosKanban` y `TratosKanbanCard`: tablero de 3 columnas (`abierto / ganado / perdido`) con DnD.
- Toggle Tabla↔Kanban en `/tratos` vía `useTabSync` con `paramKey='vista'`; kanban es la vista por defecto (URL limpia = kanban; `?vista=tabla` = tabla).
- Extensión backward-compatible de `useTabSync` con argumento `paramKey` opcional (ADR-045 update).
- `useColumnasKanban()`: seam de columnas tipado con `ColumnaKanban` (hoy hardcodeado del enum, aditivo para config futura).
- `resolverDragEnd()`: función pura que mapea `(activeId, overId, columnas)` → acción (`'noop' | 'ganar' | 'reabrir' | 'modal-perder'`).
- Flujo drag-to-perdido: abre `TratoPerderDialog` (sin modificaciones al componente); si cancela, tarjeta revierte; confirmar → PATCH; sin optimistic update.
- Reglas de terminales: `ganado` → `abierto` permitido (reabrir); `perdido` → `abierto` permitido; `perdido` → `ganado` deshabilitado.
- WIP counters por columna en el header.
- Filtros del listado homologados en la vista kanban (mismos filtros que la tabla).
- Fixtures de tratos: agregar ≥1 trato en `ganado` y ≥1 en `perdido`.
- Tests bajo Strict TDD: `resolverDragEnd` como función pura, estructura de columnas y distribución de tarjetas, flujo modal interrupt.

### Out of Scope

- Kanban de Tareas (Change 8).
- Etapas configurables por instancia / multi-tenancy (change futuro).
- Orden manual de tarjetas dentro de columnas (requiere campo `orden`; v1 = agrupación por estado solamente).
- Badge de tareas pendientes en tarjetas kanban (evita N+1 query; ya existe en la detail page).
- `TratoEstadoMenu` en la tarjeta (v1: click navega al detalle).
- WIP limits.
- Analytics / pipeline metrics.

---

## Capabilities

### New Capabilities

- `tratos-kanban`: Vista kanban drag-and-drop de tratos con transiciones de estado; seam `getColumnasKanban`; flujo modal-interrupt para `perdido`.

### Modified Capabilities

- `tratos-management`: Extensión de `TratosListPage` con toggle de vista; extensión de `useTabSync` con `paramKey`; fixtures adicionales.

---

## Approach

### Vista toggle en `/tratos`

`TratosListPage` incorpora `useTabSync(['kanban', 'tabla'], 'kanban', 'vista')`. La URL limpia renderiza el kanban; `?vista=tabla` renderiza la tabla existente. El hook se extiende con un tercer argumento opcional `paramKey = 'tab'` — cambio de 3 líneas, backward compatible.

### Componentes kanban

```
TratosKanban
 ├── useColumnasKanban()          → 3 ColumnaKanban structs
 ├── useTratos(filters)           → tratos filtrados (query existente)
 ├── DndContext (onDragEnd)
 │    ├── KanbanColumna × 3       → useDroppable(columna.id)
 │    │    └── TratosKanbanCard × N → useDraggable(trato.id)
 │    └── resolverDragEnd()        → función pura
 └── TratoPerderDialog            → montado en TratosKanban, controlado por pendingDrag
```

### Flujo drag-to-perdido (sin optimistic update)

`onDragEnd` llama `resolverDragEnd()`. Si retorna `'modal-perder'`: guarda `pendingDrag={tratoId, nombre}` y abre `TratoPerderDialog`. La tarjeta no se mueve en la UI hasta que el servidor confirme (el kanban deriva su estado de `useTratos()`). Cancelar limpia `pendingDrag` sin PATCH; confirmar → `usePerderTrato` invalida el query y la tarjeta aparece en `perdido`.

### Seam `useColumnasKanban`

```ts
interface ColumnaKanban {
  id: EstadoTrato; label: string; color: string;
  esTerminal: boolean; requiereModal: boolean;
}
```

`requiereModal: true` en `perdido` desacopla la lógica de dispatch del componente. En el futuro, este hook puede hacer `useQuery` a un endpoint de etapas configuradas sin cambiar `TratosKanban`.

### Testing bajo Strict TDD

1. `resolverDragEnd`: función pura → tests unitarios sin render (todos los casos: noop, ganar, reabrir, modal-perder, drop en mismo estado, terminal-a-terminal prohibido).
2. `TratosKanban` estructura: render con MSW → verificar 3 columnas, WIP counters, tarjetas en columna correcta.
3. Flujo modal interrupt: simular `handleDragEnd` con `over.id='perdido'` → verificar `open=true`; confirmar → verificar mutación; cancelar → verificar noop.
4. `useTabSync` con `paramKey` personalizado: extender tests existentes del hook.

---

## Affected Areas

| Área | Impacto | Descripción |
|------|---------|-------------|
| `src/features/tratos/pages/TratosListPage.tsx` | Modified | Toggle kanban↔tabla con `useTabSync` + `paramKey='vista'` |
| `src/features/tratos/components/TratosKanban.tsx` | New | Tablero principal con DnD y estado de pendingDrag |
| `src/features/tratos/components/TratosKanbanCard.tsx` | New | Tarjeta draggable |
| `src/features/tratos/hooks/useColumnasKanban.ts` | New | Seam de columnas tipado |
| `src/features/tratos/hooks/resolverDragEnd.ts` | New | Función pura de resolución de acción por drop |
| `src/lib/useTabSync.ts` | Modified | Tercer argumento `paramKey` opcional (default `'tab'`) |
| `src/mocks/fixtures/tratos.ts` | Modified | +1 fixture `ganado`, +1 fixture `perdido` |
| `src/features/tratos/__tests__/TratosKanban.test.tsx` | New | Tests kanban: estructura, distribución, modal-interrupt |
| `src/features/tratos/__tests__/resolverDragEnd.test.ts` | New | Tests unitarios función pura |
| `src/lib/__tests__/useTabSync.test.ts` | Modified | Tests de `paramKey` personalizado |
| `package.json` | Modified | `@dnd-kit/core@^6.3.1` |

---

## New ADRs Proposed

| # | Título |
|---|--------|
| ADR-055 | `@dnd-kit/core` como librería de drag-and-drop (solo core, sin sortable) |
| ADR-056 | Kanban como vista primaria de `/tratos` (divergencia explícita de homologación) |
| ADR-057 | Extensión de `useTabSync` con `paramKey` opcional (actualiza ADR-045) |
| ADR-058 | Drag-to-perdido interrumpido por `TratoPerderDialog` sin optimistic update |
| ADR-059 | `useColumnasKanban()` como seam para etapas configurables futuras |
| ADR-060 | Reglas de drop para columnas terminales en el kanban |
| ADR-061 | `resolverDragEnd()` como función pura para viabilidad de testing bajo Strict TDD |

---

## Risks

| Riesgo | Prob | Mitigación |
|--------|------|-----------|
| DnD gestos no simulables en jsdom | Alta | `resolverDragEnd()` pura + stubs; no se simulan gestos reales |
| Tarjeta "regresa" visualmente al cancelar perdido | Media | Comportamiento aceptado y documentado; sin optimistic update es la norma |
| Kanban como default rompe expectativa de tabla | Baja | Aceptado explícitamente por el usuario; ADR-056 lo documenta |
| `@dnd-kit/core@^6` peerDep con React 18 | Baja | Verificado compatible (`peerDep "react": ">=16"`); no requiere React 19 |
| Columna `perdido` crece sin WIP limit | Baja | Toggle a vista tabla disponible para trabajar con volumen alto |
| N+1 si se agrega badge de tareas | N/A | Descartado en v1; badge solo en detail page |

---

## Rollback Plan

1. Revertir `package.json` + `pnpm-lock.yaml` (eliminar `@dnd-kit/core`).
2. Revertir `TratosListPage.tsx` a la versión sin toggle (git revert del commit).
3. Revertir `useTabSync.ts` al original (una línea cambiada).
4. Eliminar los nuevos archivos: `TratosKanban.tsx`, `TratosKanbanCard.tsx`, `useColumnasKanban.ts`, `resolverDragEnd.ts` y sus tests.
5. La tabla de tratos existente permanece intacta en todo momento — es la vista de fallback.

---

## Dependencies

- `@dnd-kit/core@^6.3.1` (no instalado aún).
- Change 6a (`tratos-management`) y Change 6b (`tareas-management`) deben estar mergeados — ambos están en main.

---

## Success Criteria

- [ ] `/tratos` (sin query params) renderiza el kanban con 3 columnas: Abierto, Ganado, Perdido.
- [ ] Arrastrar una tarjeta a otra columna dispara PATCH y la tarjeta aparece en la nueva columna tras `onSuccess`.
- [ ] Arrastrar a `perdido` abre `TratoPerderDialog`; cancelar revierte; confirmar actualiza columna.
- [ ] Arrastrar desde `perdido` a `ganado` no está permitido (drop ignorado).
- [ ] WIP counter de cada columna refleja el conteo correcto.
- [ ] Los filtros del listado funcionan igual en vista kanban y en vista tabla.
- [ ] `?vista=tabla` muestra la `TratosTable` existente sin regresiones.
- [ ] `pnpm test:run` pasa con ≥233 tests (baseline) + nuevos tests del kanban.
- [ ] `resolverDragEnd` tiene cobertura de todos sus casos de salida.
- [ ] `useTabSync` con `paramKey` personalizado tiene test explícito y los tests existentes siguen pasando.
