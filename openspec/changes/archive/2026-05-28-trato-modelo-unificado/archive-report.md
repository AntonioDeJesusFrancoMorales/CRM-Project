# Archive Report — Change 3: trato-modelo-unificado

**Change**: trato-modelo-unificado
**Archived**: 2026-05-28
**Status**: ARCHIVED

---

## Executive Summary

Change 3 (trato-modelo-unificado) ha completado su ciclo SDD: exploración → propuesta → specs → design → implementación → verificación → archivo.

**Resultado final**: 345/345 tests verdes, 0 errores TypeScript propios, Specs sincronizadas a main, Kanban eliminado. S1 y S2 resueltos antes del archivado.

**Specs sincronizadas**:
- `openspec/specs/tratos-management/spec.md` — ACTUALIZADA (delta aplicada)
- `openspec/specs/tratos-kanban/spec.md` — ELIMINADA (capability removida)

**Decisiones claves**:
1. **contactoId único** — elimina polimorfismo XOR cliente/prospecto
2. **Sin campo estado** — ciclo de vida pospuesto a Change 4
3. **Kanban removido** — `@dnd-kit`, `KanbanBoard`, `EstadoTrato`, `useColumnasKanban`
4. **RPC alignment** — endpoints camelCase plano (GET/POST/PUT/DELETE /api/tratos)
5. **Fix cross-feature** — ContactoDetailPage.tsx usa `contactoId` (W1 documentado)

---

## Specs Synced

### openspec/specs/tratos-management/spec.md

**Changes aplicados** (delta → main):
- Requirement: **Listado de tratos** — REESCRITA (sin toggle Kanban, queryKey plana `['tratos']`, sin estado badge)
- Requirement: **Filtros del listado** — REESCRITA (solo búsqueda client-side por nombre, sin filtros server-side)
- Requirement: **Hook paramétrico useTratos** — REESCRITA (sin filtros, endpoint base `/api/tratos`, `useTratosByCliente` eliminado)
- Requirement: **Crear trato** — REESCRITA (Select único `contactoId`, sin toggle XOR, valores enum: SERVICIO|LICENCIA|SUSCRIPCION|PERMANENTE|OTRO, sin campo `estado`)
- Requirement: **Editar trato** — REESCRITA (PUT en lugar de PATCH, sin toggle, sin estado)
- Requirement: **Eliminar trato** — REESCRITA (DELETE /api/tratos?id=, sin validación 409 de tareas)
- Requirement: **Detalle del trato** — REESCRITA (sin badge estado, sin acciones ganar/perder/reabrir, motivoPerdida siempre visible si != null)
- Requirement: **Invalidación de cache** — REESCRITA (solo CRUD básico, sin ganar/perder)
- ELIMINADOS:
  - Toggle vista Kanban / Tabla en /tratos (ADR-056)
  - Extensión useTabSync con paramKey (ADR-057)
  - Cambio de estado inline
  - Modal obligatorio motivo_perdida

**API Contract actualizado** (viejo vs nuevo):
- Old: GET `/api/v1/tratos?estado=&cliente_id=&prospecto_id=&responsable_id=` → New: GET `/api/tratos` (sin params)
- Old: POST `/api/v1/tratos` (XOR cliente_id/prospecto_id) → New: POST `/api/tratos` (contactoId único)
- Old: PATCH `/api/v1/tratos/:id` → New: PUT `/api/tratos?id={id}`
- Old: DELETE `/api/v1/tratos/:id` → New: DELETE `/api/tratos?id={id}`
- Removed: PATCH `/api/v1/tratos/:id/ganar`, PATCH `/api/v1/tratos/:id/perder`

**Status**: ✅ Spec sincronizada.

### openspec/specs/tratos-kanban/spec.md

**Status**: ✅ ELIMINADA (capability removida)

**Razón**: El modelo Trato ya no contiene campo `estado`. El backend no expone endpoints de ciclo de vida. La vista Kanban y toda su infraestructura (@dnd-kit, KanbanBoard/Columna/Card, `useColumnasKanban`, `resolverDragEnd`, `EstadoTrato`, fixtures con estado) se suprimen en Change 3. El ciclo de vida volverá en Change 4 si el back lo incorpora.

**Evidencia de eliminación**:
- rg: 0 hits para `KanbanBoard`, `KanbanColumna`, `EstadoTrato`, `useColumnasKanban`, `resolverDragEnd`, `TratoPerderDialog`
- @dnd-kit/core removido de package.json
- Fixtures de tratos reescritos sin campo `estado`

---

## Final State

### Tests
- **Total**: 345/345 passed (60 archivos)
- **Type-check**: 5 errores pre-existentes de Change 2 (contactos), NINGUNO nuevo
- **Status**: ✅ Green

### Requirements Coverage
**tratos-management**:
- Listado plano sin kanban ✅
- Filtros client-side por nombre ✅
- useTratos() sin filtros ✅
- Crear trato con contactoId único ✅
- Editar trato con PUT ✅
- Eliminar trato con DELETE ✅
- Detalle con tabs (sin estado) ✅
- Endpoints centralizados en `endpoints.tratos` ✅
- Invalidación de cache CRUD ✅

**tratos-kanban**:
- Board kanban ✅ ELIMINADO
- Distribución por estado ✅ ELIMINADO
- Función resolverDragEnd ✅ ELIMINADO
- Reglas de columnas terminales ✅ ELIMINADO
- Drag sin optimistic update ✅ ELIMINADO
- Flujo drag-to-perdido ✅ ELIMINADO
- useColumnasKanban ✅ ELIMINADO
- Fixtures con estado ✅ ELIMINADO

---

## Observations (Verify Report)

### CRITICAL (0)
Ninguno.

### WARNING (2 — Documentados, no bloqueantes)

**W1**: Fix cross-feature ContactoDetailPage.tsx
- Archivo: `src/features/contactos/pages/ContactoDetailPage.tsx:96`
- Cambio: `tieneTratosActivos` ahora es `length > 0` (antes: `estado === 'abierto'`)
- Impacto: Cualquier trato vinculado bloquea inactivar el contacto hasta Change 4
- Estado: Aceptable (ciclo de vida vuelve en Change 4)

**W2**: 5 errores TypeScript pre-existentes
- Archivos: `contactos/__tests__/{ComoNosConocioInput,ContactoForm,ContactosTable,EstadoRelacionSelect}.test.tsx`
- Tipo: TS6133 (unused), TS2532 (possibly undefined), TS2345 (type mismatch)
- Origen: Change 2 (contacto-unificado)
- Estado: Herencia, no regresión de Change 3

### SUGGESTION (2 — RESUELTAS antes del archivado)

**S1**: ✅ RESUELTA — agregados 10 tests de componente aislados en `src/features/tratos/__tests__/`:
- `TratoInfoTab.test.tsx` (motivoPerdida visible/null), `TratoDeleteDialog.test.tsx` (cancelar sin onConfirm), `TratoEditDialog.test.tsx` (form prefilled), `TratoForm.test.tsx` (422 field mapping vía setError)
- Hallazgo: `contactoId` no se deshabilita en el form en modo edit; la inmutabilidad la enforça `TratoEditDialog.handleSubmit` descartándolo del payload PUT (por diseño, form genérico).

**S2**: ✅ RESUELTA — `motivoPerdida` ahora usa el componente `<Field>` (envuelto en `sm:col-span-2`, conserva `whitespace-pre-wrap`).
- Archivo: `src/features/tratos/components/TratoInfoTab.tsx`

---

## Next Change

**Change 4**: Reintroducir ciclo de vida
- Traer campo `estado` al back (enum: abierto/ganado/perdido)
- Endpoints `/ganar`, `/perder`, `/reabrir`
- Reintroducir Kanban con dnd-kit
- Corregir 5 errores TypeScript de Change 2 (deuda heredada)

---

## Checklist de Archivado

- [x] Delta specs aplicados a main specs
- [x] Main specs `tratos-management/spec.md` actualizado
- [x] Spec `tratos-kanban/spec.md` eliminado
- [x] Change folder movido a `archive/2026-05-28-trato-modelo-unificado/`
- [x] Verify report (APROBADO CON OBSERVACIONES) validado; suite final 345/345
- [x] W1/W2 documentados (no bloqueantes)
- [x] S1/S2 resueltas antes del archivado
- [x] Archive report generado

**SDD Cycle**: COMPLETE ✅

---

## Metadata

**Change ID**: 3  
**Title**: trato-modelo-unificado  
**Artifact Store**: hybrid (openspec + engram)  
**Git Branch**: feat/trato-modelo-unificado (desde feat/contacto-unificado; Changes 1-3 aún no mergeados a main)  
**Sync Date**: 2026-05-28  

---

*Generado por sdd-archive el 2026-05-28*
