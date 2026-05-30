# Verification Report — kanban-tareas (Change 6)

**Change**: kanban-tareas  
**Version**: N/A (delta spec over Change 5 base)  
**Mode**: Strict TDD  
**Verified**: 2026-05-30  
**Verdict**: APPROVED

---

## Completeness

| Metric | Value |
|--------|-------|
| Tasks total | 29 (tasks 1.1–8.2 across 8 batches) |
| Tasks complete | 29 |
| Tasks incomplete | 0 |

All 8 batches fully checked off in `tasks.md`. No orphaned tasks.

---

## Build & Tests Execution

**Tests**: 582 passed / 0 failed / 0 skipped  
**Test files**: 74 passed (74)  
**Exit code**: 0

```
Test Files  74 passed (74)
     Tests  582 passed (582)
  Start at  20:50:59
  Duration  41.11s
```

**Type-check**: exit code 2 — 5 errors (ALL pre-existing in `src/features/contactos/__tests__/`, zero in kanban)

```
src/features/contactos/__tests__/ComoNosConocioInput.test.tsx(2,18): TS6133 'screen' unused
src/features/contactos/__tests__/ContactoForm.test.tsx(93,23): TS2532 possibly undefined
src/features/contactos/__tests__/ContactosTable.test.tsx(79,21): TS6133 'onDelete' unused
src/features/contactos/__tests__/ContactosTable.test.tsx(83,22): TS2345 HTMLElement|undefined not assignable
src/features/contactos/__tests__/EstadoRelacionSelect.test.tsx(136,11): TS6133 'razonEl' unused
```

Zero TypeScript errors in any kanban file.

**Coverage**: Not configured — Not available.

---

## TDD Compliance

| Task | RED | GREEN | Triangulation | Notes |
|------|-----|-------|---------------|-------|
| 1.1 schemas | Yes | Yes | 14 schema cases | asignarColumnaSchema superRefine |
| 2.1 deriveEstadoTarea | Yes | Yes | 7 unit cases | Pure function tested |
| 2.3 useTareasSinFicha | Yes | Yes | 4 integration cases | MSW+hook |
| 3.1 KanbanCard label | Yes | Yes | 4 cases | Backward-compat preserved |
| 4.1–4.3 FichaForm/Dialog | Yes | Yes | 7+8 cases | entidadId rename done |
| 5.1 KanbanColumn badge | Yes | Yes | 5 new cases | Badge dual PENDIENTE/EN_CURSO/FINALIZADA |
| 5.3 KanbanBoard tipoFicha | Yes | Yes | 2 new cases | Filter by type |
| 6.1 KanbanPage TAREAS | Yes | Yes | 3 cases (k,l,m) | selector/hidden field/schema |
| 7.1 KanbanListPage unified | Yes | Yes | 3 cases (b,b2,b3) | Lista unificada + badges |

---

## Spec Compliance Matrix

### ADDED: Listar tableros de tipo TAREAS en lista unificada con badge

| Scenario | Test | Layer | Result |
|----------|------|-------|--------|
| Lista unificada muestra ambos tipos con badge | `KanbanPage.test.tsx > KanbanListPage - lista unificada TRATOS+TAREAS > (b) AHORA muestra tableros de tipo TAREAS`, `(b2) badge TRATOS`, `(b3) badge TAREAS` | Integration | COMPLIANT |
| Lista vacia muestra empty state | `KanbanPage.test.tsx > (c) empty state cuando no hay tableros` | Integration | COMPLIANT |

### ADDED: Derivar estado de la tarea desde la columna

| Scenario | Test | Layer | Result |
|----------|------|-------|--------|
| Estado PENDIENTE se deriva correctamente | `deriveEstadoTarea.test.ts > estados válidos > retorna PENDIENTE...` | Unit | COMPLIANT |
| Estado EN_CURSO se deriva correctamente | `deriveEstadoTarea.test.ts > estados válidos > retorna EN_CURSO...` | Unit | COMPLIANT |
| Estado FINALIZADA se deriva correctamente | `deriveEstadoTarea.test.ts > estados válidos > retorna FINALIZADA...` | Unit | COMPLIANT |
| Tarea sin ficha no tiene estado derivado | `deriveEstadoTarea.test.ts > edge cases > retorna null cuando la tarea no tiene ninguna ficha` | Unit | COMPLIANT |

### ADDED: Crear ficha de tarea

| Scenario | Test | Layer | Result |
|----------|------|-------|--------|
| Selector de tarea solo muestra tareas sin ficha | `useTareasSinFicha.test.ts > tareas con ficha TAREA activa quedan excluidas` | Integration | COMPLIANT |
| Creacion exitosa envia tipoFicha TAREA con tareaId | `FichaCreateDialog.test.tsx > body mapping > (e) body TAREA: tipoFicha=TAREA, tareaId relleno, tratoId=null` + `(g) query fichas invalidada` | Integration | COMPLIANT |
| tareaId requerido para ficha de tipo TAREA | `FichaForm.test.tsx > entidadId requerido > (f) enviar sin seleccionar entidadId muestra error` | Component | COMPLIANT |
| Error 422 del back muestra serverError en campo | `FichaForm.test.tsx > serverErrors > (g) serverErrors con field entidadId muestra el mensaje` | Component | PARTIAL — tests validan serverErrors en el campo generico `entidadId` pero no cubren el flujo MSW 422 end-to-end desde el dialog (Radix+Dialog pointer-events:none limitacion jsdom documentada). Comportamiento de remapping `tareaId`→`entidadId` implementado en FichaCreateDialog y verificado por codigo. |

### MODIFIED: Listar fichas del tablero

| Scenario | Test | Layer | Result |
|----------|------|-------|--------|
| Fichas se distribuyen en sus columnas correctas | `KanbanBoard.test.tsx > render > (g) ficha aparece en su columna correcta` | Integration | COMPLIANT |
| Fichas de tipo TAREA no aparecen en tablero TRATOS | `KanbanBoard.test.tsx > render > (h) fichas con tipoFicha TAREA no aparecen en el tablero` | Integration | COMPLIANT |
| Fichas de tipo TRATO no aparecen en tablero TAREAS | `KanbanBoard.test.tsx > Batch 5 > (j) con tipoFicha='TAREA' solo muestra fichas de tipo TAREA` | Integration | COMPLIANT |
| Orden de fichas es por creadoEn ascendente | `KanbanColumn.test.tsx > fichas children > (l) orden de fichas es por creadoEn ASC` | Component | COMPLIANT |

### MODIFIED: Gestionar columnas del tablero

| Scenario | Test | Layer | Result |
|----------|------|-------|--------|
| Asignar columna valida limiteWip >= 1 | `schemas.test.ts > asignarColumnaSchema > rechaza limiteWip: 0` + `KanbanPage.test.tsx > (i) asignarColumnaSchema rechaza limiteWip=0` | Unit+Integration | COMPLIANT |
| Asignar columna en tablero TRATOS envia estadoTrato | `KanbanPage.test.tsx > (j) asignar columna success invoca POST asignar-columna` + `schemas.test.ts > TRATOS: acepta estadoTrato ABIERTO sin estadoTarea` | Integration | COMPLIANT |
| Asignar columna en tablero TAREAS envia estadoTarea y totalValorEstimado=0 | `KanbanPage.test.tsx > (m) asignarColumnaSchema para TAREAS requiere estadoTarea y totalValorEstimado=0` + `KanbanPage.test.tsx > (k) tablero TAREAS muestra selector estadoTarea` | Integration | COMPLIANT |
| Enviar estadoTarea=null en tablero TAREAS no se permite | `schemas.test.ts > TAREAS: rechaza si estadoTarea está ausente` + `KanbanPage.test.tsx > (m) sinEstado falla` | Unit | COMPLIANT |
| Quitar columna con fichas muestra error 409 | `KanbanColumn.test.tsx > (q) 409 en Quitar columna — botón se re-habilita tras error` | Component | PARTIAL — verifica que el hook es invocado y el boton se re-habilita; no verifica el mensaje de toast especifico de 409 vs 422. Comportamiento de toast implementado en `useQuitarColumna`. |
| Quitar columna vacia exitosa | `KanbanColumn.test.tsx > (p) clic en "Quitar columna" invoca DELETE eliminar-columna con tableroId y columnaId correctos` | Integration | COMPLIANT |

**Compliance summary**: 16/18 scenarios COMPLIANT, 2/18 PARTIAL, 0/18 MISSING.

---

## Correctness (Static — Invariantes del Back)

| Invariante | Status | Evidence |
|------------|--------|----------|
| estadoTarea/estadoTrato exclusividad + requerido por tipo | COMPLIANT | `asignarColumnaSchema.superRefine` en `columna.schema.ts` enforza exclusividad exacta. Probado en `schemas.test.ts` (7 casos de exclusividad). |
| totalValorEstimado=0 forzado y oculto para TAREAS | COMPLIANT | `KanbanPage.tsx` oculta el campo con `{!esTareas && ...}` y fija `totalValorEstimado: 0` en submit. Probado en tests (l) y (m). |
| Ficha TAREA: tareaId presente, tratoId=null | COMPLIANT | `FichaCreateDialog.tsx` construye body con `tratoId: null` para TAREA. Test (e) verifica el body exacto. |
| creadoPor = MOCK_USER_ID | COMPLIANT | `mockUser.ts` exporta `'00000000-0000-0000-0000-000000000001'`. Usado en `FichaCreateDialog.tsx`. Test (e) verifica `creadoPor` en el body capturado. |
| responsableId = useUsuarios() | COMPLIANT | `FichaForm.tsx` usa `useUsuarios()` para el selector de responsable. `FichaForm.test.tsx` mockea el endpoint `/api/usuarios/get-all`. |
| Modelo Tarea SIN campo estado | COMPLIANT | `deriveEstadoTarea.ts` es la fuente del estado derivado. `Tarea` type no tiene campo `estado`. |
| tipoFicha filtrado por tipo de tablero | COMPLIANT | `KanbanBoard.tsx` filtra `fichas.filter(f => f.tipoFicha === tipoFicha)`. KanbanPage filtra adicionalmente `fichasFiltradas` antes de pasar a KanbanBoard. |

---

## Coherence (Design)

| Decision | Followed | Notes |
|----------|----------|-------|
| D1 — Solo hojas: props opcionales backward-compatible | YES | `tipoFicha` default `'TRATO'` en KanbanBoard, KanbanColumn, FichaCreateDialog. Tests de backward-compat verdes (h→k en KanbanColumn). |
| D2 — deriveEstadoTarea espejo exacto | YES | Firma identica al design doc. Implementado en `kanban/lib/deriveEstadoTarea.ts`. |
| D3 — useTareasSinFicha client-side | YES | Espejo de useTratosSinFicha. Sin endpoint adicional al back. |
| D5 — Un asignarColumnaSchema + superRefine | YES | `columna.schema.ts` implementa exactamente el schema del design doc. |
| Discriminador en Pagina | YES | KanbanPage detecta `tablero.tipoTablero` y pasa `tipoFicha` hacia abajo. Componentes hoja no infieren el tipo. |
| FichaForm campo entidadId generico | YES | Renombrado de `tratoId` a `entidadId`. Parent remapea a `tratoId`/`tareaId`. |
| KanbanPage submit sin tipoTablero | YES | Submit construye body condicional sin el discriminador `tipoTablero`. |

### File Changes — todos los archivos del design implementados:

| File | Expected Action | Actual |
|------|----------------|--------|
| `kanban/lib/deriveEstadoTarea.ts` | Create | DONE |
| `kanban/lib/useTareasSinFicha.ts` | Create | DONE |
| `kanban/schemas/tablero.schema.ts` | Modify | DONE — estadoTarea enum + EstadoTarea type |
| `kanban/schemas/columna.schema.ts` | Modify | DONE — asignarColumnaSchema + superRefine |
| `kanban/components/KanbanCard.tsx` | Modify | DONE — label prop opcional |
| `kanban/components/KanbanColumn.tsx` | Modify | DONE — tipoFicha + badge dual + label |
| `kanban/components/KanbanBoard.tsx` | Modify | DONE — tipoFicha + filtro |
| `kanban/components/FichaForm.tsx` | Modify | DONE — tipoFicha + items + entidadId |
| `kanban/components/FichaCreateDialog.tsx` | Modify | DONE — tipoFicha + body mapping |
| `kanban/pages/KanbanListPage.tsx` | Modify | DONE — lista unificada + badge |
| `kanban/pages/KanbanPage.tsx` | Modify | DONE — tipoTablero detect + tipoFicha passthrough |

---

## Issues Found

**CRITICAL** (must fix before archive):
None.

**WARNING** (should fix):
1. **type-check exit code != 0**: `pnpm type-check` exits with code 2 due to 5 pre-existing errors in `src/features/contactos/__tests__/`. These are NOT introduced by this change (verified: zero kanban errors). However, the project technically has a failing type-check gate. These should be cleaned up in a separate fix.

**SUGGESTION**:
1. **Error 422 escenario parcial**: El scenario "Error 422 del back muestra serverError en campo" tiene cobertura de componente (`FichaForm.test.tsx (g)`) pero no integration-level end-to-end desde el dialog con MSW. La limitacion es estructural (Radix Select + Dialog en jsdom no soporta pointer-events). El comportamiento esta correctamente implementado en FichaCreateDialog (remapping `tareaId`/`tratoId` → `entidadId`). Considerar un test de smoke manual o un E2E (Playwright) si se quiere garantia de integración completa.

2. **Scenario "Quitar columna 409 muestra mensaje claro"**: El test (q) verifica que el boton se re-habilita pero no el mensaje visual de toast. El behavior esta implementado en `useQuitarColumna` con `toast.error`. Agregar un test de toast si se usa el patron de spy en Sonner.

---

## Verdict

**APPROVED**

582/582 tests passed. 0 errores TypeScript en kanban. Los 5 errores de type-check son pre-existentes en contactos y no relacionados con este change. 16/18 scenarios COMPLIANT, 2/18 PARTIAL (limitaciones estructurales de jsdom con Radix+Dialog, comportamiento implementado y verificado estaticamente). Todos los invariantes del back respetados. Todos los archivos del design implementados. Backward-compatibility preservada (tests de TRATOS siguen verdes).
