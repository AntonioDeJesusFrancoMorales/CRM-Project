# Tasks: Clientes Management (Change 5)

**Change**: clientes-management
**Strict TDD**: ACTIVO — RED → GREEN → REFACTOR por cada hook/página
**Total**: 42 tareas en 6 lotes (A → B → C → D → E → F)
**Dependencias**: A → B → C, B → D, B+C+D → E, E → F

---

## Lote A — MSW handlers + contrato de datos

> **Commit**: `feat(mocks): override DELETE clientes con 409 y filtros en GET`
> **Dependencias**: Ninguna
> **Precondición**: pasar `pnpm test:run` antes del commit.

- [x] **T_A.1** `[CODE]` En `src/mocks/handlers/clientes.ts`, agregar handler `http.delete` ANTES del spread `...makeCrudHandlers(...)`. Lógica: buscar `tratosFixture.filter(t => t.cliente_id === id)`; si hay tratos → `apiError(409, 'CONFLICT', mensajeConConteo, details)`; si no → `clientesFixture.splice(idx,1)` + 204. **AC**: el override DELETE debe ser el PRIMER elemento del array exportado, antes de `makeCrudHandlers`.
- [x] **T_A.2** `[CODE]` En `src/mocks/handlers/clientes.ts`, agregar handler `http.get` para `GET /clientes` con filtros ANTES del spread `...makeCrudHandlers(...)`. Filtros: `empresa_id` (string match) y `origen` (`prospecto` → `prospecto_origen_id !== null`; `manual` → `null`). **AC**: los handlers custom van ANTES del spread; MSW resuelve en orden.
- [x] **T_A.3** `[TEST]` Escribir tests del handler DELETE en `src/mocks/handlers/__tests__/clientes.handler.test.ts` (o equivalente). Casos: DELETE 204 cliente sin tratos; DELETE 409 con mensaje que incluye conteo de tratos; DELETE 404 cliente inexistente.
- [x] **T_A.4** `[TEST]` Escribir tests del handler GET con filtros: sin filtros devuelve todos; `empresa_id` filtra por empresa; `origen=prospecto` filtra solo convertidos; `origen=manual` filtra solo manuales.
- [x] **T_A.5** `[CODE]` Verificar que `GET /clientes/:id/tratos` ya existe en `src/mocks/handlers/clientes.ts` o `tratos.ts`. Si falta, agregar handler que filtra `tratosFixture` por `cliente_id`. **AC**: no duplicar si ya existe.
- [x] **T_A.6** `[CODE]` Ejecutar `pnpm test:run` y confirmar que tests anteriores (prospectos, empresas, usuarios) siguen verdes. **AC**: 0 regresiones.

---

## Lote B — Schema Zod + 6 Hooks CRUD (RED → GREEN)

> **Commit**: `feat(clientes): schema Zod y 6 hooks CRUD con tests`
> **Dependencias**: Lote A

- [x] **T_B.1** `[CODE]` Crear `src/features/clientes/schemas/cliente.schema.ts` con `clienteCreateSchema`, `clienteUpdateSchema` (`.partial()`), `ClienteCreateInput`, `ClienteUpdateInput`, y `CLIENTE_EMPTY_DEFAULTS`. **AC**: `como_nos_conocio` usa `.optional()` SIN `.default()` (lección WARN-03 de Change 4). `EMPTY_DEFAULTS` tiene `como_nos_conocio: undefined`.
- [x] **T_B.2** `[CODE]` Crear `src/features/clientes/hooks/useClientes.ts` con `clientesKeys` factory y hook `useClientes(filters?)`. **AC**: `clientesKeys.list()` retorna `['clientes'] as const` (NO concatenar filtros — mantiene compatibilidad con `useConvertirProspecto`). Hook acepta `UseClientesFilters { empresa_id?, origen? }` y los pasa como query params.
- [x] **T_B.3** `[TEST]` Escribir `src/features/clientes/__tests__/useClientes.test.tsx` ANTES de que el hook funcione correctamente. Casos: GET list retorna array; filtro `empresa_id` pasa query param correcto; filtro `origen=prospecto` pasa param correcto; error 500 expone error. (RED → luego GREEN con T_B.2 terminado).
- [x] **T_B.4** `[CODE]` Crear `src/features/clientes/hooks/useCliente.ts`. **AC**: `enabled: !!id`; maneja 404 sin crash.
- [x] **T_B.5** `[TEST]` Escribir `src/features/clientes/__tests__/useCliente.test.tsx`. Casos: GET by id devuelve cliente; 404 expone error con status 404.
- [x] **T_B.6** `[CODE]` Crear `src/features/clientes/hooks/useCreateCliente.ts`. **AC**: invalida `clientesKeys.list()` en `onSuccess`; `prospecto_origen_id` ausente del payload (el handler MSW lo fija a `null`).
- [x] **T_B.7** `[TEST]` Escribir `src/features/clientes/__tests__/useCreateCliente.test.tsx`. Casos: POST 201 → invalida `['clientes']`; error 422 expone details; `prospecto_origen_id` es null en cliente creado.
- [x] **T_B.8** `[CODE]` Crear `src/features/clientes/hooks/useUpdateCliente.ts`. **AC**: invalida `clientesKeys.list()` y `clientesKeys.detail(id)` en `onSuccess`.
- [x] **T_B.9** `[TEST]` Escribir `src/features/clientes/__tests__/useUpdateCliente.test.tsx`. Casos: PATCH 200 → invalida ambas keys; error 422 expone details.
- [x] **T_B.10** `[CODE]` Crear `src/features/clientes/hooks/useDeleteCliente.ts`. **AC**: DELETE 204 → `removeQueries(clientesKeys.detail(id))` + `invalidateQueries(clientesKeys.list())`; DELETE 409 → NO invalidar (cliente sigue existiendo), propagar error con `error.message` del backend para el toast.
- [x] **T_B.11** `[TEST]` Escribir `src/features/clientes/__tests__/useDeleteCliente.test.tsx`. Casos: DELETE 204 → invalida + remueve key; DELETE 409 → toast con mensaje del backend que incluye conteo; DELETE 404.
- [x] **T_B.12** `[CODE]` Crear `src/features/clientes/hooks/useTratosByCliente.ts`. **AC**: endpoint `/clientes/:id/tratos`; key `clientesKeys.tratos(id)`; `enabled: !!id`.
- [x] **T_B.13** `[TEST]` Escribir `src/features/clientes/__tests__/useTratosByCliente.test.tsx`. Casos: GET tratos retorna array con tratos; cliente sin tratos retorna `[]`; error 500 expone error.

---

## Lote C — Migración atómica del hook useClientes

> **ESTE LOTE DEBE COMMITEARSE COMO 1 SOLO COMMIT ATÓMICO**
> **Commit**: `refactor(clientes): migrar useClientes desde features/prospectos`
> **Dependencias**: Lote B (`src/features/clientes/hooks/useClientes.ts` ya debe existir)
> **Precondición**: `pnpm type-check` y `pnpm test:run` deben pasar ANTES de hacer el commit.

- [x] **T_C.1** `[CODE]` Editar `src/features/prospectos/pages/ProspectosListPage.tsx` línea 22: cambiar `import { useClientes } from '../hooks/useClientes'` → `import { useClientes } from '@/features/clientes/hooks/useClientes'`. El uso interno NO cambia.
- [x] **T_C.2** `[CODE]` Eliminar archivo `src/features/prospectos/hooks/useClientes.ts`.
- [x] **T_C.3** `[CODE]` Verificar pre-commit: `git status` muestra exactamente 1 eliminado + 1 modificado (+ el nuevo de Lote B si no fue commiteado aparte). Ejecutar `pnpm type-check` (exit 0) y `pnpm test:run -- prospectos` (tab Convertidos verde). **AC**: solo cuando ambos pasan, hacer el commit atómico.

---

## Lote D — Componentes UI (sin tests directos)

> **Commit**: `feat(clientes): componentes presentacionales y diálogos CRUD`
> **Dependencias**: Lote B
> **Nota**: cobertura implícita via page tests del Lote E (ADR-038). Excepción solo si sdd-verify detecta gap.

- [x] **T_D.1** `[CODE]` Crear `src/features/clientes/components/ClienteForm.tsx`. Props: `defaultValues: ClienteCreateInput`, `mode: 'create' | 'edit'`, `onSubmit`, `isSubmitting?`, `serverErrors?`. Internamente usa `useForm` con `zodResolver(clienteCreateSchema)`. Reusa `useEmpresas()` y `useUsuarios()` para los Selects. Mapea `'' → null` (utilidad `emptyToNull`) antes de `onSubmit`. **AC**: `como_nos_conocio` usa `value={field.value ?? ''}` en el Select.
- [x] **T_D.2** `[CODE]` Crear `src/features/clientes/components/ClienteCreateDialog.tsx`. Container que abre Dialog shadcn, renderiza `ClienteForm mode="create"` con `CLIENTE_EMPTY_DEFAULTS`, cablea `useCreateCliente`. **AC**: cierra dialog en `onSuccess`, muestra toast de éxito.
- [x] **T_D.3** `[CODE]` Crear `src/features/clientes/components/ClienteEditDialog.tsx`. Container que renderiza `ClienteForm mode="edit"` con datos prefilled del cliente. Cablea `useUpdateCliente`. **AC**: `defaultValues` toma los campos del `cliente` recibido por prop; invalida y cierra en `onSuccess`.
- [x] **T_D.4** `[CODE]` Crear `src/features/clientes/components/ClienteDeleteDialog.tsx`. AlertDialog con botones Confirmar/Cancelar. La lógica de DELETE + manejo 409 (toast error) + 204 (navigate) vive en el HOST (`ClienteDetailPage`), no en este componente. **AC**: el componente solo emite `onConfirm()` y `onCancel()`, sin lógica de mutation.
- [x] **T_D.5** `[CODE]` Crear `src/features/clientes/components/ClientesTable.tsx`. Columnas: `nombre_contacto` (clickeable → `navigate('/clientes/:id')`), empresa, contacto (correo/teléfono), badge origen, fecha creación. **AC**: nombre como `<button>` o `<Link>` que navega al detalle (patrón homologado con `EmpresasTable`).
- [x] **T_D.6** `[CODE]` Crear `src/features/clientes/components/ClienteOrigenBadge.tsx`. Props: `prospectoOrigenId: string | null`. Si `!== null`: `<Link to="/prospectos/:id">Origen: Prospecto convertido</Link>`. Si `null`: `<span>Origen: Manual</span>`. **AC**: el Link NO puede estar anidado dentro de otro `<Link>` o `<button>` (ADR-037).
- [x] **T_D.7** `[CODE]` Crear `src/features/clientes/components/ClienteInfoTab.tsx`. Renderiza todos los campos del cliente: `nombre_contacto`, `correo_contacto`, `telefono_contacto`, `cargo_contacto`, `como_nos_conocio`, `notas`, empresa (link `/empresas/:id`), responsable, `creado_en`, `actualizado_en`. Campos nulos → `"—"`. **AC**: sin datos calculados, puramente presentacional.
- [x] **T_D.8** `[CODE]` Crear `src/features/clientes/components/ClienteTratosTab.tsx`. Invoca `useTratosByCliente(id)` sin flag `enabled` externo (lazy implícito por montaje en `<TabsContent>`). Renderiza lista read-only. **AC**: empty state "Sin tratos vinculados"; sin botón de crear trato; sin links a detalle de trato (Change 6).

---

## Lote E — Pages + Routing + Sidebar

> **Commit**: `feat(clientes): pages, routing y habilitar item en sidebar`
> **Dependencias**: Lotes B, C (migración), D (componentes)

- [x] **T_E.1** `[TEST]` Escribir `src/features/clientes/__tests__/ClientesListPage.test.tsx` ANTES de implementar la página. Casos mínimos: render tabla con datos fixture; búsqueda por nombre filtra client-side; filtro empresa dispara query param; error 500 muestra botón "Reintentar"; click en nombre navega a detalle; botón "Nuevo cliente" abre `ClienteCreateDialog`.
- [x] **T_E.2** `[CODE]` Crear `src/features/clientes/pages/ClientesListPage.tsx`. Container: consume `useClientes(filters)`, estado local para filtros (input búsqueda, select empresa, select origen), `useState` para dialog open. Renderiza `ClientesTable` + `ClienteCreateDialog`. **AC**: búsqueda por nombre es client-side (filter sobre data); filtros empresa y origen pasan a `useClientes`.
- [x] **T_E.3** `[TEST]` Escribir `src/features/clientes/__tests__/ClienteDetailPage.test.tsx` ANTES de implementar la página. Casos mínimos: render header con nombre y empresa; badge prospecto es Link a `/prospectos/:id`; badge manual es span sin link; click "Tratos" monta `ClienteTratosTab` y dispara fetch lazy; 404 muestra toast y redirige a `/clientes`; click "Editar" abre `ClienteEditDialog`; click "Eliminar" abre AlertDialog; confirmar eliminar (204) navega a `/clientes`; confirmar eliminar (409) muestra toast con mensaje.
- [x] **T_E.4** `[CODE]` Crear `src/features/clientes/pages/ClienteDetailPage.tsx`. Container: consume `useCliente(id)`, `useDeleteCliente`. Maneja 404 (toast + redirect). Estado local: `editOpen`, `deleteOpen`. En `useDeleteCliente.onSuccess` (204) → `navigate('/clientes')` + toast éxito. En `onError` (409) → toast con `error.message`. Renderiza header con `ClienteOrigenBadge`, botones Editar/Eliminar, `ClienteEditDialog`, `ClienteDeleteDialog`, y `<Tabs>` con `ClienteInfoTab` + `ClienteTratosTab`. **AC**: estructura plana del header (ADR-037, sin Link anidado en button).
- [x] **T_E.5** `[CODE]` Agregar rutas en `src/routes/router.tsx`: `/clientes` → `<ClientesListPage />` y `/clientes/:id` → `<ClienteDetailPage />`. **AC**: NO agregar ruta `/clientes/nuevo`.
- [x] **T_E.6** `[CODE]` En `src/routes/placeholders.tsx`, eliminar `ClientesPlaceholder` (componente + su uso en el router si aún está referenciado).
- [x] **T_E.7** `[CODE]` En `src/components/layout/Sidebar.tsx`, quitar `disabled: true` y `badge: 'Próximamente'` del item `Clientes` en el array `items: NavItem[]`. **AC**: el item queda como `{ label: 'Clientes', to: '/clientes', icon: ... }` sin props `disabled` ni `badge`. Smoke manual: click en "Clientes" en el sidebar navega a `/clientes` sin overlay ni badge.
- [x] **T_E.8** `[CODE]` Ejecutar `pnpm test:run` (todos los tests verdes, incluidos los nuevos de Lote E) + `pnpm type-check` (exit 0) + `pnpm lint` (0 errores nuevos). **AC**: los tests de `ProspectosListPage` siguen verdes (no hay regresión post-migración Lote C).

---

## Lote F — Smoke fixes + polish (contingente)

> **Commit**: `fix(clientes): ajustes detectados en smoke/verify`
> **Dependencias**: Lote E
> **Nota**: este lote comienza vacío. Se llena durante `sdd-apply` si emergen issues en smoke manual o en `sdd-verify`.

- [ ] **T_F.1** `[CODE]` Reservado para fix detectado en smoke (ej: ajuste visual, edge case no cubierto). Describir al implementar.
- [ ] **T_F.2** `[CODE]` Reservado para fix detectado por `sdd-verify` (WARN-XX). Describir al implementar.

---

## Estimación

| Lote | Tareas | Tests nuevos (aprox.) | Enfoque |
|------|--------|-----------------------|---------|
| A | 6 | 7 (handler tests) | MSW handlers + override 409 + filtros |
| B | 12 | 18 (6 hooks × ~3 cases) | Schema + 6 hooks TDD RED→GREEN |
| C | 3 | 0 (regresión existente) | Migración atómica useClientes |
| D | 8 | 0 (cobertura implícita) | 8 componentes UI |
| E | 8 | 20 (2 pages × ~10 cases) | Pages + routing + sidebar |
| F | 2 | 0 (contingente) | Fixes detectados en apply/verify |
| **Total** | **39** | **~45 tests nuevos** | |

**Tests estimados post-Change 5**: ~60 actuales + ~45 nuevos = **~105 tests** (supera objetivo "50+ verdes" del proposal).

### Dependencias entre lotes

```
A (handlers MSW)
└── B (schema + hooks — necesita 409 funcional para test de DELETE)
    ├── C (migración atómica — necesita useClientes en clientes/ ya creado)
    └── D (componentes — consumen hooks de B)
        └── E (pages + routing + sidebar — importa componentes de D y hooks de B+C)
            └── F (smoke fixes — contingente post-apply/verify)
```

### Patrón Sidebar (obligatorio, patrón #155)

**T_E.7 es MANDATORIA** — quitar `disabled: true, badge: 'Próximamente'` del item Clientes en `Sidebar.tsx`. Este bug NO es detectado por type-check ni tests de integración (RTL usa MemoryRouter, no pasa por el Sidebar real). Solo el smoke manual lo captura. La tarea es la única defensa.

### Commit atómico Lote C (ADR-032)

El Lote C (T_C.1 → T_C.3) DEBE ser un único commit con exactamente: 1 archivo eliminado (`prospectos/hooks/useClientes.ts`) + 1 archivo modificado (`ProspectosListPage.tsx`) + el nuevo archivo de Lote B (si no fue commiteado separado). El `pnpm type-check` DEBE pasar antes del commit.
