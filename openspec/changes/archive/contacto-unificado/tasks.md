# Tasks — Change 2: `contacto-unificado`

**Status**: pending  
**Modo**: Strict TDD — cada unidad: test rojo primero, implementación verde, refactor.  
**Runner**: `pnpm test:run`  
**Fecha**: 2026-05-28  
**Rama**: `feat/contacto-unificado`

---

## Resumen de batches

| Batch | Descripción | Tareas |
|-------|-------------|--------|
| B1 | Fundación: endpoints + tipos + schema Zod | 5 |
| B2 | MSW fixtures + handlers | 4 |
| B3 | Hooks (TDD-first) | 14 |
| B4 | Componentes base | 10 |
| B5 | Páginas + routing + sidebar | 6 |
| B6 | Migración empresas (EmpresaContactosTab) | 5 |
| B7 | Migración tratos (imports sin tocar modelo) | 5 |
| B8 | Limpieza (eliminar prospectos/ y clientes/) | 6 |
| B9 | Verificación final | 3 |
| **Total** | | **58** |

---

## B1 — Fundación (endpoints + tipos + schema Zod)

> Sin dependencias externas. Estos archivos habilitan todos los pasos siguientes.

- [ ] **B1.1** [TEST] Crear `src/api/__tests__/endpoints.test.ts` (o actualizar si existe): agregar
  assertions para `endpoints.contactos`: `getAll()` → `/contactos/get-all`; `getById('c1')` → `/contactos/get-by-id?id=c1`; `create()` → `/contactos/create`; `edit('c1')` → `/contactos/edit?id=c1`; `delete('c1')` → `/contactos/delete?id=c1`.
  - Archivo: `src/api/__tests__/endpoints.test.ts`

- [ ] **B1.2** [IMPL] Actualizar `src/api/endpoints.ts`: agregar bloque `contactos` al objeto `endpoints`
  con las 5 funciones del contrato RPC. Verificar que `endpoints.empresas` y `endpoints.tareas` siguen
  intactos.
  - Archivo: `src/api/endpoints.ts`

- [ ] **B1.3** [IMPL] Actualizar `src/api/types.ts`: agregar interface `Contacto` con campos camelCase
  del back (`id`, `nombre`, `apellido`, `correo`, `telefono`, `empresaId`, `estadoRelacion`,
  `comoNosConocio`, `responsableId`, `creadoPor`, `creadoEn`, `actualizadoEn`);
  agregar `ContactoCreatePayload` y `ContactoUpdatePayload` (sin `empresaId` ni `creadoPor`
  — son inmutables en el back); verificar que `EstadoRelacion = 'ACTIVO' | 'INACTIVO' | 'PROSPECTO'`
  ya está exportado (fue añadido en Change 1 — si falta, agregarlo aquí); eliminar
  tipos `Prospecto`, `Cliente`, `ComoNosConocio`, `EstadoPosibleCliente` de este archivo
  SOLO si ningún archivo fuera de `prospectos/` y `clientes/` los importa todavía
  (verificar con Grep antes; si hay dependencias externas, postergarlo al B8).
  - Archivo: `src/api/types.ts`

- [ ] **B1.4** [TEST] Crear `src/features/contactos/schemas/__tests__/contacto.schema.test.ts`:
  verificar `contactoCreateSchema`: `nombre` requerido; `estadoRelacion` acepta `PROSPECTO|ACTIVO|INACTIVO`
  y rechaza valor inválido; `comoNosConocio` opcional, max 200 chars; `correo` opcional, formato
  válido rechaza string sin `@`; `empresaId` requerido; `ContactoUpdatePayload` no incluye
  `empresaId` ni `creadoPor`.
  - Archivo: `src/features/contactos/schemas/__tests__/contacto.schema.test.ts` (nuevo)

- [ ] **B1.5** [IMPL] Crear `src/features/contactos/schemas/contacto.schema.ts`:
  `contactoCreateSchema` + `contactoUpdateSchema` + `COMO_NOS_CONOCIO_SUGERENCIAS as const satisfies readonly string[]`
  + tipos `ContactoCreateInput` / `ContactoUpdateInput` + `CONTACTO_EMPTY_DEFAULTS`.
  - Archivo: `src/features/contactos/schemas/contacto.schema.ts` (nuevo)

> Acceptance: `pnpm test:run` — tests de endpoints y schema verdes.

---

## B2 — MSW fixtures + handlers

> Depende de B1 (tipos `Contacto` + `EstadoRelacion` + `endpoints.contactos`).
> Handlers listos habilitan TDD de hooks en B3.

- [ ] **B2.1** [IMPL] Crear `src/mocks/fixtures/contactos.ts`: mínimo 6 items que cubran los tres
  estados (≥2 por estado). Incluir: 1 prospecto sin correo (null); 1 prospecto completo;
  1 activo con `comoNosConocio` = texto libre; 1 activo con `comoNosConocio` = sugerencia del array;
  2 inactivos (uno con id referenciado en fixtures de tratos para probar guard 409).
  Todos los campos en camelCase, sin `notas`, sin `estado_posible_cliente`.
  - Archivo: `src/mocks/fixtures/contactos.ts` (nuevo)

- [ ] **B2.2** [TEST] Crear `src/mocks/handlers/__tests__/contactos.handler.test.ts`:
  verificar `GET /api/contactos/get-all` retorna lista con `estadoRelacion` en camelCase;
  `GET /api/contactos/get-by-id?id=` retorna item por id o 404; `POST /api/contactos/create`
  responde 201 con el contacto creado; `PUT /api/contactos/edit?id=` acepta PUT (no PATCH),
  lee id de query param, responde 200; `DELETE /api/contactos/delete?id=` responde 204;
  `DELETE /api/contactos/delete?id=` con id inactivo-con-tratos responde 409.
  - Archivo: `src/mocks/handlers/__tests__/contactos.handler.test.ts` (nuevo)

- [ ] **B2.3** [IMPL] Crear `src/mocks/handlers/contactos.ts`: handlers RPC explícitos para las
  5 rutas del back. No usar `makeCrudHandlers`. Importar rutas de `endpoints.contactos`.
  El handler DELETE debe detectar si el contacto tiene tratos asociados en la fixture
  y responder 409 en ese caso.
  - Archivo: `src/mocks/handlers/contactos.ts` (nuevo)

- [ ] **B2.4** [IMPL] Actualizar `src/mocks/handlers/index.ts`: importar `contactosHandlers` desde
  `./contactos`; agregar `...contactosHandlers` al array `handlers`. Los imports de
  `prospectosHandlers` y `clientesHandlers` se mantienen por ahora — se eliminan en B8.
  - Archivo: `src/mocks/handlers/index.ts`

> Acceptance: `pnpm test:run` — tests de handlers de contactos verdes, tests anteriores sin regresión.

---

## B3 — Hooks (TDD-first)

> Depende de B1 (endpoints + tipos) y B2 (handlers MSW en `index.ts`).
> Cada test ANTES de cada implementación.

- [ ] **B3.1** [TEST] Crear `src/features/contactos/__tests__/useContactos.test.tsx`:
  verificar que llama `GET /api/contactos/get-all`, retorna array de `Contacto`, maneja
  estado loading y error; el `queryKey` es `['contactos']`.
  - Archivo: `src/features/contactos/__tests__/useContactos.test.tsx` (nuevo)

- [ ] **B3.2** [IMPL] Crear `src/features/contactos/hooks/useContactos.ts`:
  `useQuery({ queryKey: contactosKeys.list(), queryFn: () => apiClient.get<Contacto[]>(endpoints.contactos.getAll()) })`.
  Exportar `contactosKeys` con `list: () => ['contactos'] as const` y `detail: (id: string) => ['contactos', id] as const`.
  - Archivo: `src/features/contactos/hooks/useContactos.ts` (nuevo)

- [ ] **B3.3** [TEST] Crear `src/features/contactos/__tests__/useContacto.test.tsx`:
  verificar: (a) cuando hay cache en `['contactos']` retorna item por id sin nueva petición HTTP;
  (b) sin cache, llama `GET /api/contactos/get-by-id?id=`; (c) id inexistente retorna `undefined`.
  - Archivo: `src/features/contactos/__tests__/useContacto.test.tsx` (nuevo)

- [ ] **B3.4** [IMPL] Crear `src/features/contactos/hooks/useContacto.ts`:
  `useQuery({ queryKey: contactosKeys.detail(id), queryFn: () => apiClient.get<Contacto>(endpoints.contactos.getById(id)), initialData: () => queryClient.getQueryData<Contacto[]>(contactosKeys.list())?.find(c => c.id === id) })`.
  - Archivo: `src/features/contactos/hooks/useContacto.ts` (nuevo)

- [ ] **B3.5** [TEST] Crear `src/features/contactos/__tests__/useCreateContacto.test.tsx`:
  verificar: `POST /api/contactos/create` responde 201; invalidación de `contactosKeys.list()`
  post-mutación; toast de éxito con sonner.
  - Archivo: `src/features/contactos/__tests__/useCreateContacto.test.tsx` (nuevo)

- [ ] **B3.6** [IMPL] Crear `src/features/contactos/hooks/useCreateContacto.ts`:
  `useMutation({ mutationFn: (payload) => apiClient.post<Contacto>(endpoints.contactos.create(), payload), onSuccess: () => { queryClient.invalidateQueries(contactosKeys.list()); toast.success(...) } })`.
  - Archivo: `src/features/contactos/hooks/useCreateContacto.ts` (nuevo)

- [ ] **B3.7** [TEST] Crear `src/features/contactos/__tests__/useUpdateContacto.test.tsx`:
  verificar `PUT /api/contactos/edit?id=`; invalidación de list + detail; body no incluye
  `empresaId` ni `creadoPor`.
  - Archivo: `src/features/contactos/__tests__/useUpdateContacto.test.tsx` (nuevo)

- [ ] **B3.8** [IMPL] Crear `src/features/contactos/hooks/useUpdateContacto.ts`:
  `useMutation({ mutationFn: ({ id, data }) => apiClient.put<Contacto>(endpoints.contactos.edit(id), data), onSuccess: (_, { id }) => { invalidate list + detail(id); toast.success(...) } })`.
  - Archivo: `src/features/contactos/hooks/useUpdateContacto.ts` (nuevo)

- [ ] **B3.9** [TEST] Crear `src/features/contactos/__tests__/useDeleteContacto.test.tsx`:
  verificar: 204 → invalidación de list; 409 → no invalida, toast de error con mensaje del back
  (`"El contacto tiene tratos activos"`).
  - Archivo: `src/features/contactos/__tests__/useDeleteContacto.test.tsx` (nuevo)

- [ ] **B3.10** [IMPL] Crear `src/features/contactos/hooks/useDeleteContacto.ts`:
  `useMutation({ mutationFn: (id) => apiClient.delete<void>(endpoints.contactos.delete(id)), onSuccess: () => { invalidate list; toast.success(...) }, onError: (e) => toast.error(e.message) })`.
  - Archivo: `src/features/contactos/hooks/useDeleteContacto.ts` (nuevo)

- [ ] **B3.11** [TEST] Crear `src/features/contactos/__tests__/useEmpresaContactos.test.tsx`:
  verificar que el `select` filtra correctamente por `empresaId`; contactos de otra empresa
  no aparecen; comparte `queryKey: ['contactos']` con `useContactos`.
  - Archivo: `src/features/contactos/__tests__/useEmpresaContactos.test.tsx` (nuevo)

- [ ] **B3.12** [IMPL] Crear `src/features/contactos/hooks/useEmpresaContactos.ts`:
  `useQuery({ queryKey: contactosKeys.list(), queryFn: () => apiClient.get<Contacto[]>(endpoints.contactos.getAll()), select: (data) => data.filter(c => c.empresaId === empresaId) })`.
  - Archivo: `src/features/contactos/hooks/useEmpresaContactos.ts` (nuevo)

- [ ] **B3.13** [TEST] Crear `src/features/contactos/__tests__/useTransicionEstado.test.ts` (sin React):
  tabla de 9 casos (3 estados actuales × 3 candidatos): idempotencia pasa; ACTIVO → PROSPECTO
  falla; INACTIVO → PROSPECTO falla; PROSPECTO → INACTIVO sin tratos activos pasa; ACTIVO →
  INACTIVO con tratos activos falla; ACTIVO → INACTIVO sin tratos activos pasa; todos los demás
  pasan. Definición usada: **`trato.estado === 'abierto'`** = trato activo (ver nota al pie).
  - Archivo: `src/features/contactos/__tests__/useTransicionEstado.test.ts` (nuevo)

- [ ] **B3.14** [IMPL] Crear `src/features/contactos/hooks/useTransicionEstado.ts`:
  función pura exportada `puedeTransicionar(actual, nuevo, tieneTratosActivos)`.
  `tieneTratosActivos` se computa externamente con `tratosDelContacto.some(t => t.estado === 'abierto')`.
  - Archivo: `src/features/contactos/hooks/useTransicionEstado.ts` (nuevo)

> Acceptance: `pnpm test:run` — todos los tests de hooks de contactos verdes, 0 regresiones.

---

## B4 — Componentes base

> Depende de B3 (hooks disponibles para mocking en tests de componentes).

- [ ] **B4.1** [TEST] Crear `src/features/contactos/__tests__/ComoNosConocioInput.test.tsx`:
  verificar: renderiza `<input>` con atributo `list`; renderiza `<datalist>` con las 5 sugerencias
  de `COMO_NOS_CONOCIO_SUGERENCIAS`; acepta texto libre (sin sugerencias, no falla validación de
  pertenencia al array); `maxLength` es 200; value null/undefined renderiza como string vacío.
  - Archivo: `src/features/contactos/__tests__/ComoNosConocioInput.test.tsx` (nuevo)

- [ ] **B4.2** [IMPL] Crear `src/features/contactos/components/ComoNosConocioInput.tsx`:
  recibe `{ ...field }` de react-hook-form, renderiza `<Input list="como-nos-conocio-options" maxLength={200} value={field.value ?? ''} ...field />` + `<datalist>` con `COMO_NOS_CONOCIO_SUGERENCIAS`.
  - Archivo: `src/features/contactos/components/ComoNosConocioInput.tsx` (nuevo)

- [ ] **B4.3** [TEST] Crear `src/features/contactos/__tests__/EstadoRelacionSelect.test.tsx`:
  verificar: (a) opciones inválidas tienen `aria-disabled` o están deshabilitadas en el `Select`;
  (b) Tooltip muestra `razon` al hacer hover sobre opción deshabilitada; (c) opciones válidas
  permiten `onValueChange`; (d) ACTIVO → PROSPECTO está deshabilitado; (e) ACTIVO → INACTIVO
  con `tieneTratosActivos=true` está deshabilitado con razón correcta.
  - Archivo: `src/features/contactos/__tests__/EstadoRelacionSelect.test.tsx` (nuevo)

- [ ] **B4.4** [IMPL] Crear `src/features/contactos/components/EstadoRelacionSelect.tsx`:
  recibe `{ contactoActual, tratosDelContacto, value, onChange, disabled? }`.
  `tieneTratosActivos = tratosDelContacto.some(t => t.estado === 'abierto')`.
  Itera sobre los 3 valores de `EstadoRelacion`, llama `puedeTransicionar`, envuelve opciones
  inválidas en `<Tooltip>` de Radix con `razon` como contenido.
  - Archivo: `src/features/contactos/components/EstadoRelacionSelect.tsx` (nuevo)

- [ ] **B4.5** [TEST] Crear `src/features/contactos/__tests__/ContactoForm.test.tsx`:
  verificar: campos requeridos fallan validación sin input; `comoNosConocio` renderiza datalist;
  submit válido llama `onSubmit` con los valores correctos; modo `edit` inicializa con
  `defaultValues`.
  - Archivo: `src/features/contactos/__tests__/ContactoForm.test.tsx` (nuevo)

- [ ] **B4.6** [IMPL] Crear `src/features/contactos/components/ContactoForm.tsx`:
  presentacional, react-hook-form + zod. Usa `ComoNosConocioInput` para el campo `comoNosConocio`.
  Incluye campo `estadoRelacion` como `<Select>` Radix básico (sin `EstadoRelacionSelect` que
  requiere contexto de tratos — ese se usa en el detail, no en el form de creación).
  - Archivo: `src/features/contactos/components/ContactoForm.tsx` (nuevo)

- [ ] **B4.7** [IMPL] Crear `src/features/contactos/components/ContactoFormDialog.tsx`:
  ADR-043 (modal): dialog Radix que envuelve `ContactoForm` para create y edit. Sin test
  específico (cubierto por page tests).
  - Archivo: `src/features/contactos/components/ContactoFormDialog.tsx` (nuevo)

- [ ] **B4.8** [IMPL] Crear `src/features/contactos/components/ContactoDeleteDialog.tsx`:
  dialog de confirmación. Muestra advertencia si el delete puede responder 409. Sin test
  específico (patrón homologado con `EmpresaDeleteDialog`).
  - Archivo: `src/features/contactos/components/ContactoDeleteDialog.tsx` (nuevo)

- [ ] **B4.9** [TEST] Crear `src/features/contactos/__tests__/ContactosTable.test.tsx`:
  verificar: renderiza filas por cada contacto del array; nombre linkea a `/contactos/:id`;
  muestra `estadoRelacion` como badge; tabla vacía renderiza mensaje de vacío.
  - Archivo: `src/features/contactos/__tests__/ContactosTable.test.tsx` (nuevo)

- [ ] **B4.10** [IMPL] Crear `src/features/contactos/components/ContactosTable.tsx`:
  recibe `contactos: Contacto[]`, renderiza tabla. Nombre como `<Link to={/contactos/${c.id}}>`.
  Badge de `estadoRelacion`. Sin filtros — los filtros los hacen las páginas.
  - Archivo: `src/features/contactos/components/ContactosTable.tsx` (nuevo)

> Acceptance: `pnpm test:run` — todos los tests de componentes de contactos verdes.

---

## B5 — Páginas + routing + sidebar

> Depende de B3 (hooks) y B4 (componentes).

- [ ] **B5.1** [TEST] Crear `src/features/contactos/__tests__/ContactosPage.test.tsx`:
  verificar: (a) tab `PROSPECTO` por defecto muestra solo contactos con `estadoRelacion === 'PROSPECTO'`;
  (b) cambiar tab a `ACTIVO` filtra correctamente; (c) tab state sincroniza con `?tab=` en URL;
  (d) tab PROSPECTO sin datos muestra mensaje de vacío.
  - Archivo: `src/features/contactos/__tests__/ContactosPage.test.tsx` (nuevo)

- [ ] **B5.2** [IMPL] Crear `src/features/contactos/pages/ContactosPage.tsx`:
  usa `useContactos()`, tabs Radix para `PROSPECTO|ACTIVO|INACTIVO` con estado via `useSearchParams`
  (parámetro `tab`). Cada tab pasa el subarray filtrado a `<ContactosTable>`. Botón
  "Nuevo contacto" abre `<ContactoFormDialog mode="create">`.
  - Archivo: `src/features/contactos/pages/ContactosPage.tsx` (nuevo)

- [ ] **B5.3** [TEST] Crear `src/features/contactos/__tests__/ContactoDetailPage.test.tsx`:
  verificar: muestra nombre y datos del contacto; tab "Info" renderiza campos; tab "Tratos"
  muestra tratos del contacto; 404 de back muestra mensaje de error.
  - Archivo: `src/features/contactos/__tests__/ContactoDetailPage.test.tsx` (nuevo)

- [ ] **B5.4** [IMPL] Crear `src/features/contactos/pages/ContactoDetailPage.tsx`:
  usa `useContacto(id)`. Tabs Info / Tratos. Tab Info muestra todos los campos, incluye
  `<EstadoRelacionSelect>` con `tratosDelContacto`. Tab Tratos muestra tratos del contacto
  (filtrado client-side sobre `useTratos()` si existe, o placeholder). Botones de editar /
  eliminar en header. 
  - Archivo: `src/features/contactos/pages/ContactoDetailPage.tsx` (nuevo)

- [ ] **B5.5** [IMPL] Actualizar `src/routes/router.tsx`:
  - Importar `ContactosPage` y `ContactoDetailPage`.
  - Agregar `{ path: 'contactos', element: <ContactosPage /> }` y `{ path: 'contactos/:id', element: <ContactoDetailPage /> }`.
  - Agregar redirects: `{ path: 'prospectos', element: <Navigate to="/contactos?tab=PROSPECTO" replace /> }`, `{ path: 'prospectos/:id', element: <Navigate to="/contactos" replace /> }`, `{ path: 'clientes', element: <Navigate to="/contactos?tab=ACTIVO" replace /> }`, `{ path: 'clientes/:id', element: <Navigate to="/contactos" replace /> }`.
  - Eliminar imports de `ProspectosListPage`, `ProspectoDetailPage`, `ClientesListPage`, `ClienteDetailPage` y sus rutas originales (`{ path: 'prospectos', ... }`, `{ path: 'clientes', ... }`).
  - Archivo: `src/routes/router.tsx`

- [ ] **B5.6** [IMPL] Actualizar `src/components/layout/Sidebar.tsx`:
  reemplazar el ítem `{ label: 'Prospectos', to: '/prospectos', icon: UserSearch }` y el ítem
  `{ label: 'Clientes', to: '/clientes', icon: Users }` por uno único
  `{ label: 'Contactos', to: '/contactos', icon: Contact2 }` (o usar `UserCircle2` si `Contact2`
  no existe en lucide-react — verificar antes de usar). Eliminar íconos `UserSearch` y `Users`
  del import si quedan sin uso.
  - Archivo: `src/components/layout/Sidebar.tsx`

> Acceptance: `pnpm test:run` — todos los tests de páginas verdes; navegar a `/contactos` en app
> muestra la página con tabs.

---

## B6 — Migración empresas (EmpresaContactosTab)

> Depende de B3 (`useEmpresaContactos` disponible).
> `EmpresaProspectosTab` y `EmpresaClientesTab` son los tabs legacy a reemplazar.

- [ ] **B6.1** [TEST] Crear `src/features/empresas/__tests__/EmpresaContactosTab.test.tsx`:
  verificar: muestra contactos de la empresa filtrados por `empresaId`; contactos de otra empresa
  no aparecen; muestra `estadoRelacion` como badge; lista vacía muestra mensaje.
  - Archivo: `src/features/empresas/__tests__/EmpresaContactosTab.test.tsx` (nuevo)

- [ ] **B6.2** [IMPL] Crear `src/features/empresas/components/EmpresaContactosTab.tsx`:
  usa `useEmpresaContactos(empresaId)`. Muestra nombre como link a `/contactos/:id`, `estadoRelacion`
  como badge, correo y teléfono. Reemplaza `EmpresaProspectosTab` + `EmpresaClientesTab` en un
  único tab "Contactos".
  - Archivo: `src/features/empresas/components/EmpresaContactosTab.tsx` (nuevo)

- [ ] **B6.3** [IMPL] Actualizar `src/features/empresas/pages/EmpresaDetailPage.tsx`:
  reemplazar los dos tabs "Prospectos" y "Clientes" por un único tab "Contactos" que usa
  `<EmpresaContactosTab empresaId={id} />`. Eliminar imports de `EmpresaProspectosTab` y
  `EmpresaClientesTab`.
  - Archivo: `src/features/empresas/pages/EmpresaDetailPage.tsx`

- [ ] **B6.4** [IMPL] Actualizar `src/mocks/handlers/empresas.ts`: eliminar los dos handlers
  legacy `GET /api/empresas/:id/prospectos` y `GET /api/empresas/:id/clientes` (líneas 71-78).
  Eliminar imports de `prospectosFixture` y `clientesFixture` de ese archivo.
  - Archivo: `src/mocks/handlers/empresas.ts`

- [ ] **B6.5** [TEST] Actualizar `src/features/empresas/__tests__/EmpresaDetailPage.test.tsx` (si existe):
  ajustar tests para que busquen el tab "Contactos" en lugar de "Prospectos"/"Clientes".
  Verificar que los tests pasan.
  - Archivo: `src/features/empresas/__tests__/EmpresaDetailPage.test.tsx`

> Acceptance: `pnpm test:run` — tests de empresas verdes; EmpresaDetailPage muestra tab Contactos.

---

## B7 — Migración tratos (imports sin tocar el modelo)

> Depende de B3 (`useContactos` disponible). No tocar el modelo `Trato` ni su schema.

- [ ] **B7.1** [IMPL] Actualizar `src/features/tratos/components/TratoForm.tsx`:
  reemplazar imports `useClientes` y `useProspectos` por `useContactos` (de `@/features/contactos/hooks/useContactos`).
  Reimplementar los dos selects con filtros:
  - Select "Prospecto": `useContactos().data?.filter(c => c.estadoRelacion === 'PROSPECTO') ?? []`.
  - Select "Cliente": `useContactos().data?.filter(c => c.estadoRelacion === 'ACTIVO' || c.estadoRelacion === 'INACTIVO') ?? []`.
  Los campos del form `cliente_id` / `prospecto_id` y el toggle `asociacion` permanecen igual.
  - Archivo: `src/features/tratos/components/TratoForm.tsx`

- [ ] **B7.2** [IMPL] Actualizar `src/features/tratos/components/TratoInfoTab.tsx`:
  reemplazar links `/clientes/:id` y `/prospectos/:id` por `/contactos/:id`. Eliminar imports
  de tipos `Cliente` / `Prospecto` si existieran — usar tipo `Contacto` para el objeto
  vinculado, o simplemente cambiar la URL sin cambiar el tipo si el tab ya tipea dinámicamente.
  - Archivo: `src/features/tratos/components/TratoInfoTab.tsx`

- [ ] **B7.3** [IMPL] Actualizar `src/features/tratos/pages/TratoDetailPage.tsx`:
  reemplazar cualquier `useClientes`/`useProspectos` por `useContactos`. Links a
  `/contactos/:id`. Verificar que `tratoId` sigue siendo el filtro para tareas.
  - Archivo: `src/features/tratos/pages/TratoDetailPage.tsx`

- [ ] **B7.4** [TEST] Actualizar fixtures/mocks de tests de tratos que hagan referencia a
  handlers de prospectos o clientes:
  - `src/features/tratos/__tests__/TratoForm.test.tsx`: si intercepta `/api/prospectos/get-all`
    o `/api/clientes/get-all`, cambiar por `/api/contactos/get-all` con fixture de contactos.
  - `src/features/tratos/__tests__/TratoDetailPage.test.tsx`: mismo ajuste.
  - Verificar `pnpm test:run` — tests de tratos verdes antes de continuar a B8.
  - Archivos: `src/features/tratos/__tests__/*.test.tsx` (los que apliquen)

- [ ] **B7.5** [TEST] Ejecutar `pnpm test:run` y confirmar que todos los tests de tratos pasan.
  Si algún test de tratos sigue importando tipos `Prospecto` o `Cliente` eliminados, actualizar
  los tipos a `Contacto`. Documentar cualquier test roto pre-existente como ruido inherited.
  - Verificación antes de proceder a B8.

> Acceptance: `pnpm test:run` — todos los tests de tratos verdes; ningún import de `useClientes`
> ni `useProspectos` en `src/features/tratos/`.

---

## B8 — Limpieza (eliminar features viejas)

> Depende de que B7 haya pasado completamente. Solo eliminar después de que todos los tests
> de tratos sean verdes.

- [ ] **B8.1** [IMPL] Eliminar `src/features/prospectos/` completo (directorio + todo su contenido).
  Eliminar `src/features/clientes/` completo.
  - Nota: verificar antes con Grep que ningún archivo fuera de estos directorios y fuera de
    `src/mocks/handlers/prospectos.ts`, `clientes.ts` importe de `features/prospectos/` o
    `features/clientes/`. Si hay referencias huérfanas, corregirlas antes de borrar.

- [ ] **B8.2** [IMPL] Eliminar `src/mocks/handlers/prospectos.ts` y `src/mocks/handlers/clientes.ts`.
  Eliminar `src/mocks/fixtures/prospectos.ts` y `src/mocks/fixtures/clientes.ts`.

- [ ] **B8.3** [IMPL] Actualizar `src/mocks/handlers/index.ts`:
  eliminar imports de `prospectosHandlers` y `clientesHandlers`; eliminar `...prospectosHandlers`
  y `...clientesHandlers` del array. Verificar que `...contactosHandlers` ya está (B2.4).
  - Archivo: `src/mocks/handlers/index.ts`

- [ ] **B8.4** [IMPL] Actualizar `src/api/types.ts`: eliminar tipos `Prospecto`, `Cliente`,
  `ComoNosConocio` (enum viejo), `EstadoPosibleCliente` si aún están presentes y no tienen
  referencias externas. Verificar con Grep antes de eliminar.
  - Archivo: `src/api/types.ts`

- [ ] **B8.5** [CLEANUP] Buscar referencias huérfanas: usar Grep por `prospectos` y `clientes`
  (case-insensitive) en `src/` excluyendo el directorio eliminado. Para cada hit:
  - Si es un campo de modelo `Trato` (`prospecto_id`, `cliente_id`): **no tocar** (fuera de scope).
  - Si es una importación o link de UI: corregir apuntando a `/contactos`.
  - Si es un test ya obsoleto: eliminar.

- [ ] **B8.6** [IMPL] Eliminar `src/features/empresas/components/EmpresaProspectosTab.tsx` y
  `src/features/empresas/components/EmpresaClientesTab.tsx` (ya reemplazados en B6).
  Eliminar `src/features/empresas/hooks/useEmpresaProspectos.ts` y
  `src/features/empresas/hooks/useEmpresaClientes.ts`.

> Acceptance: `pnpm test:run` — verde; Grep por `features/prospectos` y `features/clientes`
> en `src/` da cero resultados (excluyendo campos `prospecto_id`/`cliente_id` del modelo Trato).

---

## B9 — Verificación final

> Ejecutar solo cuando B1–B8 estén completos y en verde.

- [ ] **B9.1** [TEST] `pnpm test:run`: confirmar 0 tests fallidos. Documentar el total de tests
  antes y después del change. Cualquier test roto pre-existente (no causado por este change)
  documentarlo como ruido inherited.
  - Referencia: Change 1 finalizó con 318/318 passed.

- [ ] **B9.2** [TYPECHECK] `pnpm type-check`: confirmar 0 errores nuevos en el alcance de este
  change. Los 3 errores pre-existentes en `src/features/tratos/__tests__/KanbanCard.test.tsx`
  y `KanbanColumna.test.tsx` son ruido inherited — documentarlos explícitamente.

- [ ] **B9.3** [LINT] Verificar con Grep:
  - Cero archivos en `src/` (fuera de modelo Trato) importan de `features/prospectos/` o
    `features/clientes/`.
  - Cero rutas literales `/prospectos` o `/clientes` en JSX (deben ser redirects en router,
    no links hardcodeados).
  - Todos los hooks de contactos usan `endpoints.contactos.*` (no rutas literales).

> Acceptance: `pnpm test:run` verde, `pnpm type-check` sin errores nuevos, Grep limpio.

---

## Dependencias entre batches

```
B1 (endpoints + tipos + schema)
  └─► B2 (fixtures + handlers MSW)
        └─► B3 (hooks)
              ├─► B4 (componentes base)
              │     └─► B5 (páginas + routing + sidebar)
              └─► B6 (migración empresas)
              └─► B7 (migración tratos)
                    └─► B8 (limpieza)
                          └─► B9 (verificación final)
```

B3 y B6 pueden iniciarse en paralelo una vez que B2 está completo (ambos dependen de `useEmpresaContactos` que está en B3, por lo que B6 espera a B3).

---

## Resolución: definición de "trato activo"

**Archivo leído**: `src/features/tratos/schemas/trato.schema.ts`

El enum real del front es:

```ts
estado: z.enum(['abierto', 'ganado', 'perdido'])
```

**Definición adoptada**: un trato está **activo** cuando `trato.estado === 'abierto'`.

```ts
// En puedeTransicionar y en EstadoRelacionSelect
const tieneTratosActivos = tratosDelContacto.some(t => t.estado === 'abierto');
```

El diseño documentaba `{ GANADO, PERDIDO, PERDIDO_REENGANCHE }` como set terminal (mayúsculas, con reenganche) — ese es el modelo futuro del back, no el que existe hoy en el front. Se descarta en favor del enum real. La deuda queda documentada: cuando se implemente el change de tratos y se alinee el `EstadoTrato` con el back, actualizar `puedeTransicionar` si el set terminal cambia.
