# Tasks: Kanban de Tratos (kanban-tablero-back)

> Strict TDD activo: cada tarea de código sigue RED → GREEN → REFACTOR. Test runner: `pnpm test:run`.
> Dependencias de batch son lineales: B2 depende de B1, B3 de B2, etc. B8 solo depende de B4+B5.

---

## B1 — Infraestructura base (instalación + schemas + endpoints + limpieza)

_Prerequisito de todo. Sin esto nada compila._

- [x] B1.1 — Instalar `@dnd-kit/core` y `@dnd-kit/utilities`: `pnpm add @dnd-kit/core @dnd-kit/utilities`. Verificar que aparece en `package.json`.
- [x] B1.2 — **[RED]** Crear `src/features/kanban/__tests__/schemas.test.ts`: tests `.safeParse` para enums (`tipoTablero`, `tipoFicha`, `estadoTrato`) y shapes de `tableroSchema`, `columnaTableroSchema`, `fichaSchema`, `fichaCreateSchema`, `fichaEditSchema`. Verificar que falla.
- [x] B1.3 — **[GREEN]** Crear `src/features/kanban/schemas/tablero.schema.ts`: enums `tipoTablero`, `tipoColumna`, `estadoTrato` + `columnaTableroSchema` (id/nombre/color/limiteWip/nota/estadoTarea/estadoTrato/totalValorEstimado) + `tableroSchema` (id/nombre/descripcion/tipoTablero/columnas/creadoEn). Exportar `Tablero`, `ColumnaTablero` con `z.infer`.
- [x] B1.4 — **[GREEN]** Crear `src/features/kanban/schemas/ficha.schema.ts`: enum `tipoFicha` + `fichaSchema` (id/columnaId/tipoFicha/tratoId/tareaId/responsableId/creadoPor/creadoEn/actualizadoEn) + `fichaCreateSchema` (columnaId/tipoFicha/tratoId/tareaId/responsableId/creadoPor) + `fichaEditSchema` (mismo sin creadoPor). Exportar `Ficha`, `FichaCreateInput`, `FichaEditInput`.
- [x] B1.5 — **[GREEN]** Crear `src/features/kanban/schemas/columna.schema.ts`: `columnaSchema` (id/nombre/color/tipoTablero/tipoColumna). Exportar `Columna`.
- [x] B1.6 — **[REFACTOR]** Verificar que todos los `.safeParse` de B1.2 pasan con `pnpm test:run`.
- [x] B1.7 — Modificar `src/api/endpoints.ts`: agregar bloques `tableros`, `columnas`, `fichas` con rutas RPC `?id=` (get-all, get-by-id, edit, asignar-columna, eliminar-columna, reordenar-columnas para tableros; get-all para columnas; get-all, create, edit, delete para fichas).
- [x] B1.8 — Modificar `src/api/types.ts`: borrar interfaces inventadas `Tablero`, `Columna`, `Ficha` y el tipo `TipoFicha = 'trato' | 'tarea'` (líneas ~10 y ~113-136). Corregir cualquier import roto en `src/mocks/fixtures/tableros.ts` y `src/mocks/handlers/tableros.ts`.

---

## B2 — Hooks de lectura

_Depende de B1 (schemas + endpoints)._

- [x] B2.1 — **[RED]** Crear `src/features/kanban/__tests__/hooks.read.test.ts`: tests de integración con MSW stub mínimo para `useTableros` (filtra TRATOS), `useTablero(id)` (retorna tablero con columnas), `useFichas` (retorna todas, filtrable por columnaId client-side). Verificar que fallan.
- [x] B2.2 — **[GREEN]** Crear `src/features/kanban/hooks/useTableros.ts`: `tablerosKeys = { all: ['tableros'] }` + `useTableros()` que llama GET `endpoints.tableros.getAll()`, parsea con `tableroSchema`, exporta queryKey.
- [x] B2.3 — **[GREEN]** Crear `src/features/kanban/hooks/useTablero.ts`: `useTablero(id?)` con queryKey `['tableros', id]`, habilitada solo cuando `id` es truthy. Llama GET `endpoints.tableros.getById(id)`, parsea con `tableroSchema`.
- [x] B2.4 — **[GREEN]** Crear `src/features/kanban/hooks/useColumnas.ts`: `useColumnas()` con queryKey `['columnas']`, llama GET `endpoints.columnas.getAll()`, parsea con `columnaSchema` array.
- [x] B2.5 — **[GREEN]** Crear `src/features/kanban/hooks/useFichas.ts`: `fichasKeys = { all: ['fichas'] }` + `useFichas()` con queryKey `['fichas']`, llama GET `endpoints.fichas.getAll()`, parsea con `fichaSchema` array.
- [x] B2.6 — **[REFACTOR]** Pasar tests de B2.1 con `pnpm test:run`.

---

## B3 — Hooks de escritura

_Depende de B2 (fichasKeys + tablerosKeys para invalidación)._

- [x] B3.1 — **[RED]** Crear `src/features/kanban/__tests__/hooks.write.test.ts`: tests de mutación para `useCreateFicha` (llama POST, invalida ['fichas']), `useUpdateFicha` (llama PUT, invalida ['fichas']), `useDeleteFicha` (llama DELETE 204, invalida ['fichas']), `useAsignarColumna` (llama POST asignar-columna, invalida ['tableros', id]), `useReordenarColumnas` (llama PUT reordenar-columnas, valida lista completa). Verificar que fallan.
- [x] B3.2 — **[GREEN]** Crear `src/features/kanban/hooks/useCreateFicha.ts`: `useMutation` POST `endpoints.fichas.create()`, body tipado con `FichaCreateInput`, invalida `fichasKeys.all` en `onSuccess`. Nota: `responsableId`/`creadoPor` llegan como input (mock con constante `'MOCK_USER'` hasta que auth esté en scope).
- [x] B3.3 — **[GREEN]** Crear `src/features/kanban/hooks/useUpdateFicha.ts`: `useMutation` PUT `endpoints.fichas.edit(id)`, input `{id: string, data: FichaEditInput}`, body reenvía estado completo (sin creadoPor), invalida `fichasKeys.all` en `onSuccess`.
- [x] B3.4 — **[GREEN]** Crear `src/features/kanban/hooks/useDeleteFicha.ts`: `useMutation` DELETE `endpoints.fichas.delete(id)`, espera 204, invalida `fichasKeys.all`.
- [x] B3.5 — **[GREEN]** Crear `src/features/kanban/hooks/useAsignarColumna.ts`: `useMutation` POST `endpoints.tableros.asignarColumna(tableroId, columnaId)`, body `AsignarColumnaInput` (limiteWip/nota/estadoTrato/totalValorEstimado), invalida `['tableros', tableroId]`.
- [x] B3.6 — **[GREEN]** Crear `src/features/kanban/hooks/useReordenarColumnas.ts`: `useMutation` PUT `endpoints.tableros.reordenarColumnas(tableroId)`, body `{nuevoOrden: string[]}`, valida `nuevoOrden.length === columnas.length` antes de llamar (si no, no invoca), invalida `['tableros', tableroId]`.
- [x] B3.7 — **[REFACTOR]** Pasar tests de B3.1 con `pnpm test:run`.

---

## B4 — Lib: deriveEstadoTrato

_Depende de B1 (tipos Ficha + ColumnaTablero). Independiente de B2/B3._

- [x] B4.1 — **[RED]** Crear `src/features/kanban/__tests__/deriveEstadoTrato.test.ts`: 10 unit tests (ABIERTO/GANADO/PERDIDO + edge cases: sin ficha, columnaId huérfano, estadoTrato null, fichas/columnas vacías, múltiples fichas, filtro tipoFicha TAREA). Verificado fallaban.
- [x] B4.2 — **[GREEN]** Crear `src/features/kanban/lib/deriveEstadoTrato.ts`: función pura `deriveEstadoTrato(tratoId, fichas, columnas)` — busca ficha con `tipoFicha === 'TRATO'` y `tratoId === tratoId`, cruza `columnaId → columna.estadoTrato`, retorna `EstadoTrato | null`.
- [x] B4.3 — **[REFACTOR]** 10/10 tests verdes con `pnpm test:run`. Type-check: 0 errores propios (corregido spread frágil `...columnas[0]` en el test que rompía con noUncheckedIndexedAccess).

---

## B5 — MSW: fixtures + handlers reescritos al contrato real

_Depende de B1 (tipos nuevos de schemas, no de api/types). Puede correr en paralelo con B3/B4._

- [x] B5.1 — Reescribir `src/mocks/fixtures/tableros.ts`: exportar `tableroTratosFixture` (TableroResponse con 4 columnas: 2×ABIERTO, 1×GANADO, 1×PERDIDO con `limiteWip` en al menos una), `columnasFixture` (catálogo), `fichasFixture` (FichaResponse array con 3+ fichas con `tipoFicha: 'TRATO'`, `tratoId` apuntando a ids de `tratosFixture`, `creadoEn` ordenables). Usar shape real del back (camelCase, sin `tipo_ficha`, sin `tablero_id`).
- [x] B5.2 — Reescribir `src/mocks/handlers/tableros.ts`: handlers con patrón RPC `?id=` (url.searchParams.get) para `tableros/get-all`, `tableros/get-by-id?id=`, `tableros/asignar-columna?id=&columnaId=`, `tableros/reordenar-columnas?id=`, `tableros/eliminar-columna?id=&columnaId=`; `columnas/get-all`; `fichas/get-all`, `fichas/create`, `fichas/edit?id=` (merge columnaId), `fichas/delete?id=` (204). Eliminar handlers de rutas REST antiguas (`/tableros`, `/tableros/:id`, etc.).
- [x] B5.3 — Verificar que `src/mocks/handlers/index.ts` sigue exportando `tablerosHandlers` (sin cambios, ya importa el archivo).
- [x] B5.4 — **[RED]** Crear `src/mocks/handlers/__tests__/tableros.handler.test.ts`: tests que confirmen que `GET /api/tableros/get-all` retorna tableros, `GET /api/fichas/get-all` retorna fichas, `PUT /api/fichas/edit?id=` actualiza columnaId. Verificar que fallan.
- [x] B5.5 — **[GREEN]** Ajustar handlers/fixtures hasta pasar tests de B5.4.

---

## B6 — Componentes Kanban + DnD

_Depende de B2 (hooks lectura) + B3 (useUpdateFicha para DnD) + B4 (deriveEstadoTrato) + B5 (MSW)._

- [x] B6.1 — **[RED]** Crear `src/features/kanban/__tests__/KanbanColumn.test.tsx`: tests component — renderiza nombre/color/badge estadoTrato, muestra limiteWip cuando no es null, muestra indicador WIP superado cuando fichas.length > limiteWip, oculta indicador cuando limiteWip es null. Verificar que fallan.
- [x] B6.2 — **[GREEN]** Crear `src/features/kanban/components/KanbanColumn.tsx`: `useDroppable({ id: columnaId })`, recibe props `columna: ColumnaTablero`, `fichas: Ficha[]`, renderiza nombre + badge estadoTrato + indicador limiteWip, distribuye `KanbanCard` children.
- [x] B6.3 — **[RED]** Crear `src/features/kanban/__tests__/KanbanCard.test.tsx`: tests — renderiza tratoId visible, es draggable (aria-grabbed o data-dnd), no reordena dentro de la misma columna. Verificar que fallan.
- [x] B6.4 — **[GREEN]** Crear `src/features/kanban/components/KanbanCard.tsx`: `useDraggable({ id: fichaId })`, recibe `ficha: Ficha`, muestra tratoId u otro dato identificable del trato.
- [x] B6.5 — **[RED]** Crear `src/features/kanban/__tests__/KanbanBoard.test.tsx`: test de integración — drag de ficha a otra columna invoca `PUT /api/fichas/edit?id=` con nuevo columnaId; drag a misma columna NO invoca HTTP. Verificar que fallan.
- [x] B6.6 — **[GREEN]** Crear `src/features/kanban/components/KanbanBoard.tsx`: `<DndContext onDragEnd={handle}>` wrapping columnas. `onDragEnd`: si `over.id !== ficha.columnaId` → `useUpdateFicha({ id: fichaId, data: { ...fichaActual, columnaId: over.id } })`; si igual → no-op. Agrupar fichas por columnaId, ordenar por creadoEn ASC.
- [x] B6.7 — **[REFACTOR]** Pasar todos los tests de B6 con `pnpm test:run`.

---

## B7 — KanbanPage + routing + Sidebar

_Depende de B6 (KanbanBoard) + B2 (useTableros, useTablero, useFichas)._

- [x] B7.1 — **[RED]** Crear `src/features/kanban/__tests__/KanbanPage.test.tsx`: test integración — `/tableros` muestra solo tableros TRATOS; `/tableros` con array vacío muestra empty state; error 500 muestra botón reintentar; `/tableros/t1` renderiza columnas en orden del back; 404 redirige a `/tableros`. Verificar que fallan.
- [x] B7.2 — **[GREEN]** Crear `src/features/kanban/pages/KanbanListPage.tsx`: consume `useTableros()`, filtra `tipoTablero === 'TRATOS'`, renderiza lista con links a `/tableros/:id`, maneja empty state y error.
- [x] B7.3 — **[GREEN]** Crear `src/features/kanban/pages/KanbanPage.tsx`: consume `useTablero(id)` + `useFichas()`, filtra fichas de `tipoFicha === 'TRATO'` cuyo `columnaId` esté en el tablero, renderiza `KanbanBoard`. Maneja 404 con redirect y toast.
- [x] B7.4 — Modificar `src/routes/router.tsx`: agregar rutas `/tableros` → `KanbanListPage` y `/tableros/:id` → `KanbanPage`. Eliminar o comentar uso de `TablerosPlaceholder`.
- [x] B7.5 — Modificar `src/routes/placeholders.tsx`: eliminar `TablerosPlaceholder` (verificado con grep: solo la usaba router.tsx, eliminada).
- [x] B7.6 — Modificar `src/components/layout/Sidebar.tsx`: quitar `disabled: true` y badge "Próximamente" del item "Tableros". Verificar que navega a `/tableros`.
- [x] B7.7 — **[RED]** Crear/actualizar `src/features/kanban/__tests__/Sidebar.kanban.test.tsx` (o test existente de Sidebar): item "Tableros" está habilitado, sin badge "Próximamente", navega a `/tableros`. Verificar que fallan.
- [x] B7.8 — **[REFACTOR]** Pasar tests de B7 con `pnpm test:run`.

---

## B8 — Fix W1: ContactoDetailPage (tieneTratosActivos)

_Depende de B4 (deriveEstadoTrato) + B5 (MSW fichas). Puede correr en paralelo con B6/B7._

- [x] B8.1 — **[RED]** Actualizar `src/features/contactos/__tests__/ContactoDetailPage.test.tsx`: agregar scenario "INACTIVO deshabilitado si trato tiene ficha en columna ABIERTO" y "INACTIVO habilitado si todos los tratos tienen fichas en GANADO/PERDIDO" y "INACTIVO habilitado si contacto no tiene tratos". Verificar que los nuevos scenarios fallan (W1 buggy).
- [x] B8.2 — **[GREEN]** Modificar `src/features/contactos/pages/ContactoDetailPage.tsx`: importar `useFichas` de kanban/hooks + `deriveEstadoTrato` de kanban/lib. Reemplazar `const tieneTratosActivos = tratosDelContacto.length > 0` por `const tieneTratosActivos = tratosDelContacto.some(t => deriveEstadoTrato(t.id, fichas ?? [], columnasTablTratos) === 'ABIERTO')`. Cargar `useTablero` del primer tablero TRATOS para extraer sus columnas.
- [x] B8.3 — Modificar `src/features/contactos/hooks/useTransicionEstado.ts` (si existe): actualizar comentario para reflejar que el estado viene de la columna Kanban (no de campo `trato.estado`).
- [x] B8.4 — **[REFACTOR]** Pasar todos los scenarios de B8.1 con `pnpm test:run`.

---

## B9 — Cierre: type-check + suite verde

_Depende de todos los batches anteriores._

- [x] B9.1 — Ejecutar `pnpm type-check`. Corregir todos los errores de TypeScript (especialmente imports a `Tablero/Columna/Ficha` de `api/types` que ya no existen — deben apuntar a `kanban/schemas`).
- [x] B9.2 — Ejecutar `pnpm test:run`. Verificar que todos los tests pasan (0 failures). Resolver cualquier test roto por la eliminación de tipos viejos en B1.8.
- [x] B9.3 — Verificar que los handlers de MSW del B5 no colisionan con rutas de otros handlers (tratos, contactos). Ajustar si hay conflictos de path.
- [x] B9.4 — Eliminar cualquier import residual de `Tablero`, `Columna`, `Ficha`, `TipoFicha` de `src/api/types` en archivos fuera de kanban/ (etiquetas-comentarios.ts, tableros.handler.test si queda). Confirmar con `pnpm type-check`.

---

## Trazabilidad Spec → Tasks

| Requirement spec | Batch/Tarea |
|---|---|
| Listar tableros TRATOS (filtrado client-side) | B7.1, B7.2 |
| Ver tablero con columnas (orden back, badge estadoTrato, limiteWip) | B6.1, B6.2, B7.1, B7.3 |
| Listar fichas (filtrar por columnaId, tipoFicha TRATO, orden creadoEn) | B2.5, B6.6 |
| Crear ficha trato (POST, tratoId requerido, invalida ['fichas']) | B3.2 |
| Editar ficha (PUT estado completo, invalida ['fichas']) | B3.3 |
| Eliminar ficha (DELETE 204, invalida ['fichas']) | B3.4 |
| Mover ficha DnD (solo ENTRE columnas, no-op misma columna) | B6.5, B6.6 |
| Derivar estado trato de columna (util pura) | B4.1, B4.2 |
| Gestionar columnas (asignar-columna, eliminar-columna, @Deprecated guard) | B3.5 |
| Reordenar columnas (lista completa, validar length) | B3.6 |
| Limite WIP visual (client-side, null = sin indicador) | B6.1, B6.2 |
| Sidebar + routing /tableros y /tableros/:id | B7.4, B7.5, B7.6 |
| W1: tieneTratosActivos derivado de columna.estadoTrato ABIERTO | B8.1, B8.2 |
| TratoResponse sin campo `estado` (schema Zod) | B1.3 (tablero), B1.4 (ficha, no expone estado) |
| Enums exactos confirmados vs Java | B1.3, B1.4 |
| MSW drop-in contrato back | B5.1, B5.2 |

---

## Notas de implementación (NO CONFIRMADO — marcar en código)

- `responsableId`/`creadoPor` en `useCreateFicha`: usar constante `'MOCK_USER'` hasta que auth sea in-scope (B3.2).
- Selección tablero TRATOS en W1: tomar `tableros.find(t => t.tipoTablero === 'TRATOS')` — no se confirmó unicidad (B8.2).
- WIP server-side: no existe en contrato leído; enforcement solo UI (B6.6).

---

## Addendum — Correcciones post-verify (2026-05-29)

Dos observaciones del verify-report resueltas con Strict TDD. No son batches nuevos; son correcciones quirúrgicas sobre B3.6 y B8.

### Corrección C1 — useReordenarColumnas: validación de permutación completa (WARNING B3.6)

**Problema**: el guard solo validaba `nuevoOrden.length === 0`. El spec exige permutación EXACTA.

**Cambio en `src/features/kanban/hooks/useReordenarColumnas.ts`**:
- Nueva firma: `ReordenarColumnasVars` agrega `idsActuales: string[]`
- Guards adicionales: length igual, sin duplicados (Set size), sin ids ajenos (set containment)
- Si algún guard falla → `Promise.reject` sin HTTP, con mensaje descriptivo

**Cambio en `src/features/kanban/__tests__/hooks.write.test.ts`**:
- Todos los tests existentes de `useReordenarColumnas` actualizados a la nueva firma (agregan `idsActuales`)
- 4 tests nuevos: subconjunto incompleto, duplicados, ids ajenos, vacío con `isError: true`

**Callers**: ninguno (UI de reordenar columnas fue diferida). Solo hook + test.

### Corrección C2 — ContactoDetailPage: test edge W1 faltante (SUGGESTION B8)

**Problema**: faltaba el escenario "INACTIVO habilitado si los tratos del contacto no tienen ficha asignada" del spec contactos-management.

**Cambio en `src/features/contactos/__tests__/ContactoDetailPage.test.tsx`**:
- Test nuevo: contacto c2222222 (Diego, ACTIVO) con trato d3333333, override de fichas = `[]`
- `deriveEstadoTrato(d3333333, [], columnas)` === `null` → `tieneTratosActivos = false` → INACTIVO habilitado
- Implementación NO cambió (ya era correcta). Solo faltaba la cobertura explícita.

**Suite final**: 485/485 verdes (70 archivos). Type-check: 5 errores pre-existentes de contactos, 0 propios.
