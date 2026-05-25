# Tasks: Kanban de Tratos (Change 7)

**Change**: `kanban-tratos`
**Modo**: Strict TDD — cada batch es RED primero, luego GREEN.
**Runner**: `pnpm test:run` (baseline: 233 tests verdes)

---

## Lote 1 — Fundación pura + dependencia DnD

**Commit**: `feat(tratos): useColumnasKanban + resolverDragEnd (9 unit tests)`

### 1.1 Instalar @dnd-kit/core

- [x] 1.1 Agregar `@dnd-kit/core@^6.3.1` a `package.json` y ejecutar `pnpm install`.

### 1.2 useColumnasKanban — RED

- [x] 1.2 Crear `src/features/tratos/__tests__/useColumnasKanban.test.ts` con 1 test: retorna 3 columnas, `perdido.requiereModal===true`, `ganado.esTerminal===true`, `abierto.esTerminal===false`. Verificar que falla (archivo fuente no existe).

### 1.3 useColumnasKanban — GREEN

- [x] 1.3 Crear `src/features/tratos/hooks/useColumnasKanban.ts`: exportar `ColumnaKanban` interface + `useColumnasKanban()` con 3 columnas hardcodeadas. Suite pasa.

### 1.4 resolverDragEnd — RED

- [x] 1.4 Crear `src/features/tratos/__tests__/resolverDragEnd.test.ts` con los 9 casos del diseño: `null→ignorar`, `mismo estado ×3→ignorar`, `abierto→ganado→ganar`, `ganado→abierto→reabrir`, `perdido→abierto→reabrir`, `perdido→ganado→ignorar` (terminal→terminal), `cualquiera→perdido→abrir-modal-perder`. Verificar que todos fallan.

### 1.5 resolverDragEnd — GREEN

- [x] 1.5 Crear `src/features/tratos/hooks/resolverDragEnd.ts`: exportar `AccionDrag` + `resolverDragEnd()` con lógica de los 9 casos usando `columna.requiereModal`. Suite pasa (233 + 14 nuevos).

---

## Lote 2 — Extensión useTabSync con paramKey

**Commit**: `feat(lib): useTabSync acepta paramKey opcional (backward-compat)`

### 2.1 useTabSync paramKey — RED

- [ ] 2.1 Agregar 4 tests nuevos a `src/lib/__tests__/useTabSync.test.tsx`: `paramKey='vista'` lee `?vista=`, escribe `?vista=tabla`, fallback limpia URL, y test sin paramKey sigue usando `?tab=`. Verificar que los 4 nuevos fallan, los 5 existentes siguen verdes.

### 2.2 useTabSync paramKey — GREEN

- [ ] 2.2 Modificar `src/lib/useTabSync.ts`: agregar `paramKey = 'tab'` como tercer argumento; reemplazar las 3 ocurrencias hardcodeadas de `'tab'` por la variable. Suite pasa (233 + 10 + 4 nuevos).

---

## Lote 3 — Fixtures + componentes presentacionales

**Commit**: `feat(tratos): fixtures ganado/perdido + KanbanCard + KanbanColumna`

### 3.1 Fixtures — RED

- [ ] 3.1 Agregar test en `src/features/tratos/__tests__/KanbanBoard.test.tsx` (archivo nuevo, solo la sección de fixtures por ahora): importar `tratosFixture` y assert que hay al menos 1 `estado:'ganado'` y 1 `estado:'perdido'`. Verificar que falla.

### 3.2 Fixtures — GREEN

- [ ] 3.2 Modificar `src/mocks/fixtures/tratos.ts`: agregar fixture `id:'d4444444-...'` con `estado:'ganado'` y fixture `id:'d5555555-...'` con `estado:'perdido'`. Test pasa.

### 3.3 KanbanCard — GREEN (sin RED separado — la cobertura llega desde KanbanBoard.test)

- [ ] 3.3 Crear `src/features/tratos/components/KanbanCard.tsx`: `useDraggable`, nombre como link a `/tratos/:id`, `TratoEstadoBadge`. No necesita test propio — será cubierto por los tests de integración del Lote 4.

### 3.4 KanbanColumna — GREEN

- [ ] 3.4 Crear `src/features/tratos/components/KanbanColumna.tsx`: `useDroppable`, header con título + WIP counter (`{columna.label} ({tarjetas.length})`), lista de `KanbanCard`. Suite sigue verde (233 + 14).

---

## Lote 4 — KanbanBoard: integración DnD + modal-interrupt

**Commit**: `feat(tratos): KanbanBoard con DnD, modal-interrupt y mutations`

### 4.1 KanbanBoard columnas — RED

- [ ] 4.1 Ampliar `src/features/tratos/__tests__/KanbanBoard.test.tsx` con tests de integración: 3 columnas visibles, WIP counters correctos con fixtures (2 abierto, 1 ganado, 1 perdido), tarjetas en columna correcta. Verificar que fallan.

### 4.2 KanbanBoard — GREEN (estructura base)

- [ ] 4.2 Crear `src/features/tratos/components/KanbanBoard.tsx`: `DndContext` + sensores (pointer + keyboard), `useColumnasKanban`, `useTratos(filters)`, distribución de tarjetas, `KanbanColumna × 3`. Tests de columnas/WIP pasan.

### 4.3 KanbanBoard modal-interrupt — RED

- [ ] 4.3 Agregar tests en `KanbanBoard.test.tsx`: drag→perdido abre `TratoPerderDialog` (verifica `open` prop), cancelar mantiene tarjeta en origen, confirmar invoca PATCH `/perder` y limpia `pendingDrag`. Invocar `handleDragEnd` directamente con `DragEndEvent` sintético (no simular gestos pointer — limitación jsdom).

### 4.4 KanbanBoard modal-interrupt — GREEN

- [ ] 4.4 Agregar a `KanbanBoard.tsx`: estado `pendingDrag: PendingDrag | null`, handler que llama a `resolverDragEnd` y despacha acción correcta, `TratoPerderDialog` controlado por `pendingDrag`. Tests de modal pasan.

### 4.5 KanbanBoard drag sin modal — RED

- [ ] 4.5 Agregar tests en `KanbanBoard.test.tsx`: ganar→PATCH `/ganar`+invalidación, reabrir→PATCH `/:id` con `{estado:'abierto', motivo_perdida:null}`, perdido→ganado (noop, ningún endpoint llamado).

### 4.6 KanbanBoard drag sin modal — GREEN

- [ ] 4.6 Agregar a `KanbanBoard.tsx`: `useGanarTrato` y `useUpdateTrato`; en `handleDragEnd` despachar `ganarMutation.mutate` o `updateMutation.mutate` según `AccionDrag`. Suite pasa (233 + 14 + N tests de integración).

---

## Lote 5 — TratosListPage toggle kanban/tabla

**Commit**: `feat(tratos): TratosListPage con toggle kanban/tabla (kanban como default)`

### 5.1 TratosListPage toggle — RED

- [ ] 5.1 Ampliar `src/features/tratos/__tests__/TratosListPage.test.tsx` (archivo existente): +4 tests: sin params→muestra KanbanBoard, `?vista=tabla`→muestra tabla, click "Tabla"→URL agrega `?vista=tabla`, click "Kanban"→URL limpia. Verificar que los 4 nuevos fallan.

### 5.2 TratosListPage toggle — GREEN

- [ ] 5.2 Modificar `src/features/tratos/pages/TratosListPage.tsx`: agregar `useTabSync(['kanban','tabla'], 'kanban', 'vista')`, botones de toggle, renderizado condicional `KanbanBoard | TratosTable`. Suite pasa.

### 5.3 Regresión general

- [ ] 5.3 Ejecutar `pnpm test:run` completo: verificar que todos los tests previos siguen verdes y el total es 233 + todos los nuevos. Corregir cualquier regresión antes de continuar.

---

## Lote 6 — ADRs y cierre

**Commit**: `docs(adr): ADRs 055-061 para kanban-tratos`

- [ ] 6.1 Crear ADRs 055-061 en el directorio de ADRs del proyecto (uno por decisión documentada en el diseño: DnD lib choice, `resolverDragEnd` firma, árbol de componentes, no-optimistic, reutilizar hooks existentes, `useColumnasKanban` seam, `useTabSync` paramKey).
- [ ] 6.2 Ejecutar `pnpm test:run` final: confirmar suite 100% verde.

---

## Resumen de batches

| Lote | Tareas | Tests nuevos (aprox.) | Commit |
|------|--------|----------------------|--------|
| 1 | 5 | 10 (1 hook + 9 unit) | `feat(tratos): useColumnasKanban + resolverDragEnd` |
| 2 | 2 | 4 | `feat(lib): useTabSync acepta paramKey opcional` |
| 3 | 4 | 1 (fixtures) | `feat(tratos): fixtures + KanbanCard + KanbanColumna` |
| 4 | 6 | ~8 integración | `feat(tratos): KanbanBoard con DnD + modal-interrupt` |
| 5 | 3 | 4 | `feat(tratos): TratosListPage toggle kanban/tabla` |
| 6 | 2 | 0 | `docs(adr): ADRs 055-061` |
| **Total** | **22** | **~27** | |
