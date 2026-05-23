# Technical Design — Clientes Management (Change 5)

**Fecha**: 2026-05-23
**Persistencia**: hybrid
**Strict TDD**: enabled (`pnpm test:run`)
**Status**: draft
**ADRs**: ADR-030 a ADR-039
**Cross-refs**:
- `openspec/changes/clientes-management/proposal.md`
- `openspec/changes/clientes-management/specs/clientes-management/spec.md`
- `openspec/changes/clientes-management/exploration.md`
- Change 4 design (ADR-022 a ADR-029): `openspec/changes/archive/2026-05-22-prospectos-crud/design.md`

---

## 1. Resumen ejecutivo

Change 5 promueve `Cliente` a entidad de primer nivel del CRM Pipely: lista filtrable (`/clientes`), detalle con tabs Información + Tratos (`/clientes/:id`), CRUD vía diálogos modales, eliminación con bloqueo 409 si hay tratos vinculados, y badge de origen (prospecto/manual). Migra el hook temporal `useClientes` desde `features/prospectos/` a `features/clientes/` en un commit atómico que también actualiza el único consumidor (`ProspectosListPage.tsx:22`), preservando la query key literal `['clientes']` para no romper la invalidación de `useConvertirProspecto`. Toda la infraestructura de Changes 1-4 (TanStack Query, RHF + Zod v4, shadcn primitives, MSW + `makeCrudHandlers`, Vitest + RTL) se reutiliza. La feature se homologa estructuralmente con `empresas/` (template CRUD) y reutiliza patrones del detalle de `prospectos/` (tabs + lazy load).

A diferencia de la exploración, la decisión final es **Dialog para create + edit** (no page `/clientes/nuevo`), homologado con empresas/prospectos. Esto reduce superficie, simplifica routing y mantiene UX consistente.

---

## 2. Decisiones arquitectónicas (ADRs)

### ADR-030 — Estructura de la feature `clientes/`

**Contexto**. Tres precedentes existen: `empresas/` (CRUD tabla), `usuarios/` (CRUD tabla), `prospectos/` (Kanban + detalle con tabs). Clientes es CRUD tabla con detalle de tabs — combinación de ambos.

**Decisión**. Layout homologado con `empresas/` para el shell de carpetas, e incorporando el patrón de tabs del detalle de `prospectos/`:

```
src/features/clientes/
├── schemas/
│   └── cliente.schema.ts
├── hooks/
│   ├── useClientes.ts          (migrado + clientesKeys)
│   ├── useCliente.ts
│   ├── useCreateCliente.ts
│   ├── useUpdateCliente.ts
│   ├── useDeleteCliente.ts
│   └── useTratosByCliente.ts
├── components/
│   ├── ClientesTable.tsx
│   ├── ClienteForm.tsx           (presentational, RHF + Zod, reusado)
│   ├── ClienteCreateDialog.tsx   (container Dialog)
│   ├── ClienteEditDialog.tsx     (container Dialog)
│   ├── ClienteDeleteDialog.tsx   (AlertDialog, manejo 409 en host)
│   ├── ClienteInfoTab.tsx        (presentational)
│   └── ClienteTratosTab.tsx      (container, lazy fetch)
├── pages/
│   ├── ClientesListPage.tsx
│   └── ClienteDetailPage.tsx
└── __tests__/
    ├── useClientes.test.tsx
    ├── useCliente.test.tsx
    ├── useCreateCliente.test.tsx
    ├── useUpdateCliente.test.tsx
    ├── useDeleteCliente.test.tsx
    ├── useTratosByCliente.test.tsx
    ├── ClientesListPage.test.tsx
    └── ClienteDetailPage.test.tsx
```

**Razón**. Carpetas `schemas/`, `hooks/`, `components/`, `pages/`, `__tests__/` son convención del repo. Separar `ClienteCreateDialog` y `ClienteEditDialog` (no un `ClienteFormDialog` con discriminated union) reduce ramas internas y mantiene cada container con responsabilidad única.

**Tradeoff**. Dos diálogos vs uno con `mode`. Optamos por dos para legibilidad (cada uno cablea su mutation directa). El `ClienteForm` interno es único y se reusa entre ambos (ADR-035).

---

### ADR-031 — Hooks del CRUD + query keys factory

**Contexto**. Necesitamos 5 hooks CRUD + 1 hook read-only para tratos del cliente. El factory `clientesKeys` debe coexistir con la invalidación hardcoded `['clientes']` de `useConvertirProspecto`.

**Decisión**.

| Hook | Tipo | Signature | Notas |
|---|---|---|---|
| `useClientes(filters?)` | `UseQueryResult<Cliente[]>` | acepta `{ empresa_id?, origen? }` opcional | filtros server-side via query params |
| `useCliente(id)` | `UseQueryResult<Cliente>` | `enabled: !!id` | |
| `useCreateCliente()` | `UseMutationResult<Cliente, Error, CreateClienteInput>` | invalida `['clientes']` | |
| `useUpdateCliente()` | `UseMutationResult<Cliente, Error, { id, data }>` | invalida `['clientes']`, `['clientes', id]` | |
| `useDeleteCliente()` | `UseMutationResult<void, Error, string>` | maneja 409 en `onError` (toast con mensaje), 204 invalida + remove | |
| `useTratosByCliente(id, opts?)` | `UseQueryResult<Trato[]>` | `enabled: opts?.enabled ?? true` para lazy | endpoint `/clientes/:id/tratos` |

Factory de keys (versión revisada durante Lote E — ver "Revisión post-implementación" abajo):

```ts
export const clientesKeys = {
  all: ['clientes'] as const,
  list: (filters?: ClientesFilters) => ['clientes', filters ?? {}] as const,
  detail: (id: string) => ['clientes', id] as const,
  tratos: (id: string) => ['clientes', id, 'tratos'] as const,
};
```

**Razón**. `list(filters)` incluye los filtros en la queryKey para que TanStack Query refetchee automáticamente cuando cambian (sin filtros en la key, cambiar `empresa_id` u `origen` en la UI no dispara nueva llamada al servidor). La compatibilidad con `useConvertirProspecto:29` (`queryClient.invalidateQueries({ queryKey: ['clientes'] })`) se preserva porque TanStack Query v5 usa **prefix matching** por defecto en `invalidateQueries`: el array `['clientes']` invalida todas las variantes `['clientes', *]`.

**Tradeoff**. Cada combinación de filtros genera una entrada de caché propia. Aceptable: el set de clientes esperado es pequeño y la separación de caches por filtro mejora UX (no se ve "flash" de la lista anterior al cambiar filtro).

**Revisión post-implementación (Lote E)**: La versión original del ADR proponía `list() => ['clientes']` literal (sin filtros) para garantizar la compatibilidad con `useConvertirProspecto`. Durante la implementación de `ClientesListPage` se detectó que esto rompía el refetch automático al cambiar filtros, contradiciendo REQ-01 del spec. El sub-agent revisó el ADR a la versión actual tras verificar que TQ v5 prefix-match preserva la invalidación de `useConvertirProspecto`. Decisión aceptada por el usuario el 2026-05-23, documentada aquí en lugar del apply-progress para mantener el design como fuente de verdad.

---

### ADR-032 — Migración atómica del hook `useClientes`

**Contexto**. `src/features/prospectos/hooks/useClientes.ts` es importado por `ProspectosListPage.tsx:22`. Mover sin actualizar el import deja el build en estado roto.

**Decisión**. Un único commit ejecuta, **en este orden**:

1. **Crear** `src/features/clientes/hooks/useClientes.ts` con la implementación migrada (idéntica + `clientesKeys` factory + soporte de filtros).
2. **Actualizar** `src/features/prospectos/pages/ProspectosListPage.tsx:22`:
   - De: `import { useClientes } from '../hooks/useClientes';`
   - A: `import { useClientes } from '@/features/clientes/hooks/useClientes';`
3. **Eliminar** `src/features/prospectos/hooks/useClientes.ts`.

Verificación mental antes del commit:
```bash
git status   # 3 archivos: 1 nuevo, 1 modificado, 1 eliminado
git diff --staged --stat
pnpm type-check   # exit 0 obligatorio
pnpm test:run -- ProspectosListPage   # tab Convertidos sigue verde
```

**Razón**. TypeScript en CI atrapa cualquier import roto entre estos pasos si se intentara dividir en commits. El test de integración del tab Convertidos es la red de seguridad funcional.

**Tradeoff**. El commit toca dos features. Aceptable por ser una migración mecánica, documentada en el mensaje (`refactor(clientes): mover useClientes desde features/prospectos`).

---

### ADR-033 — Override MSW `DELETE /clientes/:id` con validación 409

**Contexto**. `makeCrudHandlers` registra un `DELETE` genérico que elimina sin validar dependencias. La spec REQ-7 exige 409 si el cliente tiene tratos asociados.

**Decisión**. Sobreescribir el handler antes de `makeCrudHandlers` en el array (MSW resuelve handlers en orden — el primero que matchea responde). Lógica:

```ts
// src/mocks/handlers/clientes.ts
export const clientesHandlers = [
  // Override DELETE — debe ir ANTES del makeCrudHandlers
  http.delete(`${API}/clientes/:id`, async ({ params }) => {
    await withDelay();
    const id = String(params['id']);
    const idx = clientesFixture.findIndex((c) => c.id === id);
    if (idx === -1) return errors.notFound();

    const tratosVinculados = tratosFixture.filter((t) => t.cliente_id === id);
    if (tratosVinculados.length > 0) {
      return apiError(
        409,
        'CONFLICT',
        `El cliente tiene ${tratosVinculados.length} trato${tratosVinculados.length === 1 ? '' : 's'} asociado${tratosVinculados.length === 1 ? '' : 's'}`,
        [{ field: 'cliente_id', message: 'tratos_vinculados', tratosCount: tratosVinculados.length }],
      );
    }
    clientesFixture.splice(idx, 1);
    return new HttpResponse(null, { status: 204 });
  }),
  // Override GET lista con filtros
  http.get(`${API}/clientes`, async ({ request }) => {
    await withDelay();
    const url = new URL(request.url);
    const empresaId = url.searchParams.get('empresa_id');
    const origen = url.searchParams.get('origen'); // 'prospecto' | 'manual'
    let result = clientesFixture;
    if (empresaId) result = result.filter((c) => c.empresa_id === empresaId);
    if (origen === 'prospecto') result = result.filter((c) => c.prospecto_origen_id !== null);
    if (origen === 'manual') result = result.filter((c) => c.prospecto_origen_id === null);
    return HttpResponse.json(result);
  }),
  ...makeCrudHandlers<Cliente>(...), // resto sigue con factory
  http.get(`${API}/clientes/:id/tratos`, ...), // ya existe
];
```

**Razón**. Patrón ya usado por `prospectos.ts` (override `GET /prospectos/:id/tratos`). Mantiene el factory para POST/PATCH/GET-by-id que sí siguen patrón estándar.

**Tradeoff**. `details` incluye campo no-estándar (`tratosCount`). El frontend lo lee de `error.message` (string), no de `details`, así que es informativo para debugging. `errors` helper de `error.ts` no tiene `conflict()` — se usa `apiError(409, ...)` directo.

---

### ADR-034 — Schema Zod `cliente.schema.ts`

**Contexto**. Aprender de WARN-03 (Change 4): `.default()` en enums opcionales rompe inferencia con `@hookform/resolvers@5`. La spec REQ-5 lista campos y opcionalidad.

**Decisión**. Schema con patrón exacto de `prospecto.schema.ts`:

```ts
const phoneRegex = /^[\d\s+()-]{7,20}$/;

export const clienteCreateSchema = z.object({
  nombre_contacto: z.string().min(1, { message: 'El nombre del contacto es requerido' }).max(150),
  empresa_id: z.string().min(1, { message: 'La empresa es requerida' }),
  responsable_id: z.string().min(1, { message: 'El responsable es requerido' }),
  correo_contacto: z.string().email({ message: 'Correo inválido' }).optional().or(z.literal('')),
  telefono_contacto: z.string().regex(phoneRegex, { message: 'Teléfono inválido' }).optional().or(z.literal('')),
  cargo_contacto: z.string().max(100).optional().or(z.literal('')),
  como_nos_conocio: z.enum(['referido', 'redes_sociales', 'busqueda', 'evento', 'otro']).optional(),
  notas: z.string().max(2000).optional().or(z.literal('')),
});

export const clienteUpdateSchema = clienteCreateSchema.partial();

export type ClienteCreateInput = z.infer<typeof clienteCreateSchema>;
export type ClienteUpdateInput = z.infer<typeof clienteUpdateSchema>;
```

**Razón**. Sin `estado_posible_cliente` (no aplica a clientes). Sin `prospecto_origen_id` (server-side: `null` en create manual, viene del backend en convertidos). `como_nos_conocio` es `.optional()` puro — WARN-03 aplicado.

**EMPTY_DEFAULTS** en el form: `{ nombre_contacto: '', empresa_id: '', responsable_id: '', correo_contacto: '', telefono_contacto: '', cargo_contacto: '', notas: '', como_nos_conocio: undefined }`. El handler de submit ANTES de mutar mapea `''` → `null` para campos opcionales (utilidad: `emptyToNull`).

---

### ADR-035 — `ClienteForm` compartido (Create + Edit)

**Contexto**. Empresas y prospectos usan un `Form` único reutilizado entre `CreateDialog` y `EditDialog`. Reducimos duplicación.

**Decisión**. `ClienteForm` es presentational con props:

```ts
interface ClienteFormProps {
  defaultValues: ClienteCreateInput;       // EMPTY_DEFAULTS o prefilled
  mode: 'create' | 'edit';
  onSubmit: (data: ClienteCreateInput) => void | Promise<void>;
  isSubmitting?: boolean;
  serverErrors?: Array<{ field: string; message: string }>; // mapeo 422
}
```

Internamente: `useForm<ClienteCreateInput>({ resolver: zodResolver(clienteCreateSchema), defaultValues })`. Reusa `useEmpresas()` y `useUsuarios()` para los Selects (ADR-029 del Change 4). El submit hace el mapeo `'' → null` y delega a `onSubmit`. Los containers (`ClienteCreateDialog`, `ClienteEditDialog`) cablean su mutation respectiva.

**Razón**. Single source of truth de la UI del form. Cualquier cambio (campo nuevo, validación) toca un solo archivo. Validado en `EmpresaForm` y `ProspectoForm`.

**Tradeoff**. `mode` se pasa pero no cambia la mayoría de la UI — solo etiquetas si se quisiera ("Crear cliente" vs "Editar cliente" en el submit). El título del Dialog vive en el container, no en el form, así que la prop `mode` es mayormente para tracking/analytics futuro y para asserts en tests.

---

### ADR-036 — Tab Tratos con lazy load

**Contexto**. ADR-027 del Change 4 estableció el patrón: el hook solo dispara fetch cuando el tab está activo. `Tabs` de Radix monta/desmonta el contenido del tab activo por default.

**Decisión**. Dos opciones complementarias, elegimos la **segunda** por consistencia con Change 4:

1. **Opción A** (control en hook): `useTratosByCliente(id, { enabled: activeTab === 'tratos' })`. El hook se llama desde el page con flag.
2. **Opción B** (control por montaje): `ClienteTratosTab` solo se monta dentro de `<TabsContent value="tratos">`. Como Radix desmonta tabs inactivos, el hook dentro solo corre cuando el tab está activo. Sin necesidad de `enabled` flag externo.

Usamos **B**. `ClienteTratosTab` invoca `useTratosByCliente(id)` sin flag. El page solo pasa `id`.

**Razón**. Menos prop drilling, menos estado en el page. Patrón idéntico a `ProspectoTratosTab`. La primera activación tendrá ~300ms de delay (aceptable).

**Tradeoff**. Si el usuario alterna repetidamente entre tabs, cada activación re-monta el componente. TanStack Query mitiga con cache (la 2ª activación no refetchea hasta que la key esté stale).

---

### ADR-037 — Badge `prospecto_origen_id` sin anidamiento de `<a>`

**Contexto**. El header del detalle muestra acciones (Editar, Eliminar) y un badge de origen. Si `prospecto_origen_id !== null`, el badge es `<Link>`. Anidar un `<Link>` dentro de otro `<Link>` o dentro de `<button>` rompe HTML5 e produce comportamiento errático en click.

**Decisión**. Estructura del header:

```tsx
<header className="flex items-center justify-between">
  <div>
    <h1>{cliente.nombre_contacto}</h1>
    <p>{empresa?.nombre}</p>                                  {/* texto, NO link aquí */}
    {cliente.prospecto_origen_id ? (
      <Link to={`/prospectos/${cliente.prospecto_origen_id}`} className="badge">
        Origen: Prospecto convertido
      </Link>
    ) : (
      <span className="badge">Origen: Manual</span>
    )}
  </div>
  <div className="flex gap-2">
    <Button onClick={openEdit}>Editar</Button>
    <Button variant="destructive" onClick={openDelete}>Eliminar</Button>
  </div>
</header>
```

Reglas:
- El `<Link>` del badge NO debe vivir dentro de otro `<Link>` o `<button>`.
- Si en el futuro se agrega un wrapper clickeable al header, aplicar `onClick={(e) => e.stopPropagation()}` al `<Link>` del badge.
- Verificar mismo patrón al renderizar la empresa name (si se hace clickeable después, fuera del scope de este Change).

**Razón**. Lección de Change 4: el patrón de `EmpresaProspectosTab` tenía riesgo de anidamiento. Validar estructura en sdd-design previene el bug antes de implementar.

---

### ADR-038 — Estrategia de tests TDD

**Contexto**. Strict TDD activo. Política ADR-020 del Change 4 (sin tests directos de componentes salvo lógica propia). Cobertura objetivo: 50+ tests verdes antes de archive.

**Decisión**. Tests obligatorios por capa:

| Capa | Archivo de test | Cobertura |
|---|---|---|
| Hook | `useClientes.test.tsx` | GET list, filtros, error 500 |
| Hook | `useCliente.test.tsx` | GET by id, 404 |
| Hook | `useCreateCliente.test.tsx` | POST 201, invalida `['clientes']`, error 422 |
| Hook | `useUpdateCliente.test.tsx` | PATCH 200, invalida ambas keys, error 422 |
| Hook | `useDeleteCliente.test.tsx` | DELETE 204, DELETE 409 (toast con mensaje), DELETE 404 |
| Hook | `useTratosByCliente.test.tsx` | GET tratos, empty array, error 500 |
| Page | `ClientesListPage.test.tsx` | Render tabla, búsqueda, filtros, error reintentar, navegación al detalle, Dialog create |
| Page | `ClienteDetailPage.test.tsx` | Render header, tab Info, switch a tab Tratos (lazy), badge prospecto/manual, 404 redirect, edit dialog, delete dialog con 409 |

**Componentes presentacionales** (ClienteForm, ClienteInfoTab, ClienteTratosTab, ClientesTable, ClienteDeleteDialog, dialogs): **NO** tienen tests directos. Cobertura implícita via page-level tests. Excepción opcional: si el verify detecta gap específico (ej. WARN-02 del Change 4), `sdd-tasks` puede agregar un test puntual.

**Mínimo aceptable para archive**: 50+ tests verdes en `pnpm test:run`. Realista: 60-75 tests nuevos (6 hooks × ~3 tests + 2 pages × ~10 tests).

**Orden TDD por lote**:
1. RED — escribir test que falla por la razón correcta (handler no existe, hook no exportado, etc.)
2. GREEN — implementación mínima
3. REFACTOR — sin cambiar tests

---

### ADR-039 — Estructura de lotes para `sdd-apply`

**Contexto**. La implementación debe ser ejecutable en batches dependientes. Cada lote es atómico (un commit).

**Decisión**. 6 lotes:

| Lote | Alcance | Dependencias | Commit msg sugerido |
|---|---|---|---|
| **A — MSW + contrato** | `clientes.ts` handler override (DELETE 409, GET filtros). Sin cambios a `types.ts` (ya extendido en Change 4). | Ninguna | `feat(mocks): override DELETE clientes con 409 y filtros en GET` |
| **B — Schema + Hooks** | `cliente.schema.ts` + 6 hooks + sus tests (RED→GREEN). | Lote A | `feat(clientes): schema Zod y 6 hooks CRUD con tests` |
| **C — Migración atómica** | Mover `useClientes` desde `prospectos/`, actualizar import en `ProspectosListPage.tsx:22`, eliminar archivo viejo. | Lote B (el nuevo `useClientes` ya existe en `clientes/hooks/`) | `refactor(clientes): migrar hook useClientes desde features/prospectos` |
| **D — Componentes** | `ClienteForm`, `ClientesTable`, `ClienteCreateDialog`, `ClienteEditDialog`, `ClienteDeleteDialog`, `ClienteInfoTab`, `ClienteTratosTab`. Sin tests directos. | Lote B | `feat(clientes): componentes presentacionales y diálogos CRUD` |
| **E — Pages + Routing + Sidebar** | `ClientesListPage` + `ClienteDetailPage` + sus tests + wiring `router.tsx` + eliminar `ClientesPlaceholder` + habilitar item Sidebar (línea 18). | Lotes B, C, D | `feat(clientes): pages, routing y habilitar item en sidebar` |
| **F — Smoke + fixes** | Lote contingente: arreglos detectados en smoke manual o por `sdd-verify`. Ej: WARN-XX, ajustes UX. | Lote E | `fix(clientes): ajustes detectados en smoke/verify` |

**Razón**. Lote A primero porque los tests de hooks dependen del 409 funcional. Lote C después de B (no antes), para que el nuevo `useClientes` ya esté disponible antes de eliminar el viejo. Lote D antes de E porque las pages importan los componentes. Lote F siempre opcional.

**Regla de oro**: cada lote pasa `pnpm test:run` antes de commit.

---

## 3. Component tree

```
ClientesListPage
├── TopBar
│   ├── Input (búsqueda nombre_contacto, client-side)
│   ├── Select (empresa_id, server-side query param)
│   ├── Select (origen: todos|prospecto|manual, server-side)
│   └── Button "Nuevo cliente" → abre ClienteCreateDialog
├── ClienteCreateDialog (Dialog shadcn)
│   └── ClienteForm (mode="create")
├── ClientesTable
│   └── Rows con nombre clickeable → navigate(`/clientes/:id`)
└── (estado vacío | error con Reintentar)

ClienteDetailPage
├── Header
│   ├── h1 nombre_contacto + empresa name
│   ├── Badge origen (Link a /prospectos/:id si origen, span "Manual" si no)
│   └── Botones Editar | Eliminar
├── ClienteEditDialog (Dialog)
│   └── ClienteForm (mode="edit", defaultValues prefilled)
├── ClienteDeleteDialog (AlertDialog)
│   └── confirm → useDeleteCliente.mutate(id) — host maneja 204→navigate, 409→toast
└── Tabs
    ├── TabsContent "info" → ClienteInfoTab (campos + "—" para nulos)
    └── TabsContent "tratos" → ClienteTratosTab → useTratosByCliente(id) (lazy)
```

---

## 4. Data flow

```
┌───────────────────────────────────────────────────────────┐
│ src/api/client.ts (axios + interceptor JWT)               │
└───────────────────────┬───────────────────────────────────┘
                        │
       ┌────────────────┴────────────────┐
       ▼                                 ▼
┌──────────────────┐              ┌──────────────────┐
│ MSW /clientes.ts │ interceptor  │ Backend real     │
│ + GET filtros    │              │ (post-mocks)     │
│ + DELETE 409     │              │                  │
└──────────────────┘              └──────────────────┘
                        │
                        ▼
┌───────────────────────────────────────────────────────────┐
│ src/features/clientes/hooks/                              │
│   useClientes / useCliente / useTratosByCliente           │
│   useCreateCliente / useUpdateCliente / useDeleteCliente  │
│ TanStack Query cache bajo keys clientesKeys.*             │
└───────────────────────┬───────────────────────────────────┘
                        │
                        ▼
┌───────────────────────────────────────────────────────────┐
│ pages (containers): ClientesListPage / ClienteDetailPage  │
│   ├── consumen hooks                                      │
│   └── estado UI local (useState para Dialog open, etc.)   │
└───────────────────────┬───────────────────────────────────┘
                        │
                        ▼
┌───────────────────────────────────────────────────────────┐
│ components (presentational + container dialogs)           │
│   ClientesTable | ClienteForm | *Dialog | *Tab            │
└───────────────────────────────────────────────────────────┘
```

### Invalidación de cache

| Mutation | Keys invalidadas |
|---|---|
| `useCreateCliente` | `clientesKeys.list()` |
| `useUpdateCliente` | `clientesKeys.list()`, `clientesKeys.detail(id)` |
| `useDeleteCliente` (204) | `removeQueries(clientesKeys.detail(id))` + `invalidateQueries(clientesKeys.list())` |
| `useDeleteCliente` (409) | NO invalidar (cliente sigue existiendo) |
| Externa: `useConvertirProspecto` | `['clientes']` literal — compatible con `clientesKeys.list()` |

---

## 5. Migration plan (hook)

Único punto frágil del Change. Pasos atómicos del **Lote C**:

1. **Pre-flight check** (mental, NO commit aún):
   - Confirmar que `src/features/clientes/hooks/useClientes.ts` ya fue creado en Lote B (con misma signature + `clientesKeys` factory + soporte filtros opcional).
   - Confirmar que `clientesKeys.list()` retorna `['clientes'] as const` (no `['clientes', { filters }]`).

2. **Edit** `src/features/prospectos/pages/ProspectosListPage.tsx`:
   - Línea 22: cambiar import path de `'../hooks/useClientes'` a `'@/features/clientes/hooks/useClientes'`.
   - El uso interno (`const { data: clientes } = useClientes();`) no cambia.

3. **Delete** `src/features/prospectos/hooks/useClientes.ts`.

4. **Verificación local antes del commit**:
   ```
   pnpm type-check                                  # exit 0 obligatorio
   pnpm test:run -- prospectos                      # ProspectosListPage verde, tab Convertidos OK
   pnpm test:run -- clientes                        # nuevos tests verdes
   ```

5. **Commit atómico**:
   ```
   git add src/features/prospectos/hooks/useClientes.ts \
           src/features/prospectos/pages/ProspectosListPage.tsx \
           src/features/clientes/hooks/useClientes.ts
   git status   # debe mostrar 1D + 1M + (1A si el nuevo no estaba ya commiteado en Lote B)
   git commit -m "refactor(clientes): migrar useClientes desde features/prospectos"
   ```

**Rollback**: `git revert <hash>` o `git reset HEAD~1` si aún no se pusheó. El archivo viejo se restaura automáticamente.

**Red de seguridad**: el test `ProspectosListPage.test.tsx` (Change 4) verifica el tab Convertidos. Si rompe, el commit no debe avanzar.

---

## 6. Test plan

### Archivos nuevos (todos en `src/features/clientes/__tests__/`)

| Archivo | Tipo | Cobertura mínima | Scenarios de spec cubiertos |
|---|---|---|---|
| `useClientes.test.tsx` | Hook | GET list, filtros `empresa_id` y `origen`, error 500 | REQ Filtros listado (hook tests), REQ Listado |
| `useCliente.test.tsx` | Hook | GET by id, 404 | REQ Detalle |
| `useCreateCliente.test.tsx` | Hook | POST 201, invalida `['clientes']`, `prospecto_origen_id: null`, error 422 | REQ Crear cliente |
| `useUpdateCliente.test.tsx` | Hook | PATCH 200, invalida ambas keys, error 422 | REQ Editar cliente |
| `useDeleteCliente.test.tsx` | Hook | DELETE 204 invalida+remove, DELETE 409 con toast del backend message, DELETE 404 | REQ Eliminar 409, REQ Invalidación |
| `useTratosByCliente.test.tsx` | Hook | GET tratos array, empty `[]`, error 500 | REQ Tab Tratos |
| `ClientesListPage.test.tsx` | Page integration | render tabla, búsqueda client-side, filtros UI dispara query params, error con Reintentar, click nombre navega, abrir Create Dialog | REQ Sidebar, REQ Routing, REQ Listado, REQ Filtros, REQ Crear (UI) |
| `ClienteDetailPage.test.tsx` | Page integration | render header, badge prospecto Link, badge manual span, switch tab Tratos lazy, 404 redirect, abrir Edit Dialog, Delete con 409 toast | REQ Detalle, REQ Tab Info, REQ Tab Tratos, REQ Editar (UI), REQ Eliminar (UI 409) |

### Tests existentes que NO deben romper

- `src/features/prospectos/__tests__/ProspectosListPage.test.tsx` — el tab Convertidos sigue verde tras migración del hook.
- `src/features/prospectos/__tests__/useConvertirProspecto.test.tsx` — invalidación de `['clientes']` sigue alcanzando el cache de `useClientes` en su nueva ubicación.

### Estimación de conteo final

- 6 hook tests × ~3 cases ≈ **18 tests**
- 2 page tests × ~10 cases ≈ **20 tests**
- Total nuevos: **~38 tests** + 1 verificación de regresión de `ProspectosListPage`.
- Suite total post-Change 5: **~98 tests** (60 actuales + 38 nuevos). Cumple "50+ verdes" del proposal.

---

## 7. Risks revisited

Repaso de los 7 riesgos del proposal + 4 (R1-R4) del spec (sin numerar pero implícitos en REQs):

| ID | Riesgo (origen) | Mitigado por | Estado |
|---|---|---|---|
| R1 | Migración rompe import en `ProspectosListPage.tsx` (proposal) | ADR-032 (commit atómico) + test de regresión | **Mitigado** |
| R2 | Zod v4 + `como_nos_conocio` `.optional()` + RHF resolver v5 (proposal) | ADR-034 (patrón exacto de `prospecto.schema.ts`) | **Mitigado** |
| R3 | DELETE MSW sin 409 (proposal) | ADR-033 (override custom) | **Mitigado** |
| R4 | `clientesKeys.list()` rompe `useConvertirProspecto` (proposal) | ADR-031 (literal `['clientes'] as const`) | **Mitigado** |
| R5 | Form compartido requiere `EMPTY_DEFAULTS` correctos (proposal) | ADR-035 (defaults explícitos documentados) + cobertura via page tests | **Mitigado** |
| R6 | Badge anidado dentro de elementos clickeables (proposal) | ADR-037 (estructura plana validada) | **Mitigado** |
| R7 | Olvido de unblock del Sidebar (proposal) | ADR-039 (Lote E incluye explícitamente) + test integration | **Mitigado** |
| R-spec-a | Filtros UI no disparan query params correctamente | ADR-031 (signature `useClientes(filters)`) + test `useClientes.test.tsx` con filtros | **Mitigado** |
| R-spec-b | Lazy load del tab Tratos genera doble fetch al re-montar | ADR-036 (`enabled` implícito por montaje) + cache TanStack Query | **Mitigado** (parcial: refetch si stale) |
| R-spec-c | Mapeo de error 409 no muestra mensaje legible | ADR-033 (mensaje en backend) + ADR-031 (`onError` lee `error.message`) | **Mitigado** |
| R-spec-d | `prospecto_origen_id` no llega como `null` en cliente manual | MSW handler de POST ya fija `null` (verificado en exploración) + test `useCreateCliente` | **Mitigado** |

**Risks pendientes para `sdd-tasks` o `sdd-apply`**:
- **R-tasks-1**: granularidad de subtareas en Lote D (componentes) — el agente de `sdd-tasks` debe decidir si testear ciertos componentes (ClienteForm, ClienteDeleteDialog) merece test directo o cobertura implícita.
- **R-tasks-2**: orden de los handlers en `clientes.ts` — MSW resuelve en orden de array; el override DELETE debe ir antes del spread de `makeCrudHandlers`. `sdd-tasks` debe marcar este detalle como acceptance criteria del Lote A.

---

## 8. File changes

| Archivo | Acción | Descripción |
|---|---|---|
| `src/features/clientes/schemas/cliente.schema.ts` | Create | Zod schema (ADR-034) |
| `src/features/clientes/hooks/useClientes.ts` | Create | Migrado + extendido + `clientesKeys` |
| `src/features/clientes/hooks/useCliente.ts` | Create | GET by id |
| `src/features/clientes/hooks/useCreateCliente.ts` | Create | POST |
| `src/features/clientes/hooks/useUpdateCliente.ts` | Create | PATCH |
| `src/features/clientes/hooks/useDeleteCliente.ts` | Create | DELETE con manejo 409 |
| `src/features/clientes/hooks/useTratosByCliente.ts` | Create | GET tratos read-only |
| `src/features/clientes/components/ClienteForm.tsx` | Create | Form RHF + Zod compartido |
| `src/features/clientes/components/ClientesTable.tsx` | Create | Tabla con nombre clickeable |
| `src/features/clientes/components/ClienteCreateDialog.tsx` | Create | Dialog + ClienteForm + useCreateCliente |
| `src/features/clientes/components/ClienteEditDialog.tsx` | Create | Dialog + ClienteForm + useUpdateCliente |
| `src/features/clientes/components/ClienteDeleteDialog.tsx` | Create | AlertDialog confirm |
| `src/features/clientes/components/ClienteInfoTab.tsx` | Create | Render campos con `—` para nulos |
| `src/features/clientes/components/ClienteTratosTab.tsx` | Create | Lazy fetch tratos |
| `src/features/clientes/pages/ClientesListPage.tsx` | Create | Container lista |
| `src/features/clientes/pages/ClienteDetailPage.tsx` | Create | Container detalle |
| `src/features/clientes/__tests__/*.test.tsx` | Create (8 archivos) | Cobertura TDD |
| `src/features/prospectos/hooks/useClientes.ts` | Delete | Migrado (Lote C) |
| `src/features/prospectos/pages/ProspectosListPage.tsx` | Modify | Línea 22: actualizar import path |
| `src/mocks/handlers/clientes.ts` | Modify | Override DELETE 409 + GET filtros |
| `src/routes/router.tsx` | Modify | Wirear `clientes` (index) + `clientes/:id` |
| `src/routes/placeholders.tsx` | Modify | Eliminar `ClientesPlaceholder` y su uso |
| `src/components/layout/Sidebar.tsx` | Modify | Línea 18: quitar `disabled + badge` |

---

## 9. Interfaces / Contracts

### Hooks (signatures)

```ts
export interface UseClientesFilters {
  empresa_id?: string;
  origen?: 'prospecto' | 'manual';
}
export function useClientes(filters?: UseClientesFilters): UseQueryResult<Cliente[]>;
export function useCliente(id: string): UseQueryResult<Cliente>;
export function useCreateCliente(): UseMutationResult<Cliente, Error, ClienteCreateInput>;
export function useUpdateCliente(): UseMutationResult<Cliente, Error, { id: string; data: ClienteUpdateInput }>;
export function useDeleteCliente(): UseMutationResult<void, Error, string>;
export function useTratosByCliente(id: string): UseQueryResult<Trato[]>;
```

### API contract (referencia desde spec)

| Método | Path | Notas |
|---|---|---|
| GET | `/api/v1/clientes?empresa_id=&origen=` | filtros opcionales |
| POST | `/api/v1/clientes` | body sin `prospecto_origen_id` (handler lo fija a `null`) |
| GET | `/api/v1/clientes/:id` | 404 si no existe |
| PATCH | `/api/v1/clientes/:id` | 200 con cliente actualizado |
| DELETE | `/api/v1/clientes/:id` | 204 OK; 409 si tiene tratos; 404 si no existe |
| GET | `/api/v1/clientes/:id/tratos` | array (puede ser vacío) |

Errores normalizados: `{ status, error, message, details? }`.

---

## 10. Migration / Rollout

Sin migración de datos (mocks). Rollout por commits atómicos (lotes A-F). Cada lote pasa `pnpm test:run` + `pnpm type-check` antes de commit. Rollback por `git revert` del commit del lote afectado. El único cross-feature change (Lote C) está aislado y reversible.

---

## 11. Open Questions

Ninguna. Las decisiones se cierran con ADR-030 a ADR-039. Cualquier hallazgo durante `sdd-apply` se persistirá como `mem_save` tipo `discovery` con `topic_key: sdd/clientes-management/discoveries/<n>`.

---

## 12. Next phase

`sdd-tasks` — desglose explícito de los 6 lotes (A-F) en tareas con checklist `[ ]` y acceptance criteria por tarea. Aplicar Strict TDD (RED→GREEN→REFACTOR) y respetar dependencias entre lotes.
