# Exploration — tareas-management (Change 6b)

**Fecha**: 2026-05-24 (America/Mexico_City)  
**Persistencia**: hybrid (este archivo + engram `sdd/tareas-management/explore`)  
**Alineación previa**: engram `sdd/tareas-management/alignment` (#186)  
**Sucesor de**: Change 6a — `tratos-management` (archivado `openspec/changes/archive/2026-05-24-tratos-management/`)

---

## Current State

### Objetivo 1 — Usuario logueado / responsable actual (PRIORIDAD MÁXIMA)

**Veredicto: SÍ EXISTE** — `useAuthStore` persiste el usuario logueado.

- **`src/store/authStore.ts`** (líneas 1-34): Zustand store con persistencia en `localStorage` (`crm-auth`). Expone `usuario: AuthUser | null`, donde `AuthUser = Pick<Usuario, 'id' | 'nombre' | 'correo' | 'rol_sistema' | 'rol_empresa'>`.
- El campo relevante es `usuario.id` que corresponde directamente al `responsable_id` en el contrato de `Tarea`.
- **`src/features/auth/hooks/useLogin.ts`** (línea 19): `setSession(token, usuario)` — el store se llena al hacer login; el objeto `usuario` incluye el campo `id`.
- **`src/components/layout/Sidebar.tsx`** (línea 25): `const usuario = useAuthStore((s) => s.usuario)` — ya hay precedente de consumo del store en un componente de layout.

**Conclusión para decisión #3 ("Mis tareas")**: La implementación de "Mis tareas" filtrada por responsable logueado es **totalmente accionable** sin fallback. Se lee con `useAuthStore((s) => s.usuario?.id)` y se pasa como `responsable_id` al hook `useTareas`. Si `usuario` es `null` (raro en rutas protegidas), el filtro simplemente no aplica.

**Fallback innecesario**: El sistema de autenticación mock funciona con 2 fixtures (admin `11111111-1111-1111-1111-111111111111` y vendedor `22222222-2222-2222-2222-222222222222`). Ambos son `responsable_id` válidos. Sin embargo, las tareas actuales del fixture solo usan `22222222-2222-2222-2222-222222222222` — ver Objetivo 4.

---

### Objetivo 2 — Contrato Tarea (`src/api/types.ts:84-97`)

Verificado campo a campo:

```ts
export interface Tarea {
  id: string;
  trato_id: string;          // requerido (no nullable — IMPORTANTE: vinculación obligatoria)
  responsable_id: string;    // requerido
  titulo: string;            // requerido
  descripcion: string | null;
  tipo: TipoTarea;           // 'llamada' | 'reunion' | 'email' | 'demo' | 'seguimiento'
  estado: EstadoTarea;       // 'pendiente' | 'en_progreso' | 'completada'
  prioridad: 1 | 2 | 3;      // union literal numérica
  fecha_limite: string | null;
  fecha_completada: string | null;
  creado_en: string;
  actualizado_en: string;
}
```

- `TipoTarea` (línea 9): `'llamada' | 'reunion' | 'email' | 'demo' | 'seguimiento'`
- `EstadoTarea` (línea 10): `'pendiente' | 'en_progreso' | 'completada'`
- `TipoFicha` (línea 11): incluye `'tarea'` — relevante para Change 7 (Tableros), no para 6b.

**Nota crítica**: `trato_id: string` es **requerido y no nullable** — toda tarea debe tener un trato vinculado. Esto es coherente con la decisión #1 (página `/tareas` = listado global) y la decisión #2 (tab en TratoDetailPage). Confirma que el filtro `trato_id` en el listado global es un filtro opcional de búsqueda, no una relación obligatoria del scope de la página.

---

### Objetivo 3 — Handler MSW `src/mocks/handlers/tareas.ts`

Estado actual del CRUD:

| Endpoint | Estado | Observaciones |
|---|---|---|
| `POST /tratos/:id/tareas` | ✅ Implementado | Crea tarea vinculada al trato; estado forzado a `'pendiente'`; `fecha_completada: null` |
| `GET /tareas/:id` | ✅ Implementado | Read de tarea individual |
| `PATCH /tareas/:id` | ✅ Implementado | Update general (spread body + `actualizado_en`) |
| `PATCH /tareas/:id/completar` | ✅ Implementado | Auto-rellena `estado='completada'` + `fecha_completada=nowIso()` |
| `DELETE /tareas/:id` | ✅ Implementado | 204 sin verificación downstream (decisión #7 confirmada) |
| **`GET /tareas`** (listado global) | ❌ **FALTA** | Requerido para página `/tareas` (decisión #1) — brecha principal |
| **`GET /tratos/:id/tareas`** | ✅ Implementado en `tratos.ts:88-91` | Filtra `tareasFixture` por `trato_id` — funciona para el tab de TratoDetailPage (decisión #2) |

**Brecha clave**: `GET /tareas` con soporte de filtros (`estado`, `prioridad`, `responsable_id`, `fecha_limite`, `trato_id`) es el único endpoint faltante para el Change 6b.

**Registro en `handlers/index.ts`**: `tareasHandlers` ya está incluido (línea 7-8 + línea 17). Solo hay que agregar `GET /tareas` al array `tareasHandlers`.

---

### Objetivo 4 — Fixture `src/mocks/fixtures/tareas.ts`

Estado actual: **2 tareas**, ambas para el mismo trato `d1111111-dddd-1111-dddd-111111111111`, ambas con `responsable_id: '22222222-2222-2222-2222-222222222222'` (María González / vendedor).

| id | trato_id | responsable_id | estado | prioridad | fecha_limite |
|---|---|---|---|---|---|
| `e1111111-...` | `d1111111` | `22222222` | `pendiente` | 3 (alta) | 2026-05-15 |
| `e2222222-...` | `d1111111` | `22222222` | `pendiente` | 2 (media) | 2026-05-22 |

**Cobertura insuficiente para ejercitar los 6 filtros**. Necesidades para el Change 6b:

1. **Filtro estado**: solo `'pendiente'` → necesita tareas `en_progreso` y `completada`.
2. **Filtro prioridad**: solo 2 y 3 → necesita prioridad 1 (baja).
3. **Filtro responsable**: solo `22222222` (vendedor) → necesita tarea del admin (`11111111-1111-1111-1111-111111111111`) para probar "Mis tareas" con admin logueado.
4. **Filtro trato vinculado**: solo `d1111111` → necesita tareas de otros tratos (`d2222222`, `d3333333`).
5. **Filtro vencimiento (fecha_limite)**: ambas con fecha pasada → necesita fechas futuras y `null`.

**Recomendación**: agregar al menos 4-5 tareas adicionales que cubran las combinaciones de filtros. El fixture actual solo sirve para el test de la restricción DELETE 409 en tratos.

---

### Objetivo 5 — Hook `useTratos` como plantilla para `useTareas`

`src/features/tratos/hooks/useTratos.ts` — patrón exacto a replicar:

```ts
export interface UseTareasFilters {
  trato_id?: string;
  responsable_id?: string;
  estado?: EstadoTarea;
  prioridad?: 1 | 2 | 3;
  // fecha_limite: filtrado client-side (rango) o server-side (flag 'vencida')
}

export const tareasKeys = {
  all: ['tareas'] as const,
  list: (filters?: UseTareasFilters) => ['tareas', filters ?? {}] as const,
  detail: (id: string) => ['tareas', id] as const,
  byTrato: (trato_id: string) => ['tareas', { trato_id }] as const,
};
```

**Patrón de mutations** (verificado en `useCreateTrato.ts`, `useDeleteTrato.ts`, `useGanarTrato.ts`):
- `useMutation` con `queryClient.invalidateQueries({ queryKey: tareasKeys.all })` en `onSuccess`.
- Error 422 → `return` silencioso (el form maneja inline via `setError`).
- Otros errores HTTP → `toast.error(err.message)`.
- Para action hooks (`useCompletar`): también invalida `tareasKeys.byTrato(tarea.trato_id)` para refrescar el badge de pendientes en TratoDetailPage.

**Hook acción `useCompletarTarea`**: homologa con `useGanarTrato.ts` — `apiClient.patch('/tareas/:id/completar')` + doble invalidación (`tareasKeys.all` + `tareasKeys.byTrato(trato_id)`).

---

### Objetivo 6 — Routing + Sidebar + Tabs

**Routing** (`src/routes/router.tsx`):
- Patrón para agregar `/tareas`: insertar `{ path: 'tareas', element: <TareasListPage /> }` en el bloque `AppShell` children (línea 30 como referencia de línea adyacente). No se requiere ruta de detalle para tareas (no hay `TareaDetailPage` en el scope de 6b).
- No hay `TareasPlaceholder` — la ruta no existe hoy.

**Sidebar** (`src/components/layout/Sidebar.tsx`):
- Patrón #155 exacto: agregar objeto a `items[]` con `{ label: 'Tareas', to: '/tareas', icon: <icono lucide> }` — sin `disabled: true` (la página se crea en el mismo Change).
- El icono sugerido: `CheckSquare` o `ClipboardList` de lucide-react (verificar disponibilidad en la versión instalada).
- El sidebar actual importa: `Building2, UserSearch, Users, Handshake, KanbanSquare, ShieldCheck` — los íconos candidatos (`CheckSquare`, `ClipboardList`, `ListTodo`) no están importados todavía.

**Tabs en TratoDetailPage** (`src/features/tratos/pages/TratoDetailPage.tsx`):
- La página actual NO tiene tabs — es un layout flat de campos en `<div className="grid">` (línea 205).
- **Refactor requerido**: convertir a estructura tabbed similar a `ClienteDetailPage.tsx`, usando `useTabSync(['info', 'tareas'], 'info')` (ADR-045).
- El tab `info` mostrará los campos actuales (mover contenido del `<div className="grid">` al `<ClienteInfoTab>` equivalente de tratos).
- El tab `tareas` montará el futuro `TratoTareasTab` (lazy load por montaje — ADR-036).
- El badge de tareas pendientes irá en el `<TabsTrigger value="tareas">` del header de tabs.

---

### Objetivo 7 — DropdownMenu de cambio de estado (ADR-044) — homologación para tareas

`src/features/tratos/components/TratoEstadoMenu.tsx` — patrón exacto verificado:

- 3 ítems siempre visibles; `disabled` computado por estado actual.
- Estado `'ganado'` usa endpoint dedicado `PATCH /tratos/:id/ganar`.
- `'Reabrir'` usa `useUpdateTrato` con `{ estado: 'abierto', motivo_perdida: null }`.
- `'Marcar perdido…'` delega a un modal (no llama endpoint directamente).

**Para `TareaEstadoMenu`** — diferencias respecto a tratos:
- Transiciones: `pendiente → en_progreso`, `en_progreso → completada`, `completada → reabrir (pendiente)`.
- `'Completar'` usa endpoint dedicado `PATCH /tareas/:id/completar` (handler ya existe).
- `'Reabrir'` = `PATCH /tareas/:id` con `{ estado: 'pendiente', fecha_completada: null }`.
- `'Iniciar'` = `PATCH /tareas/:id` con `{ estado: 'en_progreso' }`.
- **Sin modal para ninguna transición** (decisión #5 confirmada).
- Disabled-by-state:
  - "Iniciar": disabled si `estado !== 'pendiente'`.
  - "Completar": disabled si `estado === 'completada'`.
  - "Reabrir": disabled si `estado !== 'completada'`.

---

### Objetivo 8 — Patrón de filtros (homologación con TratosListPage)

`src/features/tratos/pages/TratosListPage.tsx` — patrón completo verificado:

- Estado local: `useState` por cada filtro activo (`estado`, `clienteId`, `prospectoId`, `responsableId`).
- Filtros server-side vía `useTratos(filters)` con `queryKey` reactivo.
- Búsqueda por nombre: client-side con `searchTerm` (Input + filter local en la tabla).
- Selects: Radix `Select` con `SelectItem` — opción "todos" como sentinel que limpia el filtro.
- Función helper `setOrUnset(setter, sentinel)` para reducir boilerplate.
- Patrón especial de tratos: filtrar selects para mostrar solo entidades con resultados (evitar opciones vacías). En tareas se puede reutilizar el mismo principio pero más simple (no hay polimorfismo).

**Para `TareasListPage`** los filtros serán:
1. `estado` (Select): `todos | pendiente | en_progreso | completada`
2. `prioridad` (Select): `todas | 1 (baja) | 2 (media) | 3 (alta)`
3. `responsable_id` (Select): lista de usuarios activos — mismo patrón que tratos.
4. `trato_id` (Select): lista de tratos con tareas — homologa patrón de filtro de tratos.
5. `vencimiento` (Select): `todos | vencidas | proximas_7d | sin_fecha` — filtrado **client-side** (no existe endpoint que soporte rangos de fecha; el handler tendrá que implementar lógica de comparación de fechas o dejar el filtro en el frontend).

---

### Objetivo 9 — Estructura openspec Change 6a

Verificado en `openspec/changes/archive/2026-05-24-tratos-management/`:
- Archivos: `explore.md`, `proposal.md`, `tasks.md`, `design.md`, `apply-progress.md`, `verify-report.md`, `archive-report.md`.
- Subdirectorio: `specs/` con `tratos-management/spec.md`, `prospectos-management/spec.md`, `clientes-management/spec.md`.
- **Nombre del archivo de exploración**: `explore.md` (no `exploration.md` como en cambios anteriores — Change 6a usó `explore.md`).

**Convención replicada**: el Change 6b usará `openspec/changes/tareas-management/explore.md` (este archivo), y al archivar irá a `openspec/changes/archive/2026-05-24-tareas-management/` (fecha del día del archivado).

---

## Affected Areas

### A crear (greenfield Change 6b)

- `src/features/tareas/` — feature completo (greenfield)
  - `schemas/tarea.schema.ts` — Zod: `titulo` required, `tipo` enum, `estado` enum, `prioridad` literal union, `trato_id` required string, `responsable_id` required string, `fecha_limite` optional string|null.
  - `hooks/useTareas.ts` — paramétrico con `UseTareasFilters` + `tareasKeys`.
  - `hooks/useTarea.ts` — detail por id.
  - `hooks/useCreateTarea.ts` — POST a `/tratos/:trato_id/tareas`.
  - `hooks/useUpdateTarea.ts` — PATCH a `/tareas/:id`.
  - `hooks/useDeleteTarea.ts` — DELETE a `/tareas/:id` (204 simple, sin 409).
  - `hooks/useCompletarTarea.ts` — PATCH a `/tareas/:id/completar`.
  - `components/TareasTable.tsx` — con `titulo` clickeable y `TareaEstadoMenu` por fila.
  - `components/TareaEstadoMenu.tsx` — DropdownMenu homologado a `TratoEstadoMenu` (ADR-044).
  - `components/TareaEstadoBadge.tsx` — homologa `TratoEstadoBadge`.
  - `components/TareaForm.tsx` — presentational compartido entre Create/Edit.
  - `components/TareaCreateDialog.tsx`, `TareaEditDialog.tsx`, `TareaDeleteDialog.tsx`.
  - `components/TratoTareasTab.tsx` — lista de tareas del trato (consumida en TratoDetailPage).
  - `pages/TareasListPage.tsx` — listado global con 5 filtros.
  - `__tests__/` — un test por hook (useTareas, useTarea, useCreate, useUpdate, useDelete, useCompletar) + TareasListPage.

- **`GET /tareas`** en `src/mocks/handlers/tareas.ts` — único endpoint faltante.
- **Fixture ampliada** en `src/mocks/fixtures/tareas.ts` — +4-5 tareas para cobertura de filtros.

### A modificar

- `src/routes/router.tsx` — agregar `{ path: 'tareas', element: <TareasListPage /> }`.
- `src/components/layout/Sidebar.tsx` — agregar item `Tareas` (icono lucide a confirmar, sin `disabled`).
- `src/features/tratos/pages/TratoDetailPage.tsx` — **refactor mayor**: convertir a layout tabbed con `useTabSync(['info', 'tareas'], 'info')`, tab `info` = campos actuales, tab `tareas` = `<TratoTareasTab tratoId={id} />` + badge de pendientes en trigger.

---

## Approaches

### 1. Hook `useTareas` paramétrico (homologa `useTratos`)

- `GET /tareas?estado=&prioridad=&responsable_id=&trato_id=` con filtros server-side en el handler MSW.
- Para el tab de TratoDetailPage: `useTareas({ trato_id: id })` (reutiliza el mismo hook, sin duplicar).
- **Pros**: una sola fuente de verdad; invalidación uniforme; homologa perfectamente con el patrón establecido.
- **Cons**: el handler MSW necesita `GET /tareas` nuevo (bajo costo).
- **Effort**: Low.

### 2. Endpoints separados: `GET /tareas` + `GET /tratos/:id/tareas`

- El tab TratoDetailPage consumiría `GET /tratos/:id/tareas` (ya existe); la página principal consumiría `GET /tareas`.
- **Pros**: el handler del tab no requiere cambios.
- **Cons**: dos hooks diferentes para listar tareas; invalidación asimétrica (al crear una tarea habría que invalidar ambos namespace). Rompe homologación con tratos (que ya migró a hook paramétrico único).
- **Effort**: Low (pero introduce deuda).

**Recomendación**: Approach 1 — hook paramétrico único. El costo de agregar `GET /tareas` al handler es mínimo y el beneficio de invalidación uniforme es alto.

### Sub-decisión: filtro vencimiento

| Opción | Descripción | Effort |
|---|---|---|
| **A**: Client-side | Filtrar en la tabla con `Date.now()` — simple, sin tocar handler | Low |
| **B**: Server-side (handler MSW) | Agregar lógica de comparación en `GET /tareas` | Low-Medium |

Recomendado **B** para coherencia con el resto de filtros server-side, pero dado que `fecha_limite` es un string ISO, se puede hacer con comparación simple en el handler.

---

## Recommendation

**Approach 1** (hook paramétrico único + `GET /tareas` server-side) con filtro de vencimiento server-side en el handler MSW.

Razones:
1. Homologación perfecta con el patrón `useTratos` — el equipo ya conoce el patrón.
2. El handler `GET /tareas` es un `http.get` nuevo simple (~20 líneas) — no modifica nada existente.
3. Invalidación con `tareasKeys.all` (prefix match) cubre tanto el listado global como el tab del trato sin configuración extra.
4. `useCompletarTarea` homologa con `useGanarTrato` — la plantilla está disponible.
5. El refactor de `TratoDetailPage` a tabs es el trabajo más sustancial del Change 6b, pero el patrón está completamente documentado en `ClienteDetailPage`.

---

## Risks

1. **Fixture insuficiente**: Las 2 tareas actuales no cubren los filtros. Se necesita expandir `tareasFixture` antes de que los tests sean útiles. Si se deja para el apply, los tests de filtros fallarán por datos insuficientes.

2. **Refactor TratoDetailPage — regresión de tests**: `src/features/tratos/__tests__/TratoDetailPage.test.tsx` testea el layout actual (sin tabs). El refactor a tabs requiere actualizar los tests existentes. En Strict TDD esto implica reescribir los tests PRIMERO.

3. **Badge de tareas pendientes — reactividad**: El badge en el `<TabsTrigger value="tareas">` debe actualizarse cuando se completa o crea una tarea. Esto requiere que `useCompletarTarea` invalide también `tareasKeys.byTrato(trato_id)` o que el badge use el mismo query que el tab. Si el badge tiene su propia query, puede desincronizarse. Mitigación: usar el mismo `useTareas({ trato_id, estado: 'pendiente' })` para el badge y para el tab (o derivar el count del query del tab).

4. **Icono de Sidebar no confirmado**: Lucide-react íconos candidatos (`ClipboardList`, `ListTodo`, `CheckSquare`) pueden no estar disponibles en la versión instalada. En sdd-design/tasks confirmar con la versión de lucide-react del `package.json`.

5. **Filtro `trato_id` en listado global requiere label**: El Select de `trato_id` en la página de tareas necesita mostrar el `nombre` del trato, no el UUID. Esto implica un query adicional `useTratos()` (sin filtros) para resolver los nombres — mismo patrón que `TratosListPage` usa con `useClientes()` y `useProspectos()`.

6. **`trato_id` obligatorio en Tarea**: El campo no es nullable. Toda tarea creada desde la página global `/tareas` DEBE tener un trato seleccionado. El form de creación debe incluir un Select de trato requerido — no es opcional.

---

## Ready for Proposal

**Sí.** Toda la información necesaria está capturada:

- Auth/current-user: resuelto — `useAuthStore((s) => s.usuario?.id)` es el `responsable_id` del usuario logueado.
- Contrato API: verificado campo a campo, sin sorpresas.
- Handler MSW: 5/6 endpoints existen; solo falta `GET /tareas`.
- Fixture: insuficiente para filtros — necesita expansión planificada.
- Patrones de homologación: `useTratos`, `TratoEstadoMenu`, `ClienteDetailPage` (tabs), `TratosListPage` (filtros) son plantillas directas.
- Brechas acotadas: `GET /tareas` handler, fixture expansion, `TratoDetailPage` refactor a tabs.
- Riesgos enumerados con mitigaciones concretas.

**Sugerencia**: continuar con `sdd-propose` para fijar scope formal, ADRs candidatas (ADR-047 para `TareaEstadoMenu`, ADR-048 para `useTareas` paramétrico) y plan de rollback. Pausa Interactive al cierre de propose antes de spec/design.
