# Diseño — Change 2: `contacto-unificado`

**Fase**: sdd-design  
**Fecha**: 2026-05-28  
**Rama**: `feat/contacto-unificado`  
**Depende de**: Change 1 `contrato-endpoints-rpc` (completado)

---

## 1. Estructura de archivos — `src/features/contactos/`

ADR-040 feature-flat: carpeta plana por concern, sin sub-dominios anidados.

```
src/features/contactos/
├── schemas/
│   └── contacto.schema.ts          # Zod schemas + COMO_NOS_CONOCIO_SUGERENCIAS
├── hooks/
│   ├── useContactos.ts             # GET /contactos/get-all + contactosKeys
│   ├── useContacto.ts              # GET /contactos/get-by-id?id= (client-side primero)
│   ├── useCreateContacto.ts        # POST /contactos/create
│   ├── useUpdateContacto.ts        # PUT /contactos/edit?id=
│   ├── useDeleteContacto.ts        # DELETE /contactos/delete?id=
│   ├── useEmpresaContactos.ts      # filtro client-side por empresaId
│   └── useTransicionEstado.ts      # función pura puedeTransicionar (ver §5)
├── components/
│   ├── ContactosTable.tsx          # tabla genérica: recibe contactos[], sin filtrar
│   ├── ContactoForm.tsx            # form create/edit presentacional
│   ├── ContactoFormDialog.tsx      # dialog ADR-043 que envuelve ContactoForm
│   ├── ContactoDeleteDialog.tsx    # dialog de confirmación de eliminación
│   ├── ContactoInfoTab.tsx         # tab de datos del detalle
│   ├── ContactoTratosTab.tsx       # tab tratos del detalle (delegado a hooks de tratos)
│   ├── EstadoRelacionSelect.tsx    # Select con transiciones filtradas (ver §5)
│   └── ComoNosConocioInput.tsx     # Input + datalist nativo (ver §4)
├── pages/
│   ├── ContactosPage.tsx           # /contactos — lista con Tabs por estadoRelacion
│   └── ContactoDetailPage.tsx      # /contactos/:id — detalle con tabs
└── __tests__/
    ├── useContactos.test.tsx
    ├── useContacto.test.tsx
    ├── useCreateContacto.test.tsx
    ├── useUpdateContacto.test.tsx
    ├── useDeleteContacto.test.tsx
    ├── useEmpresaContactos.test.tsx
    ├── useTransicionEstado.test.ts  # test unitario puro (no necesita React)
    ├── ComoNosConocioInput.test.tsx
    ├── EstadoRelacionSelect.test.tsx
    ├── ContactosPage.test.tsx
    └── ContactoDetailPage.test.tsx
```

**Nomenclatura de hooks**: se usa `useCreateContacto` / `useUpdateContacto` / `useDeleteContacto`
alineando con el patrón de empresas (`useCreateEmpresa`, `useUpdateEmpresa`, `useDeleteEmpresa`).
La propuesta mencionaba `useCrearContacto` — se descarta en favor del inglés consistente con el resto del codebase.

---

## 2. Capa de contrato API

### 2.1 Bloque `endpoints.contactos`

```ts
// src/api/endpoints.ts — agregar al objeto endpoints existente
contactos: {
  getAll:  () => '/contactos/get-all',
  getById: (id: string) => `/contactos/get-by-id?id=${id}`,
  create:  () => '/contactos/create',
  edit:    (id: string) => `/contactos/edit?id=${id}`,
  delete:  (id: string) => `/contactos/delete?id=${id}`,
},
```

El back SÍ expone `get-by-id` para Contacto (diferencia con Empresa). Se incluye.

### 2.2 Convención de mutations

```ts
// Create — 201
apiClient.post<Contacto>(endpoints.contactos.create(), payload)

// Update — 200
apiClient.put<Contacto>(endpoints.contactos.edit(id), payload)

// Delete — 204
apiClient.delete<void>(endpoints.contactos.delete(id))
```

`stringsToNulls(input)` se aplica antes de enviar (mismo patrón que empresas).

### 2.3 Query keys

```ts
export const contactosKeys = {
  all:    ['contactos'] as const,
  list:   () => ['contactos'] as const,
  detail: (id: string) => ['contactos', id] as const,
};
```

Plana y sin sub-namespace — igual que `empresasKeys`. El array único `['contactos']`
es la cache canónica de todos los derivados.

---

## 3. Estrategia de cache

### Decisión: `select` de TanStack Query para derivados

`useContactos` hace `GET /contactos/get-all` y es la única llamada a red para el listado.
Todos los derivados se obtienen via la opción `select` de `useQuery`, no con `useMemo` posterior.

**Justificación**:
- `select` es memoizado por TanStack Query v5 internamente — no requiere `useMemo` manual.
- El componente consumidor solo recibe el subarray que le importa, sin re-render cuando cambia
  un contacto de otro estado.
- `useMemo(data, [data])` obliga al consumidor a manejar el `undefined` de carga; `select` lo
  encapsula limpiamente dentro del mismo `UseQueryResult`.
- Empresas usa `useEmpresas()` puro + filtro inline en JSX — válido para listas cortas.
  Contactos tiene más superficies de derivación (por empresa, por estado, etc.) por lo que
  el `select` evita repetir el filtro en cada punto de consumo.

```ts
// useEmpresaContactos.ts — derivado via select
export function useEmpresaContactos(empresaId: string) {
  return useQuery<Contacto[], Error, Contacto[]>({
    queryKey: contactosKeys.list(),
    queryFn:  () => apiClient.get<Contacto[]>(endpoints.contactos.getAll()),
    select:   (data) => data.filter((c) => c.empresaId === empresaId),
  });
}
```

Los tabs de `ContactosPage` (por `estadoRelacion`) usan `useContactos()` directamente y
filtran en JSX sobre `data` — el array completo es pequeño y el filtro es trivial.
`select` aplica cuando hay un hook dedicado (como `useEmpresaContactos`); para tabs inline,
el filtro JSX es más legible.

**Query key compartida**: `useEmpresaContactos` y `useContactos` comparten `queryKey: ['contactos']`.
Cuando una mutación invalida `contactosKeys.list()`, ambos se actualizan automáticamente.

---

## 4. Combobox `comoNosConocio`

### Decisión: `<Input>` nativo + `<datalist>` HTML

**Opciones evaluadas**:

| Opción | Tradeoffs |
|--------|-----------|
| shadcn Combobox (Popover + Command + cmdk) | cmdk NO está instalado, `popover.tsx` y `command.tsx` no existen en `/ui`. Requiere instalar dependencia nueva. Descartado. |
| Radix Select + input free-text fallback | Dos controles para un solo campo; UX inconsistente; no permite mezclar selección con texto propio sin lógica extra. Descartado. |
| `<Input>` + `<datalist>` nativo | Cero dependencias. Accesibilidad nativa (WAI-ARIA). El usuario puede elegir de la lista O escribir texto libre. Max 200 chars vía atributo. Compatible con react-hook-form vía `{...field}`. |

**Elección: `<Input>` + `<datalist>` nativo.**

```ts
// src/features/contactos/schemas/contacto.schema.ts
export const COMO_NOS_CONOCIO_SUGERENCIAS = [
  'Referido',
  'Redes sociales',
  'Búsqueda web',
  'Evento',
  'Otro',
] as const satisfies readonly string[];
```

`satisfies readonly string[]` — TypeScript verifica que siga siendo `string[]` si se agregan
valores en el futuro, sin hardcodear el tipo union.

El componente `ComoNosConocioInput.tsx` recibe `{...field}` de react-hook-form y renderiza:

```tsx
<>
  <Input
    {...field}
    list="como-nos-conocio-options"
    maxLength={200}
    placeholder="Ej. Referido, Evento..."
    value={field.value ?? ''}
  />
  <datalist id="como-nos-conocio-options">
    {COMO_NOS_CONOCIO_SUGERENCIAS.map((s) => (
      <option key={s} value={s} />
    ))}
  </datalist>
</>
```

**Accesibilidad**: los navegadores modernos anuncian el `datalist` como combobox nativo. No
requiere ARIA manual. El atributo `list` es suficiente.

**Datos legacy**: el back puede tener strings arbitrarios (e.g. `"redes_sociales"` del enum
viejo). El `Input` los renderiza sin error — no hay validación de pertenencia al array de
sugerencias; solo maxLength=200.

---

## 5. Validación de transiciones de estado

### Función pura `puedeTransicionar`

**Ubicación**: `src/features/contactos/hooks/useTransicionEstado.ts`

Se coloca en `hooks/` aunque sea una función pura porque:
- Es consumida exclusivamente por `EstadoRelacionSelect`, que es un componente de la feature.
- El test puede importarla directamente sin wrapper de React (el archivo exporta la función pura
  y opcionalmente el hook wrapper si se necesita acceso a datos de tratos en el futuro).

```ts
// Función pura exportada — testeable sin React
export function puedeTransicionar(
  actual: EstadoRelacion,
  nuevo: EstadoRelacion,
  tieneTratosActivos: boolean
): { ok: boolean; razon?: string } {
  // Idempotencia: mismo estado siempre ok
  if (actual === nuevo) return { ok: true };

  // Regla 1: no volver a PROSPECTO desde ACTIVO o INACTIVO
  if (nuevo === 'PROSPECTO' && actual !== 'PROSPECTO') {
    return {
      ok: false,
      razon: `No se puede volver a Prospecto desde ${actual}.`,
    };
  }

  // Regla 2: no INACTIVO si tiene tratos activos
  if (nuevo === 'INACTIVO' && tieneTratosActivos) {
    return {
      ok: false,
      razon: 'No se puede marcar como inactivo: el contacto tiene tratos activos.',
    };
  }

  return { ok: true };
}
```

### Set de estados terminales de tratos (tratos "activos")

El `TratoForm` maneja un toggle Cliente|Prospecto con XOR pero no expone el set de estados
terminales explícitamente. Dado que el change de tratos está parkeado y no se puede leer
la definición definitiva de `EstadoTrato` del back, el supuesto es:

**Un trato está "activo" (no terminal) cuando su estado NO es `GANADO`, `PERDIDO` ni
`PERDIDO_REENGANCHE`.**

Supuesto documentado aquí como deuda: cuando se implemente el change de tratos y se
defina formalmente el enum `EstadoTrato` del back, verificar que el set terminal sea
exactamente `{ GANADO, PERDIDO, PERDIDO_REENGANCHE }` y actualizar `puedeTransicionar`
si es necesario. Referencia: ADR pendiente de tratos.

### Componente `EstadoRelacionSelect`

```ts
interface EstadoRelacionSelectProps {
  contactoActual: Contacto;
  tratosDelContacto: Trato[];
  value: EstadoRelacion;
  onChange: (value: EstadoRelacion) => void;
  disabled?: boolean;
}
```

El componente construye las opciones del `<Select>` de Radix y para cada opción candidata
llama `puedeTransicionar(contactoActual.estadoRelacion, candidata, tieneTratosActivos)`.
Las opciones con `ok: false` se renderizan con `disabled` y envueltas en `<Tooltip>` con
`razon` como contenido.

`tieneTratosActivos` se deriva en el componente: 
```ts
const tieneTratosActivos = tratosDelContacto.some(
  (t) => !['GANADO', 'PERDIDO', 'PERDIDO_REENGANCHE'].includes(t.estado)
);
```

---

## 6. Migración de tratos — alcance limitado

### Archivos a modificar (solo imports, sin tocar el modelo)

| Archivo | Cambio |
|---------|--------|
| `src/features/tratos/components/TratoForm.tsx` | Reemplazar `useClientes` + `useProspectos` por `useContactos`. El select de "cliente" filtra `estadoRelacion === 'ACTIVO' \| 'INACTIVO'`; el de "prospecto" filtra `estadoRelacion === 'PROSPECTO'`. |
| `src/features/tratos/pages/TratoDetailPage.tsx` | Reemplazar `useClientes`/`useProspectos` por `useContactos` + filtro por id. Links a `/contactos/:id`. |
| `src/features/tratos/components/TratoInfoTab.tsx` | Links `/clientes/:id` y `/prospectos/:id` → `/contactos/:id`. |

### ¿Dos selects separados en `TratoForm` o uno unificado?

**Decisión: mantener los dos selects separados hasta el change de tratos.**

Razonamiento:
- El modelo `Trato` mantiene `prospecto_id` / `cliente_id` en el back y en la interface del
  front. Unificar en un solo `contactoId` requiere cambios al schema, al back y a la UI
  de tratos — todo eso es scope del change de tratos.
- En este change, los dos selects se reimplementan sobre `useContactos()` con filtros:
  - Select "Prospecto": `contactos.filter(c => c.estadoRelacion === 'PROSPECTO')`.
  - Select "Cliente": `contactos.filter(c => c.estadoRelacion === 'ACTIVO' || c.estadoRelacion === 'INACTIVO')`.
- El campo `estado_posible_cliente !== 'convertido'` que filtraba prospectos en el form
  desaparece — ese campo no existe en `Contacto`. El filtro nuevo es solo por `estadoRelacion`.
- Acoplar el change de contactos a decisiones de `Trato` sería incorrecto: este change tiene
  como invariante que el modelo `Trato` no se toca.

---

## 7. Handlers MSW

### Estructura de `src/mocks/handlers/contactos.ts`

Reescritura completa fiel al contrato del back (no usa `makeCrudHandlers` — ese helper
no soporta el patrón RPC del back con query params y PUT):

```ts
const API = '/api';

export const contactosHandlers = [
  http.get(`${API}/contactos/get-all`, async () => { ... }),
  http.get(`${API}/contactos/get-by-id`, async ({ request }) => {
    // id via url.searchParams.get('id')
  }),
  http.post(`${API}/contactos/create`, async ({ request }) => {
    // 201 + ContactoResponse
  }),
  http.put(`${API}/contactos/edit`, async ({ request }) => {
    // id via query param, 200 + ContactoResponse
  }),
  http.delete(`${API}/contactos/delete`, async ({ request }) => {
    // id via query param, 204
    // 409 si tiene tratos asociados (guard DeleteContactoService)
  }),
];
```

Importa desde `endpoints.contactos` para las rutas, igual que `empresasHandlers`.

### Fixtures `src/mocks/fixtures/contactos.ts`

Mix de estados que cubra los tres valores de `EstadoRelacion` (mínimo 2 por estado = 6 fixtures):
- 2 `PROSPECTO` — uno sin correo (nullable), uno con todos los campos.
- 2 `ACTIVO` — uno con `comoNosConocio` string libre, uno con sugerencia del array.
- 2 `INACTIVO` — uno con tratos asociados (para testear el guard 409 en delete).

Todos los campos en camelCase, sin `notas`, sin `estado_posible_cliente`, sin `prospecto_origen_id`.

### Limpieza de handlers legacy

- Eliminar `src/mocks/handlers/prospectos.ts` y `clientes.ts`.
- Eliminar `src/mocks/fixtures/prospectos.ts` y `clientes.ts`.
- En `src/mocks/handlers/empresas.ts`: eliminar los handlers
  `GET /empresas/:id/prospectos` y `GET /empresas/:id/clientes` (líneas 71-78).
- En `src/mocks/handlers/index.ts`: reemplazar `prospectosHandlers` + `clientesHandlers`
  por `contactosHandlers`.

---

## 8. Routing

### Rutas nuevas

```ts
// src/routes/router.tsx
{ path: '/contactos',    element: <ContactosPage /> }
{ path: '/contactos/:id', element: <ContactoDetailPage /> }
```

### Decisión: redirects desde `/prospectos` y `/clientes`

**Sí agregar redirects.** Justificación: los bookmarks y links cruzados en tratos
(que se actualizan en este change) pueden haber generado URLs en historial del browser.
Un redirect no tiene costo de mantenimiento y evita pantallas en blanco si algún link
se escapó al refactor.

```ts
{ path: '/prospectos',    element: <Navigate to="/contactos?tab=PROSPECTO" replace /> }
{ path: '/prospectos/:id', element: <Navigate to="/contactos" replace /> }
{ path: '/clientes',      element: <Navigate to="/contactos?tab=ACTIVO" replace /> }
{ path: '/clientes/:id',  element: <Navigate to="/contactos" replace /> }
```

El redirect de detalle (`/:id`) va a `/contactos` (lista) porque no existe equivalencia
directa de id — la detail page vieja puede no corresponder al mismo id en el nuevo modelo.

### Tabs de `ContactosPage`

Los tabs usan `useSearchParams` / `useTabSync` para sincronizar `?tab=PROSPECTO|ACTIVO|INACTIVO`
con la URL — mismo patrón que la EmpresaDetailPage existente.

---

## 9. Eliminación del Kanban frío/tibio/caliente

`EstadoPosibleCliente` (`'frio' | 'tibio' | 'caliente' | 'convertido'`) desaparece del modelo.
Su único uso era en `EmpresaProspectosTab` (badge frio/tibio/caliente) y en `ProspectosKanban`
(columnas por estado). Ambos se eliminan completamente con las features `prospectos/` y `clientes/`.

**Verificación**: ningún archivo fuera de `prospectos/`, `clientes/` y sus tests referencia
`EstadoPosibleCliente` o `ProspectosKanban`. Confirmado en el explore — safe to delete.

El sidebar tiene una entrada "Prospectos" (con ícono de Kanban). Se reemplaza por una entrada
"Contactos" con ruta `/contactos`. El ítem de "Clientes" del sidebar también desaparece.

---

## 10. Estrategia de testing

Strict TDD activo (`pnpm test:run`). Cada hook y componente con lógica condicional tiene su
test ANTES de su implementación.

### Cobertura por capa

| Archivo | Qué testea |
|---------|------------|
| `useContactos.test.tsx` | GET /get-all, loading/error states, datos devueltos |
| `useContacto.test.tsx` | GET /get-by-id, cache-hit primero, fallback a fetch |
| `useCreateContacto.test.tsx` | POST /create, 201, invalidación de cache, toast |
| `useUpdateContacto.test.tsx` | PUT /edit?id=, 200, invalidación de list + detail, toast |
| `useDeleteContacto.test.tsx` | DELETE /delete?id=, 204, 409 con mensaje adecuado |
| `useEmpresaContactos.test.tsx` | select filtra correctamente por empresaId |
| `useTransicionEstado.test.ts` | tabla de transiciones: 9 casos (3×3 estados) + caso trato activo |
| `ComoNosConocioInput.test.tsx` | renderiza datalist, acepta texto libre, respeta maxLength |
| `EstadoRelacionSelect.test.tsx` | deshabilita opciones inválidas, muestra tooltip con razón |
| `ContactosPage.test.tsx` | tabs renderizan lista filtrada por estadoRelacion |
| `ContactoDetailPage.test.tsx` | muestra datos del contacto, tabs de info y tratos |

### MSW como fuente única de verdad del mock

Los tests NO crean mocks ad-hoc. Todo test que necesite datos HTTP usa los handlers de
`src/mocks/handlers/contactos.ts` directamente (igual que empresas). Los fixtures son
los mismos del MSW de desarrollo — garantía de coherencia.

---

## 11. Orden de implementación (propuesta para tasks)

El orden minimiza dependencias rotas en cada paso.

1. **Schemas + endpoints** — `contacto.schema.ts` + `endpoints.contactos` en `endpoints.ts`
   + tipos `Contacto` en `types.ts`. Sin dependencias externas. Compila solo.

2. **Fixtures + handlers MSW** — `fixtures/contactos.ts` + `handlers/contactos.ts`.
   Depende de Step 1 (tipos). Handlers listos habilitan TDD desde Step 3.

3. **Hooks** — `useContactos`, `useContacto`, `useCreateContacto`, `useUpdateContacto`,
   `useDeleteContacto`, `useEmpresaContactos`, `useTransicionEstado`. Todos con tests.

4. **Componentes base** — `ContactoForm`, `ComoNosConocioInput`, `EstadoRelacionSelect`,
   `ContactoFormDialog`, `ContactoDeleteDialog`. Todos con tests los que tienen lógica.

5. **Páginas + routing** — `ContactosPage` (con tabs), `ContactoDetailPage`. Actualizar
   `router.tsx` (nuevas rutas + redirects), `Sidebar.tsx`.

6. **Migración empresas** — `useEmpresaContactos` reemplaza `useEmpresaProspectos` +
   `useEmpresaClientes`. `EmpresaContactosTab` nuevo. `EmpresaDetailPage` actualizada.

7. **Migración tratos** — actualizar imports en `TratoForm`, `TratoDetailPage`, `TratoInfoTab`
   para usar `useContactos`. Sin tocar el modelo `Trato`.

8. **Limpieza** — eliminar `features/prospectos/`, `features/clientes/`, handlers y fixtures
   viejos. Actualizar `handlers/index.ts`. Eliminar tipos `Prospecto`, `Cliente`,
   `ComoNosConocio`, `EstadoPosibleCliente` de `types.ts`.

---

## 12. Riesgos — resumen con mitigaciones

| ID | Riesgo | Mitigación |
|----|--------|------------|
| R1 | **Bug back `EditContactoService`** — bypasea `cambiarEstadoRelacion()`, el back acepta transiciones inválidas | `EstadoRelacionSelect` bloquea UI client-side. Cuando el back lo corrija, agregar manejo del 4xx. Documentado en archive-report como deuda del back. |
| R2 | **Tests de tratos se rompen** — `TratoForm`, `TratoDetailPage`, `TratoInfoTab` importan hooks que desaparecen | Step 7 del orden migra los imports ANTES del Step 8 (eliminación). Los tests de tratos pasan antes de borrar prospectos/clientes. |
| R3 | **Links legacy a `/prospectos` y `/clientes`** — bookmarks, historial del browser | Redirects en router (§8). Los ids de detalle viejo no tienen equivalencia directa; redirigen a lista. |
| R4 | **Datos legacy de `comoNosConocio`** — strings del back que no coinciden con sugerencias | `Input` nativo renderiza cualquier string sin validación de pertenencia. maxLength=200 es el único constraint. |
| R5 | **Fixtures de tratos con `prospecto_id`/`cliente_id`** — referencian fixtures eliminados | `tratosFixture` conserva sus ids. Los tests de tratos no dependen de resolución cruzada con fixtures de prospectos/clientes — solo usan esos campos como strings en el modelo `Trato`. Verificar en Step 7. |
