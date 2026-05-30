# Archive Report — kanban-tareas (Change 6)

**Change**: kanban-tareas
**Archived**: 2026-05-29
**Branch**: feat/kanban-tareas (stacked on feat/kanban-crud-ui; Changes 1-6, NOT merged to main)
**Verdict**: APPROVED
**Mode**: Strict TDD (8 batches, 32 tasks)

---

## Summary

Change 6 extiende el tablero Kanban (kanban-management) para soportar `TipoTablero.TAREAS` junto a los tableros `TRATOS` existentes. La lista unificada de tableros ahora muestra ambos tipos con badge discriminador. El sistema deriva el estado de la tarea (PENDIENTE / EN_CURSO / FINALIZADA) client-side via `deriveEstadoTarea.ts`, espejo exacto de la logica de Tratos. Los componentes existentes fueron generalizados con props opcionales backward-compatible (`tipoFicha` default `'TRATO'`), preservando todos los tests de TRATOS.

---

## Test Results

| Metric | Value |
|--------|-------|
| Tests passed | 582 |
| Tests failed | 0 |
| Test files | 74 |
| Type errors kanban | 0 |
| Type errors pre-existing (contactos) | 5 |

```
Test Files  74 passed (74)
     Tests  582 passed (582)
  Start at  20:50:59
  Duration  41.11s
```

---

## Files Changed (11 src files)

### Created (2)

| File | Description |
|------|-------------|
| `src/features/kanban/lib/deriveEstadoTarea.ts` | Funcion pura que cruza `ficha.tareaId` + `columna.estadoTarea` para derivar `EstadoTarea \| null`. Espejo exacto de `deriveEstadoTrato.ts`. |
| `src/features/kanban/lib/useTareasSinFicha.ts` | Hook que cruza `useTareas()` + `useFichas()` y filtra tareas que ya tienen ficha `tipoFicha==='TAREA'`. Espejo de `useTratosSinFicha`. |

### Modified (9)

| File | Change |
|------|--------|
| `src/features/kanban/schemas/tablero.schema.ts` | Exporta `estadoTarea = z.enum(['PENDIENTE','EN_CURSO','FINALIZADA'])` y tipo `EstadoTarea`. `columnaTableroSchema` usa enum tipado. |
| `src/features/kanban/schemas/columna.schema.ts` | `asignarColumnaSchema` refactorizado con `superRefine`: exclusividad `estadoTrato`/`estadoTarea` por `tipoTablero`; `totalValorEstimado` forzado a 0 para TAREAS. |
| `src/features/kanban/components/KanbanCard.tsx` | Prop `label?: string` opcional; backward-compatible (fallback al label de trato si no se pasa). |
| `src/features/kanban/components/KanbanColumn.tsx` | Prop `tipoFicha?: TipoFicha` (default `'TRATO'`); badge dual `estadoTarea`/`estadoTrato`; pasa `tipoFicha` a `FichaCreateDialog`. |
| `src/features/kanban/components/KanbanBoard.tsx` | Prop `tipoFicha?: TipoFicha` (default `'TRATO'`); filtra fichas por `f.tipoFicha === tipoFicha`; propaga `tipoFicha` a columnas. |
| `src/features/kanban/components/FichaForm.tsx` | Generalizado: props `tipoFicha`, `items: ItemSinFicha[]`; campo RHF renombrado `tratoId` → `entidadId`; label/placeholder dinamico por tipo. |
| `src/features/kanban/components/FichaCreateDialog.tsx` | Prop `tipoFicha?: TipoFicha` (default `'TRATO'`); resuelve items via `useTareasSinFicha` o `useTratosSinFicha`; mapea body `tareaId`/`tratoId` segun tipo. |
| `src/features/kanban/pages/KanbanListPage.tsx` | Elimina filtro `tipoTablero === 'TRATOS'`; renderiza todos los tableros; badge `tablero.tipoTablero` por card. |
| `src/features/kanban/pages/KanbanPage.tsx` | Lee `tablero.tipoTablero`; pasa `tipoFicha` derivado a `KanbanBoard`; form asignar columna: selector de estado condicional, `totalValorEstimado` oculto/fijo a 0 para TAREAS. |

### Test fixtures (1 additional)

| File | Description |
|------|-------------|
| `src/features/kanban/__tests__/mocks/fixtures/tableros.ts` | Fixtures de tablero TAREAS con columnas `estadoTarea` para tests de integracion. |

---

## Spec Sync

| Metric | Before (Change 5) | After (Change 6) |
|--------|-------------------|------------------|
| Requirements | 12 | 15 (+3 added) |
| Scenarios | 36 | 49 (+13 net) |
| Requirements MODIFIED | — | 2 (Listar fichas del tablero, Gestionar columnas del tablero) |
| Requirements ADDED | — | 3 (Lista unificada TAREAS, Derivar estado tarea, Crear ficha tarea) |
| Requirements REMOVED | — | 0 |
| Requirements preserved | — | 12/12 (sin perdida) |

**Main spec updated**: `openspec/specs/kanban-management/spec.md`

Notable changes to the main spec:
- **Purpose** actualizado: de "Solo tableros TipoTablero.TRATOS" a "Soporta TipoTablero.TRATOS y TipoTablero.TAREAS".
- **Requirement "Listar fichas del tablero"**: filtro de tipo ahora es bidireccional (TRATO filtra TAREA, TAREA filtra TRATO); 1 scenario nuevo agregado.
- **Requirement "Gestionar columnas del tablero"**: body de asignar columna ahora requiere exclusividad `estadoTrato`/`estadoTarea` por tipo; 2 scenarios nuevos (TAREAS-specific + validacion exclusividad).
- **Out of Scope** actualizado: eliminado "Tableros TipoTablero.TAREAS (futuro Change)" — ya implementado.

---

## Compliance Summary

| Metric | Value |
|--------|-------|
| Scenarios COMPLIANT | 16/18 |
| Scenarios PARTIAL | 2/18 |
| Scenarios MISSING | 0/18 |
| CRITICAL issues | 0 |
| WARNING issues | 1 (pre-existing contactos type errors) |
| SUGGESTIONS | 2 |

**Partial scenarios** (limitacion estructural jsdom/Radix — comportamiento implementado y verificado estaticamente):
1. Error 422 end-to-end desde dialog (Radix+Dialog pointer-events:none en jsdom)
2. Toast mensaje especifico en error 409 de quitar columna

---

## Deferred Debts

### WARNING — pre-existing (no bloqueante)

**5 errores TypeScript en `src/features/contactos/__tests__/`** — todos pre-existentes al Change 6, cero relacion con kanban:

| File | Error |
|------|-------|
| `ComoNosConocioInput.test.tsx(2,18)` | TS6133: 'screen' unused |
| `ContactoForm.test.tsx(93,23)` | TS2532: possibly undefined |
| `ContactosTable.test.tsx(79,21)` | TS6133: 'onDelete' unused |
| `ContactosTable.test.tsx(83,22)` | TS2345: HTMLElement\|undefined not assignable |
| `EstadoRelacionSelect.test.tsx(136,11)` | TS6133: 'razonEl' unused |

Accion recomendada: limpiar en un change separado (contactos-type-cleanup).

### SUGGESTION — E2E coverage

1. **Error 422 end-to-end desde dialog**: Considerar Playwright smoke test para validar el flujo completo FichaCreateDialog TAREA con respuesta 422 del back. La limitacion es jsdom + Radix Dialog pointer-events.

2. **Toast 409 en quitar columna**: Agregar spy en Sonner para verificar el mensaje especifico de "columna con fichas" vs mensaje generico 422.

---

## SDD Cycle Completion

| Phase | Status |
|-------|--------|
| Explore | Done |
| Propose | Done |
| Spec (delta) | Done |
| Design | Done |
| Tasks | Done (32/32) |
| Apply | Done (8 batches, Strict TDD) |
| Verify | APPROVED |
| Archive | Done (2026-05-29) |

Change 6 `kanban-tareas` completado. Siguiente cambio disponible: `feat/kanban-tareas` listo para PR o merge a `feat/kanban-crud-ui`.
