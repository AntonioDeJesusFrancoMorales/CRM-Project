# Archive Report — kanban-tratos (Change 7)

**Fecha de archivado**: 2026-05-25 (America/Mexico_City)
**Veredicto de verify**: PASS WITH WARNINGS (W1 y W2 reconciliados en delta spec antes de archivar)
**Persistencia**: hybrid (openspec/ + engram)

---

## Observaciones en Engram

Los artefactos de este Change han sido persistidos en engram para auditoría y recovery:

| Artefacto | Topic Key |
|---|---|
| Proposal | `sdd/kanban-tratos/proposal` |
| Spec (tratos-kanban) | `sdd/kanban-tratos/spec` |
| Design | `sdd/kanban-tratos/design` |
| Tasks | `sdd/kanban-tratos/tasks` |
| Verify-report | `sdd/kanban-tratos/verify-report` |
| Archive-report | `sdd/kanban-tratos/archive-report` (este) |

---

## Resumen Ejecutivo

Change 7 ha agregado la vista kanban drag-and-drop de tratos como **vista primaria de `/tratos`**. Implementó:

- **`KanbanBoard` con DnD**: tablero de 3 columnas (`abierto / ganado / perdido`) usando `@dnd-kit/core@^6.3.1` (solo core, sin sortable). Estado del board 100% derivado del query cache de TanStack Query — sin estado local de tarjetas, sin optimistic update.
- **`resolverDragEnd()` función pura (ADR-061)**: mapea `(tratoId, estadoOrigen, estadoDestino, columnas, nombre)` → `AccionDrag` discriminated union (`ignorar | ganar | reabrir | abrir-modal-perder`). Testeable sin render. Firma definitiva resuelta en `sdd-design` (5 args, discriminated union) — el spec fue reconciliado antes de archivar (W1 del verify).
- **`useColumnasKanban()` seam (ADR-059)**: interface `ColumnaKanban` con `requiereModal`/`esTerminal`; v1 hardcodeada del enum. Desacopla reglas de columna del componente; permite config por instancia sin reescritura (norte estrella diferido).
- **Flujo drag-to-perdido modal-interrupt (ADR-043 + ADR-058)**: arrastrar a `perdido` guarda `pendingDrag` y abre `TratoPerderDialog` sin invocar ningún endpoint. Cancelar revierte sin PATCH; confirmar → `usePerderTrato` → invalida cache → tarjeta aparece en "Perdido".
- **Reglas terminales (ADR-060)**: `perdido → ganado` ignorado sin UI feedback. `ganado/perdido → perdido` siempre abre modal (precedencia sobre terminal→terminal). Tabla completa de transiciones documentada en spec.
- **`crearManejadorDragEnd` seam de testing**: función factory que recibe dependencias por inyección, permitiendo tests sin simular gestos pointer en jsdom (limitación conocida de `@dnd-kit`).
- **Toggle Kanban / Tabla (ADR-056 + ADR-057)**: `useTabSync(['kanban','tabla'], 'kanban', 'vista')` — URL limpia = kanban default, `?vista=tabla` = tabla. Extensión de 3 líneas al hook, backward-compatible (callers existentes con `?tab=` sin tocar).
- **Fixtures ampliados**: +1 trato `estado:'ganado'` (id `d4444444-...`) + 1 trato `estado:'perdido'` (id `d5555555-...`).

**Hitos clave**:
- 6 lotes de implementación (1-6), 22/22 tareas completadas.
- 7 ADRs propias (ADR-055 a ADR-061) + ADR-043 aplicado a DnD.
- 283/283 tests verdes, 61 archivos de test, Strict TDD con RED-first en todos los lotes.
- 0 CRITICALs; 2 WARNINGs de drift spec vs implementación (W1: firma `resolverDragEnd`; W2: nombre `KanbanBoard`) — reconciliados en delta spec antes de archivar.
- 8 commits en rama `feat/kanban-tratos`.

---

## Estado de Implementación

| Métrica | Resultado |
|---|---|
| **Tests totales** | 283/283 (61 suites) |
| **Lotes completados** | 1, 2, 3, 4, 5, 6 (6/6) |
| **Tareas completadas** | 22/22 |
| **ADRs propias respetadas** | 7/7 (ADR-055 a ADR-061) |
| **ADR-043 (modal obligatorio perder)** | Aplicado a DnD |
| **Strict TDD** | Aplicado en todos los lotes (RED-first) |
| **Spec reconciliada** | W1 (firma resolverDragEnd) + W2 (KanbanBoard naming) corregidos en delta spec |

---

## ADRs Implementadas (7 propias + ADR-043 aplicado)

| ADR | Decisión | Estado |
|---|---|---|
| ADR-055 | `@dnd-kit/core` como librería DnD (solo core, sin sortable); PointerSensor(8px) + KeyboardSensor | Aplicado en `KanbanBoard.tsx` |
| ADR-056 | Kanban como vista primaria de `/tratos` (divergencia explícita de homologación de tablas) | Aplicado en `TratosListPage.tsx` (useTabSync fallback='kanban') |
| ADR-057 | Extensión `useTabSync` con `paramKey` opcional (actualiza ADR-045; backward-compat) | Aplicado en `useTabSync.ts` (tercer arg, 3 ocurrencias) |
| ADR-058 | Drag-to-perdido modal-interrupt sin optimistic update; tarjeta no se mueve hasta `onSuccess` | Aplicado en `KanbanBoard.tsx` (`pendingDrag` state) |
| ADR-059 | `useColumnasKanban()` como seam para etapas configurables futuras; `requiereModal` desacopla dispatch | Aplicado en `useColumnasKanban.ts` + `resolverDragEnd.ts:49` |
| ADR-060 | Reglas terminales: `perdido→ganado` ignorado; modal tiene precedencia sobre terminal→terminal | Aplicado en `resolverDragEnd.ts:46-57` |
| ADR-061 | `resolverDragEnd()` como función pura; `crearManejadorDragEnd` como seam de testing (factory) | Aplicado en `resolverDragEnd.ts` + `crearManejadorDragEnd.ts` |
| ADR-043 | Modal obligatorio `TratoPerderDialog` con `motivo_perdida`; aplica a DnD igual que a menú | Verificado: drag a perdido → dialog → `/perder` |

---

## Lotes de Implementación

| Lote | Descripción | Tests netos |
|------|-------------|-------------|
| 1 | `useColumnasKanban` (1 unit) + `resolverDragEnd` (9 unit) | +10 (~243 total) |
| 2 | `useTabSync` con `paramKey` backward-compat | +4 (~247 total) |
| 3 | Fixtures ganado/perdido + `KanbanCard` + `KanbanColumna` | +9 (~256 total) |
| 4 | `KanbanBoard` DnD + modal-interrupt + drag sin modal | +8 (~264 total) |
| 5 | `TratosListPage` toggle kanban/tabla + regresión general | +5 (~269 total) — 274 tras ajustes |
| 6 | ADRs 055-061 documentadas inline + `pnpm test:run` final | 0 nuevos → **283 total** |

---

## Seam Refactor: crearManejadorDragEnd

El reto de testing con `@dnd-kit` en jsdom (gestos pointer no simulables) se resolvió con el patrón factory:

```ts
// crearManejadorDragEnd(deps) retorna un handler que inyecta dependencias
// KanbanBoard recibe el handler pre-construido y lo pasa a DndContext.onDragEnd
```

Esto permitió testear el comportamiento de drag (ganar, reabrir, modal-interrupt) invocando `handleDragEnd` directamente con `DragEndEvent` sintético, sin necesidad de simular gestos pointer reales. El patrón queda documentado para futuros componentes DnD (ADR-061).

---

## Reconciliación de Spec (Verify W1 + W2)

### W1 — Firma resolverDragEnd

El delta spec original describía `resolverDragEnd(activeId, overId, columnas)` con retorno string union `'noop' | 'ganar' | 'reabrir' | 'modal-perder'`. La implementación siguió el diseño definitivo de `sdd-design` (ADR-061): firma de 5 args + discriminated union `AccionDrag`. La reconciliación se hizo en el delta spec antes de archivar — el spec permanente refleja la API real.

### W2 — Nombre KanbanBoard vs TratosKanban

El delta `tratos-management` referenciaba el componente como `TratosKanban`; la implementación usa `KanbanBoard` (nombre más genérico y correcto para el árbol de componentes feature-plano). El spec permanente refleja `KanbanBoard`.

---

## Norte Estrella Diferido

- **Etapas configurables por instancia**: `useColumnasKanban()` está preparado como seam — en el futuro puede hacer `useQuery` a un endpoint de etapas sin cambiar `KanbanBoard`. Requiere modelo multi-tenant o config por instancia (Change futuro).
- **Self-hosted single-tenant**: arquitectura preparada; sin cambios necesarios en este Change.
- **Kanban de Tareas**: Change 8 (si se prioriza).
- **Orden manual de tarjetas dentro de columnas**: requiere campo `orden` en el modelo `Trato`.
- **Badge de tareas pendientes en tarjetas kanban**: descartado en v1 para evitar N+1; ya existe en la detail page.
- **WIP limits por columna**: backlog futuro.

---

## Commits Asociados

8 commits en `feat/kanban-tratos`:

```
- feat(tratos): useColumnasKanban + resolverDragEnd (9 unit tests)
- feat(lib): useTabSync acepta paramKey opcional (backward-compat)
- feat(tratos): fixtures ganado/perdido + KanbanCard + KanbanColumna
- feat(tratos): KanbanBoard con DnD, modal-interrupt y mutations
- feat(tratos): TratosListPage con toggle kanban/tabla (kanban como default)
- docs(adr): ADRs 055-061 para kanban-tratos
- [+ 2 commits adicionales del proceso]
- [archive — siguiente]
```

---

## Specs Principales Sincronizadas

### Nueva capability: `tratos-kanban`
- **Archivo principal**: `openspec/specs/tratos-kanban/spec.md` — CREADO
- **Acción**: Spec completa copiada (capability greenfield); metadatos de change eliminados; firma reconciliada (W1 + W2).
- **Requirements**: 6 (Board 3 columnas, Distribución de tarjetas, Función pura resolverDragEnd, Reglas terminales, Drag sin modal, Flujo drag-to-perdido, Seam useColumnasKanban, Fixtures)
- **Scenarios**: ~24 total
- **API contract**: 4 endpoints (GET /tratos, PATCH /ganar, PATCH /perder, PATCH /:id reabrir)

### Modificada: `tratos-management`
- **Archivo principal**: `openspec/specs/tratos-management/spec.md` — MODIFICADO
- **Requirement modificado**: "Listado de tratos" — tabla ahora es vista secundaria vía `?vista=tabla`; kanban es la vista por defecto.
- **Requirements AÑADIDOS**: "Toggle vista Kanban / Tabla en /tratos (ADR-056)" + "Extensión backward-compatible de useTabSync con paramKey (ADR-057)"
- **Requirements ANTES**: 12 | **Requirements DESPUÉS**: 14 (ninguno eliminado)

---

## Movimiento de Archivos

- `openspec/changes/kanban-tratos/` → `openspec/changes/archive/2026-05-25-kanban-tratos/`
- Patrón date-prefix `YYYY-MM-DD-{name}/` siguiendo convención repo (Changes 4, 5, 6a y 6b ya archivados con este patrón).
- Specs sincronizadas: 1 NUEVA (`tratos-kanban/`) + 1 delta aplicado (`tratos-management/` — modificación + 2 requirements añadidos).

---

## Veredicto Final

### APROBADO PARA ARCHIVO

La implementación es **completa y correcta**:
- 283/283 tests passing, Strict TDD en todos los lotes.
- 6 lotes implementados con commits semánticos atómicos revertibles.
- 7 ADRs propias + ADR-043 aplicado (100% coherencia con design).
- 0 CRITICALs; 0 VIOLATED; 2 WARNINGs de drift spec/implementación reconciliados antes de archivar.
- Seam `crearManejadorDragEnd` resuelve la intesteabilidad de DnD en jsdom sin comprometer la arquitectura.

**Próximo Change**: `Change 8 — Kanban de Tareas` (si se prioriza) o el que el equipo decida.
