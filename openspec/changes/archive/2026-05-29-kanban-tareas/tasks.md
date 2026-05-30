# Tasks: Kanban de Tareas (Change 6)

> Strict TDD activo — runner: `pnpm test:run` | type-check: `pnpm type-check`.
> Cada batch: test RED primero → implementacion GREEN → type-check.

---

## Batch 1: Schemas — enum estadoTarea + asignarColumnaSchema con superRefine
**Scenarios cubiertos**: Gestionar columnas (limiteWip, exclusividad estado, totalValorEstimado=0).

- [x] 1.1 [RED] `schemas.test.ts` — añadir describe `estadoTarea enum`: acepta PENDIENTE/EN_CURSO/FINALIZADA; rechaza valores invalidos. Añadir describe `asignarColumnaSchema con tipoTablero`: TRATOS requiere estadoTrato; TAREAS requiere estadoTarea y totalValorEstimado=0; enviar ambos estados falla superRefine.
- [x] 1.2 [GREEN] `kanban/schemas/tablero.schema.ts` — exportar `estadoTarea = z.enum(['PENDIENTE','EN_CURSO','FINALIZADA'])` y tipo `EstadoTarea`. En `columnaTableroSchema` reemplazar `estadoTarea: z.string().nullable()` por `estadoTarea: estadoTarea.nullable()`.
- [x] 1.3 [GREEN] `kanban/schemas/columna.schema.ts` — añadir campo `tipoTablero` (opcional) al schema; reemplazar `asignarColumnaSchema` con `z.object({tipoTablero, limiteWip, estadoTrato?.optional(), estadoTarea?.optional(), totalValorEstimado}).superRefine(...)` siguiendo el contrato del design exactamente.
- [x] 1.4 [CHECK] `pnpm type-check` — sin errores en schemas.

---

## Batch 2: Lib helpers — deriveEstadoTarea + useTareasSinFicha
**Scenarios cubiertos**: Derivar estado de la tarea (PENDIENTE/EN_CURSO/FINALIZADA/null).

- [x] 2.1 [RED] Crear `kanban/__tests__/deriveEstadoTarea.test.ts` — 4 unit tests espejo de `deriveEstadoTrato.test.ts`: estado PENDIENTE, EN_CURSO, FINALIZADA derivados correctamente; tarea sin ficha retorna null.
- [x] 2.2 [GREEN] Crear `kanban/lib/deriveEstadoTarea.ts` — firma exacta del design: `deriveEstadoTarea(tareaId, fichas, columnas): EstadoTarea | null`. Filtrar `f.tipoFicha === 'TAREA' && f.tareaId === tareaId`.
- [x] 2.3 [RED] Crear `kanban/__tests__/useTareasSinFicha.test.ts` — component test: tareas con ficha TAREA activa quedan excluidas; tareas sin ficha aparecen; resultado es undefined mientras carga.
- [x] 2.4 [GREEN] Crear `kanban/lib/useTareasSinFicha.ts` — espejo de `useTratosSinFicha`: cruzar `useTareas()` + `useFichas()`; filtrar `!fichas.data!.some((f) => f.tipoFicha === 'TAREA' && f.tareaId === t.id)`. Exportar interface `TareasSinFichaResult`.
- [x] 2.5 [CHECK] `pnpm test:run` — 4 unit tests de deriveEstadoTarea + useTareasSinFicha verdes.

---

## Batch 3: KanbanCard — prop `label` opcional backward-compatible
**Scenarios cubiertos**: Label de card derivado en tableros TAREAS (Tarea.titulo).

- [x] 3.1 [RED] `KanbanCard.test.tsx` — añadir tests: con `label` explícito muestra ese texto; sin `label` cae al fallback interno (no rompe).
- [x] 3.2 [GREEN] `kanban/components/KanbanCard.tsx` — añadir `label?: string` a props; cambiar texto mostrado a `label ?? tratoLabel`. Tests existentes sin `label` siguen verdes.
- [x] 3.3 [CHECK] `pnpm test:run` — todos los tests de KanbanCard verdes.

---

## Batch 4: FichaForm + FichaCreateDialog — generalizar tipoFicha + migrar tests existentes
**Scenarios cubiertos**: Crear ficha de tarea (selector tareas sin ficha, tareaId requerido, error 422, body correcto).

- [x] 4.1 [RED — migrar] `KanbanColumn.test.tsx` — actualizar tests existentes de FichaCreateDialog: pasar `tipoFicha='TRATO'`; cambiar selectores que buscan `name="tratoId"` a `name="entidadId"`. Verificar que el campo Trato sigue apareciendo con `tipoFicha='TRATO'`.
- [x] 4.2 [RED — nuevo] Crear `kanban/__tests__/FichaForm.test.tsx` — component tests: con `tipoFicha='TRATO'` muestra label "Trato"; con `tipoFicha='TAREA'` muestra label "Tarea"; `entidadId` requerido en ambos casos; serverErrors en campo `entidadId` se muestran.
- [x] 4.3 [RED — nuevo] Crear `kanban/__tests__/FichaCreateDialog.test.tsx` — integration tests con MSW: `tipoFicha='TAREA'` envia body con `tipoFicha:'TAREA'`, `tareaId`, sin `tratoId`; query `['fichas']` invalidada; `tipoFicha='TRATO'` envia body con `tratoId`, sin `tareaId` (backward-compat).
- [x] 4.4 [GREEN] `kanban/components/FichaForm.tsx` — generalizar: añadir props `tipoFicha: TipoFicha`, `items: ItemSinFicha[]`, `itemsLoading?`. Renombrar campo RHF de `tratoId` a `entidadId`. Schema: `z.object({ entidadId: z.string().min(1,...), responsableId: ... })`. Label/placeholder dinámico por `tipoFicha`. Eliminar import de `useTratosSinFicha` (el padre provee `items`). Exportar `FichaFormValues`.
- [x] 4.5 [GREEN] `kanban/components/FichaCreateDialog.tsx` — añadir prop `tipoFicha?: TipoFicha` (default `'TRATO'`). Resolver items: `tipoFicha==='TAREA'` → `useTareasSinFicha()` mapeado a `{id, label:titulo}`; `'TRATO'` → `useTratosSinFicha()` mapeado a `{id, label:nombre}`. Mapear body: `tipoFicha==='TAREA'` → `{tareaId: entidadId, tratoId: null}`; `'TRATO'` → `{tratoId: entidadId, tareaId: null}`.
- [x] 4.6 [CHECK] `pnpm test:run` — FichaForm + FichaCreateDialog + KanbanColumn verdes.

---

## Batch 5: KanbanColumn + KanbanBoard — tipoFicha prop + badge dual + filtro por tipo
**Scenarios cubiertos**: Fichas TAREA no aparecen en tablero TRATOS; fichas TRATO no en TAREAS; badge estadoTarea en columna TAREAS.

- [x] 5.1 [RED] `KanbanColumn.test.tsx` — añadir tests: con `tipoFicha='TAREA'` muestra badge estadoTarea (PENDIENTE/EN_CURSO/FINALIZADA); pasa `tipoFicha` a `FichaCreateDialog` (dialog abre con tipo correcto); tests existentes con `tipoFicha` omitido siguen verdes (default TRATO).
- [x] 5.2 [GREEN] `kanban/components/KanbanColumn.tsx` — añadir prop `tipoFicha?: TipoFicha` (default `'TRATO'`). Badge dual: si `tipoFicha==='TAREA'` mostrar `columna.estadoTarea`; si `'TRATO'` mostrar `columna.estadoTrato`. Resolver `label` por tipo antes de pasarlo a `KanbanCard`. Pasar `tipoFicha` a `FichaCreateDialog`.
- [x] 5.3 [RED] `KanbanBoard.test.tsx` — añadir test: con `tipoFicha='TAREAS'` solo muestra fichas con `tipoFicha==='TAREA'`; fichas TRATO filtradas. (El test `(h)` existente cubre el sentido inverso — TAREA filtrada en board TRATOS; verificar que sigue verde con el nuevo prop.)
- [x] 5.4 [GREEN] `kanban/components/KanbanBoard.tsx` — añadir prop `tipoFicha?: TipoFicha` (default `'TRATO'`). Filtrar fichas: `fichas.filter(f => f.tipoFicha === tipoFicha)` antes de distribuir por columna. Pasar `tipoFicha` a cada `KanbanColumn`.
- [x] 5.5 [CHECK] `pnpm test:run` — KanbanColumn + KanbanBoard verdes.

---

## Batch 6: KanbanPage — detectar tipoTablero, selector de estado correcto, totalValorEstimado=0
**Scenarios cubiertos**: Asignar columna en tablero TAREAS envia estadoTarea + totalValorEstimado=0; enviar estadoTarea=null falla; asignar en TRATOS envia estadoTrato.

- [x] 6.1 [RED] `KanbanPage.test.tsx` — añadir tests: tablero TAREAS muestra selector estadoTarea (no estadoTrato); campo totalValorEstimado oculto o fijo a 0; asignar columna en TAREAS envia body con `estadoTarea` y `totalValorEstimado: 0`; tablero TRATOS no rompe con cambio (backward-compat).
- [x] 6.2 [GREEN] `kanban/pages/KanbanPage.tsx` — leer `tablero.tipoTablero`. Pasar `tipoFicha` (derivado de tipo) a `KanbanBoard`. En form asignar columna: incluir `tipoTablero` en `defaultValues`; para TAREAS fijar `totalValorEstimado: 0` y ocultar ese input; renderizar selector `estadoTarea` vs `estadoTrato` segun tipo. Submit: omitir el estado que no corresponde al tipo.
- [x] 6.3 [CHECK] `pnpm test:run` — KanbanPage verdes.

---

## Batch 7: KanbanListPage — lista unificada + badge de tipo
**Scenarios cubiertos**: Lista unificada muestra TRATOS y TAREAS; badge distingue tipo; empty state; navegacion a /tableros/:id.

- [x] 7.1 [RED] `KanbanPage.test.tsx` (describe KanbanListPage) — actualizar test `(b)` que espera que tableros TAREAS NO aparezcan: cambiar expectativa a que SI aparecen con badge TAREAS. Añadir test: badge TRATOS visible en card de tipo TRATOS; badge TAREAS visible en card de tipo TAREAS.
- [x] 7.2 [GREEN] `kanban/pages/KanbanListPage.tsx` — quitar filtro `tipoTablero === 'TRATOS'`; renderizar todos los tableros. Añadir badge `tablero.tipoTablero` por card.
- [x] 7.3 [CHECK] `pnpm test:run` + `pnpm type-check` — todos los tests verdes, cero errores de tipos.

---

## Batch 8: Verificacion final
- [x] 8.1 `pnpm test:run` — 0 tests en rojo: 582 passed (74 test files).
- [x] 8.2 `pnpm type-check` — 0 errores kanban; 5 errores contactos pre-existentes (no relacionados).
