# Archive Report — kanban-tablero-back (Change 4)

**Change**: kanban-tablero-back
**Archived**: 2026-05-29
**Status**: COMPLETED
**Mode**: Strict TDD

---

## Resumen del Change

Change 4 implementó el tablero Kanban de Tratos alineado al contrato real del back AR-CRM. El estado del ciclo de vida del Trato (`ABIERTO | GANADO | PERDIDO`) se deriva client-side de la columna donde se encuentra la Ficha — no es un campo del modelo Trato. Se implementó también el fix W1: la validación de transición a `INACTIVO` en `ContactoDetailPage` ahora usa `deriveEstadoTrato` correctamente en lugar de `trato.estado` (campo que no existe).

---

## Decisiones Clave

1. **Estado del Trato es derivado, nunca almacenado**: `TratoResponse` no tiene campo `estado`. La derivación cruza `ficha.tratoId → columna.estadoTrato`. Función pura `deriveEstadoTrato(tratoId, fichas, columnas)` exportada como primitiva reutilizable (usada en Kanban y en W1 de ContactoDetailPage).

2. **DnD solo entre columnas**: `buildDragEndHandler` como función pura exportada — testeable sin DOM. Guard `if (ficha.columnaId === columnaDestinoId) return;` garantiza no-op idempotente.

3. **Feature-flat `src/features/kanban/`**: Estructura `schemas/hooks/components/pages/__tests__/lib/` siguiendo ADR-040.

4. **Rutas RPC `?id=` (no REST `/:id`)**: `endpoints.ts` centraliza todas las URLs. Handlers MSW usan `searchParams.get`.

5. **`asignar-columna` (no `agregar-columna`)**: El endpoint `@Deprecated` fue explícitamente evitado con guard en comentario.

6. **`useReordenarColumnas` valida permutación completa** (post-verify C1): 4 guards — vacío, length distinto, duplicados (Set size), ids ajenos (Set containment). Si alguno falla → `Promise.reject` sin HTTP.

7. **Cache compartida `['fichas']`**: `useFichas()` reutilizada en Kanban y en ContactoDetailPage (W1).

---

## Números Reales (verificados en archive)

| Métrica | Valor |
|---------|-------|
| Tests | **485/485 verdes** — 70 archivos |
| Type-check errores propios Change 4 | **0** |
| Type-check errores pre-existentes | **5** (ruido heredado de Change 2 — contactos) |
| Tasks completadas | **52/52** (B1–B9 + C1 + C2) |
| Scenarios COMPLIANT | 31/36 |
| Scenarios PARTIAL (sin UI implementada) | 5/36 |

Errores pre-existentes confirmados (fuera del alcance de Change 4):
- `src/features/contactos/__tests__/ComoNosConocioInput.test.tsx(2,18)`: TS6133 'screen' unused
- `src/features/contactos/__tests__/ContactoForm.test.tsx(93,23)`: TS2532 possibly undefined
- `src/features/contactos/__tests__/ContactosTable.test.tsx(79,21)`: TS6133 'onDelete' unused
- `src/features/contactos/__tests__/ContactosTable.test.tsx(83,22)`: TS2345 HTMLElement|undefined
- `src/features/contactos/__tests__/EstadoRelacionSelect.test.tsx(136,11)`: TS6133 'razonEl' unused

---

## Correcciones Post-Verify

### C1 — useReordenarColumnas: validación de permutación completa

**Problema verificado**: el guard solo validaba `nuevoOrden.length === 0`. El spec exige permutación EXACTA.

**Archivos modificados**:
- `src/features/kanban/hooks/useReordenarColumnas.ts` — nueva firma con `idsActuales: string[]`; 4 guards
- `src/features/kanban/__tests__/hooks.write.test.ts` — tests existentes actualizados + 4 tests nuevos RED→GREEN

### C2 — ContactoDetailPage: test edge W1 faltante

**Problema verificado**: faltaba el scenario "INACTIVO habilitado si tratos no tienen ficha".

**Archivos modificados**:
- `src/features/contactos/__tests__/ContactoDetailPage.test.tsx` — test nuevo con fichas vacías

---

## Specs Sincronizados

| Dominio | Acción | Detalles |
|---------|--------|----------|
| `kanban-management` | **CREADO** | Spec nuevo (10 requirements, 24+ scenarios). Capability inexistente antes de este change. Incluye 4 scenarios adicionales para validación de permutación completa en `useReordenarColumnas`. |
| `tratos-management` | **ACTUALIZADO** | 1 requirement ADDED: "Estado del trato derivado de la columna Kanban" (5 scenarios). Actualizado `Out of Scope` (referencia a Change 4 eliminada; DnD aclarado como exclusivo del Kanban). |
| `contactos-management` | **ACTUALIZADO** | 1 requirement MODIFIED: "Validacion client-side de transiciones de estadoRelacion". Bloqueo 2 corregido (`trato.estado` → `deriveEstadoTrato`). Scenarios: 5 → 7 (agregados "todos GANADO/PERDIDO" y "sin ficha asignada"). Merge sin pérdida — todos los 5 scenarios previos están representados en los 7 nuevos. |

---

## Deudas Diferidas (Change 5 futuro)

Los siguientes items quedaron OUT OF SCOPE en este change — hooks implementados, UI pendiente:

1. **UI CRUD de fichas**: `useCreateFicha`, `useUpdateFicha`, `useDeleteFicha` están listos. Falta el formulario/diálogo de creación, edición y confirmación de eliminación de fichas desde el tablero.
2. **UI de gestión de columnas**: `useAsignarColumna`, `useReordenarColumnas` están listos. Falta la UI de asignar/quitar/reordenar columnas desde el tablero.
3. **MOCK_USER como placeholder de auth**: `responsableId: 'MOCK_USER'` en `useCreateFicha` — se debe reemplazar cuando auth entre en scope. Considerar constante exportada o tipo opaco para facilitar el find-replace.
4. **Unicidad de tablero TRATOS en W1**: `ContactoDetailPage` asume un único tablero de tipo TRATOS. Si hubiera varios, la lógica de selección del tablero correcto es un open question (documentado en `design.md §Open Questions`).
5. **Tableros `TipoTablero.TAREAS`**: Completamente out of scope.

---

## Contenido del Archive

- `proposal.md` ✅
- `explore.md` ✅
- `specs/kanban-management/spec.md` ✅
- `specs/tratos-management/spec.md` ✅
- `specs/contactos-management/spec.md` ✅
- `design.md` ✅
- `tasks.md` ✅ (52/52 tasks completas)
- `verify-report.md` ✅ (veredicto: APROBADO CON OBSERVACIONES)
- `archive-report.md` ✅ (este archivo)

---

## Archivos Principales del Change (fuente de verdad en el repo)

```
src/features/kanban/
  schemas/          tablero.schema.ts, ficha.schema.ts, columna.schema.ts
  hooks/            useTableros, useTablero, useColumnas, useFichas (lectura)
                    useCreateFicha, useUpdateFicha, useDeleteFicha (escritura)
                    useAsignarColumna, useReordenarColumnas (gestión tablero)
  components/       KanbanCard, KanbanColumn, KanbanBoard (DnD)
  pages/            KanbanListPage, KanbanPage
  lib/              deriveEstadoTrato.ts, buildDragEndHandler.ts
  __tests__/        70 archivos de test (485/485 verdes)

src/features/contactos/
  pages/ContactoDetailPage.tsx    (W1: deriveEstadoTrato integrado)
  __tests__/ContactoDetailPage.test.tsx  (W1: 3+1 tests nuevos)

src/api/
  endpoints.ts    (tableros, columnas, fichas añadidos)

src/mocks/handlers/
  tableros.ts     (29 tests MSW)

src/routes/
  router.tsx      (/tableros, /tableros/:id)
  placeholders.tsx  (TablerosPlaceholder eliminado)
```
