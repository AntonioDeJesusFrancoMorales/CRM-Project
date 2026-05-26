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

- [x] 2.1 Agregar 4 tests nuevos a `src/lib/__tests__/useTabSync.test.tsx`: `paramKey='vista'` lee `?vista=`, escribe `?vista=tabla`, fallback limpia URL, y test sin paramKey sigue usando `?tab=`. Verificar que los 4 nuevos fallan, los 5 existentes siguen verdes.

### 2.2 useTabSync paramKey — GREEN

- [x] 2.2 Modificar `src/lib/useTabSync.ts`: agregar `paramKey = 'tab'` como tercer argumento; reemplazar las 3 ocurrencias hardcodeadas de `'tab'` por la variable. Suite pasa (233 + 10 + 4 nuevos).

---

## Lote 3 — Fixtures + componentes presentacionales

**Commit**: `feat(tratos): fixtures ganado/perdido + KanbanCard + KanbanColumna`

### 3.1 Fixtures — RED

- [x] 3.1 Agregar test en `src/features/tratos/__tests__/KanbanBoard.test.tsx` (archivo nuevo, solo la sección de fixtures por ahora): importar `tratosFixture` y assert que hay al menos 1 `estado:'ganado'` y 1 `estado:'perdido'`. Verificar que falla.

### 3.2 Fixtures — GREEN

- [x] 3.2 Modificar `src/mocks/fixtures/tratos.ts`: agregar fixture `id:'d4444444-...'` con `estado:'ganado'` y fixture `id:'d5555555-...'` con `estado:'perdido'`. Test pasa.

### 3.3 KanbanCard — RED + GREEN (cobertura directa — override del orquestador)

- [x] 3.3 Crear `src/features/tratos/__tests__/KanbanCard.test.tsx` con 3 tests RED (nombre visible, button type=button, triangulación con fixture diferente). Crear `src/features/tratos/components/KanbanCard.tsx`: `useDraggable`, nombre como button + navigate (homologado con TratosTable), `TratoEstadoBadge`. Tests GREEN.

### 3.4 KanbanColumna — RED + GREEN (cobertura directa — override del orquestador)

- [x] 3.4 Crear `src/features/tratos/__tests__/KanbanColumna.test.tsx` con 5 tests RED (título, WIP 0, WIP correcto, tarjetas visibles, triangulación WIP 1). Crear `src/features/tratos/components/KanbanColumna.tsx`: `useDroppable`, header con título + WIP counter (`{columna.label} ({tarjetas.length})`), lista de `KanbanCard`. Suite verde (261 tests).

---

## Lote 4 — KanbanBoard: integración DnD + modal-interrupt

**Commit**: `feat(tratos): KanbanBoard con DnD, modal-interrupt y mutations`

### 4.1 KanbanBoard columnas — RED

- [x] 4.1 Ampliar `src/features/tratos/__tests__/KanbanBoard.test.tsx` con tests de integración: 3 columnas visibles, WIP counters correctos con fixtures (2 abierto, 1 ganado, 1 perdido), tarjetas en columna correcta. Verificar que fallan.

### 4.2 KanbanBoard — GREEN (estructura base)

- [x] 4.2 Crear `src/features/tratos/components/KanbanBoard.tsx`: `DndContext` + sensores (pointer + keyboard), `useColumnasKanban`, `useTratos(filters)`, distribución de tarjetas, `KanbanColumna × 3`. Tests de columnas/WIP pasan.

### 4.3 KanbanBoard modal-interrupt — RED

- [x] 4.3 Agregar tests en `KanbanBoard.test.tsx`: drag→perdido abre `TratoPerderDialog` (verifica `open` prop), cancelar mantiene tarjeta en origen, confirmar invoca PATCH `/perder` y limpia `pendingDrag`. Invocar `handleDragEnd` directamente con `DragEndEvent` sintético (no simular gestos pointer — limitación jsdom).

### 4.4 KanbanBoard modal-interrupt — GREEN

- [x] 4.4 Agregar a `KanbanBoard.tsx`: estado `pendingDrag: PendingDrag | null`, handler que llama a `resolverDragEnd` y despacha acción correcta, `TratoPerderDialog` controlado por `pendingDrag`. Tests de modal pasan.

### 4.5 KanbanBoard drag sin modal — RED

- [x] 4.5 Agregar tests en `KanbanBoard.test.tsx`: ganar→PATCH `/ganar`+invalidación, reabrir→PATCH `/:id` con `{estado:'abierto', motivo_perdida:null}`, perdido→ganado (noop, ningún endpoint llamado).

### 4.6 KanbanBoard drag sin modal — GREEN

- [x] 4.6 Agregar a `KanbanBoard.tsx`: `useGanarTrato` y `useUpdateTrato`; en `handleDragEnd` despachar `ganarMutation.mutate` o `updateMutation.mutate` según `AccionDrag`. Suite pasa (261 + 8 nuevos = 269 tests).

---

## Lote 5 — TratosListPage toggle kanban/tabla

**Commit**: `feat(tratos): TratosListPage con toggle kanban/tabla (kanban como default)`

### 5.1 TratosListPage toggle — RED

- [x] 5.1 Ampliar `src/features/tratos/__tests__/TratosListPage.test.tsx` (archivo existente): +5 tests (5.1a–5.1e): sin params→muestra KanbanBoard, `?vista=tabla`→muestra tabla, click "Tabla"→URL agrega `?vista=tabla`, click "Kanban"→URL limpia, filtro estado=ganado estrecha kanban. Verificar que los 4 nuevos fallan (5.1b ya pasaba).

### 5.2 TratosListPage toggle — GREEN

- [x] 5.2 Modificar `src/features/tratos/pages/TratosListPage.tsx`: agregar `useTabSync(['kanban','tabla'], 'kanban', 'vista')`, botones de toggle (LayoutGrid/Table icons), renderizado condicional `KanbanBoard | TratosTable`. Agregar `filters?: UseTratosFilters` prop a `KanbanBoard` para homologación. Suite pasa (274 tests).

### 5.3 Regresión general

- [x] 5.3 Ejecutar `pnpm test:run` completo: 274/274 verde. Tests previos ajustados (renderiza tabla, nombre clickeable, búsqueda, nuevo trato) actualizados para usar `?vista=tabla`. Regresión: 0.

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
