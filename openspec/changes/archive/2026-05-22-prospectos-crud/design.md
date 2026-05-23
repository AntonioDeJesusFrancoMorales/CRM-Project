# Technical Design — Prospectos CRUD (Change 4)

**Fecha**: 2026-05-22
**Persistencia**: hybrid
**Strict TDD**: enabled
**Status**: draft
**ADRs**: ADR-022 a ADR-029
**Cross-refs**:
- `openspec/changes/prospectos-crud/proposal.md`
- `openspec/changes/prospectos-crud/specs/prospectos-management/spec.md`
- `openspec/changes/prospectos-crud/specs/prospecto-conversion/spec.md`
- `openspec/changes/prospectos-crud/exploration.md`

## 1. Resumen ejecutivo

El Change 4 sustituye `ProspectosPlaceholder` por una experiencia completa Kanban (`/prospectos`) + página de detalle (`/prospectos/:id`). A diferencia de Empresas y Usuarios (tablas densas), aquí el layout primario es un Kanban de 3 columnas activas (`frio` / `tibio` / `caliente`) más un tab "Convertidos" con agrupación temporal. Se reusa toda la infraestructura ya consolidada en Changes 1-3 (TanStack Query, RHF + Zod v4, shadcn primitives, MSW, Vitest + RTL) y el patrón container-presentational empleado en `empresas` y `usuarios`.

El Change también introduce el primer cambio al contrato compartido desde el Change 1: extiende el enum `EstadoPosibleCliente` con `'convertido'` y agrega `prospecto_origen_id: string | null` a `Cliente`. Esto debe ocurrir en un commit atómico junto con el fix bloqueante en `EmpresaProspectosTab.tsx` para no romper el build.

## 2. Decisiones arquitectónicas (ADRs)

### ADR-022 — Layout Kanban (no tabla)

**Contexto**. Empresas y Usuarios usan tabla densa. Prospectos representa el pipeline comercial, donde el estado (`frio` / `tibio` / `caliente`) es la dimensión visual dominante.

**Decisión**. `/prospectos` se compone de un `Tabs` shadcn con dos tabs:
- **Activos** (default): Kanban con 3 columnas fijas, una por estado activo.
- **Convertidos**: vista de lista con sección "Este mes" + Collapsible "Anteriores".

Cada columna del Kanban es un `Card` shadcn con header (label + contador) y body con las cards de prospectos, envuelto en un `ScrollArea` vertical.

**Tradeoffs**.
- **Pro**: representación natural del pipeline; menos clics que filtrar tabla.
- **Contra**: rompe consistencia visual con otras vistas listado. Mitigación: el top-bar (búsqueda + filtros) reusa los mismos componentes (`Input`, `Select`) que Empresas/Usuarios, manteniendo continuidad.

### ADR-023 — Filtrado client-side para Activos vs Convertidos

**Contexto**. El backend acepta `?estado_posible_cliente=` para filtrar. Podríamos hacer dos queries separadas: una `['prospectos', 'activos']` y otra `['prospectos', 'convertidos']`. La alternativa es traer todo bajo una sola key `['prospectos']` y dividir en memoria.

**Decisión**. **Opción B (client-side split)**. `useProspectos(filters)` trae el listado completo respetando `responsable_id` (si aplica), y `KanbanBoard` / `ConvertidosList` filtran localmente por `estado_posible_cliente !== 'convertido'` o `=== 'convertido'`.

**Razón**. (1) Con fixtures actuales (3-10 registros) la diferencia de performance es irrelevante. (2) Una sola cache key simplifica la invalidación (no hay que recordar invalidar dos keys distintas tras un convert). (3) El join con `clientes` para timestamp de conversión queda más limpio si todo vive en el mismo árbol.

**Tradeoffs**. Si el fixture creciera a > 500 prospectos esto sería ineficiente; el R6 del proposal documenta la posible paginación futura (YAGNI).

### ADR-024 — `prospecto_origen_id` como FK desde Cliente (no espejo)

**Contexto**. Trazar la conversión requiere un puente entre `Prospecto` (estado `convertido`) y `Cliente` (entidad final). Opciones: (a) `Cliente.prospecto_origen_id`, (b) `Prospecto.cliente_destino_id`, (c) ambos (espejo).

**Decisión**. Solo **(a)**: FK desde `Cliente`. El Prospecto convertido se identifica por su `estado_posible_cliente === 'convertido'`; para mostrar el timestamp de conversión se hace join `clientes[].creado_en` por `prospecto_origen_id`.

**Razón**. Es el sentido natural del flujo de negocio (el cliente nace del prospecto). Evita duplicación y riesgo de desincronización. Coincide con el modelado típico de CRMs reales.

### ADR-025 — `'convertido'` como valor del enum (no flag separado)

**Contexto**. Alternativa: agregar `Prospecto.es_convertido: boolean` y mantener `EstadoPosibleCliente` como `'frio' | 'tibio' | 'caliente'`.

**Decisión**. Extender el enum a `'frio' | 'tibio' | 'caliente' | 'convertido'`.

**Razón**. (1) Un prospecto convertido **deja de ser un prospecto activo**; el estado captura esa transición sin requerir validación cruzada. (2) Los filtros del Kanban (`columna.estado === card.estado`) siguen siendo una comparación trivial. (3) El handler GET ya soporta filtrar por `?estado_posible_cliente=convertido` sin cambios.

**Costo**. Cualquier `Record<EstadoPosibleCliente, X>` exhaustivo en el código se rompe al agregar la nueva entrada (R1 del proposal). Mitigación: Lote A atómico.

### ADR-026 — Edición post-conversión limitada a `notas`

**Contexto**. Cuando un prospecto es convertido, los datos de contacto ya viven en `Cliente`. Editar el prospecto post-conversión genera ambigüedad (¿se refleja en el cliente?).

**Decisión**. El botón "Editar" sigue visible. Al abrir el `ProspectoFormDialog` en modo `edit` con un prospecto convertido, **todos los campos** quedan `disabled` salvo `notas`. El bloqueo es exclusivamente client-side (el handler PATCH no se modifica). El form recibe una prop derivada `isLocked = prospecto.estado_posible_cliente === 'convertido'`.

**Razón**. La nota es contexto histórico válido; el resto es información que debe actualizarse en la entidad `Cliente`. No agregamos validación server-side porque (a) MSW handler no la requiere y (b) sería violar capa: la regla es de UX, no de dominio backend.

**Test obligatorio** (spec REQ-4 scenario "Form en modo post-conversión").

### ADR-027 — Lazy loading del tab Tratos

**Contexto**. `Tabs` de Radix monta el contenido del tab activo y desmonta el resto (default behavior). Podríamos forzar prefetch via `queryClient.prefetchQuery` al cargar la página.

**Decisión**. **No prefetch**. El tab Tratos solo dispara `GET /prospectos/:id/tratos` cuando el usuario lo activa. `useProspectoTratos(id)` se llama desde dentro del componente `ProspectoTratosTab`, que solo se monta cuando `TabsContent value="tratos"` está activo.

**Razón**. La mayoría de las visitas a `/prospectos/:id` son para info básica, no para revisar tratos. Prefetch añade requests innecesarios. Penalidad: ~300ms de delay al primer clic en el tab (aceptable y consistente con el patrón de Empresas).

### ADR-028 — Select inline para cambio de estado (NO drag-and-drop)

**Contexto**. El Kanban natural sugiere DnD entre columnas. Sin embargo, `@dnd-kit` no está instalado y el Change 7 (Tableros) lo introduce con casos de uso más exigentes.

**Decisión**. Cada card del Kanban incluye un `Select` shadcn inline con las opciones `frio` / `tibio` / `caliente`. Al cambiar el valor, dispara `useUpdateProspecto.mutate({ id, estado_posible_cliente })`. La card se mueve al re-render tras invalidar `['prospectos']`. Si el estado es `convertido`, el Select se renderiza como `disabled` mostrando "Convertido".

**Razón**. (1) DnD es Change 7 y aquí sería sobre-ingeniería. (2) Accesibilidad: keyboard-only friendly desde el primer commit. (3) Mobile-ready sin librerías extra (aunque mobile no es objetivo de este Change).

**Tradeoffs**. UX menos "visual" que DnD. Si en Change 7 introducimos DnD generalizado, refactorizar este componente es trivial (la mutación ya está aislada en `useUpdateProspecto`).

### ADR-029 — Reuso de `useEmpresas` / `useUsuarios` para Selects del form

**Contexto**. El form de crear/editar prospecto necesita seleccionar `empresa_id` y `responsable_id`. Empresas y Usuarios ya exponen hooks listos.

**Decisión**. `ProspectoForm` consume `useEmpresas()` y `useUsuarios()` directamente para alimentar los Selects. No se crea hook intermedio ni se duplica la fetch.

**Razón**. Ya cacheado por TanStack Query; cualquier mutación en empresas/usuarios refresca automáticamente las opciones disponibles. Mantiene el principio de single source of truth.

**Gotcha**. Estos hooks pueden estar en estado loading; el `Select` muestra un placeholder "Cargando..." y queda `disabled` hasta que `data` exista (patrón ya usado en Empresas para `responsable_id`).

## 3. Flujo de datos

```
┌─────────────────────────────────────────────────────────────┐
│ src/api/client.ts (axios + interceptor JWT)                 │
└──────────────────────┬──────────────────────────────────────┘
                       │
       ┌───────────────┴──────────────────┐
       ▼                                  ▼
┌──────────────────┐               ┌──────────────────┐
│ src/mocks/...    │ MSW intercept │ Backend real     │
│ /prospectos.ts   │               │ (post-mocks)     │
└──────────────────┘               └──────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ src/features/prospectos/hooks/                              │
│   useProspectos / useProspecto / useProspectoTratos         │
│   useCreateProspecto / useUpdateProspecto                   │
│   useDeleteProspecto / useConvertirProspecto                │
│ (Wrappers TanStack Query — useQuery / useMutation)          │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ src/features/prospectos/pages/                              │
│   ProspectosListPage   ProspectoDetailPage                  │
│ (Containers — orquestan hooks + estado UI local)            │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ src/features/prospectos/components/                         │
│   Kanban (cont.) → KanbanColumn (pres.) → ProspectoCard     │
│   ConvertidosList → ConvertidosSection                      │
│   ProspectoFormDialog (cont.) → ProspectoForm (pres.)       │
│   ProspectoDeleteDialog / ConvertirProspectoDialog          │
│   ProspectoInfoTab / ProspectoTratosTab (pres.)             │
└─────────────────────────────────────────────────────────────┘
```

### Invalidación de cache (referenciada por REQ-cache de la spec)

| Mutation | Keys a invalidar (en `onSuccess`) |
|---|---|
| `useCreateProspecto` | `['prospectos']` |
| `useUpdateProspecto` | `['prospectos']`, `['prospectos', id]` |
| `useDeleteProspecto` | `queryClient.removeQueries(['prospectos', id])` + invalidate `['prospectos']` |
| Cambio de estado in-place | Reusa `useUpdateProspecto` → mismas keys |
| `useConvertirProspecto` | `['prospectos']`, `['prospectos', id]`, `['clientes']`, `['empresa-clientes', empresaId]`, `['empresa-prospectos', empresaId]` |

> **Decisión adicional**. `useConvertirProspecto` invalida también `['empresa-clientes']` y `['empresa-prospectos']` porque el tab `EmpresaProspectosTab.tsx` y `EmpresaClientesTab.tsx` (ya existentes del Change 2) muestran datos derivados. Si no se invalidan, queda stale data al volver a `/empresas/:id`.

## 4. Descomposición de componentes

### Estructura de carpetas (mirroring `features/empresas`)

```
src/features/prospectos/
├── schemas/
│   └── prospecto.schema.ts        # Zod create/update + types
├── hooks/
│   ├── useProspectos.ts           # GET list con filtros
│   ├── useProspecto.ts            # GET by id
│   ├── useProspectoTratos.ts      # GET tratos by prospecto
│   ├── useCreateProspecto.ts      # POST
│   ├── useUpdateProspecto.ts      # PATCH (también usado para cambio in-place)
│   ├── useDeleteProspecto.ts      # DELETE
│   └── useConvertirProspecto.ts   # POST /:id/convertir
├── components/
│   ├── ProspectosKanban.tsx       # Container — divide por estado
│   ├── KanbanColumn.tsx           # Presentational — recibe array + estado
│   ├── ProspectoCard.tsx          # Presentational — card individual con Select inline + DropdownMenu
│   ├── ProspectoConvertidosList.tsx  # Presentational — sección "Este mes" + Collapsible "Anteriores"
│   ├── ProspectoFormDialog.tsx    # Container del Dialog (create/edit)
│   ├── ProspectoForm.tsx          # Presentational — campos RHF + Zod
│   ├── ProspectoDeleteDialog.tsx  # AlertDialog
│   ├── ConvertirProspectoDialog.tsx  # AlertDialog
│   ├── ProspectoInfoTab.tsx       # Presentational — info read-only del detalle
│   └── ProspectoTratosTab.tsx     # Container/presentational — lazy fetch tratos
├── pages/
│   ├── ProspectosListPage.tsx     # Tabs Activos/Convertidos + top-bar
│   └── ProspectoDetailPage.tsx    # Header + tabs Info/Tratos + acciones
└── __tests__/
    ├── ProspectosListPage.test.tsx     # Render Kanban + filtros + tab Convertidos
    ├── ProspectoDetailPage.test.tsx    # Render detalle + tab switch + 404
    ├── useProspectos.test.tsx          # Query con filtros server-side
    ├── useConvertirProspecto.test.tsx  # Mutation + invalidación múltiple
    ├── ProspectoForm.test.tsx          # Validación Zod + bloqueo post-conversión
    └── ProspectoCard.test.tsx          # Select inline + Convertir oculto + estado disabled
```

> 7 hooks + 10 componentes + 2 pages + 6 tests. Consistente con la cuenta del proposal.

### Container vs Presentational

- **Containers** (orquestan hooks + state UI): `ProspectosListPage`, `ProspectoDetailPage`, `ProspectosKanban`, `ProspectoFormDialog`, `ProspectoTratosTab`.
- **Presentational** (puro render + callbacks): `KanbanColumn`, `ProspectoCard`, `ProspectoForm`, `ProspectoInfoTab`, `ProspectoConvertidosList`, `ConvertidosSection` (interno), `ProspectoDeleteDialog`, `ConvertirProspectoDialog`.

### Estado UI local (sin Zustand)

El estado UI necesario es **muy localizado**: `dialogOpen`, `selectedProspecto`, `searchQuery`, `responsableFilter`, `soloMios`. Todo cabe en `useState` dentro del page o el container correspondiente. **No se introduce Zustand store** para Prospectos. Esto sigue el patrón de Empresas y Usuarios.

## 5. Estrategia de Forms

### Schema Zod v4 (`prospecto.schema.ts`)

```ts
import { z } from 'zod';

export const estadoPosibleClienteSchema = z.enum([
  'frio', 'tibio', 'caliente', 'convertido',
]);

export const comoNosConocioSchema = z.enum([
  'referido', 'web', 'redes_sociales', 'evento', 'otro',
]).nullable();

const baseProspectoSchema = z.object({
  nombre_contacto: z.string().min(1, 'El nombre del contacto es requerido'),
  empresa_id: z.string().uuid('Selecciona una empresa'),
  responsable_id: z.string().uuid('Selecciona un responsable'),
  correo_contacto: z.email('Correo inválido').nullable().or(z.literal('').transform(() => null)),
  telefono_contacto: z.string().nullable(),
  cargo_contacto: z.string().nullable(),
  como_nos_conocio: comoNosConocioSchema,
  estado_posible_cliente: estadoPosibleClienteSchema.default('frio'),
  notas: z.string().nullable(),
});

export const createProspectoSchema = baseProspectoSchema;
export const updateProspectoSchema = baseProspectoSchema.partial();

export type CreateProspectoInput = z.infer<typeof createProspectoSchema>;
export type UpdateProspectoInput = z.infer<typeof updateProspectoSchema>;
```

> Compatibilidad con Zod v4: ya validado en Change 3 (`z.email()` directo, no `z.string().email()`).

### Modo create vs edit vs locked

`ProspectoFormDialog` recibe props discriminantes:

```ts
type Mode =
  | { mode: 'create' }
  | { mode: 'edit'; prospecto: Prospecto };
```

Dentro del Dialog se deriva:

```ts
const isLocked =
  props.mode === 'edit' && props.prospecto.estado_posible_cliente === 'convertido';
```

`ProspectoForm` recibe `isLocked` como prop. Si `isLocked`, todos los `<FormField>` excepto `notas` se renderizan con `disabled`. El field `notas` siempre permanece habilitado.

### Submit handlers

- Create → `useCreateProspecto.mutate(values, { onSuccess: closeDialog, onError: mapServerErrors })`.
- Edit (normal o locked) → `useUpdateProspecto.mutate({ id, ...values }, ...)`.

El mapeo de errores 422 reusa el helper `mapServerErrorsToForm(setError, error)` ya existente en Change 2 (`src/lib/forms/errors.ts` o similar — confirmar nombre en apply).

### Conversion flow

`ConvertirProspectoDialog` es un `AlertDialog` con título "¿Convertir a cliente?" + descripción. Confirm dispara `useConvertirProspecto.mutate(prospectoId)`. Al éxito: toast "Prospecto convertido" + las queries afectadas se invalidan automáticamente.

## 6. MSW Handlers — cambios necesarios

Los endpoints CRUD existen vía `makeCrudHandlers` (GET list ya con filtros server-side, GET id, POST, PATCH, DELETE) y NO requieren cambios estructurales. El único endpoint que se modifica es `POST /prospectos/:id/convertir`:

### `POST /api/v1/prospectos/:id/convertir` — handler modificado

```ts
http.post(`${API}/prospectos/:id/convertir`, async ({ params }) => {
  await withDelay();
  const prospecto = prospectosFixture.find((p) => p.id === params['id']);
  if (!prospecto) return errors.notFound();

  // MUTACIÓN del prospecto (nuevo en Change 4)
  prospecto.estado_posible_cliente = 'convertido';
  prospecto.actualizado_en = nowIso();

  const cliente: Cliente = {
    id: crypto.randomUUID(),
    empresa_id: prospecto.empresa_id,
    responsable_id: prospecto.responsable_id,
    creado_por: prospecto.creado_por,
    prospecto_origen_id: prospecto.id,         // ← NUEVO campo en Cliente
    nombre_contacto: prospecto.nombre_contacto,
    correo_contacto: prospecto.correo_contacto,
    telefono_contacto: prospecto.telefono_contacto,
    cargo_contacto: prospecto.cargo_contacto,
    como_nos_conocio: prospecto.como_nos_conocio,
    notas: prospecto.notas,
    creado_en: nowIso(),
    actualizado_en: nowIso(),
  };
  clientesFixture.push(cliente);
  return HttpResponse.json(cliente, { status: 201 });
}),
```

### Otros cambios concretos en handlers/fixtures

| Archivo | Cambio |
|---|---|
| `src/api/types.ts:6` | `EstadoPosibleCliente`: agregar `'convertido'` |
| `src/api/types.ts:65` (`Cliente`) | Agregar `prospecto_origen_id: string \| null` |
| `src/mocks/handlers/prospectos.ts:46-66` | Mutar prospecto + setear FK en cliente (snippet arriba) |
| `src/mocks/fixtures/clientes.ts` | Agregar `prospecto_origen_id: null` a los 2 registros |
| `src/features/empresas/components/EmpresaProspectosTab.tsx:17-27` | Agregar entrada `'convertido'` en ambos `Record<EstadoPosibleCliente, string>` (label + className) |

> **Lote A atómico** (R1 + R2 mitigados): estos 5 archivos en un solo commit. El test `pnpm type-check` en CI verifica integridad.

### Endpoints adicionales

Los endpoints `GET /prospectos/:id/tratos` y los demás CRUD ya funcionan; no requieren cambios.

## 7. Routing

```tsx
// src/routes/router.tsx — cambios
{
  path: 'prospectos',
  children: [
    { index: true, element: <ProspectosListPage /> },     // antes: ProspectosPlaceholder
    { path: ':id', element: <ProspectoDetailPage /> },    // nuevo
  ],
},
```

- Eliminar import de `ProspectosPlaceholder`.
- Eliminar export de `ProspectosPlaceholder` en `src/routes/placeholders.tsx`.
- El link de sidebar ya está habilitado (verificado en exploration). No requiere cambios en `AppShell`.

> Nota: la ruta detalle se anida con `children` (mismo patrón usado por Empresas/Usuarios en Change 2 y 3).

## 8. Estrategia de testing (Strict TDD)

Strict TDD está activo. Cada componente y hook se implementa Red → Green → Refactor. **Granularidad**:

### Unit + Hook tests (Vitest + RTL)

| Archivo | Cubre | Scenarios |
|---|---|---|
| `useProspectos.test.tsx` | Query con filtros server-side y client-side preconditions | REQ-1 happy, REQ-2 toggle y Select |
| `useConvertirProspecto.test.tsx` | Mutation + invalidación de múltiples keys | REQ-conversion happy, error 500 |
| `ProspectoForm.test.tsx` | Validación Zod + bloqueo post-conversión | REQ-3 validación, REQ-4 locked, mapeo 422 |
| `ProspectoCard.test.tsx` | Select inline + botón Convertir oculto si convertido + Select disabled | REQ-6 in-place, REQ-conversion oculto |

### Integration tests (con MSW + QueryClient real)

| Archivo | Cubre |
|---|---|
| `ProspectosListPage.test.tsx` | Render Kanban con datos fixture, búsqueda client-side, tab switch a Convertidos, sección "Este mes" |
| `ProspectoDetailPage.test.tsx` | Render detalle con tab Info, switch lazy a tab Tratos, 404 redirect, badge convertido |

### Patrón QueryClient para hook tests

Usar `renderHook` con wrapper `QueryClientProvider`. `QueryClient` se crea por test con `retry: false` y `staleTime: 0`. Reusar el helper `createTestQueryClient()` ya existente desde el Change 2.

### Lo que NO testeamos

- Estilos / clases de Tailwind (no aporta valor).
- Drag-and-drop (no existe en este Change).
- Optimistic updates (no implementadas).
- Comportamiento interno de Radix/shadcn primitives (ya cubierto upstream).
- Paginación / virtualización (out of scope).
- Validación server-side de edición post-conversión (es exclusivamente client-side por ADR-026).

### TDD enforcement

Por strict TDD, el orden de cada lote será:
1. Escribir test rojo → confirmar que falla por la razón correcta.
2. Implementar mínimo necesario → green.
3. Refactor → tests siguen verdes.

`sdd-apply` debe respetar este orden y NO escribir implementación antes del test.

## 9. Riesgos y tradeoffs

| ID | Riesgo | Severidad | Mitigación |
|---|---|---|---|
| R1 | Build TS rompe si `types.ts` se commitea antes de `EmpresaProspectosTab.tsx` | **CRÍTICA** | Lote A atómico: 5 archivos en un solo commit. CI corre `pnpm type-check` |
| R2 | Handler convertir queda incompleto sin mutación del prospecto | **CRÍTICA** | Incluido en Lote A. Test `useConvertirProspecto.test.tsx` verifica que tras convertir, el prospecto ya no aparece en columnas activas |
| R3 | Filtrado client-side degrada con muchos prospectos | Baja | Aceptado YAGNI; documentado para Change futuro |
| R4 | Bypass del bloqueo post-conversión via DevTools | Baja | Aceptado: bloqueo es UX, no de dominio. Backend no se modifica |
| R5 | `useConvertirProspecto` puede olvidar invalidar `['empresa-clientes']` y dejar tab desincronizado | Media | Lista explícita de keys a invalidar en ADR-024 + sección 3. Test que verifica las invalidaciones (mock spy de queryClient) |
| R6 | Performance Kanban con 100+ cards | Baja | YAGNI documentado; columnas envueltas en `ScrollArea` |
| R7 | Lazy load del tab Tratos genera latencia perceptible al primer click | Muy baja | Aceptado (consistente con Empresas) |
| R8 | Reuso de `useEmpresas`/`useUsuarios` puede mostrar `disabled` si están loading al abrir el form | Baja | Placeholder explícito "Cargando empresas..." en el Select; `useUsuarios` ya filtrado a `activo === true` (regla del Change 3) |

## 10. Preguntas abiertas

Ninguna. Las decisiones pre-explore (#142) y post-explore (#145) cerraron las ambigüedades pendientes:
- Filtro top-bar por estado → eliminado.
- Edición post-conversión → solo `notas`.

Si durante `sdd-apply` aparecen cuestiones nuevas (esperado en TDD), se documentarán como `mem_save` de tipo `discovery` con `topic_key: sdd/prospectos-crud/discoveries/<n>`.

## 11. Next phase

`sdd-tasks` — desglose en 4 lotes siguiendo el patrón del Change 3:
- **Lote A — Contrato + MSW** (atómico): `types.ts` + handler convertir + fixtures + `EmpresaProspectosTab.tsx` fix.
- **Lote B — Schemas + hooks**: `prospecto.schema.ts` + 7 hooks con tests.
- **Lote C — Componentes + pages**: 10 componentes + 2 pages con tests.
- **Lote D — Routing + wiring + cleanup**: actualizar `router.tsx`, eliminar `ProspectosPlaceholder`, verificar `pnpm type-check` + suite completa de tests.
