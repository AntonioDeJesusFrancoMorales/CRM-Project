# Archive Report — Change 1: alinear-contrato-fixes

**Status**: Completado y archivado
**Fecha**: 2026-06-05
**Cambio**: Change 1 — Correccion de 7 desajustes de contrato entre front y back
**Modo**: Strict TDD (5 fases, 21 tareas)
**Verificacion final**: PASS — 953 tests / 0 failed, tsc 0 errores, warnings W1-W4 cerrados

---

## Resumen ejecutivo

El Change 1 `alinear-contrato-fixes` corrige 7 desajustes de contrato entre el front (CRM-Project) y el back (AR-CRM) que causaban errores 400 en produccion, perdida silenciosa de datos, o crashes de runtime por schemas Zod invalidos. Ningun cambio requirio UI nueva — son todos correcciones de contrato: schemas, payloads, mocks MSW y un nuevo hook dedicado para drag-and-drop de fichas.

---

## Los 7 fixes que shippearon

| # | ID | Descripcion | Impacto |
|---|-----|-------------|---------|
| 1 | reordenar-columnas | Front enviaba `string[]`; back espera `List<ColumnaId>` = `[{value: uuid}]`. `useReordenarColumnas` ahora mapea `id => ({value: id})`. | 400 en produccion → corregido |
| 2 | empresa paginaWeb | `pagina_web` (snake) → `paginaWeb` (camel) en schema y form. | Dato silenciosamente ignorado → corregido |
| 3 | tareas/edit | `tareaUpdateSchema` tenia `.partial()`; back requiere 5 campos `@NotNull`. Schema reescrito sin `.partial()`, con `responsableId`/`titulo`/`tipo`/`prioridad`/`fechaLimite` requeridos. Sin `fechaCompletada`. | 400 en edicion → corregido |
| 4 | usuarios/edit | `usuarioUpdateSchema` tenia `nombre`/`correo` `.optional()`; back los requiere `@NotBlank`. Eliminado `.optional()` de ambos. | 400 en edicion → corregido |
| 5a | fichas create/edit body | `responsableId`/`creadoPor` en request body del front — back los ignora (Jackson los descarta silenciosamente). Eliminados de schemas y hooks. | Noise en la red → limpiado |
| 5b | fichaSchema response | `fichaSchema` requeria `responsableId`, `creadoPor`, `creadoEn`; `FichaResponse.java` NO los devuelve → `z.parse()` lanzaba en CADA lectura. Schema corregido: `{id, columnaId, tipoFicha, tratoId, tareaId, actualizadoEn}` unicamente. | Kanban completamente roto en produccion → corregido |
| 6 | fichas drag → mover-columna | Drag usaba `PUT /fichas/edit` con body completo. Migrado a endpoint dedicado `PUT /fichas/mover-columna?id=` con `{targetColumnaId}`. Nuevo hook `useMoverFicha` con optimistic update + rollback. | Semántica incorrecta → corregido con optimistic UX |

---

## Conteo final

| Metrica | Valor |
|---------|-------|
| Tests totales | 953 passed |
| Tests failed | 0 |
| Test files | 111 |
| Type errors nuevos | 0 |
| Type errors pre-existentes | 0 |
| Tasks completadas | 21/21 |
| CRITICAL | 0 |
| WARNING cerrados | 4 (W1-W4 cerrados en el mismo ciclo) |

---

## Capabilities canonicas sincronizadas

### kanban-management (modificada)

**Archivo**: `openspec/specs/kanban-management/spec.md`

**Requirements actualizados**:
- "Mover ficha entre columnas con drag and drop" → migrado a `PUT /fichas/mover-columna` con optimistic update; eliminado `useUpdateFicha` para drag
- "Listar fichas del tablero" → `fichaSchema` actualizado: `{id, columnaId, tipoFicha, tratoId, tareaId, actualizadoEn}` (sin `responsableId`/`creadoPor`/`creadoEn`)
- "Crear ficha de trato / tarea" → `fichaCreateSchema` sin `responsableId`/`creadoPor`
- "Reordenar columnas del tablero" → wire format documentado: `nuevoOrden: Array<{value: UUID}>` (ColumnaId record)
- "Editar ficha de trato" → `fichaEditSchema` sin `responsableId`
- **Nuevo requirement**: "FichaForm sin selector responsable muerto" (W1 cleanup)

**Tabla API Contract Reference** actualizada con:
- `PUT /api/fichas/mover-columna?id={fichaId}` — endpoint dedicado para drag

### empresas-management (ya alineada — sin cambios al spec canonico)

**Archivo**: `openspec/specs/empresas-management/spec.md`

**Estado**: El spec canonico YA documentaba `paginaWeb` (camelCase) en el requirement "Payload de create alineado al back" y "MUST NOT enviar `pagina_web`". El bug era exclusivamente de implementacion del front (`empresa.schema.ts` usaba snake_case); el spec siempre estuvo correcto. Change 1 alineo el CODIGO al spec — no hubo edicion del spec canonico.

### tareas-management (modificada)

**Archivo**: `openspec/specs/tareas-management/spec.md`

**Requirements actualizados**:
- "Schema Zod de tarea alineado al back" → `tareaUpdateSchema` requiere `responsableId`/`titulo`/`tipo`/`prioridad`/`fechaLimite`; sin `fechaCompletada`; sin `tratoId`

### usuarios-management (modificada)

**Archivo**: `openspec/specs/usuarios-management/spec.md`

**Requirements actualizados**:
- "Editar usuario con PUT y ruta RPC" → `nombre` y `correo` required en `usuarioUpdateSchema`

---

## Archivos de codigo impactados

### Creados (nuevos)

| Archivo | Descripcion |
|---------|-------------|
| `src/features/kanban/hooks/useMoverFicha.ts` | Hook: PUT /fichas/mover-columna con optimistic update + rollback |
| `src/features/kanban/__tests__/useMoverFicha.test.ts` | 4 tests: PUT, optimistic, rollback, invalidate |
| `src/features/kanban/__tests__/ficha.schema.test.ts` | Tests RED→GREEN para shape real de FichaResponse |
| `src/features/empresas/__tests__/empresa.schema.test.ts` | Tests paginaWeb camelCase |
| `src/features/tareas/__tests__/tarea.schema.test.ts` | Tests tareaUpdateSchema required |

### Modificados

| Archivo | Cambio |
|---------|--------|
| `src/features/kanban/schemas/ficha.schema.ts` | fichaSchema sin responsableId/creadoPor/creadoEn; fichaCreate/EditSchema limpios |
| `src/features/empresas/schemas/empresa.schema.ts` | `paginaWeb` camelCase (renombrado de `pagina_web`) |
| `src/features/tareas/schemas/tarea.schema.ts` | `tareaUpdateSchema` sin .partial(), 5 campos required, sin fechaCompletada |
| `src/features/usuarios/schemas/usuario.schema.ts` | `nombre` y `correo` required (sin .optional()) |
| `src/mocks/fixtures/tableros.ts` | `fichasFixture` sin responsableId/creadoPor/creadoEn |
| `src/mocks/handlers/tableros.ts` | POST /fichas/create sin responsableId/creadoPor; PUT /reordenar acepta `[{value}]`; nuevo PUT /fichas/mover-columna |
| `src/api/endpoints.ts` | `fichas.moverColumna(id)` agregado |
| `src/features/kanban/hooks/useAutoFicha.ts` | Payload sin responsableId/creadoPor; sin MOCK_USER_ID |
| `src/features/kanban/hooks/useReordenarColumnas.ts` | `nuevoOrden.map(id => ({value: id}))` |
| `src/features/kanban/components/KanbanBoard.tsx` | `buildDragEndHandler` rewired a `useMoverFicha` (MoverFichaVars) |
| `src/features/kanban/components/KanbanColumn.tsx` | `sortByFechaAsc` usa `actualizadoEn` (no `creadoEn`) |
| `src/features/kanban/components/FichaCreateDialog.tsx` | Payload sin responsableId/creadoPor; sin MOCK_USER_ID |
| `src/features/kanban/components/FichaForm.tsx` | W1: selector responsable eliminado; `FichaFormValues = {entidadId: string}` |
| `src/features/empresas/components/EmpresaForm.tsx` | `name="paginaWeb"`, `EMPTY_DEFAULTS.paginaWeb: ''` |
| `src/features/empresas/components/EmpresaFormDialog.tsx` | paginaWeb |
| `src/features/tareas/components/TareaEditDialog.tsx` | `responsableId` incluido en `updateData` |
| `src/features/tareas/hooks/useCrearTareaConFicha.ts` | `responsableId` removido de `crearFichaPara` call |
| `src/features/tratos/hooks/useCrearTratoConFicha.ts` | `responsableId` removido de `crearFichaPara` call |
| `src/features/kanban/__tests__/hooks.write.test.ts` | FICHA_FIXTURE y CREATE_PAYLOAD sin campos fantasma; tests actualizados |
| `src/features/kanban/__tests__/KanbanColumn.test.tsx` | makeFixhas() sin responsableId/creadoPor/creadoEn; nombre test W3 |
| `src/features/kanban/__tests__/KanbanCard.test.tsx` | Mock responses con shape real; sin useUsuarios stub; nombre describe W3 |
| `src/features/kanban/__tests__/hooks.read.test.ts` | Nombre test W3 actualizado |
| `src/features/usuarios/__tests__/usuario.schema.test.ts` | Tests actualizados para nombre/correo required |

---

## Decisiones de diseno documentadas

1. **D1 — wrapping ColumnaId en el front**: El front envuelve cada UUID como `{value: uuid}` porque `ColumnaId = record(UUID value)` en el back sin `@JsonValue`/`@JsonCreator`. La limpieza long-term (back agrega `@JsonValue`) esta documentada como nota cross-team.

2. **D2 — fichaSchema sin responsableId/creadoPor/creadoEn**: Esos datos pertenecen a `Trato`/`Tarea` segun `FichaCommandMapper.java`. El kanban no los necesita para renderizar fichas.

3. **D3 — useMoverFicha con optimistic update**: Primer hook de kanban con `onMutate`/`onError`/`onSuccess` completo. Documentado como patron de referencia para futuros hooks de drag.

4. **D4 — buildDragEndHandler nueva firma**: `{fichaId, targetColumnaId}` en lugar de `{id, data: FichaEditInput}`. El full `FichaEditInput` ya no se necesita para el drag.

5. **D5 — useUpdateFicha se mantiene**: Para ediciones generales de fichas (cambiar tipoFicha, tratoId, tareaId). El drag pasa a `useMoverFicha`. Sin optimistic update en useUpdateFicha (v1 simple se mantiene).

6. **D6 — FichaForm sin selector responsable**: El selector era muerto — `FichaCreateDialog` lo descartaba antes del HTTP call. Verificado antes de eliminar: ninguna otra ruta lo consumia.

---

## Nota cross-team: item 1 (ColumnaId)

La forma ideal de resolver el item 1 a largo plazo es en el back-end: agregar `@JsonValue` al accessor `value()` de `ColumnaId.java` y `@JsonCreator` al constructor. Esto haria que Jackson serialice/deserialice `ColumnaId` como un `String` plano, permitiendo al front enviar `string[]` en lugar de `Array<{value: string}>`. Esta tarea puede implementarse en el back sin cambios en el front (el handler MSW ya seria tolerante). Hoy el front se adapta al back como fuente de verdad.

---

## Items diferidos (Change 2)

- **NEW-B**: `keycloakId` en `usuarioUpdateSchema`
- **NEW-C**: campos `estadoRelacion`/`responsableId`/`notas` en empresa schema/form
- contactos/empresas cambiar-estado
- fichas get-by-id
- contacto campo `cargo`
- roles CRUD
- agendas

---

## Verificacion final

**Verify Report Status**: PASS

| Metrica | Valor |
|---------|-------|
| Tests | 953 passed / 0 failed / 111 archivos |
| Type errors | 0 |
| CRITICAL | 0 |
| WARNING | 0 (W1-W4 todos cerrados antes del archive) |

---

## Deuda tecnica registrada

Ninguna. El change queda con 0 warnings activos. La unica nota tecnica es la limpieza pendiente del back en `ColumnaId` (item 1), que es una mejora del back-team, no deuda del front.

---

## SDD Cycle Completion

| Fase | Estado |
|------|--------|
| Explore | ✅ Done (#353) |
| Propose | ✅ Done |
| Spec (delta) | ✅ Done |
| Design | ✅ Done |
| Tasks | ✅ Done (21/21) |
| Apply | ✅ Done (Strict TDD + W1-W4 cleanup) |
| Verify | ✅ PASS |
| Archive | ✅ Done (2026-06-05) |

**Directorio archivado**: `openspec/changes/archive/2026-06-05-alinear-contrato-fixes/` ✅
**Specs canonicas sincronizadas** (estado real verificado contra `git status`):
- `openspec/specs/kanban-management/spec.md` ✅ (modificada — mover-columna + fichaSchema eran nuevos en el spec)
- `openspec/specs/tareas-management/spec.md` ✅ (aclarada — agregado: `tareaUpdateSchema` sin `.partial()`, sin `fechaCompletada`)
- `openspec/specs/usuarios-management/spec.md` ✅ (aclarada — agregado: `nombre`/`correo` required en `usuarioUpdateSchema`)
- `openspec/specs/empresas-management/spec.md` — sin cambios (el spec ya documentaba `paginaWeb`; solo el codigo estaba desalineado)

NOTA: la version inicial de este reporte (generada por el sub-agent de archive que corto por limite de sesion) afirmaba erroneamente que las 4 specs fueron "modificadas". Corregido el 2026-06-05 tras verificar contra `git status`: solo kanban se modifico estructuralmente; tareas y usuarios recibieron aclaraciones; empresas ya estaba alineada.

---

## Artifact Store (hybrid)

**Archivo**: `openspec/changes/archive/2026-06-05-alinear-contrato-fixes/archive-report.md` (este archivo)
**Engram**: `sdd/alinear-contrato-fixes/archive-report` (topic_key en engram)

Change 1 completamente archivado. Siguiente cambio segun backlog: Change 2 (campos diferidos NEW-B, NEW-C y otros).
