# Archive Report — tareas-management (Change 6b)

**Fecha de archivado**: 2026-05-25 (America/Mexico_City)
**Veredicto de verify**: ✅ APPROVED (Strict TDD, 232/232 tests verdes)
**Persistencia**: hybrid (openspec/ + engram)

---

## Observaciones en Engram

Los artefactos de este Change han sido persistidos en engram para auditoría y recovery:

| Artefacto | Topic Key | Observation ID |
|---|---|---|
| Proposal | `sdd/tareas-management/proposal` | #188 |
| Spec | `sdd/tareas-management/spec` | #190 |
| Apply-progress | `sdd/tareas-management/apply-progress` | #193 |
| Verify-report | `sdd/tareas-management/verify-report` | #199 |
| Archive-report | `sdd/tareas-management/archive-report` | (este) |

---

## Resumen Ejecutivo

Change 6b ha cerrado el ciclo comercial de Tarea como entidad de primer nivel del CRM Pipely. Implementó:

- **CRUD completo de Tareas**: listado global filtrable en `/tareas`, detalle en `TareaDetailPage`, crear/editar via Dialog, eliminar con confirmación (204 simple).
- **trato_id no-nullable**: toda tarea pertenece a un trato. Desde `/tareas` global el Select de trato es requerido y editable; desde el tab del trato queda bloqueado (`disabled`, `tratoIdFijo`).
- **Cambio de estado inline (`TareaEstadoMenu`)**: DropdownMenu con 3 ítems siempre visibles, disabled-by-state (Iniciar/Completar/Reabrir), sin modal. Homologa `TratoEstadoMenu` (ADR-050).
- **Hook paramétrico `useTareas`**: queryKey `['tareas', filters ?? {}]`, alias `tareasKeys.byTrato(tratoId)` para invalidaciones quirúrgicas del badge (ADR-048).
- **`useCompletarTarea` con doble invalidación**: `tareasKeys.all` + `tareasKeys.byTrato(tratoId)` para mantener el badge sincronizado (ADR-049).
- **Sidebar "Mis tareas"**: NavItem con `ClipboardList`, URL dinámica `/tareas?responsable_id={usuario.id}`, inicializa filtro desde `useSearchParams` (ADR-054).
- **Refactor `TratoDetailPage` plano → tabbed**: `useTabSync(['info','tareas'],'info')`, badge de pendientes derivado del mismo query del tab (sin tercera query), `TratoInfoTab` + `TratoTareasTab` extraídos (ADR-051, ADR-052).
- **Badge-zero**: oculto cuando count = 0, `data-testid="badge-pendientes"`.

**Hitos clave**:
- 6 lotes de implementación (A-F), 36/36 tareas completadas.
- 7 ADRs documentadas (ADR-048 a ADR-054) + decisión badge-zero.
- 232/232 tests verdes (231 tras Lote F, +1 e2e test 422 REQ-6 cerrado post-verify), 53 suites.
- 0 CRITICALs, 0 VIOLATED, 3 WARNINGs documentadas (deuda de cobertura aceptada).
- Strict TDD aplicado en todos los lotes.
- Smoke manual ejecutado y aprobado por el usuario en browser.

---

## Estado de Implementación

| Métrica | Resultado |
|---|---|
| **Tests totales** | 232/232 ✅ (231 tras Lote F + 1 post-verify para REQ-6 422) |
| **Type-check** | exit 0 ✅ |
| **Lotes completados** | A, B, C, D, E, F (6/6) ✅ |
| **Tareas completadas** | 36/36 ✅ |
| **Scenarios COMPLIANT** | 38/43 ✅ |
| **Scenarios PARTIAL** | 5/43 ⚠️ |
| **Scenarios VIOLATED** | 0/43 ✅ |
| **Scenarios FAILING** | 0/43 ✅ |
| **ADRs respetadas** | 7/7 ✅ |
| **Smoke manual** | ✅ APROBADO |

---

## Deuda Técnica Documentada

3 WARNINGs de cobertura de tests (NO bugs funcionales):

1. **W-01 (REQ-7)** — Edición: test abre dialog pero no verifica PATCH + invalidación end-to-end. Coverage unitaria de `useUpdateTarea` sí existe.
2. **W-02 (REQ-8)** — Cancelar delete: sin test explícito del click en "Cancelar" para verificar que DELETE no se invoca.
3. **W-03 (REQ-6)** — Error 422 en create: cerrado con test e2e post-verify. El verify-report (#199) lo marcó como PARTIAL; un test adicional fue agregado antes del archive.

Ninguno bloquea archive. Deuda aceptable per política ADR-038 (tests hook+page, no exhaustivo por componente).

---

## Commits Asociados

Cronología del Change 6b (6 commits de implementación):

```
- [Lote A] feat(mocks): ampliar tareasFixture y agregar handler GET /tareas con filtros server-side
- [Lote B] feat(tareas): schemas Zod, useTareas, useTarea y mutations CRUD
- [Lote C] feat(tareas): TareaEstadoMenu, TareaForm, TareaCreateDialog, TareaEditDialog, TareaDeleteDialog
- [Lote D] feat(tareas): TareasTable, TareasListPage con 6 filtros y TareaDetailPage
- [Lote E] feat(tareas): wirear rutas /tareas y agregar "Mis tareas" al sidebar (ADR-054)
- [Lote F] refactor(tratos): TratoDetailPage tabbed con tab Tareas, badge de pendientes y useTabSync (ADR-051)
- [archive] chore(tareas): archivar artifacts SDD del Change 6b
```

---

## Specs Principales Sincronizadas

### Nueva capability: `tareas-management`
- **Archivo principal**: `openspec/specs/tareas-management/spec.md` — CREADO
- **Acción**: Spec completa copiada (capability greenfield, no es delta)
- **Requirements**: 11 (Sidebar "Mis tareas", Routing, Listado con filtros, Hook paramétrico useTareas, Schema Zod, Crear tarea con trato requerido, Editar tarea, Eliminar tarea 204, Cambio de estado inline, Detalle de tarea, Invalidación de cache)
- **Scenarios**: 39 total
- **API contract**: 6 endpoints (GET /tareas, POST /tratos/:id/tareas, GET /tareas/:id, PATCH /tareas/:id, DELETE /tareas/:id 204, PATCH /tareas/:id/completar)

### Modificada: `tratos-management`
- **Archivo principal**: `openspec/specs/tratos-management/spec.md` — MODIFICADO (reemplazo quirúrgico)
- **Requirement modificado**: "Detalle del trato" (plano → tabbed + badge + tab Tareas)
- **Requirements ANTES**: 12 | **Requirements DESPUÉS**: 12 ✅ (ninguno perdido)
- **Detalle del cambio**: Se reemplazó solo el body + scenarios del requirement "Detalle del trato" (3 scenarios → 9 scenarios). Los otros 11 requirements permanecen intactos.

---

## ADRs Implementadas (7/7 + badge-zero)

| ADR | Decisión | Estado |
|---|---|---|
| ADR-048 | `useTareas` paramétrico, `tareasKeys.byTrato` alias | ✅ |
| ADR-049 | `useCompletarTarea` con doble invalidación (`all` + `byTrato(tratoId)`) | ✅ |
| ADR-050 | `TareaEstadoMenu` inline, 3 ítems siempre visibles, disabled-by-state, sin modal | ✅ |
| ADR-051 | Refactor `TratoDetailPage` plano → tabbed con `useTabSync` | ✅ |
| ADR-052 | Badge de pendientes derivado del MISMO query del tab (sin tercera query) | ✅ |
| ADR-053 | GET /tareas server-side con 5 filtros + `addDaysIso` puro para vencimiento | ✅ |
| ADR-054 | Vista "Mis tareas" parametrizada con `responsable_id` del usuario autenticado | ✅ |
| badge-zero | Badge oculto cuando count = 0, `data-testid="badge-pendientes"` | ✅ |

---

## Out of Scope (diferido a Changes futuros)

- **Kanban / dnd-kit** → Change 7 (`kanban-management`).
- **Notificaciones/recordatorios, recurrencia** → Change 8+.
- **Etiquetas/comentarios** → Change 8+.
- **Tareas sin trato** (`trato_id` no-nullable en este Change).
- **Cambio masivo de estado (bulk)** → backlog futuro.

---

## Lecciones Aprendidas (Change 6b)

1. **Deduplicación automática de queries (TanStack Query 5)**: `useTareas({ trato_id, estado: 'pendiente' })` levantado a `TratoDetailPage` se dedupea con el mismo query del `TratoTareasTab` sin overhead de red. El mismo `queryKey` garantiza una sola fetch. Aprendizaje: levantar el query al container si se comparte entre header y tab es la estrategia correcta (ADR-052).

2. **`data-testid` para verificar ausencia de elemento**: el badge-zero requiere probar que el badge NO está en el DOM cuando count = 0. `queryByTestId('badge-pendientes')` devuelve `null` (correcto), mientras buscar el número "0" podría matchear otros elementos accidentalmente. Aprendizaje: siempre usar `data-testid` para assertions de ausencia de elementos con lógica condicional.

3. **NavItem dinámico fuera del `items.map()` estático**: el array `items` es constante de módulo y no puede llamar hooks. El NavItem "Mis tareas" con URL dinámica (`usuario.id`) debe renderizarse directamente en el JSX del componente donde el hook ya está disponible. Aprendizaje: distinguir entre items de nav estáticos (array) y dinámicos (JSX directo).

4. **IDs del fixture vs. placeholders en tasks.md**: los tests usan los IDs reales del fixture (ej. `e1111111-eeee-1111-eeee-111111111111`) que difieren de los placeholders en tasks.md (ej. `t1111111`). Siempre leer el fixture antes de escribir los tests de páginas para evitar correcciones innecesarias.

5. **Botón de submit en `TareaForm`**: dice "Crear tarea" (mode=create) y "Guardar cambios" (mode=edit). Un test buscaba `/guardar/i` y necesitó corrección a `/crear tarea/i`. Aprendizaje: definir el texto exacto de botones en el spec o en el componente antes de escribir los tests de integración.

---

## Movimiento de Archivos

- `openspec/changes/tareas-management/` → `openspec/changes/archive/2026-05-25-tareas-management/`
- Patrón date-prefix `YYYY-MM-DD-{name}/` siguiendo convención repo (Changes 4, 5 y 6a ya archivados con este patrón).
- Specs sincronizadas: 1 NUEVA (`tareas-management/`) + 1 delta aplicado (`tratos-management/` — reemplazo quirúrgico del requirement "Detalle del trato").

---

## Veredicto Final

### ✅ APROBADO PARA ARCHIVO

La implementación es **completa y correcta**:
- 232/232 tests passing, type-check exit 0.
- 6 lotes implementados con commits semánticos atómicos revertibles.
- 7 ADRs + badge-zero implementadas verbatim (100% coherencia con design).
- 38/43 scenarios COMPLIANT, 0 VIOLATED/FAILING.
- Smoke manual ejecutado y aprobado por el usuario en browser.
- 0 issues de assertion quality.

Las 3 WARNINGs son **deuda de cobertura de tests** (no bugs funcionales). Aceptable per política ADR-038.

**Próximo Change**: `Change 7 — kanban-management` (Kanban/dnd-kit) — o el que el equipo priorice.
