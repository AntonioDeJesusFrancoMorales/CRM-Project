# Design: tareas-management (Change 6b)

## Technical Approach

Feature greenfield `src/features/tareas/` con estructura plana (ADR-040), homologada al patrón ya validado en `features/tratos/` (Change 6a). `useTratos`/`tratosKeys` (`src/features/tratos/hooks/useTratos.ts`) es la plantilla directa de `useTareas`/`tareasKeys`; `TratoEstadoMenu` (`src/features/tratos/components/TratoEstadoMenu.tsx`, ADR-044) es la plantilla de `TareaEstadoMenu`. El backend MSW está 5/6 listo (`src/mocks/handlers/tareas.ts`); falta solo `GET /tareas` server-side con filtros, que se homologa al `GET /tratos` ya existente (`src/mocks/handlers/tratos.ts:33-46`). `TratoDetailPage` (hoy flat) se refactoriza a tabbed espejando `ClienteDetailPage` (`src/features/clientes/pages/ClienteDetailPage.tsx`) + `useTabSync` (ADR-045). Sin componentes shadcn nuevos.

## Resolución de Open Questions

### OQ1 — Semántica del filtro "vencimiento" (server-side)

**Choice**: 3 opciones en el Select `vencimiento`: `todas` (default, sin param), `vencidas`, `proximas`. El handler las evalúa con comparación de strings ISO contra `nowIso().slice(0, 10)` (hoy, formato `YYYY-MM-DD`, comparación lexicográfica válida en ISO):
- `vencidas`: `fecha_limite != null && fecha_limite < hoy && estado != 'completada'`.
- `proximas`: `fecha_limite != null && fecha_limite >= hoy && fecha_limite <= hoy+7d && estado != 'completada'`.
- `todas`: sin filtro.
**N = 7 días.** Param en query: `vencimiento=vencidas|proximas`.
**Alternatives**: client-side (rechazado — rompe homologación con filtros server-side de `useTratos`; el explore lo confirma server-side); `fecha_limite` exacta (rechazado — UX pobre).
**Rationale**: `fecha_limite` es `date` (`YYYY-MM-DD`), no datetime → comparación de strings es correcta y determinista. `estado != 'completada'` evita marcar como "vencida" una tarea ya cerrada. N=7 cubre la semana operativa.

### OQ2 — Firma de `UseTareasFilters`

**Choice**: server-side (query params al handler): `trato_id`, `responsable_id`, `estado`, `prioridad`, `vencimiento`. Client-side (NO viaja al handler): `searchTerm` sobre `titulo` (homologa `TratosListPage`). El campo de búsqueda NO entra en `UseTareasFilters` (es estado local de la página, igual que en tratos).
```ts
export interface UseTareasFilters {
  trato_id?: string;
  responsable_id?: string;
  estado?: EstadoTarea;
  prioridad?: 1 | 2 | 3;
  vencimiento?: 'vencidas' | 'proximas';
}
```
**Rationale**: espeja `UseTratosFilters` (5 campos opcionales server-side); búsqueda client-side por título es el patrón establecido en Change 6a/5.

### OQ3 — Fuente del badge de pendientes (header del trato)

**Choice**: derivar del MISMO query que alimenta el tab Tareas: `useTareas({ trato_id, estado: 'pendiente' })`. El count = `data?.length ?? 0`. NO se crea tercera query. El badge se renderiza en el header del `TratoDetailPage` leyendo ese mismo hook (montado a nivel de página, no dentro del `TabsContent`).
**Rationale**: TanStack dedupe por `queryKey` (`tareasKeys.list({ trato_id, estado: 'pendiente' })`); badge y tab comparten cache, reactividad gratis al invalidar `tareasKeys.byTrato(trato_id)` (ADR-052).
**Consecuencia**: el query del badge se levanta a nivel `TratoDetailPage`; el tab consume el mismo filtro.

### OQ4 — Select de trato al crear

**Choice**: `TareaForm` recibe prop opcional `tratoIdFijo?: string`.
- Desde tab del trato → `tratoIdFijo` presente → Select PRECARGADO (`defaultValues.trato_id`) y BLOQUEADO (`disabled`), con el nombre del trato resuelto vía `useTratos()` o pasado por props.
- Desde `/tareas` global → `tratoIdFijo` ausente → Select REQUERIDO y EDITABLE, opciones de `useTratos()` (labels = `trato.nombre`), validado por Zod (`trato_id` min 1).
El `trato_id` se pasa por props/contexto desde el host (`TareaCreateDialog`), no por URL.
**Rationale**: homologa el patrón `defaultValues` + `disabled` de `TratoForm` (Select `disabled={loading}`); evita que el usuario reasigne el trato cuando el contexto ya lo determina.

### OQ5 — Icono del sidebar

**Choice**: `ClipboardList`. Verificado importable en `lucide-react@0.469.0` (también existen `ListTodo`, `CheckSquare`, `ListChecks`, `CircleCheck`).
**Rationale**: `ClipboardList` comunica "lista de tareas/pendientes" sin colisionar semánticamente con `Handshake` (Tratos) ni `KanbanSquare` (Tableros). Label sidebar: "Mis tareas".

### OQ6 — Layout del header de `TratoDetailPage` tabbed

**Choice**: espejar `ClienteDetailPage`. Header en dos zonas (flex `sm:justify-between`):
- Izquierda: botón volver + `<h1>{trato.nombre}</h1>` + `TratoEstadoBadge` + **badge de pendientes** (OQ3).
- Derecha (`flex flex-wrap gap-2`): acciones de estado del trato (Marcar ganado / Marcar perdido… / Reabrir) + Editar + Eliminar (las 5 acciones que hoy ya viven en el header flat se MANTIENEN ahí).
Debajo del header: `<Tabs value={tab} onValueChange={setTab}>` con `useTabSync(['info','tareas'],'info')`. Tab `info` = la grilla de `Field`s actual extraída a `TratoInfoTab`; tab `tareas` = `TratoTareasTab` (monta `useTareas({ trato_id })` + tabla + botón "Crear tarea").
**Rationale**: ClienteDetailPage ya prueba este layout (header con acciones arriba + tabs abajo); las acciones de estado del trato son acciones de la entidad, no del tab, así que van en el header (decisión #8 del alignment).

## Architecture Overview

### Estructura feature
```
src/features/tareas/
├── schemas/tarea.schema.ts          (tareaCreateSchema, tareaUpdateSchema, TAREA_EMPTY_DEFAULTS)
├── hooks/
│   ├── useTareas.ts                 (list paramétrico + tareasKeys con byTrato)
│   ├── useTarea.ts                  (detail by id)
│   ├── useCreateTarea.ts            (POST /tratos/:tratoId/tareas)
│   ├── useUpdateTarea.ts            (PATCH /tareas/:id)
│   ├── useDeleteTarea.ts            (DELETE 204)
│   └── useCompletarTarea.ts         (PATCH /tareas/:id/completar — doble invalidación)
├── components/
│   ├── TareasTable.tsx              (filas: título clickeable + TareaEstadoMenu + prioridad/estado badges)
│   ├── TareaForm.tsx                (presentational shared create/edit; prop tratoIdFijo)
│   ├── TareaCreateDialog.tsx
│   ├── TareaEditDialog.tsx
│   ├── TareaDeleteDialog.tsx        (AlertDialog)
│   ├── TareaEstadoBadge.tsx
│   ├── TareaPrioridadBadge.tsx
│   └── TareaEstadoMenu.tsx          (DropdownMenu 3 ítems disabled-by-state)
├── pages/
│   ├── TareasListPage.tsx           (filtros + tabla)
│   └── TareaDetailPage.tsx
└── __tests__/                       (Strict TDD: hook tests + page tests)
```

### Componentes nuevos en tratos (refactor tabbed)
```
src/features/tratos/components/
├── TratoInfoTab.tsx                 (extrae la grilla de Fields del header flat actual)
└── TratoTareasTab.tsx              (useTareas({ trato_id }) + TareasTable + "Crear tarea" con tratoIdFijo)
```

### State ownership

| Dato | Owner | Notas |
|---|---|---|
| Lista de tareas con filtros | TanStack Query (`tareasKeys.list(filters)`) | refetch automático al cambiar filtros |
| Tarea individual | TanStack Query (`tareasKeys.detail(id)`) | invalidado por mutations |
| Badge pendientes header trato | mismo query del tab (`useTareas({ trato_id, estado:'pendiente' })`) | sin tercera query (OQ3) |
| Filtros activos `/tareas` | Estado local `TareasListPage` | embebidos en queryKey |
| searchTerm título | Estado local `TareasListPage` | client-side, no en queryKey |
| Tab activo `?tab=` | URL searchParams via `useTabSync` | ADR-045 reutilizado |
| `responsable_id` "Mis tareas" | `useAuthStore((s) => s.usuario?.id)` | sin fallback (rutas protegidas) |

## TanStack Query Keys & Invalidation

```ts
// src/features/tareas/hooks/useTareas.ts (homologa tratosKeys + byTrato — ADR-048)
export const tareasKeys = {
  all: ['tareas'] as const,
  list: (filters?: UseTareasFilters) => ['tareas', filters ?? {}] as const,
  detail: (id: string) => ['tareas', id] as const,
  byTrato: (tratoId: string) => ['tareas', { trato_id: tratoId }] as const,
};
```

| Mutation | Invalidación | Por qué |
|---|---|---|
| `useCreateTarea` | `invalidateQueries({ queryKey: tareasKeys.all })` | prefix match cubre lista global + lista del trato + badge |
| `useUpdateTarea` | `tareasKeys.all` + `tareasKeys.detail(id)` | refresca listas y detalle |
| `useDeleteTarea` (204) | `removeQueries(tareasKeys.detail(id))` + `invalidateQueries(tareasKeys.all)` | patrón useDeleteTrato |
| `useCompletarTarea` | `tareasKeys.all` + `tareasKeys.detail(id)` | badge (lista filtrada por pendiente) + detalle (ADR-049, homologa useGanarTrato) |

`tareasKeys.byTrato(tratoId)` es alias semántico de `list({ trato_id })`; sirve para invalidación dirigida del badge sin tocar la lista global. Como `all` es prefijo de todo, invalidar `all` ya refresca el badge — `byTrato` queda como helper explícito para invalidaciones quirúrgicas futuras (ADR-052).

## MSW Handler Shape — `GET /tareas` (ADR-053)

Agregar en `src/mocks/handlers/tareas.ts`, ANTES de `GET /tareas/:id` (MSW resuelve en orden; `/tareas` literal no colisiona con `/tareas/:id` pero el orden mantiene legibilidad):

```ts
http.get(`${API}/tareas`, async ({ request }) => {
  await withDelay();
  const url = new URL(request.url);
  const tratoId = url.searchParams.get('trato_id');
  const responsableId = url.searchParams.get('responsable_id');
  const estado = url.searchParams.get('estado');
  const prioridad = url.searchParams.get('prioridad');
  const vencimiento = url.searchParams.get('vencimiento');
  const hoy = nowIso().slice(0, 10); // 'YYYY-MM-DD'

  let result = tareasFixture;
  if (tratoId) result = result.filter((t) => t.trato_id === tratoId);
  if (responsableId) result = result.filter((t) => t.responsable_id === responsableId);
  if (estado) result = result.filter((t) => t.estado === estado);
  if (prioridad) result = result.filter((t) => t.prioridad === Number(prioridad));
  if (vencimiento === 'vencidas') {
    result = result.filter(
      (t) => t.fecha_limite != null && t.fecha_limite < hoy && t.estado !== 'completada',
    );
  } else if (vencimiento === 'proximas') {
    const limite = addDaysIso(hoy, 7); // helper local o inline
    result = result.filter(
      (t) =>
        t.fecha_limite != null &&
        t.fecha_limite >= hoy &&
        t.fecha_limite <= limite &&
        t.estado !== 'completada',
    );
  }
  return HttpResponse.json(result);
}),
```

`addDaysIso(hoy, 7)`: helper inline (sumar 7 días a `Date` y `.toISOString().slice(0,10)`). No requiere lib nueva.

## Fixture — ampliación de `tareasFixture` (ADR-053 soporte)

Estado actual (2 tareas, ambas trato `d1111111`, responsable `22222222`, estado `pendiente`, prioridades 2/3). Agregar ~5 tareas para cubrir TODOS los filtros + ambos usuarios. Hoy del mock = 2026-05-24.

| # | trato_id | responsable_id | estado | prioridad | fecha_limite | Cubre |
|---|---|---|---|---|---|---|
| existente 1 | d1111111 | 22222222 | pendiente | 3 | 2026-05-15 | vencida (pasada) |
| existente 2 | d1111111 | 22222222 | pendiente | 2 | 2026-05-22 | vencida (pasada) |
| nueva 3 | d2222222 | 11111111 (admin) | en_progreso | 1 | 2026-05-28 | prioridad 1, admin, en_progreso, próxima |
| nueva 4 | d2222222 | 11111111 (admin) | completada | 2 | 2026-05-10 | estado completada + fecha_completada |
| nueva 5 | d3333333 | 22222222 | pendiente | 1 | 2026-05-30 | otro trato, próxima (≤7d) |
| nueva 6 | d1111111 | 11111111 (admin) | pendiente | 3 | null | fecha_limite null (ni vencida ni próxima) |
| nueva 7 | d3333333 | 22222222 | pendiente | 2 | 2026-06-20 | futura lejana (>7d, no próxima) |

Garantiza: estados (pendiente/en_progreso/completada), prioridades (1/2/3), ambos responsables (`11111111` admin / `22222222`), múltiples tratos (`d1111111`/`d2222222`/`d3333333`), vencimiento (vencida/próxima/lejana/null). La tarea #4 debe tener `fecha_completada` no-null.

## Schema Zod — `tarea.schema.ts`

```ts
export const tareaCreateSchema = z.object({
  trato_id: z.string().min(1, { message: 'El trato es requerido' }),
  responsable_id: z.string().min(1, { message: 'El responsable es requerido' }),
  titulo: z.string().min(1, { message: 'El título es requerido' }).max(200),
  descripcion: z.string().max(2000).nullable().optional().or(z.literal('')),
  tipo: z.enum(['llamada', 'reunion', 'email', 'demo', 'seguimiento']),
  prioridad: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  fecha_limite: z.string().nullable().optional().or(z.literal('')),
});

export const tareaUpdateSchema = tareaCreateSchema.partial().extend({
  estado: z.enum(['pendiente', 'en_progreso', 'completada']).optional(),
  fecha_completada: z.string().nullable().optional(),
});

export type TareaCreateInput = z.infer<typeof tareaCreateSchema>;
export type TareaUpdateInput = z.infer<typeof tareaUpdateSchema>;
```
`trato_id` REQUERIDO (no-nullable en contrato — explore OBJ2). `estado`/`fecha_completada` solo en update (programáticas: `TareaEstadoMenu` Reabrir). `TAREA_EMPTY_DEFAULTS` homologa `TRATO_EMPTY_DEFAULTS`.

## Hook signatures (homologan useTratos/useGanarTrato)

```ts
export function useTareas(filters?: UseTareasFilters): UseQueryResult<Tarea[]>;
export function useTarea(id: string | undefined): UseQueryResult<Tarea>;
export function useCreateTarea(): UseMutationResult<Tarea, Error, TareaCreateInput>;   // POST /tratos/:trato_id/tareas
export function useUpdateTarea(): UseMutationResult<Tarea, Error, { id: string; data: TareaUpdateInput }>;
export function useDeleteTarea(): UseMutationResult<void, Error, string>;
export function useCompletarTarea(): UseMutationResult<Tarea, Error, string>;          // PATCH /tareas/:id/completar
```
`useCreateTarea` postea a `/tratos/${input.trato_id}/tareas` (handler existente, línea 11) — el handler toma `trato_id` del path param, NO del body. `useCompletarTarea` espeja `useGanarTrato` (mutationFn `apiClient.patch(\`/tareas/${id}/completar\`)` + invalida `all` + `detail(id)`).

## TareaEstadoMenu (ADR-050, homologa TratoEstadoMenu)

3 ítems SIEMPRE visibles, disabled-by-state:
- **"Iniciar"** → `useUpdateTarea({ id, data: { estado: 'en_progreso' } })`. `disabled` si `estado !== 'pendiente'`.
- **"Completar"** → `useCompletarTarea(id)` (endpoint `/completar`, auto-rellena `fecha_completada` server-side, handler línea 44). `disabled` si `estado === 'completada'`.
- **"Reabrir"** → `useUpdateTarea({ id, data: { estado: 'pendiente', fecha_completada: null } })`. `disabled` si `estado !== 'completada'`.
Sin modal para ninguna transición. Trigger = `Button ghost icon` con `MoreVertical`. Reutilizado en `TareasTable` y `TareaDetailPage`.

## Refactor TratoDetailPage → tabbed (ADR-051)

1. Extraer la grilla de `Field`s (líneas 205-247 actuales) a `TratoInfoTab.tsx` (presentational, recibe `trato` + nombres resueltos).
2. Crear `TratoTareasTab.tsx`: `useTareas({ trato_id })` + `TareasTable` + botón "Crear tarea" (abre `TareaCreateDialog` con `tratoIdFijo={trato.id}`).
3. `TratoDetailPage`: agregar `const [tab, setTab] = useTabSync(['info','tareas'],'info')`; envolver contenido en `<Tabs>`; header mantiene las 5 acciones + badge pendientes (OQ6).
4. REESCRIBIR `TratoDetailPage.test.tsx` (Strict TDD): tests del header con acciones + presencia de tabs + cambio de tab + badge.

## File Changes

| File | Action | Description |
|---|---|---|
| `src/features/tareas/` | Create | Feature completo greenfield (~20 archivos incl. tests) |
| `src/mocks/handlers/tareas.ts` | Modify | Agregar `GET /tareas` con filtros (ADR-053) |
| `src/mocks/fixtures/tareas.ts` | Modify | +5 tareas (cubrir 6 filtros + ambos usuarios) |
| `src/mocks/handlers/__tests__/tareas.handler.test.ts` | Create | Tests GET /tareas con cada filtro + vencimiento |
| `src/features/tratos/pages/TratoDetailPage.tsx` | Modify | Flat → tabbed (ADR-051) + badge pendientes |
| `src/features/tratos/components/TratoInfoTab.tsx` | Create | Extracción de la grilla de Fields |
| `src/features/tratos/components/TratoTareasTab.tsx` | Create | Tab Tareas del trato |
| `src/features/tratos/__tests__/TratoDetailPage.test.tsx` | Modify | Reescribir para layout tabbed |
| `src/routes/router.tsx` | Modify | Agregar `/tareas`, `/tareas/:id` |
| `src/components/layout/Sidebar.tsx` | Modify | Agregar NavItem "Mis tareas" con `ClipboardList` |

**Aprox**: ~22 create, ~6 modify, 0 delete.

## Testing Strategy (Strict TDD — `pnpm test:run`)

| Layer | Qué testear | Approach |
|---|---|---|
| **MSW handler** | `GET /tareas` por cada filtro (trato_id, responsable_id, estado, prioridad) + vencimiento (vencidas/próximas/todas) | `tareas.handler.test.ts` (nuevo); fixture ampliado da cobertura |
| **Hooks** | useTareas (con/sin filtros), useTarea, useCreate/Update/DeleteTarea, useCompletarTarea (verifica fecha_completada) | 1 test por hook (~6). QueryClientProvider |
| **Schema** | tareaCreateSchema (trato_id requerido falla vacío, happy path) | `safeParse` |
| **Page TareasListPage** | tabla poblada, cada filtro aplica, búsqueda título client-side, título navega a detalle, error 500 | 1 test integration |
| **Page TareaDetailPage** | detalle válido, TareaEstadoMenu transiciones, 404 redirect | 1 test integration |
| **TratoDetailPage (refactor)** | header con 5 acciones, tabs info/tareas, badge pendientes derivado, cambio de tab `?tab=` | reescribir test existente |
| **"Mis tareas"** | sidebar navega; lista filtra por `usuario.id` | dentro del test de TareasListPage con authStore seteado |

## Migration / Rollout

No requiere migración de datos (MSW resetea por sesión). Rollout = ciclo SDD: tests verde por lote, smoke manual al cierre del lote del refactor TratoDetailPage (tabs visuales) y del wiring sidebar (NavItem nuevo, tests no lo detectan — patrón #155/ADR-047).

## Architecture Decisions (ADRs nuevos)

- **ADR-048**: `useTareas` paramétrico + `tareasKeys` con `byTrato(tratoId)` (homologa ADR-040/useTratos).
- **ADR-049**: `useCompletarTarea` doble invalidación (`all` + `detail`), espeja `useGanarTrato`; usa endpoint `/completar` que auto-rellena `fecha_completada`.
- **ADR-050**: `TareaEstadoMenu` inline DropdownMenu, 3 ítems disabled-by-state, sin modal (homologa ADR-044). Iniciar/Completar/Reabrir.
- **ADR-051**: Refactor `TratoDetailPage` flat → tabbed con `useTabSync(['info','tareas'],'info')`; acciones de estado del trato permanecen en el header (espeja ClienteDetailPage).
- **ADR-052**: Badge de pendientes derivado del MISMO query del tab (`useTareas({ trato_id, estado:'pendiente' })`), sin tercera query.
- **ADR-053**: `GET /tareas` server-side con filtros; `vencimiento` evaluado por comparación de strings ISO contra hoy (`vencidas` = `< hoy && != completada`; `proximas` = `[hoy, hoy+7d] && != completada`). Fixture ampliado a 7 tareas.
- **ADR-054**: Vista "Mis tareas" = `TareasListPage` parametrizada con `responsable_id` del `useAuthStore`; sin fallback (rutas protegidas garantizan usuario). Icono sidebar `ClipboardList`.

## Open Questions

Ninguna. Las 6 open questions del proposal quedan resueltas arriba (OQ1-OQ6) con evidencia y homologación citada.
