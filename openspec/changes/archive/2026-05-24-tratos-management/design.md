# Design: tratos-management (Change 6a)

## Technical Approach

Feature greenfield `src/features/tratos/` siguiendo la estructura plana ya validada en `empresas/` y `clientes/` (ADR-030 de Change 5). Hook paramétrico único `useTratos({ filters })` reemplaza el acoplamiento cruzado `clientes → useTratosByCliente`. Polimorfismo cliente/prospecto resuelto via toggle UI + Zod `superRefine` XOR. Cambio de estado via DropdownMenu por fila + botones en detalle; transición a 'perdido' SIEMPRE dispara modal obligatorio. Sin componentes shadcn nuevos.

## Architecture Overview

### Estructura feature

```
src/features/tratos/
├── schemas/trato.schema.ts          (Zod XOR refine)
├── hooks/
│   ├── useTratos.ts                 (list paramétrico + tratosKeys)
│   ├── useTrato.ts                  (detail by id)
│   ├── useCreateTrato.ts
│   ├── useUpdateTrato.ts
│   ├── useDeleteTrato.ts            (manejo 204/409)
│   ├── useGanarTrato.ts             (PATCH /:id/ganar)
│   └── usePerderTrato.ts            (PATCH /:id/perder con motivo)
├── components/
│   ├── TratosTable.tsx              (filas con nombre clickeable + DropdownMenu)
│   ├── TratoForm.tsx                (presentational shared create/edit)
│   ├── TratoCreateDialog.tsx
│   ├── TratoEditDialog.tsx
│   ├── TratoDeleteDialog.tsx        (AlertDialog)
│   ├── TratoEstadoBadge.tsx
│   ├── TratoEstadoMenu.tsx          (DropdownMenu con 3 ítems siempre visibles)
│   └── TratoPerderDialog.tsx        (modal motivo_perdida obligatorio)
├── pages/
│   ├── TratosListPage.tsx
│   └── TratoDetailPage.tsx
└── __tests__/                       (Strict TDD: 7 hook tests + 2 page tests)
```

### State ownership

| Dato | Owner | Notas |
|---|---|---|
| Lista de tratos con filtros | TanStack Query (`['tratos', filters]`) | refetch automático al cambiar filtros |
| Trato individual | TanStack Query (`['tratos', id]`) | invalidado por mutations |
| Toggle Cliente/Prospecto | React Hook Form (campo `asociacion`) | parte del schema |
| Modal `TratoPerderDialog` open | Estado local del componente que lo invoca | callback `onConfirm({ motivo_perdida })` |
| Filtros activos UI | Estado local de `TratosListPage` | embebidos en queryKey |
| Tab activo `?tab=` | URL searchParams via `useTabSync` | hook custom reutilizable |

## Data Flow / Sequence Diagrams

### (a) Crear trato con XOR

```
Usuario → TratoCreateDialog: abre dialog
TratoCreateDialog → TratoForm: render con asociacion='cliente' default
Usuario → TratoForm: selecciona toggle 'Prospecto', llena prospecto_id, nombre, responsable, valor
TratoForm → zodResolver(tratoCreateSchema): valida
  ├─ superRefine: confirma exactamente uno entre cliente_id/prospecto_id no-vacío
  └─ si XOR falla → ctx.addIssue({ path: ['cliente_id' | 'prospecto_id'], message })
zodResolver → form.handleSubmit: si OK, ejecuta onSubmit
TratoForm → useCreateTrato.mutate({ ...values, cliente_id: null }): payload limpio
useCreateTrato → POST /api/v1/tratos: con estado='abierto'
MSW handler → 201 + body
useCreateTrato → invalidateQueries(['tratos']): prefix match invalida todas las variantes
TratoCreateDialog → toast.success + close
```

### (b) Cambio estado inline → modal motivo_perdida

```
Usuario → TratoEstadoMenu (fila tabla o header detalle): abre DropdownMenu
TratoEstadoMenu: renderiza 3 ítems siempre visibles
  ├─ "Marcar ganado" disabled si estado='ganado'
  ├─ "Marcar perdido…" disabled si estado='perdido'
  └─ "Reabrir" disabled si estado='abierto'
Usuario → ítem "Marcar perdido…": click
TratoEstadoMenu → setPerderOpen(true): abre TratoPerderDialog (NO invoca endpoint)
TratoPerderDialog → render textarea motivo_perdida (Zod required, 1-2000 chars)
Usuario → textarea: ingresa motivo + submit
TratoPerderDialog → usePerderTrato.mutate({ id, motivo_perdida })
usePerderTrato → PATCH /api/v1/tratos/:id/perder { motivo_perdida }
  └─ si motivo_perdida vacío → handler responde 422 → form.setError inline
MSW handler → 200 + trato actualizado
usePerderTrato → invalidateQueries(['tratos']) + ['tratos', id]
TratoPerderDialog → close + toast.success
```

### (c) DELETE con 409 si hay tareas

```
Usuario → TratoDeleteDialog: confirma
useDeleteTrato → DELETE /api/v1/tratos/:id
MSW handler (override antes de makeCrudHandlers):
  ├─ busca trato por id; si !found → 404
  ├─ filtra tareasFixture por trato_id === id
  ├─ si tareas.length > 0 → apiError(409, 'CONFLICT', `tiene N tarea(s) asociada(s)`, [...])
  └─ si vacío → splice del fixture + 204
useDeleteTrato:
  ├─ 204 → removeQueries(['tratos', id]) + invalidateQueries(['tratos']) + toast.success + navigate('/tratos')
  └─ 409 → toast.error(err.message) + dialog se cierra
```

### (d) Migración atómica useTratosByCliente

```
COMMIT ÚNICO (ADR-041):
1. crear src/features/tratos/hooks/useTratos.ts (con tratosKeys.list({ cliente_id }))
2. modificar src/features/clientes/components/ClienteTratosTab.tsx:
     - import useTratosByCliente FROM '../hooks/useTratosByCliente'   ❌
     + import { useTratos } FROM '@/features/tratos/hooks/useTratos'  ✅
     - useTratosByCliente(clienteId)
     + useTratos({ cliente_id: clienteId })
3. eliminar src/features/clientes/hooks/useTratosByCliente.ts
4. modificar src/features/clientes/hooks/useClientes.ts: quitar `tratos: (id) => [...]`
5. eliminar src/features/clientes/__tests__/useTratosByCliente.test.tsx
6. eliminar src/mocks/handlers/clientes.ts:66-69 (GET /clientes/:id/tratos)
Verificación pre-commit: pnpm type-check && pnpm test:run -- clientes
```

## TanStack Query Keys & Invalidation

```ts
// src/features/tratos/hooks/useTratos.ts
export const tratosKeys = {
  all: ['tratos'] as const,
  list: (filters?: UseTratosFilters) => ['tratos', filters ?? {}] as const,
  detail: (id: string) => ['tratos', id] as const,
};
```

| Mutation | Invalidación | Por qué |
|---|---|---|
| `useCreateTrato` | `invalidateQueries({ queryKey: ['tratos'] })` | prefix match cubre lista global, lista del cliente, lista del prospecto, etc. |
| `useUpdateTrato` | `['tratos']` + `['tratos', id]` | refresca listas y detalle |
| `useDeleteTrato` (204) | `removeQueries(['tratos', id])` + `invalidateQueries(['tratos'])` | mismo patrón ADR-031 de useDeleteCliente |
| `useGanarTrato` | `['tratos']` + `['tratos', id]` | badge en lista y detalle |
| `usePerderTrato` | `['tratos']` + `['tratos', id]` | mismo |

## MSW Handler Shape

### `src/mocks/handlers/tratos.ts` — agregar override DELETE 409

```ts
// Override DELETE — DEBE ir ANTES del spread makeCrudHandlers en el array
// ADR-046: bloquea eliminación con 409 si el trato tiene tareas asociadas
http.delete(`${API}/tratos/:id`, async ({ params }) => {
  await withDelay();
  const id = String(params['id']);
  const idx = tratosFixture.findIndex((t) => t.id === id);
  if (idx === -1) return errors.notFound();

  const tareasVinculadas = tareasFixture.filter((t) => t.trato_id === id);
  if (tareasVinculadas.length > 0) {
    const n = tareasVinculadas.length;
    return apiError(
      409,
      'CONFLICT',
      `El trato tiene ${n} tarea${n === 1 ? '' : 's'} asociada${n === 1 ? '' : 's'}`,
      [{ field: 'trato_id', message: 'tareas_vinculadas' }],
    );
  }
  tratosFixture.splice(idx, 1);
  return new HttpResponse(null, { status: 204 });
}),
// ... resto del array sin cambios, .slice(1) en makeCrudHandlers ya estaba
```

### `src/mocks/handlers/clientes.ts:66-69` — eliminar handler huérfano

```diff
- http.get(`${API}/clientes/:id/tratos`, async ({ params }) => {
-   await withDelay();
-   return HttpResponse.json(tratosFixture.filter((t) => t.cliente_id === params['id']));
- }),
```

### Fixtures — sin cambios

`tratosFixture` ya tiene 3 entries. Verificado:
- `d1111111` → 2 tareas en `tareasFixture` → válido para DELETE 409.
- `d2222222` y `d3333333` → 0 tareas → válidos para DELETE 204.

**D4 ya resuelta sin cambios** — no se agrega fixture nuevo.

## Schema Zod XOR — referencia (ADR-042)

```ts
// src/features/tratos/schemas/trato.schema.ts
export const tratoCreateSchema = z
  .object({
    asociacion: z.enum(['cliente', 'prospecto']),
    cliente_id: z.string().optional().or(z.literal('')),
    prospecto_id: z.string().optional().or(z.literal('')),
    nombre: z.string().min(1, 'Nombre requerido').max(200),
    responsable_id: z.string().min(1, 'Responsable requerido'),
    valor_estimado: z.number().nonnegative().nullable().optional(),
    probabilidad: z.number().min(0).max(100).nullable().optional(),
    fecha_cierre_esperada: z.string().nullable().optional().or(z.literal('')),
    tipo_contrato: z.enum(['precio_fijo', 'tiempo_materiales', 'retainer']).nullable().optional(),
  })
  .superRefine((data, ctx) => {
    const cliente = data.cliente_id?.trim();
    const prospecto = data.prospecto_id?.trim();
    if (data.asociacion === 'cliente') {
      if (!cliente) ctx.addIssue({ code: 'custom', path: ['cliente_id'], message: 'Selecciona un cliente' });
      if (prospecto) ctx.addIssue({ code: 'custom', path: ['prospecto_id'], message: 'No puede tener prospecto si asociación es cliente' });
    } else {
      if (!prospecto) ctx.addIssue({ code: 'custom', path: ['prospecto_id'], message: 'Selecciona un prospecto' });
      if (cliente) ctx.addIssue({ code: 'custom', path: ['cliente_id'], message: 'No puede tener cliente si asociación es prospecto' });
    }
  });
```

Payload al POST: `useCreateTrato` transforma quitando `asociacion` y forzando el opuesto a `null`.

## useTabSync hook — referencia (ADR-045)

```ts
// src/lib/useTabSync.ts (nuevo helper, reutilizable)
export function useTabSync(allowed: readonly string[], fallback: string) {
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab');
  const active = tab && allowed.includes(tab) ? tab : fallback;
  function setTab(next: string) {
    const newParams = new URLSearchParams(params);
    if (next === fallback) newParams.delete('tab');
    else newParams.set('tab', next);
    setParams(newParams, { replace: true });
  }
  return [active, setTab] as const;
}
```

Uso en `ClienteDetailPage`: `const [tab, setTab] = useTabSync(['info', 'tratos'], 'info');` → `<Tabs value={tab} onValueChange={setTab}>`.

## Architecture Decisions (ADRs)

### ADR-040: Estructura feature `src/features/tratos/` plana homologada

**Choice**: Replicar la estructura de `features/clientes/` y `features/empresas/`: `schemas/`, `hooks/`, `components/`, `pages/`, `__tests__/`.
**Alternatives**: subcarpetas por subdominio (`hooks/queries/`, `hooks/mutations/`) — rechazada por overhead sin valor en este tamaño.
**Rationale**: homologación es preferencia explícita del usuario; reduce carga cognitiva al navegar el codebase.
**Consequences**: zero learning cost para developers acostumbrados a Changes 2/5.

### ADR-041: Migración atómica del hook `useTratosByCliente` en un commit

**Choice**: Un commit único que (a) crea `useTratos`, (b) actualiza `ClienteTratosTab`, (c) elimina `useTratosByCliente.ts` y su test, (d) limpia `clientesKeys.tratos`, (e) elimina handler huérfano. Verificación pre-commit: `pnpm type-check && pnpm test:run -- clientes`.
**Alternatives**: commits separados (deprecación → migración → cleanup) — rechazada por dejar window de tests fallidos.
**Rationale**: patrón ya validado en Change 5 ADR-032.
**Consequences**: revert = restauración total en un solo paso.

### ADR-042: Zod `superRefine` para XOR cliente_id/prospecto_id

**Choice (D2)**: Schema unificado con `asociacion: 'cliente' | 'prospecto'` toggle + `superRefine` que emite `ctx.addIssue` con `path` al campo concreto.
**Alternatives**: discriminated union (requiere transform pre-POST, más fricción), `refine` simple (errores genéricos sin path).
**Rationale**: errores rastreables a campos en la UI; un solo type `TratoCreateInput`.
**Consequences**: `useCreateTrato` debe transformar (`{ asociacion, ...rest }`) → quitar `asociacion`, forzar el opuesto a `null`.

### ADR-043: Modal obligatorio `TratoPerderDialog` con `motivo_perdida` requerido

**Choice**: Cualquier transición a 'perdido' (DropdownMenu o botón detalle) dispara `TratoPerderDialog`. El modal contiene textarea Zod-validated (1-2000 chars). Submit invoca `PATCH /tratos/:id/perder`. NO se permite path directo al endpoint.
**Alternatives**: validación inline en form de edición (rechazada — el form NO edita estado por ADR), confirmación simple sin textarea (rechazada por requirement de reporting).
**Rationale**: garantiza trazabilidad de motivos para futuras estadísticas; UX explícita.
**Consequences**: el endpoint `/perder` siempre se invoca desde el modal, nunca directamente.

### ADR-044: DropdownMenu con 3 ítems siempre visibles, `disabled` por estado

**Choice (D1)**: `TratoEstadoMenu` renderiza siempre "Marcar ganado", "Marcar perdido…", "Reabrir". Cada ítem computa `disabled` según `trato.estado`.
**Alternatives**: rendering condicional (altura variable entre filas), botón solo en detalle (UX inconsistente).
**Rationale**: layout consistente entre filas; usuarios descubren todas las acciones; patrón shadcn DropdownMenu lo permite.
**Consequences**: 1 componente `TratoEstadoMenu` reutilizado en tabla y detalle.

### ADR-045: `useTabSync` hook custom para sincronizar `?tab=` con state del componente Tabs

**Choice (D5)**: hook reutilizable `useTabSync(allowed, fallback)` lee/escribe `searchParams.get('tab')`. `ClienteDetailPage` y `TratoDetailPage` (cuando aplique) lo usan.
**Alternatives**: hash `#tratos` (rechazado por conflictos futuros con anchors), no sincronizar (rechazado por requerir 2 clics donde sirve 1).
**Rationale**: URLs shareables, back/forward funciona. Helper reutilizable evita duplicación cuando más detalles con tabs surjan.
**Consequences**: extracción del hook a `src/lib/useTabSync.ts` para que `TratoDetailPage` y `ClienteDetailPage` lo compartan.

### ADR-046: Override `DELETE /tratos/:id` con 409 si hay tareas (homologa ADR-031/ADR-033)

**Choice**: handler `http.delete` posicionado ANTES del spread `makeCrudHandlers` en `tratosHandlers`. Lee `tareasFixture` filtrado por `trato_id === id`. Si > 0 → `apiError(409, 'CONFLICT', mensaje con conteo, [{ field: 'trato_id', message: 'tareas_vinculadas' }])`. Si 0 → splice + 204.
**Alternatives**: validar client-side antes del DELETE (rechazado — perdería el caso race condition real del backend).
**Rationale**: patrón establecido en Change 5 (`clientes.ts:14-32`). Fixture actual ya cubre ambos paths (d1111111 con tareas → 409, d2222222/d3333333 sin tareas → 204) — **D4 no requiere fixture nuevo**.
**Consequences**: `useDeleteTrato` reutiliza el pattern de `useDeleteCliente` para manejo 409 (toast con `err.message`, no invalida cache).

### ADR-047: Habilitación de sidebar como tarea explícita (institucionaliza patrón #155)

**Choice**: `sdd-tasks` MUST incluir en Lote E una tarea explícita: "Quitar `disabled: true, badge: 'Próximamente'` del item Tratos en `src/components/layout/Sidebar.tsx:19`. Smoke manual al cierre del lote (tests no detectan)."
**Alternatives**: agregarlo en pasada al wiring del router (rechazado — históricamente se olvida).
**Rationale**: 3era ocurrencia documentada del patrón #155 (Change 3, Change 4, Change 5). La memoria explícita en checklist es la mitigación.
**Consequences**: Lote E suma 1 task + 1 smoke item; deuda institucional cerrada.

### Decisión 'D3' WARN-05 fix: convertir `<Link>` interior a `<button role="link">`

**No es un ADR independiente** porque es implementation detail, pero documentado aquí: en `ProspectoConvertidosList.tsx:48-55`, el `<Link to={/empresas/...}>` interior se reemplaza por `<button type="button" role="link" onClick={(e) => { e.stopPropagation(); navigate('/empresas/...'); }}>`. Test agregado: verificar que `container.querySelectorAll('a a')` retorna `[]` (no anidamiento).

## Lote Plan (para sdd-tasks)

5 lotes (A-E), respeta el ritmo de Change 5:

| Lote | Alcance | Dependencias | Commit semántico |
|---|---|---|---|
| **A** | MSW: override DELETE 409 en `tratos.ts`, no fixture changes (D4 ya cubierta). Tests handler. | — | `feat(mocks): override DELETE 409 tratos con tareas asociadas` |
| **B** | Schema Zod + `useTabSync` helper + 7 hooks tratos con tests (TDD). Hook tests primero. | A | `feat(tratos): schemas, hooks y helper useTabSync` |
| **C** | Migración atómica `useTratosByCliente` → `useTratos` (ADR-041). UN commit. | B | `refactor(tratos): migrar useTratosByCliente y eliminar handler huérfano (ADR-041)` |
| **D** | Componentes: `TratosTable`, `TratoForm`, `TratoCreate/Edit/DeleteDialog`, `TratoEstadoBadge`, `TratoEstadoMenu`, `TratoPerderDialog`. Tests de página integrales. Pages `TratosListPage` y `TratoDetailPage`. Wiring router. | C | `feat(tratos): CRUD completo, detalle con cambio de estado inline y sidebar habilitado` |
| **E** | UX deferida: (a) WARN-05 fix `ProspectoConvertidosList.tsx`, (b) `ClienteTratosTab` con botón "Crear trato" + link al detalle, (c) `ProspectoDetailPage` con cross-links convertido→cliente + tab tratos del cliente. Tests de regresión. | D | `feat(ux): cross-links convertido→cliente, fix WARN-05 y CTAs en tab Tratos del cliente` |

Cada lote es un commit atómico revertible. Sidebar enable cae en Lote D junto al wiring (ADR-047).

## Testing Strategy (Strict TDD — `pnpm test:run`)

Política heredada de Change 5 (ADR-038): hook tests + page tests directos; componentes tests via page tests (no hay tests unitarios por componente excepto formularios complejos).

| Layer | Qué testear | Approach |
|---|---|---|
| **MSW handler** | DELETE 409 con tareas, DELETE 204 sin tareas, override antes de makeCrudHandlers | `src/mocks/handlers/__tests__/tratos.handler.test.ts` (nuevo). Pattern de `clientes.handler.test.ts` |
| **Hooks** | useTratos (con/sin filtros), useTrato, useCreate/Update/DeleteTrato (incluyendo 409), useGanarTrato, usePerderTrato (incluyendo 422 motivo vacío) | 1 test por hook (~7 tests). Mock TanStack Query con `QueryClientProvider` |
| **Schema** | XOR happy paths (cliente + cliente_id), XOR errores (ambos vacíos, ambos llenos) | `__tests__/trato.schema.test.ts` con `safeParse` |
| **Page TratosListPage** | tabla poblada, filtros aplicados, nombre clickeable navega, error 500 + reintentar | 1 test integration |
| **Page TratoDetailPage** | detalle válido, motivo_perdida solo si perdido, 404 redirect, cambio estado vía botones | 1 test integration |
| **Regresión Change 5** | ClienteTratosTab con botón crear + link al detalle, ProspectoConvertidosList sin `<a>` anidados, ProspectoDetailPage cross-links | actualización tests existentes en `__tests__/` |
| **Helper useTabSync** | sync con `?tab=` URL, fallback default, setTab actualiza searchParams | `src/lib/__tests__/useTabSync.test.tsx` |

Estimado: ~12-15 tests nuevos. Strict TDD → cada test antes del archivo de implementación que cubre.

## File Changes

| File | Action | Description |
|---|---|---|
| `src/features/tratos/` | Create | Feature completo greenfield (~18 archivos incluyendo tests) |
| `src/lib/useTabSync.ts` | Create | Hook helper reutilizable |
| `src/lib/__tests__/useTabSync.test.tsx` | Create | Test del helper |
| `src/routes/router.tsx` | Modify | Agregar `/tratos`, `/tratos/:id`; reemplazar `TratosPlaceholder` |
| `src/routes/placeholders.tsx` | Modify | Eliminar `TratosPlaceholder` |
| `src/components/layout/Sidebar.tsx` | Modify | Quitar `disabled+badge` línea 19 |
| `src/mocks/handlers/tratos.ts` | Modify | Agregar override DELETE 409 (ADR-046) |
| `src/mocks/handlers/clientes.ts` | Modify | Eliminar líneas 66-69 (handler huérfano post-migración) |
| `src/mocks/handlers/__tests__/tratos.handler.test.ts` | Create | Tests DELETE 204/409 |
| `src/features/clientes/hooks/useTratosByCliente.ts` | Delete | Migrado (ADR-041) |
| `src/features/clientes/__tests__/useTratosByCliente.test.tsx` | Delete | Test obsoleto |
| `src/features/clientes/hooks/useClientes.ts` | Modify | Quitar `clientesKeys.tratos` |
| `src/features/clientes/components/ClienteTratosTab.tsx` | Modify | Consumir `useTratos({ cliente_id })` + botón "Crear trato" + link al detalle |
| `src/features/clientes/__tests__/ClienteDetailPage.test.tsx` | Modify | Actualizar tests del tab Tratos con botón crear + nav |
| `src/features/clientes/pages/ClienteDetailPage.tsx` | Modify | Aplicar `useTabSync` (ADR-045) |
| `src/features/prospectos/components/ProspectoConvertidosList.tsx` | Modify | Fix WARN-05 (D3: convertir `<Link>` interior a `<button role="link">`) |
| `src/features/prospectos/pages/ProspectoDetailPage.tsx` | Modify | Cross-link "Ver cliente convertido" + mensaje en tab Tratos linkeable al cliente |
| `src/features/prospectos/__tests__/ProspectoDetailPage.test.tsx` | Modify | Tests cross-links + HTML válido |

**Total**: 11 create, 9 modify, 2 delete. Coincide con el lote plan.

## Migration / Rollout

No requiere migración de datos (sin backend persistente; MSW resetea por sesión). Rollout = ciclo SDD normal: tests verde por lote, smoke manual al cierre del Lote D (sidebar) y Lote E (UX cross-links).

## Open Questions

Ninguna. Las 6 ambigüedades del spec fueron resueltas por el usuario antes de design (D1-D6); D4 confirmada sin acción extra tras verificar fixture.
