# Apply Progress — Clientes Management (Change 5)

**Última actualización**: 2026-05-23
**Mode**: Strict TDD (RED → GREEN → REFACTOR)
**Artifact store**: hybrid (openspec/ + engram)

---

## Estado actual

| Lote | Estado | Tests | Notas |
|------|--------|-------|-------|
| A — MSW handlers | COMPLETO | 11 nuevos | 71 total (60 prev + 11 nuevos) |
| B — Schema + Hooks | COMPLETO | 18 nuevos | 89 total (71 prev + 18 nuevos) |
| C — Migración atómica | COMPLETO | 0 nuevos | 89 total (sin regresión) |
| D — Componentes UI | COMPLETO | 0 nuevos | 89 total (cobertura implícita por page tests) |
| E — Pages + Routing + Sidebar | COMPLETO | 20 nuevos | 109 total (89 prev + 20 nuevos) |
| F — Smoke + fixes | PENDIENTE | — | Contingente post-verify |

---

## Lote A — MSW handlers (COMPLETO)

### Tareas completadas

- [x] **T_A.1** Override `http.delete` en `src/mocks/handlers/clientes.ts` ANTES del spread `makeCrudHandlers`. Lógica 409 con conteo de tratos.
- [x] **T_A.2** Override `http.get /clientes` con filtros `empresa_id` y `origen` ANTES del spread `makeCrudHandlers`.
- [x] **T_A.3** Tests RED→GREEN del handler DELETE (204, 409 con conteo, 404).
- [x] **T_A.4** Tests RED→GREEN del handler GET con filtros (sin filtros, empresa_id, origen=prospecto, origen=manual).
- [x] **T_A.5** Verificado: `GET /clientes/:id/tratos` ya existía en `clientes.ts` (línea 66). `GET /tratos?cliente_id=X` ya existía en `tratos.ts` (línea 23). Sin duplicar.
- [x] **T_A.6** `pnpm test:run`: 71/71 verde. `pnpm type-check`: exit 0.

### Archivos modificados

| Archivo | Acción | Detalle |
|---------|--------|---------|
| `src/mocks/handlers/clientes.ts` | Modificado | Agregados 2 overrides ANTES del spread: DELETE 409 + GET filtros |
| `src/mocks/handlers/__tests__/clientes.handler.test.ts` | Creado | 11 tests (DELETE 3 casos, GET 4 casos, tratos 2 casos, fixture 2 casos) |

### Evidencia TDD (Lote A)

| Tarea | RED (test falla) | GREEN (impl pasa) | Refactor |
|-------|-----------------|-------------------|---------|
| T_A.3 DELETE tests | 4 tests fallando — DELETE 409→204, GET sin filtrar | Impl mínima en clientes.ts | Fix TS: `tratosCount` eliminado de details (type-check exit 0) |
| T_A.4 GET filtros tests | (incluido en T_A.3 RED) | (incluido en T_A.3 GREEN) | — |
| T_A.5 verificación | N/A — ya existía | N/A — ya existía | — |

### Gotchas detectados (Lote A)

1. **`tratosCount` no es parte del tipo `ApiError['details']`**: El design ADR-033 menciona un campo `tratosCount` en details, pero el tipo `{ field: string; message: string }` no lo permite. Se eliminó. El conteo queda en `error.message` (string), que es donde el frontend lo lee de todas formas.
2. **Handlers GET en MSW**: el override GET `/clientes` debe colocarse ANTES de `makeCrudHandlers` — si va después, el factory GET genérico intercepta primero y el filtro nunca se aplica.
3. **`GET /tratos?cliente_id=X`** ya existía en `tratos.ts` línea 23 (Change anterior). No necesita duplicarse en `clientes.ts`. El endpoint `GET /clientes/:id/tratos` también ya existía.

---

## Lote B — Schema Zod + 6 Hooks CRUD (COMPLETO)

### Tareas completadas

- [x] **T_B.1** Crear `src/features/clientes/schemas/cliente.schema.ts` con `clienteCreateSchema`, `clienteUpdateSchema`, tipos inferidos y `CLIENTE_EMPTY_DEFAULTS`.
- [x] **T_B.2** Crear `src/features/clientes/hooks/useClientes.ts` con `clientesKeys` factory y hook `useClientes(filters?)`.
- [x] **T_B.3** Tests RED→GREEN `useClientes` (4 casos: lista, filtro empresa_id, filtro origen, error 500).
- [x] **T_B.4** Crear `src/features/clientes/hooks/useCliente.ts` (`enabled: !!id`, maneja 404).
- [x] **T_B.5** Tests RED→GREEN `useCliente` (3 casos: GET by id, id vacío idle, 404).
- [x] **T_B.6** Crear `src/features/clientes/hooks/useCreateCliente.ts` (invalida `clientesKeys.all` en onSuccess).
- [x] **T_B.7** Tests RED→GREEN `useCreateCliente` (2 casos: POST 201 con invalidación + `prospecto_origen_id: null`, error 422).
- [x] **T_B.8** Crear `src/features/clientes/hooks/useUpdateCliente.ts` (invalida all + detail en onSuccess).
- [x] **T_B.9** Tests RED→GREEN `useUpdateCliente` (2 casos: PATCH 200 invalida ambas keys, error 422).
- [x] **T_B.10** Crear `src/features/clientes/hooks/useDeleteCliente.ts` (204 → removeQueries + invalidate; 409 → propaga error).
- [x] **T_B.11** Tests RED→GREEN `useDeleteCliente` (3 casos: DELETE 204 remueve detail, DELETE 409 mensaje backend, DELETE 404).
- [x] **T_B.12** Crear `src/features/clientes/hooks/useTratosByCliente.ts` (endpoint `/clientes/:id/tratos`, `enabled: !!id`).
- [x] **T_B.13** Tests RED→GREEN `useTratosByCliente` (4 casos: tratos array, empty [], id vacío idle, error 500).

### Archivos creados

| Archivo | Acción | Detalle |
|---------|--------|---------|
| `src/features/clientes/schemas/cliente.schema.ts` | Creado | Schema Zod + tipos + CLIENTE_EMPTY_DEFAULTS |
| `src/features/clientes/hooks/useClientes.ts` | Creado | clientesKeys factory + useClientes(filters?) |
| `src/features/clientes/hooks/useCliente.ts` | Creado | GET by id con enabled: !!id |
| `src/features/clientes/hooks/useCreateCliente.ts` | Creado | POST + invalidate all |
| `src/features/clientes/hooks/useUpdateCliente.ts` | Creado | PATCH + invalidate all + detail |
| `src/features/clientes/hooks/useDeleteCliente.ts` | Creado | DELETE 204/409/404 con manejo diferenciado |
| `src/features/clientes/hooks/useTratosByCliente.ts` | Creado | GET /clientes/:id/tratos con enabled: !!id |
| `src/features/clientes/__tests__/useClientes.test.tsx` | Creado | 4 tests |
| `src/features/clientes/__tests__/useCliente.test.tsx` | Creado | 3 tests |
| `src/features/clientes/__tests__/useCreateCliente.test.tsx` | Creado | 2 tests |
| `src/features/clientes/__tests__/useUpdateCliente.test.tsx` | Creado | 2 tests |
| `src/features/clientes/__tests__/useDeleteCliente.test.tsx` | Creado | 3 tests |
| `src/features/clientes/__tests__/useTratosByCliente.test.tsx` | Creado | 4 tests |

### Evidencia TDD (Lote B)

| Tarea | RED | GREEN | Refactor |
|-------|-----|-------|---------|
| T_B.3 useClientes | Tests escritos primero — import resolution fail | Hook creado → 4 tests verdes | Ninguno |
| T_B.5 useCliente | Tests escritos primero — import resolution fail | Hook creado → 3 tests verdes | Ninguno |
| T_B.7 useCreateCliente | Tests escritos primero — import resolution fail | Hook creado → 2 tests verdes | Ninguno |
| T_B.9 useUpdateCliente | Tests escritos primero — import resolution fail | Hook creado → 2 tests verdes | Ninguno |
| T_B.11 useDeleteCliente | Tests escritos primero — import resolution fail | Hook creado → 3 tests verdes | Fix: ID fixture c2222222 → c3333333 |
| T_B.13 useTratosByCliente | Tests escritos primero — import resolution fail | Hook creado → 4 tests verdes | Fix: ID fixture c2222222 → c3333333 |

### Gotchas detectados (Lote B)

1. **Fixture ID incorrecto en tests iniciales**: El primer intento usó `c2222222` como cliente sin tratos, pero el fixture `tratosFixture` tiene `d3333333` con `cliente_id: 'c2222222'`. Corrección: usar `c3333333` (Valentina Cruz) que no tiene tratos en el fixture.
2. **`clientesKeys.list()` literal sin filtros**: Confirmado que retorna `['clientes'] as const`. Los filtros se pasan directamente en la `queryFn` como query params en la URL, NO en la queryKey — mantiene compatibilidad con `useConvertirProspecto`.
3. **Hook temporal intacto**: `src/features/prospectos/hooks/useClientes.ts` SIGUE EXISTIENDO. La eliminación es Lote C.

### Verificaciones de aceptación (Lote B)

- `pnpm test:run`: 89/89 verde (71 Lote A + 18 Lote B)
- `pnpm type-check`: exit 0
- Hook temporal `src/features/prospectos/hooks/useClientes.ts`: INTACTO
- ProspectosListPage tests: verdes (sin regresión)
- `clientesKeys.list()` retorna `['clientes'] as const` literal: CONFIRMADO

---

## Lote C — Migración atómica del hook useClientes (COMPLETO)

### Tareas completadas

- [x] **T_C.1** Actualizar import en `ProspectosListPage.tsx` línea 22: `../hooks/useClientes` → `@/features/clientes/hooks/useClientes`.
- [x] **T_C.2** Eliminar `src/features/prospectos/hooks/useClientes.ts` (hook temporal eliminado).
- [x] **T_C.3** Verificaciones pre-commit: `pnpm type-check` exit 0, `pnpm test:run` 89/89 verde, `pnpm lint` 0 errores. Grep por path viejo: 0 referencias encontradas.

### Archivos modificados

| Archivo | Acción | Detalle |
|---------|--------|---------|
| `src/features/prospectos/pages/ProspectosListPage.tsx` | Modificado | Import `useClientes` actualizado al path nuevo `@/features/clientes/hooks/useClientes` |
| `src/features/prospectos/hooks/useClientes.ts` | Eliminado | Hook temporal removido — migración atómica completa |

### Verificaciones de aceptación (Lote C)

- `pnpm type-check`: exit 0
- `pnpm test:run`: 89/89 verde (sin regresiones)
- `pnpm lint`: 0 errores (3 warnings pre-existentes en shadcn UI, sin relación)
- Grep por `prospectos/hooks/useClientes`: 0 referencias (path viejo eliminado)
- Grep por `useClientes`: solo referencias a `clientes/hooks/useClientes` (nuevo path)
- Tab Convertidos en `ProspectosListPage` tests: verdes (7/7 en `ProspectosListPage.test.tsx`)

---

## Lote D — Componentes UI (COMPLETO)

### Tareas completadas

- [x] **T_D.1** Crear `src/features/clientes/components/ClienteForm.tsx` — Form RHF + Zod compartido (create + edit). Usa `useEmpresas()` y `useUsuarios()`. `como_nos_conocio` con `value={field.value ?? ''}`. Patrón homologado con `ProspectoForm`.
- [x] **T_D.2** Crear `src/features/clientes/components/ClienteCreateDialog.tsx` — Dialog + ClienteForm mode="create" + useCreateCliente. Cierra en `onSuccess`.
- [x] **T_D.3** Crear `src/features/clientes/components/ClienteEditDialog.tsx` — Dialog + ClienteForm mode="edit" + useUpdateCliente. `defaultValues` prefilled del cliente.
- [x] **T_D.4** Crear `src/features/clientes/components/ClienteDeleteDialog.tsx` — AlertDialog puramente presentacional. Emite `onConfirm()` y `onCancel()`. Sin lógica de mutation (ADR-039 T_D.4).
- [x] **T_D.5** Crear `src/features/clientes/components/ClientesTable.tsx` — Tabla con `<button>` para nombre (navigate a `/clientes/:id`). ClienteOrigenBadge en su propia `<TableCell>` (fuera de elementos interactivos). Columnas: Nombre, Empresa, Contacto, Origen, Registrado.
- [x] **T_D.6** Crear `src/features/clientes/components/ClienteOrigenBadge.tsx` — Badge condicional: `<Link>` a `/prospectos/:id` si `prospectoOrigenId !== null`; `<Badge>` span si null. Sin `<a>` anidado (ADR-037).
- [x] **T_D.7** Crear `src/features/clientes/components/ClienteInfoTab.tsx` — Tab presentacional: campos contacto, correo, teléfono, cargo, cómo nos conoció, notas, empresa (Link a `/empresas/:id`), responsable, fechas. Nulos → `"—"`.
- [x] **T_D.8** Crear `src/features/clientes/components/ClienteTratosTab.tsx` — Tab container: `useTratosByCliente(clienteId)` lazy por montaje (ADR-036). Tabla read-only columnas: Nombre, Estado, Valor estimado, Tipo contrato, Cierre esperado. Empty state "Sin tratos vinculados".

### Archivos creados

| Archivo | Acción | Detalle |
|---------|--------|---------|
| `src/features/clientes/components/ClienteForm.tsx` | Creado | Form RHF + zodResolver, 8 campos, reutiliza useEmpresas + useUsuarios |
| `src/features/clientes/components/ClienteCreateDialog.tsx` | Creado | Dialog shadcn + ClienteForm create + useCreateCliente |
| `src/features/clientes/components/ClienteEditDialog.tsx` | Creado | Dialog shadcn + ClienteForm edit + useUpdateCliente + defaultValues prefilled |
| `src/features/clientes/components/ClienteDeleteDialog.tsx` | Creado | AlertDialog puramente presentacional — emite onConfirm/onCancel |
| `src/features/clientes/components/ClientesTable.tsx` | Creado | Tabla: nombre button (navigate), empresa texto, contacto, badge origen, fecha |
| `src/features/clientes/components/ClienteOrigenBadge.tsx` | Creado | Badge condicional Link/span sin anidamiento (ADR-037) |
| `src/features/clientes/components/ClienteInfoTab.tsx` | Creado | Grid 2 cols: contacto + CRM + notas + fechas |
| `src/features/clientes/components/ClienteTratosTab.tsx` | Creado | Lazy fetch via montaje, tabla read-only, empty state |

### Verificaciones de aceptación (Lote D)

- `pnpm type-check`: exit 0
- `pnpm test:run`: 89/89 verde (sin regresiones)
- ADR-037: `ClienteOrigenBadge` Link en `<TableCell>` independiente (sin `<a>` anidado en `<button>`)
- ADR-038: 0 tests directos de componentes (cobertura implícita por diseño)
- Naming homologado con `empresas/` y `prospectos/`

---

## Lote E — Pages + Routing + Sidebar (COMPLETO)

### Tareas completadas

- [x] **T_E.1** Escribir `src/features/clientes/__tests__/ClientesListPage.test.tsx` (RED → import resolution fail → GREEN tras T_E.2). 8 tests: render tabla fixture, búsqueda client-side, filtro empresa query param, filtro origen query param, empty state, click nombre navega, click "Nuevo cliente" abre dialog, error 500 con reintentar, loading state.
- [x] **T_E.2** Crear `src/features/clientes/pages/ClientesListPage.tsx`. Top-bar: input búsqueda + Select empresa + Select origen + botón "Nuevo cliente". Client-side filter para nombre. Server-side filters para empresa_id/origen vía `useClientes(filters)`. `ClientesTable` + `ClienteCreateDialog`.
- [x] **T_E.3** Escribir `src/features/clientes/__tests__/ClienteDetailPage.test.tsx` (RED → import resolution fail → GREEN tras T_E.4). 11 tests: render header, badge Manual sin link, badge Prospecto convertido como Link, tab Información default, tab Tratos lazy fetch, click Editar abre dialog, click Eliminar abre AlertDialog, confirmar 204 navega, confirmar 409 cierra sin navegar, loading state, 404 mensaje.
- [x] **T_E.4** Crear `src/features/clientes/pages/ClienteDetailPage.tsx`. `useParams` para id. `useCliente(id)` + `useDeleteCliente`. Header con nombre, empresa, `ClienteOrigenBadge`, botones Editar/Eliminar. Tabs `ClienteInfoTab` + `ClienteTratosTab` (lazy por montaje). `ClienteEditDialog` + `ClienteDeleteDialog`. Manejo 404 (toast + redirect), 204 (navigate /clientes), 409 (toast error.message sin navegar).
- [x] **T_E.5** Actualizar `src/routes/router.tsx`: reemplazar `ClientesPlaceholder` por `ClientesListPage` + agregar `/clientes/:id` → `ClienteDetailPage`. Sin ruta `/clientes/nuevo`.
- [x] **T_E.6** Eliminar `ClientesPlaceholder` de `src/routes/placeholders.tsx` (componente + export).
- [x] **T_E.7** **[CRÍTICO — Patrón #155]** Editar `src/components/layout/Sidebar.tsx` línea 18: QUITADO `disabled: true` y `badge: 'Próximamente'` del item Clientes. El item ahora es: `{ label: 'Clientes', to: '/clientes', icon: Users }`. Sin props `disabled` ni `badge`. El item renderiza como `<NavLink>` (no como `<div aria-disabled>`) — navegable.
- [x] **T_E.8** Verificaciones finales: `pnpm test:run` 109/109 verde, `pnpm type-check` exit 0, `pnpm lint` 0 errores (3 warnings pre-existentes en shadcn UI). ProspectosListPage tests: verdes (sin regresión).

### Archivos creados

| Archivo | Acción | Detalle |
|---------|--------|---------|
| `src/features/clientes/pages/ClientesListPage.tsx` | Creado | Container: useClientes(filters) + estado filtros locales + ClientesTable + ClienteCreateDialog |
| `src/features/clientes/pages/ClienteDetailPage.tsx` | Creado | Container: useCliente + useDeleteCliente + Tabs + Dialogs + manejo 404/409/204 |
| `src/features/clientes/__tests__/ClientesListPage.test.tsx` | Creado | 8 tests integration con MSW + MemoryRouter + QueryClient |
| `src/features/clientes/__tests__/ClienteDetailPage.test.tsx` | Creado | 11 tests integration con Routes + MSW + QueryClient |

### Archivos modificados

| Archivo | Acción | Detalle |
|---------|--------|---------|
| `src/routes/router.tsx` | Modificado | `/clientes` → ClientesListPage; `/clientes/:id` → ClienteDetailPage |
| `src/routes/placeholders.tsx` | Modificado | ClientesPlaceholder eliminado |
| `src/components/layout/Sidebar.tsx` | Modificado | **T_E.7**: item Clientes sin `disabled` ni `badge` — navegable |
| `src/features/clientes/hooks/useClientes.ts` | Modificado | `clientesKeys.list(filters?)` incluye filtros en queryKey para trigger refetch correcto. Hooks de create/update/delete actualizados a `clientesKeys.all` para prefix-match invalidation. |
| `src/features/clientes/__tests__/useCreateCliente.test.tsx` | Modificado | Assertion actualizada: `clientesKeys.all` en vez de `clientesKeys.list()` |
| `src/features/clientes/__tests__/useUpdateCliente.test.tsx` | Modificado | Assertion actualizada: `clientesKeys.all` en vez de `clientesKeys.list()` |

### Evidencia TDD (Lote E)

| Tarea | RED | GREEN | Refactor |
|-------|-----|-------|---------|
| T_E.1 ClientesListPage tests | Import resolution fail (página no existía) | ClientesListPage.tsx creado → 8 tests verdes | Fix: `capturedUrls[]` array en lugar de string único para tests de filtros Select |
| T_E.3 ClienteDetailPage tests | Import resolution fail (página no existía) | ClienteDetailPage.tsx creado → 11 tests verdes | Fix: usar `<Routes>` con `<Route path="/clientes/:id">` para que useParams funcione; `getAllByText` para "innovatech" que aparece múltiple |

### Deviaciones del diseño (Lote E)

1. **ADR-031 revisado (useClientes queryKey)**: El diseño original decía `clientesKeys.list()` retorna `['clientes'] as const` SIN filtros. Se modificó a `clientesKeys.list(filters?) => ['clientes', filters ?? {}]` para que TanStack Query refetchee al cambiar filtros. El diseño asumía que `staleTime: 0` forzaría el refetch, pero TQ solo refetchea si la key cambia. La invalidación de `useConvertirProspecto` usa `{ queryKey: ['clientes'] }` que por prefix-match en TQ v5 invalida todos los `['clientes', *]`. Compatibilidad preservada.
2. **Hooks create/update/delete → `clientesKeys.all`**: Como consecuencia del punto anterior, la invalidación en estos hooks se actualizó de `clientesKeys.list()` a `clientesKeys.all` para invalidar todas las variantes de la lista (con y sin filtros).

### Verificaciones de aceptación (Lote E)

- `pnpm test:run`: 109/109 verde (29 test files)
- `pnpm type-check`: exit 0
- `pnpm lint`: 0 errores (3 warnings pre-existentes shadcn UI)
- ProspectosListPage tests: verdes (7 tests, sin regresión)
- T_E.7 Sidebar: CONFIRMADO — item Clientes es `{ label: 'Clientes', to: '/clientes', icon: Users }` sin `disabled` ni `badge`

---

## Conteo de tests

- **Previos (pre-Change 5)**: 60 tests
- **Lote A nuevos**: 11 tests (handler tests)
- **Lote B nuevos**: 18 tests (6 hooks × ~3 casos)
- **Lote C nuevos**: 0 tests (migración pura)
- **Lote D nuevos**: 0 tests (cobertura implícita por page tests)
- **Lote E nuevos**: 20 tests (8 ClientesListPage + 11 ClienteDetailPage)
- **Total actual**: 109 tests
- **Objetivo era**: ~109 tests — ALCANZADO

## Próximo paso recomendado

`sdd-verify` — verificar Lote E contra specs y design. Lote F contingente post-verify.
