# Verify Report — kanban-tratos (Change 7)

**Fecha**: 2026-05-25
**Verificado por**: orquestador (inline; el sub-agente sdd-verify chocó con el límite de sesión sin persistir).
**Suite**: `pnpm test:run` → **283 passed / 0 failed (61 archivos)** — re-verificado por el orquestador.

## Veredicto: PASS WITH WARNINGS

La implementación es funcionalmente correcta, está completamente cubierta por tests (Strict TDD, RED-first) y es fiel a los ADRs 055-061. NO hay defectos de runtime. Sin embargo, existe **drift de contrato entre el delta spec y la implementación** que DEBE reconciliarse antes de `sdd-archive` (porque archive sincroniza el delta al spec permanente; archivar como está dejaría el spec mintiendo sobre la API real).

---

## CRITICAL
Ninguno.

## WARNING (real)

### W1 — Drift de contrato en `resolverDragEnd` (spec vs implementación)
El spec (`specs/tratos-kanban/spec.md`, requirement "Función pura resolverDragEnd") describe:
- Firma: `resolverDragEnd(activeId, overId, columnas)` (3 args)
- Retorno: string union `'noop' | 'ganar' | 'reabrir' | 'modal-perder'`

La implementación real (`src/features/tratos/hooks/resolverDragEnd.ts`) es:
- Firma: `resolverDragEnd(tratoId, estadoOrigen, estadoDestino, columnas, nombre)` (5 args)
- Retorno: discriminated union `AccionDrag` = `{accion:'ignorar'} | {accion:'ganar',tratoId} | {accion:'reabrir',tratoId} | {accion:'abrir-modal-perder',tratoId,nombre}`

**Causa raíz**: el spec se escribió ANTES de que `sdd-design` resolviera la "open question" de la firma (pasar `estadoOrigen` explícito y usar discriminated union, ADR-061). La implementación siguió correctamente el design; el spec quedó desactualizado.
**Impacto**: nulo en runtime (la semántica de los escenarios se cumple: misma columna → ignorar, abierto→ganado → ganar, ganado→perdido → modal, perdido→ganado → ignorar). El riesgo es que `sdd-archive` fije un spec permanente incorrecto.
**Acción**: actualizar el requirement y sus escenarios en el spec para reflejar la firma de 5 args + `AccionDrag` (renombrar `'noop'`→`'ignorar'`, `'modal-perder'`→`'abrir-modal-perder'`). Es edición de documento, no de código.

## WARNING (menor)

### W2 — Nombre de componente: spec dice `TratosKanban`, código dice `KanbanBoard`
El delta `tratos-management` referencia el componente como `TratosKanban`; la implementación lo llama `KanbanBoard`. Comportamiento idéntico, solo difiere el nombre. Reconciliar el spec a `KanbanBoard` (o aceptar el alias) antes de archivar.

## SUGGESTION

- **S1 — a11y de teclado**: `KeyboardSensor` está presente (ADR-055) pero sin `sortableKeyboardCoordinates` (`@dnd-kit/sortable` no instalado, core-only). Conviene validar manualmente que mover una tarjeta entre columnas por teclado funciona; si no, evaluar un coordinateGetter sin sumar sortable.
- **S2 — cast redundante**: en `KanbanBoard.tsx:112`, `handleDragEnd as (event: DragEndEvent) => void` es innecesario — `crearManejadorDragEnd` ya retorna exactamente ese tipo. Quitar el cast.
- **S3 — cobertura a confirmar**: el escenario "Error en mutación (PATCH /ganar 500) no mueve la tarjeta + toast" (spec línea 155) — confirmar que tiene un test dedicado a nivel board, no solo la cobertura del hook de mutación.

---

## Fidelidad de ADRs (verificada contra el código)

| ADR | Decisión | Estado |
|-----|----------|--------|
| 055 | @dnd-kit/core only (sin sortable) + PointerSensor(8px) + KeyboardSensor | ✅ KanbanBoard.tsx:51-56 |
| 056 | Kanban como vista default en /tratos | ✅ TratosListPage (useTabSync fallback='kanban') |
| 057 | useTabSync paramKey backward-compatible | ✅ useTabSync.ts (5 tests viejos verdes) |
| 058 | Drag-to-perdido modal-interrupt, SIN optimistic update | ✅ KanbanBoard.tsx (pendingDrag; mutaciones sin movimiento local) |
| 059 | Seam useColumnasKanban; detección modal vía requiereModal, no hardcodea 'perdido' | ✅ resolverDragEnd.ts:49, useColumnasKanban.ts |
| 060 | Reglas terminales; requiereModal tiene precedencia (ganado→perdido abre modal) | ✅ resolverDragEnd.ts:46-57 |
| 061 | resolverDragEnd pura; seam de testing removido | ✅ función pura; sin prop onHandleDragEndReady en KanbanBoard |
| 043 | Perder trato exige motivo vía modal (no PATCH directo) | ✅ drag a perdido → TratoPerderDialog → /perder |

## Homologación
- ✅ Filtros aplican a kanban Y tabla (KanbanBoard recibe `filters` prop → useTratos(filters)).
- ✅ Reabrir usa `PATCH /tratos/:id` con `{estado:'abierto', motivo_perdida:null}` (homologado con TratoEstadoMenu).
- ✅ Backward compat de useTabSync (TratoDetailPage/ClienteDetailPage siguen con ?tab=).

## Cobertura de requirements (alto nivel)
| Requirement | Tests |
|-------------|-------|
| Board 3 columnas + WIP + error | KanbanBoard.test.tsx |
| Distribución + filtros en kanban | KanbanBoard.test.tsx, TratosListPage.test.tsx |
| resolverDragEnd (pura) | resolverDragEnd.test.ts |
| Reglas terminales / dispatch | crearManejadorDragEnd.test.ts |
| Drag-to-perdido modal-interrupt | TratoPerderDialog.test.tsx, crearManejadorDragEnd.test.ts |
| Seam useColumnasKanban | useColumnasKanban.test.ts |
| Fixtures ganado/perdido | KanbanBoard.test.tsx |
| Toggle vista (default kanban) | TratosListPage.test.tsx |
| useTabSync paramKey + backward compat | useTabSync.test.tsx |

## Recomendación
Reconciliar W1 (y W2) en el spec ANTES de `sdd-archive`. S1-S3 pueden quedar como follow-up o limpiarse ahora (S2 es trivial).
