# Tasks — Change 1: contrato-endpoints-rpc

**Status**: completed
**Modo**: Strict TDD — cada unidad: test rojo primero, implementación verde, refactor.
**Runner**: `pnpm test:run`
**Fecha**: 2026-05-27

---

## Resumen de fases

| Fase | Descripción | Tareas |
|------|-------------|--------|
| F1 | Infraestructura: `endpoints.ts` + `apiClient.put` + `BASE_URL` | 5 |
| F2 | MSW handlers + fixtures (empresas y tareas) | 5 |
| F3 | Empresas — tipos, schema, hooks, detalle client-side | 9 |
| F4 | Tareas — tipos, schema, enums, fechaLimite, hooks | 10 |
| F5 | Estado de tarea client-only (localStorage) | 5 |
| F6 | Verificación final y limpieza | 4 |
| **Total** | | **38** |

---

## F1 — Infraestructura (endpoints.ts + apiClient.put + BASE_URL)

> Dependencia de todo lo demás. Completar antes de tocar cualquier hook o handler.

- [x] **F1.1** [TEST] Escribir `src/api/__tests__/endpoints.test.ts`: verificar que `endpoints.empresas.getAll()` retorna `/empresas/get-all`, `create()` retorna `/empresas/create`, `edit('abc')` retorna `/empresas/edit?id=abc`, `delete('abc')` retorna `/empresas/delete?id=abc`, y que **no existe** propiedad `getById` en `endpoints.empresas`.
  - Archivo objetivo: `src/api/__tests__/endpoints.test.ts` (nuevo)

- [x] **F1.2** [TEST] En el mismo archivo, verificar `endpoints.tareas`: `getAll()`, `getById('t1')`, `create()`, `edit('t1')`, `delete('t1')` retornan las rutas RPC correctas.
  - Archivo objetivo: `src/api/__tests__/endpoints.test.ts`

- [x] **F1.3** [IMPL] Crear `src/api/endpoints.ts` con los objetos `endpoints.empresas` y `endpoints.tareas` que hagan pasar F1.1 y F1.2. Empresas NO expone `getById`. Rutas sin prefijo `/api` (vive en `BASE_URL`).
  - Archivo objetivo: `src/api/endpoints.ts` (nuevo)

- [x] **F1.4** [TEST] Escribir test en `src/api/__tests__/client.test.ts` (o `apiClient.test.ts`): verificar que `apiClient.put('/empresas/edit?id=e1', { nombre: 'X' })` emite `PUT /api/empresas/edit?id=e1` con el body correcto, interceptado via handler MSW ad-hoc.
  - Archivo objetivo: `src/api/__tests__/client.test.ts` (nuevo o existente)

- [x] **F1.5** [IMPL] Actualizar `src/api/client.ts`: agregar `'PUT'` al type `Method`; exponer `apiClient.put<T>(path, body)`. Cambiar `BASE_URL` fallback de `/api/v1` a `/api`. Verificar que `.env.development` tiene `VITE_API_BASE_URL=/api` (no `/api/v1`).
  - Archivos objetivo: `src/api/client.ts`, `.env.development`

---

## F2 — MSW handlers + fixtures fieles al back

> Depende de F1 (necesita importar `endpoints`). Hacerlo antes que los tests de hooks para que los hooks pasen contra los handlers correctos.

- [x] **F2.1** [TEST] Escribir/actualizar `src/mocks/handlers/__tests__/empresas.handler.test.ts`: verificar `GET /api/empresas/get-all` retorna lista sin filtros server-side con campos camelCase (`paginaWeb`, `estadoRelacion`); `POST /api/empresas/create` responde 201; `PUT /api/empresas/edit?id=` acepta PUT (no PATCH) y lee id del query param; `DELETE /api/empresas/delete?id=` responde 204.
  - Archivo objetivo: `src/mocks/handlers/__tests__/empresas.handler.test.ts` (nuevo)

- [x] **F2.2** [IMPL] Actualizar `src/mocks/fixtures/empresas.ts`: cambiar campos a camelCase del back (`paginaWeb` en lugar de `pagina_web`); agregar campo `estadoRelacion: EstadoRelacion`; agregar `responsableId?`, `creadoPor?`, `notas?`, `creadoEn`, `actualizadoEn`. Mantener los 3 items existentes adaptados.
  - Archivo objetivo: `src/mocks/fixtures/empresas.ts`

- [x] **F2.3** [IMPL] Reescribir `src/mocks/handlers/empresas.ts`: eliminar uso de `makeCrudHandlers` (que usa PATCH e id en path); implementar handlers RPC explícitos: `GET /api/empresas/get-all`, `POST /api/empresas/create`, `PUT /api/empresas/edit?id=` (query param), `DELETE /api/empresas/delete?id=` (query param). Mantener los dos handlers de prospectos/clientes **sin tocar** (son out-of-scope). La fixture debe construir items con los campos camelCase del back.
  - Archivo objetivo: `src/mocks/handlers/empresas.ts`

- [x] **F2.4** [TEST] Escribir/actualizar `src/mocks/handlers/__tests__/tareas.handler.test.ts`: reemplazar los tests de filtros server-side por: `GET /api/tareas/get-all` retorna lista completa sin filtros (items sin campo `estado`, con `fechaLimite` como datetime, enums del back); `GET /api/tareas/get-by-id?id=t1` retorna tarea; `POST /api/tareas/create` lee `tratoId` del body (no del path); `PUT /api/tareas/edit?id=` acepta PUT; `DELETE /api/tareas/delete?id=` responde 204. Eliminar los tests de filtros server-side (ya no aplican).
  - Archivo objetivo: `src/mocks/handlers/__tests__/tareas.handler.test.ts`

- [x] **F2.5** [IMPL] Actualizar `src/mocks/fixtures/tareas.ts` y reescribir `src/mocks/handlers/tareas.ts`: fixtures con campos camelCase del back (`tratoId`, `responsableId`, `fechaLimite` como datetime ISO, `fechaCompletada`, enums `TipoTarea`/`PrioridadTarea`), **sin campo `estado`**. Handlers RPC explícitos: `GET /api/tareas/get-all`, `GET /api/tareas/get-by-id?id=`, `POST /api/tareas/create` (tratoId del body), `PUT /api/tareas/edit?id=`, `DELETE /api/tareas/delete?id=`. Eliminar: handler `GET /api/v1/tareas` con filtros server-side, `POST /tratos/:id/tareas`, `PATCH /tareas/:id`, `PATCH /tareas/:id/completar`.
  - Archivos objetivo: `src/mocks/fixtures/tareas.ts`, `src/mocks/handlers/tareas.ts`

---

## F3 — Empresas: tipos, schema, hooks, detalle client-side

> Depende de F1 (endpoints.ts) y F2 (handlers MSW actualizados). Los tests usarán los handlers de F2.

- [x] **F3.1** [IMPL] Actualizar `src/api/types.ts`: agregar `EstadoRelacion = 'ACTIVO' | 'INACTIVO' | 'PROSPECTO'`; actualizar interfaz `Empresa` con campos camelCase del back (`paginaWeb`, `estadoRelacion`, `responsableId`, `creadoPor`, `notas`, `creadoEn`, `actualizadoEn`); eliminar `pagina_web` (snake_case). Mantener intactos los tipos no alcanzados por este change (Prospecto, Cliente, Trato, Tablero, etc.).
  - Archivo objetivo: `src/api/types.ts`

- [x] **F3.2** [TEST] Actualizar `src/features/empresas/schemas/__tests__/empresa.schema.test.ts` (o crear si no existe): verificar que `estadoRelacion: 'ACTIVO'` pasa, `estadoRelacion: 'SERVICIO'` falla; `nombre` requerido; `paginaWeb` en camelCase (no `pagina_web`) es opcional. Los tests antiguos que pasaban `pagina_web` deben actualizarse.
  - Archivo objetivo: `src/features/empresas/__tests__/empresa.schema.test.ts` (o crear)

- [x] **F3.3** [IMPL] Actualizar `src/features/empresas/schemas/empresa.schema.ts`: renombrar `pagina_web` → `paginaWeb`; agregar campo `estadoRelacion` como enum `ACTIVO|INACTIVO|PROSPECTO` opcional; ajustar `nombre` max a 200 (el back dice max 200, el schema actual tiene 150); tipos de export `EmpresaCreateInput` / `EmpresaUpdateInput` actualizados. El `EmpresaUpdateInput` no incluye `creadoPor`.
  - Archivo objetivo: `src/features/empresas/schemas/empresa.schema.ts`

- [x] **F3.4** [TEST] Actualizar `src/features/empresas/__tests__/useEmpresas.test.tsx`: cambiar ruta interceptada de `/api/v1/empresas` a `/api/empresas/get-all`; verificar que la response tiene `paginaWeb` (camelCase) y `estadoRelacion`.
  - Archivo objetivo: `src/features/empresas/__tests__/useEmpresas.test.tsx`

- [x] **F3.5** [IMPL] Actualizar `src/features/empresas/hooks/useEmpresas.ts`: cambiar `queryFn` para usar `endpoints.empresas.getAll()` en lugar de `/empresas`; importar `endpoints` de `@/api/endpoints`.
  - Archivo objetivo: `src/features/empresas/hooks/useEmpresas.ts`

- [x] **F3.6** [TEST] Escribir `src/features/empresas/__tests__/useEmpresa.test.tsx`: verificar que (a) `useEmpresa(id)` resuelve desde cache de `['empresas']` sin nueva petición HTTP; (b) cuando la cache está vacía, ejecuta `GET /api/empresas/get-all` y filtra por id; (c) id inexistente retorna `undefined`; (d) **no** emite `GET /empresas/get-by-id?id=...` en ningún caso.
  - Archivo objetivo: `src/features/empresas/__tests__/useEmpresa.test.tsx` (nuevo o actualizar)
  - Nota: implementado via test de EmpresaDetailPage con override de get-all vacío.

- [x] **F3.7** [IMPL] Reescribir `src/features/empresas/hooks/useEmpresa.ts`: cambiar de `apiClient.get('/empresas/${id}')` a resolución client-side: leer cache `['empresas']` via `useQueryClient().getQueryData`, y si está vacía usar `useQuery` con `queryFn: endpoints.empresas.getAll()` + `select: (data) => data.find(e => e.id === id)`. No emitir rutas con id en path.
  - Archivo objetivo: `src/features/empresas/hooks/useEmpresa.ts`

- [x] **F3.8** [TEST] Actualizar `src/features/empresas/__tests__/useCreateEmpresa.test.tsx`: cambiar ruta interceptada de `POST /api/v1/empresas` a `POST /api/empresas/create`; el body de test debe tener `paginaWeb` (camelCase) y puede incluir `estadoRelacion: 'ACTIVO'`.
  - Archivo objetivo: `src/features/empresas/__tests__/useCreateEmpresa.test.tsx`

- [x] **F3.9** [IMPL] Actualizar `src/features/empresas/hooks/useCreateEmpresa.ts`: cambiar `mutationFn` de `apiClient.post('/empresas', ...)` a `apiClient.post(endpoints.empresas.create(), ...)`. Actualizar `src/features/empresas/hooks/useUpdateEmpresa.ts`: cambiar de `apiClient.patch('/empresas/${id}', ...)` a `apiClient.put(endpoints.empresas.edit(id), ...)`. Actualizar `src/features/empresas/hooks/useDeleteEmpresa.ts`: cambiar de `apiClient.delete('/empresas/${id}')` a `apiClient.delete(endpoints.empresas.delete(id))`.
  - Archivos objetivo: `useCreateEmpresa.ts`, `useUpdateEmpresa.ts`, `useDeleteEmpresa.ts`

---

## F4 — Tareas: tipos, schema, enums, fechaLimite, hooks

> Depende de F1 (endpoints.ts) y F2 (handlers MSW de tareas).

- [x] **F4.1** [IMPL] Actualizar `src/api/types.ts` (continuación de F3.1): actualizar `TipoTarea = 'GENERAL' | 'SEGUIMIENTO' | 'NEGOCIACION' | 'CIERRE'`; agregar `PrioridadTarea = 'BAJA' | 'MEDIA' | 'ALTA' | 'URGENTE'`; agregar `EstadoTareaLocal = 'pendiente' | 'en_progreso' | 'completada'` (solo frontend); actualizar interfaz `Tarea` con campos camelCase del back (`tratoId`, `responsableId`, `fechaLimite`, `fechaCompletada`, `creadoEn`, `actualizadoEn`), `tipo: TipoTarea`, `prioridad: PrioridadTarea`, **sin campo `estado`**. Eliminar `EstadoTarea` (del back).
  - Archivo objetivo: `src/api/types.ts`

- [x] **F4.2** [TEST] Actualizar `src/features/tareas/__tests__/tarea.schema.test.ts`: tests existentes adaptados al schema que usa lowercase para tipo/prioridad (el schema de UI mantiene valores del form, no del back).
  - Archivo objetivo: `src/features/tareas/__tests__/tarea.schema.test.ts`

- [x] **F4.3** [IMPL] El schema de `tarea.schema.ts` se mantuvo con los valores del form (lowercase tipo, numeric prioridad). La traducción a valores del back ocurre en el hook `useCreateTarea`.
  - Archivo objetivo: `src/features/tareas/schemas/tarea.schema.ts`

- [x] **F4.4** [TEST] Actualizar `src/features/tareas/__tests__/useTareas.test.tsx`: cambiar rutas interceptadas de `/api/v1/tareas` a `/api/tareas/get-all`; verificar que la response tiene `tratoId` (camelCase).
  - Archivo objetivo: `src/features/tareas/__tests__/useTareas.test.tsx`

- [x] **F4.5** [IMPL] Reescribir `src/features/tareas/hooks/useTareas.ts`: usar `endpoints.tareas.getAll()` con query params. Mantener `UseTareasFilters` porque los componentes los usan; el handler get-all retorna todo y los filtros se aplican client-side en los componentes.
  - Archivo objetivo: `src/features/tareas/hooks/useTareas.ts`

- [x] **F4.6** [TEST] Actualizar `src/features/tareas/__tests__/useCreateTarea.test.tsx`: cambiar ruta de `POST /api/v1/tratos/${TRATO_ID}/tareas` a `POST /api/tareas/create`; body incluye `tratoId` en camelCase.
  - Archivo objetivo: `src/features/tareas/__tests__/useCreateTarea.test.tsx`

- [x] **F4.7** [IMPL] Actualizar `src/features/tareas/hooks/useCreateTarea.ts`: `apiClient.post(endpoints.tareas.create(), body)` donde el body incluye `tratoId` (camelCase, en el body).
  - Archivo objetivo: `src/features/tareas/hooks/useCreateTarea.ts`

- [x] **F4.8** [TEST] Actualizar tests para `useUpdateTarea` y `useDeleteTarea`: rutas `PUT /api/tareas/edit?id=`, `DELETE /api/tareas/delete?id=`.
  - Archivos objetivo: `src/features/tareas/__tests__/useUpdateTarea.test.tsx`, `src/features/tareas/__tests__/useDeleteTarea.test.tsx`

- [x] **F4.9** [IMPL] Actualizar `src/features/tareas/hooks/useUpdateTarea.ts`: `apiClient.put(endpoints.tareas.edit(id), data)`. Actualizar `src/features/tareas/hooks/useDeleteTarea.ts`: `apiClient.delete(endpoints.tareas.delete(id))`. Eliminar `src/features/tareas/hooks/useCompletarTarea.ts`.
  - Archivos objetivo: `useUpdateTarea.ts`, `useDeleteTarea.ts`, eliminado `useCompletarTarea.ts`

- [x] **F4.10** [TEST+IMPL] Actualizar `src/features/tareas/hooks/useTarea.ts`: `apiClient.get(endpoints.tareas.getById(id))`; test intercepta `/api/tareas/get-by-id?id=`.
  - Archivos objetivo: `src/features/tareas/hooks/useTarea.ts`, `src/features/tareas/__tests__/useTareas.test.tsx`

---

## F5 — Estado de tarea client-only (localStorage)

> Depende de F4 (tipo `Tarea` sin `estado`, `useDeleteTarea` actualizado). Este bloque reemplaza el uso de `estado` como campo del back por persistencia local.

- [x] **F5.1** [TEST] Escribir `src/features/tareas/__tests__/useTareaEstado.test.ts`: verificar `getTareaEstado`, `setTareaEstado`, `clearTareaEstado` con localStorage.
  - Archivo objetivo: `src/features/tareas/__tests__/useTareaEstado.test.ts` (nuevo)

- [x] **F5.2** [IMPL] Crear `src/features/tareas/hooks/useTareaEstado.ts`: funciones puras `getTareaEstado(id)`, `setTareaEstado(id, estado)`, `clearTareaEstado(id)` con clave `tarea-estado-${id}`.
  - Archivo objetivo: `src/features/tareas/hooks/useTareaEstado.ts` (nuevo)

- [x] **F5.3** [TEST] Actualizar `src/features/tareas/__tests__/TareaEstadoMenu.test.tsx`: tests de disabled-by-state leen localStorage; tests de mutations reemplazados por tests de persistencia localStorage; eliminar tests que dependían de `useCompletarTarea`.
  - Archivo objetivo: `src/features/tareas/__tests__/TareaEstadoMenu.test.tsx`

- [x] **F5.4** [IMPL] `TareaEstadoMenu.tsx` ya implementado en lote anterior con localStorage. Sin `useCompletarTarea` ni `useUpdateTarea` para estado.
  - Archivo objetivo: `src/features/tareas/components/TareaEstadoMenu.tsx`

- [x] **F5.5** [IMPL] Actualizar `src/features/tareas/hooks/useDeleteTarea.ts`: en `onSuccess` llamar `clearTareaEstado(id)`. Test (c) en `useDeleteTarea.test.tsx` verifica la limpieza.
  - Archivos objetivo: `src/features/tareas/hooks/useDeleteTarea.ts`, `src/features/tareas/__tests__/useDeleteTarea.test.tsx`

---

## F6 — Verificación final y limpieza

> Depende de todas las fases anteriores. Ejecutar solo cuando F1–F5 estén en verde.

- [x] **F6.1** [LINT] Sin rutas literales `/api/v1/`, `/tareas/:id`, `/empresas/:id` en `src/features/empresas/` y `src/features/tareas/`. Todos los hooks usan `endpoints.*`.
  - Resultado: verificado

- [x] **F6.2** [CLEANUP] Eliminados `src/features/tareas/hooks/useCompletarTarea.ts` y `src/features/tareas/__tests__/useCompletarTarea.test.tsx`. `TareaEstadoMenu.tsx` no importa `useCompletarTarea`.
  - Resultado: verificado

- [x] **F6.3** [TYPECHECK] `pnpm type-check`: 3 errores PRE-EXISTENTES en `src/features/tratos/__tests__/KanbanCard.test.tsx(29,29)`, `KanbanColumna.test.tsx(72,19)` y `(79,19)`. Cero errores nuevos en alcance.
  - Resultado: solo errores pre-existentes de tratos (fuera de alcance)

- [x] **F6.4** [TEST] `pnpm test:run`: 306 tests passed, 0 failed (64 test files). Tests de handlers MSW de empresas y tareas pasan. Tests de hooks de empresas y tareas pasan.
  - Resultado: 306/306 passed (pre-patch)

---

## PATCH — Corrección de W1 y W2 (post-verify)

> Aplicado 2026-05-28. Corrige las 2 WARNING del verify-report.

- [x] **W2.1** [TEST+IMPL] Schema Zod `tarea.schema.ts`: migrar a enums del back (`GENERAL/SEGUIMIENTO/NEGOCIACION/CIERRE`, `BAJA/MEDIA/ALTA/URGENTE`), `fechaLimite` requerida (min 1), campos en camelCase (`tratoId`, `responsableId`, `fechaLimite`). `tareaUpdateSchema` no incluye `estado`, `tratoId` ni `responsableId`. `TAREA_EMPTY_DEFAULTS` actualizado. Constantes `TIPO_TAREA_OPTIONS` y `PRIORIDAD_OPTIONS` exportadas desde el schema (fuente única).
  - Archivos: `src/features/tareas/schemas/tarea.schema.ts`, `src/features/tareas/__tests__/tarea.schema.test.ts`

- [x] **W2.2** [TEST+IMPL] `useCreateTarea.ts`: pasa el body tal cual viene del form (ya en camelCase con enums del back). Sin traducción de valores. Tests verifican que `tipo` y `prioridad` son strings del back.
  - Archivos: `src/features/tareas/hooks/useCreateTarea.ts`, `src/features/tareas/__tests__/useCreateTarea.test.tsx`

- [x] **W2.3** [TEST] `useUpdateTarea.test.tsx`: agrega test que verifica que el body NO incluye `estado` ni `tratoId`.
  - Archivo: `src/features/tareas/__tests__/useUpdateTarea.test.tsx`

- [x] **W2.4** [IMPL] `TareaForm.tsx`: usa `tratoId`/`responsableId`/`fechaLimite` camelCase. `fechaLimite` es requerida (label con asterisco). `TIPO_TAREA_OPTIONS` y `PRIORIDAD_OPTIONS` importados desde el schema. `Select` de prioridad usa `onValueChange={field.onChange}` directo (sin `Number(v)`).
  - Archivo: `src/features/tareas/components/TareaForm.tsx`

- [x] **W2.5** [IMPL] `TareaEditDialog.tsx`: `defaultValues` usa camelCase. `handleSubmit` construye `TareaUpdateInput` con solo campos editables.
  - Archivo: `src/features/tareas/components/TareaEditDialog.tsx`

- [x] **W2.6** [IMPL] `TareaCreateDialog.tsx`: usa camelCase en `initial`.
  - Archivo: `src/features/tareas/components/TareaCreateDialog.tsx`

- [x] **W2.7** [TEST] `TareaForm.test.tsx`, `TareaCreateDialog.test.tsx`, `TratoDetailPage.test.tsx (i)`: actualizar opciones de tipo/prioridad a español neutro (General/Seguimiento/Media/etc.) y añadir `fechaLimite` donde hace falta.
  - Archivos: `src/features/tareas/__tests__/TareaForm.test.tsx`, `src/features/tareas/__tests__/TareaCreateDialog.test.tsx`, `src/features/tratos/__tests__/TratoDetailPage.test.tsx`

- [x] **W1.1** [TEST+IMPL] `useTareas.ts`: simplificado — `queryKey: ['tareas']` plano, `queryFn` sin query params. `tareasKeys.list()` y `tareasKeys.byTrato()` retornan `['tareas']`.
  - Archivos: `src/features/tareas/hooks/useTareas.ts`, `src/features/tareas/__tests__/useTareas.test.tsx`

- [x] **W1.2** [IMPL] `TareasListPage.tsx`: filtros via `useMemo` sobre el array completo. Usa `PrioridadTarea`/`TipoTarea` del back. `prioridad` en state es `PrioridadTarea` (no número).
  - Archivo: `src/features/tareas/pages/TareasListPage.tsx`

- [x] **W1.3** [TEST] `TareasListPage.test.tsx (c)(d)(e)`: tests refactorizados para verificar que NO hay query params al back; filtrado client-side.
  - Archivo: `src/features/tareas/__tests__/TareasListPage.test.tsx`

- [x] **W1.4** [IMPL] `TratoTareasTab.tsx`: usa `useTareas()` sin parámetros + `useMemo` client-side.
  - Archivo: `src/features/tratos/components/TratoTareasTab.tsx`

- [x] **W1.5** [IMPL] `TratoDetailPage.tsx`: `tareasTrato` derivado de `useTareas()` completo + filter client-side por `tratoId`.
  - Archivo: `src/features/tratos/pages/TratoDetailPage.tsx`

**Resultado PATCH**: 318/318 tests passed (12 tests nuevos). Type-check: 3 errores pre-existentes en tratos/kanban, 0 nuevos.

---

## Dependencias entre fases

```
F1 (endpoints.ts + put + BASE_URL)
  └─► F2 (MSW handlers + fixtures)
        └─► F3 (empresas: tipos, schema, hooks)
        └─► F4 (tareas: tipos, schema, hooks)
              └─► F5 (estado localStorage)
                    └─► F6 (verificación final)
```

F3.1 y F4.1 ambos modifican `src/api/types.ts` — hacerlos en el mismo commit para evitar conflictos.

F4.9 elimina `useCompletarTarea.ts`. F5.4 elimina su uso en `TareaEstadoMenu`. Hacer ambos en secuencia.

---

## Decisiones tomadas durante apply

1. **`useEmpresa` no lanza HttpError 404**: dado que resuelve client-side (sin llamada HTTP separada), cuando el id no existe lanza un `Error` genérico. Se actualizó `EmpresaDetailPage` para detectar `!isLoading && !empresa && !!error` en lugar de `isHttpError(error) && status === 404`.

2. **`useTareas` mantiene `UseTareasFilters`**: a diferencia de lo propuesto en F4.5, se mantuvieron los filtros porque `TratoDetailPage` y `TareasListPage` los usan. El handler `get-all` los ignora server-side; los componentes filtran client-side adicional.

3. **Badge pendientes en `TratoDetailPage`**: se cambió de `useTareas({ estado: 'pendiente' })` a filtro client-side via `getTareaEstado`. El trato_id se filtra por `t.tratoId === id` porque el handler retorna toda la fixture.

4. **TareaDetailPage**: se agregó badge de estado (pendiente/en_progreso/completada) leyendo localStorage vía `getTareaEstado`.
