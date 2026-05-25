# Tasks: tareas-management (Change 6b)

**Estrategia**: 6 lotes (A-F) por design. Strict TDD activo (`pnpm test:run`). Tests antes de implementación en todos los lotes. Cada lote = un commit semántico atómico revertible.

**Gate por lote (antes del commit)**:
- `pnpm test:run` → 0 fallidos.
- `pnpm tsc --noEmit` → exit 0.
- Smoke manual donde aplique.

---

## Lote A — Backend: fixture + handler GET /tareas

**Commit**: `feat(mocks): ampliar tareasFixture y agregar handler GET /tareas con filtros server-side`

**Pre-requisito de todos los demás lotes** (los tests de hooks y componentes mockan este endpoint).

- [x] **T_A.1** [TEST] Crear `src/mocks/handlers/__tests__/tareas.handler.test.ts`. Scenarios: (a) `GET /tareas` sin params devuelve las 7 tareas; (b) `GET /tareas?estado=pendiente` devuelve solo pendientes; (c) `GET /tareas?prioridad=1` devuelve solo prioridad alta; (d) `GET /tareas?responsable_id=22222222` devuelve solo ese responsable; (e) `GET /tareas?vencimiento=vencidas` (hoy=2026-05-24) devuelve tareas con `fecha_limite < '2026-05-24'` y `estado !== 'completada'`; (f) `GET /tareas?vencimiento=proximas` devuelve `fecha_limite` en `['2026-05-24','2026-05-31']` y `estado !== 'completada'`; (g) `GET /tareas?trato_id=d1111111&estado=pendiente` combinado. Tests deben fallar (handler aún sin override GET). **RED**.
- [x] **T_A.2** [IMPL] Ampliar `src/mocks/fixtures/tareas.ts` a 7 tareas (hoy mock = 2026-05-24): cubre estados `pendiente`/`en_progreso`/`completada`, prioridades `1`/`2`/`3`, responsables `11111111` (admin) y `22222222`, tratos `d1111111`/`d2222222`/`d3333333`, fechas `vencida`(<2026-05-24) / `proxima`(≥2026-05-24 y ≤2026-05-31) / `lejana`(>2026-05-31) / `null`. Tarea completada incluye `fecha_completada` no-null. Patrón: `makeTarea(overrides)` estilo 6a. Tests T_A.1 aún rojos (handler pendiente).
- [x] **T_A.3** [IMPL] Agregar override `http.get('/api/v1/tareas')` en `src/mocks/handlers/tareas.ts` ANTES del spread `makeCrudHandlers`. Lógica: params `trato_id`, `responsable_id`, `estado`, `prioridad` (Number()), `vencimiento`. `hoy = nowIso().slice(0,10)`. Filtros encadenados estilo `GET /tratos`. `addDaysIso(hoy, 7)` inline para proximas. Excluir `estado === 'completada'` en filtros `vencidas`/`proximas`. **GREEN** T_A.1.
- [x] **T_A.4** **Gate**: `pnpm test:run -- tareas.handler` verde + `pnpm tsc --noEmit` exit 0. Commit.

---

## Lote B — Schemas Zod + hooks + mutations (TDD)

**Commit**: `feat(tareas): schemas Zod, useTareas, useTarea y mutations CRUD`

**Deps**: Lote A (MSW handler listo para los tests de hooks).

### B.1 Schema Zod

- [x] **T_B.1** [TEST] Crear `src/features/tareas/__tests__/tarea.schema.test.ts`. Scenarios: (a) `trato_id: ''` → `success === false` con error `trato_id`; (b) input completo válido → `success === true`; (c) `titulo` con 201 chars → error `titulo`; (d) `tareaUpdateSchema.partial()` acepta parcial sin `trato_id`.
- [x] **T_B.2** [IMPL] Crear `src/features/tareas/schemas/tarea.schema.ts`: `tareaCreateSchema` (trato_id min1, responsable_id min1, titulo min1 max200, descripcion nullable, tipo enum, prioridad union(1|2|3), fecha_limite nullable), `tareaUpdateSchema = .partial().extend({ estado?, fecha_completada? })`, types `TareaCreateInput`/`TareaUpdateInput`, `TAREA_EMPTY_DEFAULTS`. **GREEN** T_B.1.

### B.2 tareasKeys + useTareas + useTarea

- [x] **T_B.3** [TEST] Crear `src/features/tareas/__tests__/useTareas.test.tsx`. Scenarios: (a) sin filtros → `GET /tareas` + queryKey `['tareas', {}]`; (b) con `{ responsable_id: '11111111', prioridad: 1 }` → `GET /tareas?responsable_id=11111111&prioridad=1`; (c) `tareasKeys.byTrato('d1111111')` === `tareasKeys.list({ trato_id: 'd1111111' })`.
- [x] **T_B.4** [IMPL] Crear `src/features/tareas/hooks/useTareas.ts` con `tareasKeys` (ADR-048: `all`, `list(filters)`, `detail(id)`, `byTrato(tratoId)`). Hook `useTareas(filters?: UseTareasFilters)` embebe queryString en fetch. Crear `src/features/tareas/hooks/useTarea.ts` (2 tests: happy + 404 propagado, patrón `useCliente`). **GREEN** T_B.3.

### B.3 Mutations (TDD por mutation)

- [x] **T_B.5** [TEST + IMPL] `useCreateTarea.ts` — 1 test: spy `invalidateQueries({ queryKey: ['tareas'] })` tras `POST /tratos/d1111111/tareas` exitoso. `trato_id` va en el PATH, no en el body. Patrón `useCreateTrato`.
- [x] **T_B.6** [TEST + IMPL] `useUpdateTarea.ts` — 1 test: spy invalida `tareasKeys.all` + `tareasKeys.detail(id)`.
- [x] **T_B.7** [TEST + IMPL] `useDeleteTarea.ts` — 2 tests: (a) 204 → `removeQueries(detail(id))` + `invalidateQueries(all)`; (b) error 404 propagado. Patrón `useDeleteCliente`.
- [x] **T_B.8** [TEST + IMPL] `useCompletarTarea.ts` — 1 test: spy invalida `tareasKeys.all` + `tareasKeys.detail(id)`. Verifica que `PATCH /tareas/:id/completar` se llama (ADR-049). Espeja `useGanarTrato`.
- [x] **T_B.9** **Gate**: `pnpm test:run` verde global + `pnpm tsc --noEmit`. Commit.

---

## Lote C — Componentes presentational (TDD)

**Commit**: `feat(tareas): TareaEstadoMenu, TareaForm, TareaCreateDialog, TareaEditDialog, TareaDeleteDialog`

**Deps**: Lote B (hooks y schemas disponibles).

### C.1 TareaEstadoMenu (ADR-050)

- [x] **T_C.1** [TEST] Crear `src/features/tareas/__tests__/TareaEstadoMenu.test.tsx`. Scenarios: (a) `estado: 'pendiente'` → Iniciar habilitado, Completar habilitado, Reabrir deshabilitado; (b) `estado: 'en_progreso'` → Iniciar deshabilitado, Completar habilitado, Reabrir deshabilitado; (c) `estado: 'completada'` → Iniciar deshabilitado, Completar deshabilitado, Reabrir habilitado; (d) clic "Iniciar" invoca `PATCH /tareas/t1111111` con `{ estado: 'en_progreso' }`; (e) clic "Completar" invoca `PATCH /tareas/t1111111/completar`; (f) clic "Reabrir" invoca `PATCH /tareas/t1111111` con `{ estado: 'pendiente', fecha_completada: null }`. **RED**.
- [x] **T_C.2** [IMPL] Crear `src/features/tareas/components/TareaEstadoMenu.tsx`: DropdownMenu shadcn, 3 ítems siempre visibles, disabled-by-state. Props `{ tarea }`. Internamente usa `useUpdateTarea` y `useCompletarTarea`. Sin modal. Homologa `TratoEstadoMenu`. **GREEN** T_C.1.

### C.2 TareaForm + Dialogs

- [x] **T_C.3** [TEST] Crear `src/features/tareas/__tests__/TareaForm.test.tsx`. Scenarios: (a) con `tratoIdFijo: 'd1111111'` → Select trato muestra nombre + `disabled`; (b) sin `tratoIdFijo` + submit sin trato → error inline "El trato es requerido"; (c) form de edición no expone campo `estado`; (d) input completo válido → `onSubmit` llamado con datos correctos.
- [x] **T_C.4** [IMPL] Crear `src/features/tareas/components/TareaForm.tsx`: props `{ mode:'create'|'edit', defaultValues, onSubmit, onCancel, isSubmitting, serverErrors, tratoIdFijo? }`. Cuando `tratoIdFijo` → `<Select disabled>` con valor prefijado. Cuando global → `<Select>` editable con opciones de `useTratos()`, Zod min1. Campo `estado` ausente. Patrón `TratoForm`.
- [x] **T_C.5** [IMPL] Crear `src/features/tareas/components/TareaCreateDialog.tsx` y `TareaEditDialog.tsx`: wrappers sobre `TareaForm` + `useCreateTarea`/`useUpdateTarea`. Edit prefilled con `defaultValues`. Mapeo de errores 422 → `serverErrors`. Sin test directo (cubiertos en page tests T_D.6 y T_D.7).
- [x] **T_C.6** [IMPL] Crear `src/features/tareas/components/TareaDeleteDialog.tsx`: AlertDialog shadcn. Props `{ tarea, onConfirm, onCancel }`. Sin lógica de mutación directa (la invoca el padre). Sin test directo (cubierto en T_D.7).
- [x] **T_C.7** **Gate**: `pnpm test:run` verde + `pnpm tsc --noEmit`. Commit.

---

## Lote D — TareasTable + páginas TareasListPage y TareaDetailPage (TDD)

**Commit**: `feat(tareas): TareasTable, TareasListPage con 6 filtros y TareaDetailPage`

**Deps**: Lote C (componentes disponibles).

### D.1 TareasTable

- [ ] **T_D.1** [IMPL] Crear `src/features/tareas/components/TareasTable.tsx`: columnas: título (Link a `/tareas/:id`), estado (badge), prioridad (badge), responsable, trato vinculado, fecha límite. Cada fila incluye `TareaEstadoMenu` + acciones Editar/Eliminar. Sin test directo (cubierto en T_D.4).

### D.2 Tests de páginas (RED primero)

- [ ] **T_D.2** [TEST] Crear `src/features/tareas/__tests__/TareasListPage.test.tsx`. Scenarios del spec: (a) tabla poblada con fixture renderiza filas; (b) título clickeable navega a `/tareas/t1111111`; (c) filtro `estado` pasa query param; (d) filtro `prioridad` pasa query param; (e) filtro `responsable_id` pasa query param; (f) búsqueda "demo" filtra client-side solo filas con esa palabra; (g) error 500 muestra mensaje + botón "Reintentar"; (h) botón "Nueva tarea" abre `TareaCreateDialog` con Select de trato editable.
- [ ] **T_D.3** [TEST] Crear `src/features/tareas/__tests__/TareaDetailPage.test.tsx`. Scenarios: (a) detalle válido `t1111111` renderiza campos + link al trato `/tratos/d1111111`; (b) `fecha_completada` visible solo si `estado === 'completada'`; (c) 404 → toast "Esta tarea no existe" + redirect a `/tareas`; (d) clic "Editar" abre `TareaEditDialog` prefilled; (e) clic "Eliminar" confirma → `DELETE /tareas/:id` + redirect a `/tareas`.

### D.3 Implementación de páginas

- [ ] **T_D.4** [IMPL] Crear `src/features/tareas/pages/TareasListPage.tsx`: header con botón "Nueva tarea", filtros top-bar (Select estado, Select prioridad, Select responsable_id, Select vencimiento, Select trato_id, Input búsqueda), `<TareasTable>`. Búsqueda = estado local, NO en queryKey. **GREEN** T_D.2.
- [ ] **T_D.5** [IMPL] Crear `src/features/tareas/pages/TareaDetailPage.tsx`: header (título, badge estado, badge prioridad, `TareaEstadoMenu`, Editar, Eliminar), grilla de campos (con "—" para nulls), `fecha_completada` condicional a `estado === 'completada'`. Toast + redirect en 404. **GREEN** T_D.3.
- [ ] **T_D.6** **Gate**: `pnpm test:run` verde + `pnpm tsc --noEmit`. Commit.

---

## Lote E — Wiring: router + sidebar "Mis tareas"

**Commit**: `feat(tareas): wirear rutas /tareas y agregar "Mis tareas" al sidebar (ADR-054)`

**Deps**: Lote D (páginas disponibles).

- [ ] **T_E.1** [TEST] Crear `src/features/tareas/__tests__/routing.test.tsx`. Scenarios: (a) `/tareas` renderiza `TareasListPage`; (b) `/tareas/t1111111` renderiza `TareaDetailPage`; (c) NavItem "Mis tareas" sin `disabled` + navega a `/tareas?responsable_id=22222222` con usuario id `'22222222'` de `useAuthStore`.
- [ ] **T_E.2** [IMPL] Modificar `src/routes/router.tsx`: importar `TareasListPage` y `TareaDetailPage`, agregar rutas `/tareas` y `/tareas/:id`. **GREEN** T_E.1 scenarios (a)+(b).
- [ ] **T_E.3** [IMPL] Modificar `src/components/layout/Sidebar.tsx`: agregar NavItem "Mis tareas" con icono `ClipboardList` (lucide-react 0.469.0, ADR-054). URL → `/tareas?responsable_id=${useAuthStore.getState().usuario.id}` (sin fallback). Sin `disabled`, sin badge "Próximamente". **GREEN** T_E.1 scenario (c).
- [ ] **T_E.4** **Smoke manual**: `pnpm dev`, clic "Mis tareas" → navega a `/tareas?responsable_id=22222222`, tabla muestra solo tareas del usuario.
- [ ] **T_E.5** **Gate**: `pnpm test:run` verde + `pnpm tsc --noEmit`. Commit.

---

## Lote F — Refactor TratoDetailPage → tabbed + tab Tareas + badge

**Commit**: `refactor(tratos): TratoDetailPage tabbed con tab Tareas, badge de pendientes y useTabSync (ADR-051)`

**Deps**: Lote D+E (tareas/ completo para `useTareas` y componentes). **Lote propio** por costo de tests y riesgo de regresión.

> ⚠️ **Riesgo alto**: Los tests actuales de `TratoDetailPage.test.tsx` quedarán ROJOS con el refactor. Estrategia Strict TDD: reescribir primero los tests (RED deliberado), luego implementar hasta GREEN.

### F.1 Reescribir tests (RED deliberado)

- [ ] **T_F.1** [TEST] **REESCRIBIR** `src/features/tratos/__tests__/TratoDetailPage.test.tsx`. Eliminar scenarios de layout plano. Agregar scenarios del spec delta: (a) layout tabbed renderiza tabs "Información" y "Tareas" para `d1111111`; (b) tab "Información" muestra campos del trato + link a `/clientes/c1111111`; (c) `motivo_perdida` visible solo si `estado === 'perdido'`; (d) header muestra las 5 acciones + "Reabrir" deshabilitado cuando `estado === 'abierto'`; (e) badge count > 0 muestra número "2" en header; (f) badge count = 0 → badge NO visible (ADR-052 + decisión badge-zero); (g) tab "Tareas" renderiza tabla de tareas del trato; (h) botón "Crear tarea" en tab Tareas abre `TareaCreateDialog` con Select trato disabled; (i) `POST /tratos/d1111111/tareas` se invoca desde el tab (Select bloqueado); (j) URL `?tab=tareas` pre-activa tab Tareas; (k) click tab Tareas → URL refleja `?tab=tareas`; (l) 404 → toast + redirect a `/tratos`. Tests deben fallar con la implementación actual. **RED deliberado**.

### F.2 Implementación

- [ ] **T_F.2** [IMPL] Crear `src/features/tratos/components/TratoInfoTab.tsx`: extrae la grilla de campos actual de `TratoDetailPage` (nombre, estado, valor estimado, probabilidad, fecha cierre esperada, tipo contrato, cliente/prospecto vinculado, responsable, `motivo_perdida` condicional, `creado_en`, `actualizado_en`). Campos nulos → "—".
- [ ] **T_F.3** [IMPL] Crear `src/features/tratos/components/TratoTareasTab.tsx`: `useTareas({ trato_id })` → `<TareasTable>` + botón "Crear tarea" que abre `TareaCreateDialog` con `tratoIdFijo={trato.id}`.
- [ ] **T_F.4** [IMPL] Modificar `src/features/tratos/pages/TratoDetailPage.tsx`: (a) levantar query `useTareas({ trato_id, estado: 'pendiente' })` a nivel de la página (ADR-052); (b) `const pendientesCount = tareasQuery.data?.length ?? 0`; (c) badge de pendientes = `{pendientesCount > 0 && <Badge>{pendientesCount}</Badge>}` (ADR-052 + decisión badge-zero: oculto en 0); (d) `useTabSync(['info','tareas'], 'info')`; (e) header izquierda: volver + h1 + `TratoEstadoBadge` + badge pendientes; (f) header derecha: las 5 acciones PERMANECEN; (g) `<TabsContent value="info"><TratoInfoTab /></TabsContent>`; (h) `<TabsContent value="tareas"><TratoTareasTab /></TabsContent>`. **GREEN** T_F.1.
- [ ] **T_F.5** **Gate**: `pnpm test:run` verde global (tests previos de Change 6a deben seguir verdes) + `pnpm tsc --noEmit`. Commit.

---

## Resumen y dependencias

```
A (sin deps — pre-requisito fixture + handler)
└─ B (deps: A — hooks usan el handler)
   └─ C (deps: B — componentes usan hooks)
      └─ D (deps: C — páginas usan componentes)
         └─ E (deps: D — wiring registra las páginas)
            └─ F (deps: D+E — refactor consume tareas/ completo)
```

**Granularidad por lote**:
- Lote A: 4 tasks (~1 sesión).
- Lote B: 9 tasks (~1-2 sesiones).
- Lote C: 7 tasks (~1 sesión).
- Lote D: 6 tasks (~1-2 sesiones).
- Lote E: 5 tasks (~1 sesión).
- Lote F: 5 tasks (~1-2 sesiones — candidato a partir F1/F2 en apply).

**Total estimado**: ~36 tasks. ~22 archivos crear, ~6 modificar, 0 eliminar.

**Tests nuevos estimados**: ~15 suites de test nuevas, ~3 rewrites, ~55-60 scenarios totales.
