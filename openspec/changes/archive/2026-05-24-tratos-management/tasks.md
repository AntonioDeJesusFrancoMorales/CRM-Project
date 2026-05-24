# Tasks: tratos-management (Change 6a)

**Estrategia**: 5 lotes (A-E) por design. Strict TDD activo (`pnpm test:run`). Tests antes de implementación. Cada lote = un commit semántico atómico revertible.

**Gate por lote (antes del commit)**:
- `pnpm test:run` → 0 fallidos.
- `pnpm tsc --noEmit` → exit 0.
- Smoke manual donde aplique.

---

## Lote A — MSW override DELETE 409

**Commit**: `feat(mocks): override DELETE 409 tratos con tareas asociadas`

- [x] **T_A.0** Verificar `src/mocks/fixtures/tratos.ts` y `tareas.ts`: confirmar que `d1111111` tiene tareas y `d2222222`/`d3333333` no. Si NO se cumple, agregar fixture. Esperado (D4): SÍ cumple, no se agrega nada. **Resultado**: D4 invariante holds — d1111111 con 2 tareas, d2222222/d3333333 sin tareas. Sin cambio en fixture.
- [x] **T_A.1** [TEST] Crear `src/mocks/handlers/__tests__/tratos.handler.test.ts`. Scenarios: (a) `DELETE /tratos/d2222222` → 204; (b) `DELETE /tratos/d1111111` → 409 con `message` que contiene "2 tareas asociadas"; (c) `DELETE /tratos/no-existe` → 404. Tests deben fallar primero (handler aún sin override). **RED**: 1 test fallido genuino (DELETE 409 recibía 204 del default handler).
- [x] **T_A.2** [IMPL] Agregar override `http.delete` en `src/mocks/handlers/tratos.ts` ANTES del spread `makeCrudHandlers`. Patrón: `clientes.ts:14-32` (lee `tareasFixture` filtrado por `trato_id`, `apiError(409, 'CONFLICT', msg, [{ field: 'trato_id', message: 'tareas_vinculadas' }])`). Verificar tests verdes. **GREEN**: 115/115 tests pasan.
- [x] **T_A.3** **Gate**: `pnpm test:run -- tratos.handler` verde + `pnpm tsc --noEmit` exit 0. Commit. **Commit**: `d569a3d feat(mocks): override DELETE 409 tratos con tareas asociadas` (2 files, +94/-1).

---

## Lote B — Schemas + hooks + useTabSync (TDD)

**Commit**: `feat(tratos): schemas, hooks y helper useTabSync`

### B.1 Helper useTabSync

- [x] **T_B.1** [TEST] `src/lib/__tests__/useTabSync.test.tsx` con 5 scenarios (read tratos, fallback sin tab, fallback con valor inválido, setTab agrega, setTab fallback elimina). MemoryRouter wrapper.
- [x] **T_B.2** [IMPL] `src/lib/useTabSync.ts` con `useSearchParams`, replace history. GREEN: 5 tests pasan.

### B.2 Schema XOR

- [x] **T_B.3** [TEST] `src/features/tratos/__tests__/trato.schema.test.ts` con 6 scenarios (happy cliente, happy prospecto, ambos vacíos → cliente_id, ambos llenos asociacion=cliente → prospecto_id, ambos llenos asociacion=prospecto → cliente_id, nombre vacío → nombre).
- [x] **T_B.4** [IMPL] `src/features/tratos/schemas/trato.schema.ts` con superRefine ADR-042, exports `tratoCreateSchema`, `tratoUpdateSchema`, types, `TRATO_EMPTY_DEFAULTS`. GREEN: 6 tests pasan.

### B.3 Hooks (TDD por hook)

- [x] **T_B.5** [TEST] `useTratos.test.tsx` con 3 scenarios (sin filtros, cliente_id como query param, combinación estado+cliente_id).
- [x] **T_B.6** [IMPL] `useTratos.ts` con `tratosKeys.list(filters)` paramétrico, queryString embebido.
- [x] **T_B.7** [TEST + IMPL] `useTrato.ts` — 2 tests (happy por id, 404 propagado). Pattern de `useCliente`.
- [x] **T_B.8** [TEST + IMPL] `useCreateTrato.ts` — 2 tests (happy cliente con body limpio sin asociacion + prospecto_id null, happy prospecto con cliente_id null). `toPayload` transform interno.
- [x] **T_B.9** [TEST + IMPL] `useUpdateTrato.ts` — 1 test con `vi.spyOn(invalidateQueries)` que valida invalidación de `all` + `detail(id)`.
- [x] **T_B.10** [TEST + IMPL] `useDeleteTrato.ts` — 2 tests (204 con removeQueries, 409 con err.status + err.message). Pattern verbatim de `useDeleteCliente`.
- [x] **T_B.11** [TEST + IMPL] `useGanarTrato.ts` — 1 test con spy invalidate + verificación de endpoint llamado.
- [x] **T_B.12** [TEST + IMPL] `usePerderTrato.ts` — 2 tests (happy con motivo, 422 con motivo vacío que el handler MSW ya valida).

- [x] **T_B.13** **Gate**: `pnpm test:run` 139/139 + `pnpm tsc --noEmit` exit 0. **Commit**: `4132a9d feat(tratos): schemas, hooks y helper useTabSync` (18 files, +904).

---

## Lote C — Migración atómica useTratosByCliente (ADR-041)

**Commit**: `refactor(tratos): migrar useTratosByCliente y eliminar handler huérfano (ADR-041)`

**Regla**: TODO en UN solo commit. Si pre-commit verification falla → STOP, NO commitear.

- [x] **T_C.0** Safety net baseline: `pnpm test:run -- clientes` → 139/139 antes del refactor. Approval test confirma estado actual.
- [x] **T_C.1** Modificado `ClienteTratosTab.tsx`: import a `useTratos` de `@/features/tratos/hooks/useTratos`, llamada `useTratos({ cliente_id: clienteId })`, comentario ADR-036/041 actualizado. Approval test post-refactor: 139/139 (behavior preservado).
- [x] **T_C.2** Eliminado `src/features/clientes/hooks/useTratosByCliente.ts`.
- [x] **T_C.3** Eliminado `src/features/clientes/__tests__/useTratosByCliente.test.tsx` (4 tests).
- [x] **T_C.4** Modificado `useClientes.ts`: removido `tratos: (id) => [...]` de `clientesKeys`. Comentario ADR-041 añadido.
- [x] **T_C.5** Eliminado handler `clientes.ts:66-69` (GET /clientes/:id/tratos). Import `tratosFixture` retenido — sigue usado por override DELETE 409 (línea 20).
- [x] **T_C.6** **Pre-commit gate PASS**: `pnpm tsc --noEmit` exit 0 + `pnpm test:run` → 135/135 (139 − 4 del archivo eliminado).
- [x] **T_C.7** **Commit atómico**: `417a72c refactor(tratos): migrar useTratosByCliente y eliminar handler huérfano (ADR-041)` (5 files: +8/-83).

---

## Lote D — Componentes + pages + wiring + sidebar

**Commit**: `feat(tratos): CRUD completo, detalle con cambio de estado inline y sidebar habilitado`

> ⚠️ **Tamaño**: 14 sub-tareas. Si en `sdd-apply` se siente excesivo, partir en D1 (componentes shared) y D2 (pages + wiring + sidebar). Decisión final en apply.

### D.1 Componentes presentational

- [x] **T_D.1** [IMPL] `src/features/tratos/components/TratoEstadoBadge.tsx` — badge con label + clases por estado. Sin test directo (cubierto en page tests).
- [x] **T_D.2** [IMPL] `src/features/tratos/components/TratoForm.tsx` — presentational shared create/edit. Props `{ mode, defaultValues, onSubmit, onCancel, isSubmitting, serverErrors }`. Toggle `asociacion` controla qué Select aparece (cliente vs prospecto). Patrón de `ClienteForm.tsx`.
- [x] **T_D.3** [IMPL] `src/features/tratos/components/TratoCreateDialog.tsx` y `TratoEditDialog.tsx` — wrappers sobre `TratoForm` + `useCreateTrato`/`useUpdateTrato`. Edit toggle editable.
- [x] **T_D.4** [IMPL] `src/features/tratos/components/TratoDeleteDialog.tsx` — `AlertDialog` shadcn. Confirmación + callback `onConfirm`.
- [x] **T_D.5** [IMPL] `src/features/tratos/components/TratoPerderDialog.tsx` — modal con `textarea` Zod required (1-2000). Submit invoca `usePerderTrato`. Cancelar cierra sin acción.
- [x] **T_D.6** [IMPL] `src/features/tratos/components/TratoEstadoMenu.tsx` — DropdownMenu shadcn con 3 ítems siempre visibles. `disabled` por estado (D1/ADR-044): ganar disabled si `estado==='ganado'`, perder disabled si `estado==='perdido'`, reabrir disabled si `estado==='abierto'`. Props: `{ trato, onPerder }` (perder abre el dialog externo).

### D.2 Tabla y pages

- [x] **T_D.7** [IMPL] `src/features/tratos/components/TratosTable.tsx` — columnas: nombre (Link a `/tratos/:id`), estado (badge), valor estimado (currency MX), tipo contrato, cliente/prospecto vinculado (nombre o "—"), fecha cierre. Cada fila incluye `TratoEstadoMenu`.

### D.3 Tests de página (RED antes que page IMPL)

- [x] **T_D.8** [TEST] `src/features/tratos/__tests__/TratosListPage.test.tsx`. Scenarios del spec: tabla poblada, nombre clickeable navega, filtros (estado, cliente_id) pasan query param, búsqueda por nombre client-side, error 500 + reintentar, DropdownMenu por fila con disabled correcto.
- [x] **T_D.9** [TEST] `src/features/tratos/__tests__/TratoDetailPage.test.tsx`. Scenarios: detalle con id válido renderiza campos + link cliente vinculado, motivo_perdida visible solo si estado='perdido', 404 redirect a `/tratos`, botones de cambio estado funcionan, click "Marcar perdido…" abre `TratoPerderDialog` (no invoca endpoint), submit modal con motivo OK → invalida + cierra.

### D.4 Pages

- [x] **T_D.10** [IMPL] `src/features/tratos/pages/TratosListPage.tsx` — header con botón "Nuevo trato", filtros top-bar (Select estado, Select cliente, Select prospecto, Select responsable, búsqueda nombre), `<TratosTable>`. Sin tabs (decisión: detalle de trato es single-panel; no necesita `useTabSync` aquí). Verificar T_D.8 verde.
- [x] **T_D.11** [IMPL] `src/features/tratos/pages/TratoDetailPage.tsx` — header (nombre, badge, botones estado, Editar, Eliminar), grid de campos, sección `motivo_perdida` condicional. Sin tabs. Verificar T_D.9 verde.

### D.5 Wiring + Sidebar (ADR-047, patrón #155)

- [x] **T_D.12** Modificar `src/routes/router.tsx`: importar `TratosListPage` y `TratoDetailPage`, reemplazar `TratosPlaceholder` y agregar ruta `tratos/:id`.
- [x] **T_D.13** Modificar `src/routes/placeholders.tsx`: eliminar `TratosPlaceholder` (queda solo `TablerosPlaceholder`).
- [x] **T_D.14** Modificar `src/components/layout/Sidebar.tsx:19`: quitar `disabled: true, badge: 'Próximamente'` del item Tratos. **Smoke manual**: con `pnpm dev`, hacer clic en "Tratos" del sidebar → confirmar navegación a `/tratos`.
- [x] **T_D.15** **Gate**: `pnpm test:run` verde global + `pnpm tsc --noEmit`. Commit.

---

## Lote E — UX deferida + useTabSync en ClienteDetailPage

**Commit**: `feat(ux): cross-links convertido→cliente, fix WARN-05 y CTAs en tab Tratos del cliente`

### E.1 useTabSync en ClienteDetailPage (D5/ADR-045)

- [x] **T_E.1** [TEST] Actualizar `src/features/clientes/__tests__/ClienteDetailPage.test.tsx`: scenario "URL `?tab=tratos` pre-activa tab Tratos al cargar"; "click en tab Información actualiza URL a `?tab=info` o elimina `?tab`".
- [x] **T_E.2** [IMPL] Modificar `ClienteDetailPage.tsx`: reemplazar `<Tabs defaultValue="info">` por `const [tab, setTab] = useTabSync(['info','tratos'], 'info'); <Tabs value={tab} onValueChange={setTab}>`. Verificar T_E.1 verde.

### E.2 ClienteTratosTab CTAs (delta `clientes-management`)

- [x] **T_E.3** [TEST] Update `ClienteDetailPage.test.tsx` (o `__tests__/ClienteTratosTab.test.tsx` si se crea): scenario "tab Tratos muestra botón 'Crear trato'"; "nombre de trato en fila navega a `/tratos/:id`"; "botón abre TratoCreateDialog con cliente preseleccionado".
- [x] **T_E.4** [IMPL] Modificar `src/features/clientes/components/ClienteTratosTab.tsx`: header con botón "Crear trato" → abre `TratoCreateDialog` con `defaultValues={{ asociacion: 'cliente', cliente_id: clienteId }}`. En la tabla, envolver el `nombre` en `<Link to={`/tratos/${trato.id}`}>`. Verificar T_E.3 verde.

### E.3 WARN-05 fix (D3)

- [x] **T_E.5** [TEST] Update `src/features/prospectos/__tests__/ProspectoConvertidosList.test.tsx` (o crear si no existe): scenario "no hay `<a>` anidados — `container.querySelectorAll('a a').length === 0`"; scenario "click en empresa navega a `/empresas/:id` sin propagar al wrapper".
- [x] **T_E.6** [IMPL] Modificar `src/features/prospectos/components/ProspectoConvertidosList.tsx:48-55`: reemplazar `<Link to=/empresas/...>` por `<button type="button" role="link" onClick={(e) => { e.stopPropagation(); navigate('/empresas/:id'); }} className="...mismo styling...">`. Agregar `useNavigate`. Eliminar comentario obsoleto sobre "patrón Option B" en líneas 35-38. Verificar T_E.5 verde.

### E.4 ProspectoDetailPage cross-links (delta `prospectos-management`)

- [x] **T_E.7** [TEST] Update `src/features/prospectos/__tests__/ProspectoDetailPage.test.tsx`: scenario "prospecto convertido muestra link 'Ver cliente convertido' que navega a `/clientes/:id`"; "prospecto no-convertido NO muestra el link"; "tab Tratos de prospecto convertido muestra CTA 'Ver tratos del cliente' que navega a `/clientes/:id?tab=tratos`".
- [x] **T_E.8** [IMPL] Modificar `ProspectoDetailPage.tsx`: si `prospecto.estado_posible_cliente === 'convertido'`, buscar cliente con `useClientes()` filtrado por `prospecto_origen_id === prospecto.id`. Renderizar Link "Ver cliente convertido" en header. En el tab Tratos (component existente), agregar mensaje informativo con Link "Ver tratos del cliente" → `/clientes/:id?tab=tratos`. Verificar T_E.7 verde.

### E.5 Gate final

- [x] **T_E.9** **Smoke manual** (cubre múltiples paths del Change):
  - `pnpm dev`, login, navegar a sidebar Tratos → ver listado.
  - Crear trato con cliente, luego con prospecto. Editar uno. Marcar uno como ganado, otro como perdido (modal motivo).
  - Intentar eliminar `d1111111` → ver toast 409. Eliminar `d2222222` → redirect a `/tratos`.
  - Navegar a `/clientes/:id`, tab Tratos → ver botón crear, clic en nombre de trato → llega a detalle.
  - Navegar a `/prospectos/:id` de un convertido → ver link "Ver cliente convertido", clic → llega al cliente con tab Tratos activo.
  - Inspeccionar `ProspectoConvertidosList` en DevTools → confirmar no hay `<a>` anidados.
- [x] **T_E.10** **Gate**: `pnpm test:run` verde global (~120+ tests, los previos del Change 5 deben seguir verdes) + `pnpm tsc --noEmit`. Commit.

---

## Resumen y dependencias

```
A (sin deps)
└─ B (deps: A)
   └─ C (deps: B — migración atómica)
      └─ D (deps: C — usa useTratos migrado)
         └─ E (deps: D — usa TratoCreateDialog y rutas /tratos)
```

**Granularidad por lote**:
- Lote A: 4 tasks (~1 sesión).
- Lote B: 13 tasks (~1-2 sesiones).
- Lote C: 7 tasks (~1 sesión, commit único).
- Lote D: 15 tasks (~2-3 sesiones — candidato a partir D1/D2 en apply).
- Lote E: 10 tasks (~1-2 sesiones).

**Total estimado**: ~13-15 tests nuevos, ~3 tests update, ~22 archivos tocados.
