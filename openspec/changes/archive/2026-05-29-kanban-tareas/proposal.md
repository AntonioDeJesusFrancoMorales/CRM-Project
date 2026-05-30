# Proposal: Kanban de Tareas (Change 6)

## Intent

El feature `src/features/kanban/` soporta EXCLUSIVAMENTE tableros `TRATOS` (filtros hardcodeados en ~11 archivos). El back AR-CRM ya soporta tableros `TAREAS` y fichas `tipoFicha=TAREA` desde Change 4 (estadoTarea en `useAsignarColumna`, `FichaResponse.tareaId`). El trabajo es 100% front: homologar TAREAS al patrón ya establecido para TRATOS, con impacto mínimo sobre los 529 tests verdes.

## Scope

### In Scope
- Generalizar componentes hoja de `src/features/kanban/` para tableros `TAREAS` y fichas `tipoFicha=TAREA` (estrategia "solo hojas", D1).
- Lista unificada de tableros (TRATOS+TAREAS) con badge de tipo por card (D4).
- `asignarColumnaSchema` único con `estadoTrato`/`estadoTarea` opcionales + refine por tipo; `totalValorEstimado` fijado en 0 para TAREAS (D5).
- Nuevos `deriveEstadoTarea.ts` y `useTareasSinFicha` (espejo de los de TRATOS, D2+D3).

### Out of Scope
- Auth (`creadoPor=MOCK_USER_ID`, `responsableId` via `useUsuarios()`).
- CRUD del catálogo de columnas/tableros; reordenar columnas con drag.
- Unificar `deriveEstadoTrato`+`deriveEstadoTarea` en una función genérica (refactor futuro).
- Cambios en hooks de red o en schemas base de ficha/tablero (ya genéricos).

## Capabilities

### New Capabilities
- None

### Modified Capabilities
- `kanban-management`: el tablero deja de ser solo TRATOS. Nuevos requisitos: listar y abrir tableros `TAREAS`, crear/editar fichas `TAREA` (selector de tareas sin ficha, `tareaId`), asignar columna con `estadoTarea`, badge de estado de tarea (PENDIENTE/EN_CURSO/FINALIZADA), `totalValorEstimado=0` forzado en TAREAS.

## Approach

Estrategia "solo hojas" (D1): `KanbanCard` recibe `label` pre-resuelto como prop (no llama `useTratos`); `FichaForm`/`FichaCreateDialog` reciben `tipoFicha` + items del selector; `KanbanBoard`/`KanbanColumn` quitan el filtro interno `tipoFicha==='TRATO'` y muestran el badge según tipo. Las páginas (`KanbanListPage`, `KanbanPage`) detectan el `tipoTablero` y pasan las props correctas. Espejar Change 5 para derivación y selector (D2+D3). Respetar invariantes Java (estados exclusivos/requeridos, `totalValorEstimado=ZERO`).

## Affected Areas

| Área | Impacto | Descripción |
|------|---------|-------------|
| `kanban/pages/KanbanListPage.tsx` | Modified | Quitar filtro `tipoTablero==='TRATOS'`; badge de tipo |
| `kanban/pages/KanbanPage.tsx` | Modified | Filtrar fichas por tipo; selector `estadoTarea`; label por tipo |
| `kanban/components/KanbanBoard.tsx` | Modified | Quitar filtro interno `tipoFicha==='TRATO'` |
| `kanban/components/KanbanColumn.tsx` | Modified | Badge `estadoTarea` además de `estadoTrato` |
| `kanban/components/KanbanCard.tsx` | Modified | Recibir `label` pre-resuelto (prop) |
| `kanban/components/FichaForm.tsx` | Modified | Parametrizar selector según `tipoFicha`; `totalValorEstimado=0` en TAREAS |
| `kanban/components/FichaCreateDialog.tsx` | Modified | Generalizar `tipoFicha`/`tareaId` |
| `kanban/schemas/columna.schema.ts` | Modified | `estadoTarea` opcional + refine por tipo |
| `kanban/lib/deriveEstadoTarea.ts` | New | Espejo de `deriveEstadoTrato` |
| `kanban/lib/useTareasSinFicha.ts` | New | Espejo de `useTratosSinFicha` (cruza `useTareas()`+`useFichas()`) |

## Risks

| Riesgo | Probabilidad | Mitigación |
|--------|--------------|------------|
| Regresión en los 529 tests al cambiar firma de `KanbanCard` | Med | Prop `label` con fallback backward-compatible |
| Selector de tareas vacío (Tarea.tratoId @NotNull) | Med | Fixtures MSW con tareas de ejemplo |
| `totalValorEstimado` editable viola invariante ZERO en TAREAS | Med | Fijar 0 y ocultar el campo en tableros TAREAS |
| Violar exclusividad de estados Java | Low | Refine Zod + enviar solo el estado del tipo correcto |

## Rollback Plan

Revertir el branch `feat/kanban-tareas`. Los archivos nuevos (`deriveEstadoTarea.ts`, `useTareasSinFicha.ts`) son aditivos; las modificaciones son backward-compatible (props opcionales con fallback). No hay migraciones de datos ni cambios de contrato del back.

## Dependencies

- Back AR-CRM con soporte TAREAS (ya disponible desde Change 4).

## Success Criteria

- [ ] Tableros `TAREAS` se listan y abren; fichas `TAREA` se crean/editan/borran.
- [ ] Badge de estado de tarea (PENDIENTE/EN_CURSO/FINALIZADA) visible por columna.
- [ ] Asignar columna en TAREAS envía `estadoTarea` y `totalValorEstimado=0`.
- [ ] Los 529 tests previos siguen verdes + cobertura nueva para TAREAS.
