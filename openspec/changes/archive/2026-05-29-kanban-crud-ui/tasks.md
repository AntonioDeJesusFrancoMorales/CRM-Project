# Tasks: Kanban CRUD UI (Change 5)

## Batch 1: Schema + Pure Libs (unit-testable en aislado)

- [x] 1.1 [RED] `src/features/kanban/__tests__/schemas.test.ts` — agregar test: `asignarColumnaSchema` rechaza `limiteWip: 0` y `limiteWip: -1`; acepta `limiteWip: 1`
- [x] 1.2 [GREEN] `src/features/kanban/schemas/columna.schema.ts` — exportar `asignarColumnaSchema` con `limiteWip: z.number().int().min(1, 'El límite WIP debe ser al menos 1')`, `estadoTrato` (opcional, del enum de `tablero.schema.ts`), `totalValorEstimado: z.number().min(0)`
- [x] 1.3 [RED] `src/features/kanban/__tests__/schemas.test.ts` — agregar test: `MOCK_USER_ID` es string UUID de 36 chars con formato estándar
- [x] 1.4 [GREEN] `src/features/kanban/lib/mockUser.ts` — crear `export const MOCK_USER_ID = '00000000-0000-0000-0000-000000000001'` con comentario `// TODO: reemplazar cuando entre auth`
- [x] 1.5 [RED] `src/features/kanban/__tests__/hooks.read.test.ts` — agregar test: `useTratosSinFicha` filtra tratos que ya tienen ficha; devuelve solo tratos sin ficha
- [x] 1.6 [GREEN] `src/features/kanban/lib/useTratosSinFicha.ts` — hook derivado: `useTratos()` + `useFichas()`, retorna `tratos.filter(t => !fichas.some(f => f.tratoId === t.id))`
- [x] 1.7 [REFACTOR] `src/features/kanban/hooks/useCreateFicha.ts` — quitar comentario `'MOCK_USER'`; sin cambio funcional (el dialog ya pasa el UUID completo)
- [x] 1.8 Verificar batch: `pnpm test:run` — todos los tests en verde antes de continuar

## Batch 2: useQuitarColumna (DELETE hook con 409 vs 422)

- [x] 2.1 [RED] `src/features/kanban/__tests__/hooks.write.test.ts` — agregar tests: invoca `DELETE eliminar-columna?id=&columnaId=`; invalida `['tableros', tableroId]` tras 204; 409 muestra toast distinto al 422; 422 no muestra toast genérico
- [x] 2.2 [GREEN] `src/features/kanban/hooks/useQuitarColumna.ts` — crear hook: `apiClient.delete(endpoints.tableros.eliminarColumna(tableroId, columnaId))`; `onSuccess`: invalida `tablerosKeys.detail(tableroId)` + `toast.success`; `onError`: 409 → toast 'La columna tiene fichas; muévelas o elimínalas antes de quitarla'; 422 → return sin toast genérico; else → toast.error genérico
- [x] 2.3 Verificar batch: `pnpm test:run` — verde (502/502)

## Batch 3: FichaForm + FichaCreateDialog

- [x] 3.1 [RED] `src/features/kanban/__tests__/KanbanCard.test.tsx` — agregar test de `FichaForm`: selector de trato muestra solo tratos sin ficha; `tratoId` requerido muestra error si vacío; `columnaId` precargado no es editable
- [x] 3.2 [GREEN] `src/features/kanban/components/FichaForm.tsx` — crear componente presentacional: rhf+zodResolver con `fichaFormSchema` (`tratoId` requerido, `responsableId` requerido); selectores para `useTratosSinFicha()` y `useUsuarios()`; render `serverErrors` por campo; prop `columnaId` read-only display
- [x] 3.3 [RED] `src/features/kanban/__tests__/KanbanCard.test.tsx` — agregar tests de `FichaCreateDialog`: envía body con `creadoPor: MOCK_USER_ID`, `tipoFicha: 'TRATO'`, `columnaId` precargado, `tratoId` y `responsableId` del form; invalida `['fichas']`; cierra el dialog tras éxito; 422 muestra serverError en campo y mantiene dialog abierto
- [x] 3.4 [GREEN] `src/features/kanban/components/FichaCreateDialog.tsx` — wrapper Dialog + `useCreateFicha`; recibe prop `columnaId`; compone `FichaCreateInput` con `{ ...formValues, columnaId, tipoFicha: 'TRATO', creadoPor: MOCK_USER_ID }`; tras éxito invalida `['fichas']` y cierra
- [x] 3.5 Verificar batch: `pnpm test:run` — verde

## Batch 4: FichaDeleteDialog + KanbanCard dropdown

- [x] 4.1 [RED] `src/features/kanban/__tests__/KanbanCard.test.tsx` — agregar test: `FichaDeleteDialog` no invoca DELETE al cancelar; muestra `isDeleting` deshabilitado en botón confirmar
- [x] 4.2 [GREEN] `src/features/kanban/components/FichaDeleteDialog.tsx` — AlertDialog presentacional: props `fichaId`, `onConfirm`, `onCancel`, `isDeleting`; botón confirmar llama `onConfirm`; botón cancelar llama `onCancel`; sin lógica de red
- [x] 4.3 [RED] `src/features/kanban/__tests__/KanbanCard.test.tsx` — agregar test: KanbanCard muestra `trato.nombre` si disponible; abre dropdown con opción "Eliminar"; seleccionar "Eliminar" abre FichaDeleteDialog; confirmar invoca `DELETE /api/fichas/delete?id=`; cancelar no invoca DELETE
- [x] 4.4 [GREEN] `src/features/kanban/components/KanbanCard.tsx` — agregar dropdown Radix con opción "Eliminar"; mostrar `trato.nombre` en la tarjeta si está disponible; integrar `FichaDeleteDialog` + `useDeleteFicha`
- [x] 4.5 Verificar batch: `pnpm test:run` — verde

## Batch 5: Threading tableroId + botones en KanbanColumn + Asignar columna en KanbanPage

- [x] 5.1 [RED] `src/features/kanban/__tests__/KanbanBoard.test.tsx` — agregar test: KanbanBoard recibe y threadea `tableroId` a cada KanbanColumn
- [x] 5.2 [GREEN] `src/features/kanban/components/KanbanBoard.tsx` — agregar prop `tableroId: string`; pasarla a cada `<KanbanColumn tableroId={tableroId} .../>`
- [x] 5.3 [RED] `src/features/kanban/__tests__/KanbanColumn.test.tsx` — agregar test: header muestra botón "+"; botón "+" abre `FichaCreateDialog` con `columnaId` precargado; header muestra botón "Quitar columna"; clic en "Quitar columna" invoca `useQuitarColumna` con `tableroId` y `columnaId`
- [x] 5.4 [GREEN] `src/features/kanban/components/KanbanColumn.tsx` — agregar prop `tableroId: string`; botón "+" en header que abre `FichaCreateDialog(columnaId)`; botón "Quitar columna" en header que llama `useQuitarColumna`
- [x] 5.5 [RED] `src/features/kanban/__tests__/KanbanPage.test.tsx` — agregar test: KanbanPage pasa `tableroId={tablero.id}` a KanbanBoard; UI "Asignar columna" invoca `useAsignarColumna` con `asignarColumnaSchema` (limiteWip >= 1 requerido)
- [x] 5.6 [GREEN] `src/features/kanban/pages/KanbanPage.tsx` — pasar `tableroId={tablero.id}` a `<KanbanBoard>`; alojar UI "Asignar columna" con `asignarColumnaSchema` + `useAsignarColumna`
- [x] 5.7 Verificar batch final: `pnpm test:run` — 100% verde (todos los batches)
