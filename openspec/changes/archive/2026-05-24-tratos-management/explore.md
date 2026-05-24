# Exploration — tratos-management (Change 6a)

**Fecha**: 2026-05-24 (America/Mexico_City)
**Persistencia**: hybrid (este archivo + engram `sdd/tratos-management/explore`)
**Alineación previa**: engram `sdd/tratos-management/alignment` (#176)

---

## Current State

### Contrato API (`src/api/types.ts`)

- `Trato` (líneas 68-82): incluye `prospecto_id: string | null`, `cliente_id: string | null` (polimorfismo nullable explícito), `estado: EstadoTrato`, `motivo_perdida: string | null`, más campos opcionales (`valor_estimado`, `probabilidad`, `fecha_cierre_esperada`, `tipo_contrato`).
- `EstadoTrato` (línea 8): `'abierto' | 'ganado' | 'perdido'`.
- `TipoContrato` (línea 7): `'precio_fijo' | 'tiempo_materiales' | 'retainer'`.
- `Tarea` (líneas 84-97) y `EstadoTarea` ya existen — relevante solo para validar DELETE 409 desde Tratos (consumir contrato, NO implementar UI de Tareas en este Change).

### MSW handler (`src/mocks/handlers/tratos.ts`)

Ya implementa **mucho** del backend mock necesario:

| Endpoint | Estado |
|---|---|
| `GET /tratos` con filtros `estado`, `responsable_id`, `prospecto_id`, `cliente_id` | ✅ Implementado |
| `POST /tratos` (vía `makeCrudHandlers`) | ✅ Implementado, fuerza `estado: 'abierto'` y `motivo_perdida: null` en creación |
| `GET /tratos/:id` | ✅ Implementado |
| `PATCH /tratos/:id` | ✅ Implementado |
| `DELETE /tratos/:id` | ✅ Implementado, **sin override 409 si hay tareas asociadas** |
| `PATCH /tratos/:id/ganar` | ✅ Implementado |
| `PATCH /tratos/:id/perder` | ✅ Implementado, valida `motivo_perdida` requerido y devuelve 422 si falta |
| `GET /tratos/:id/tareas` | ✅ Implementado (read-only) |

**Brecha clave**: `DELETE /tratos/:id` actualmente borra sin verificar tareas. Hay que override-ar para devolver `409 Conflict` cuando el trato tiene tareas asociadas (mismo patrón que Change 5 hizo con `DELETE /clientes/:id` si hay tratos).

**Fixture tareas** (`src/mocks/fixtures/tareas.ts`): hay 2 tareas para el trato `d1111111-dddd-1111-dddd-111111111111`. Sirve directamente para validar el caso 409 sin crear fixtures adicionales.

### Routing (`src/routes/router.tsx`)

- Línea 36: `{ path: 'tratos', element: <TratosPlaceholder /> }` — placeholder activo.
- **Falta**: ruta `tratos/:id` para detalle.
- `TratosPlaceholder` (`src/routes/placeholders.tsx:22-28`) describe el alcance original ("Tratos y tareas asociadas. Acciones para ganar/perder tratos y completar tareas") — al partir en 6a/6b el placeholder mencionado se reemplaza con `TratosListPage`.

### Sidebar (`src/components/layout/Sidebar.tsx`)

- Línea 19: `{ label: 'Tratos', to: '/tratos', icon: Handshake, disabled: true, badge: 'Próximamente' }` — confirma **patrón recurrente #155**. Tarea explícita requerida en `sdd-tasks`.

### Feature `src/features/tratos/`

- **No existe**. Greenfield total.

### Hook a migrar: `src/features/clientes/hooks/useTratosByCliente.ts`

```ts
// Estado actual — acoplamiento con clientesKeys
export function useTratosByCliente(id: string | undefined) {
  return useQuery<Trato[]>({
    queryKey: clientesKeys.tratos(id ?? ''),  // ← key bajo namespace 'clientes'
    queryFn: () => apiClient.get<Trato[]>(`/clientes/${id}/tratos`),
    enabled: !!id,
  });
}
```

- Usado por `ClienteTratosTab.tsx` (línea 97).
- `clientesKeys.tratos(id)` vive en `useClientes.ts:13` → namespace `['clientes', id, 'tratos']`.

**Decisión arquitectónica para sdd-design**: al migrar a `src/features/tratos/hooks/useTratos.ts`, **NO mantener** `clientesKeys.tratos`. Cambiar a un hook paramétrico `useTratos({ cliente_id?, prospecto_id?, estado? })` que use `GET /tratos?cliente_id={id}` (el handler MSW ya lo soporta) y queryKey `['tratos', { cliente_id: id }]`. Eliminar `clientesKeys.tratos` y el endpoint `/clientes/:id/tratos` deja de usarse desde el frontend (el handler MSW puede mantenerse hasta limpieza posterior — backend reportedly lo expone). Esto **homologa con `useClientes`/`useEmpresas`** y rompe el acoplamiento cruzado de features.

### Patrón homologado: feature clientes/

Estructura plana, claramente reutilizable:

```
features/clientes/
├── hooks/         useClientes, useCliente, useCreate/Update/DeleteCliente, useTratosByCliente
├── components/    ClientesTable, ClienteForm, ClienteCreate/Edit/DeleteDialog,
│                  ClienteOrigenBadge, ClienteInfoTab, ClienteTratosTab
├── pages/         ClientesListPage, ClienteDetailPage
├── schemas/       cliente.schema.ts (Zod)
└── __tests__/     un test por hook + pages
```

Convenciones confirmadas:
- `ClienteForm` es presentational compartido entre Create/Edit (ADR-035 referenciado en código).
- Detalle con tabs: `<Tabs defaultValue="info">` con `<TabsList>` + `<TabsContent>` (lazy load por montaje — ADR-036 — para tabs pesados).
- Delete: lógica 204/409 vive en la página (`ClienteDetailPage.handleConfirmDelete`), NO en el dialog. 409 muestra toast con `err.message` del backend.
- Search por nombre = client-side; filtros server-side van en `useClientes` con `queryKey: ['clientes', { filters }]` para refetch al cambiar.
- Schemas Zod: nullables en API → `.optional().or(z.literal(''))` para forms; defaults explícitos en `*_EMPTY_DEFAULTS`.

### WARN-05: `<a>` anidado (`src/features/prospectos/components/ProspectoConvertidosList.tsx`)

Líneas 41-66 — confirmado:

```tsx
<Link to={`/prospectos/${item.prospecto.id}`} className="...">  // outer <a>
  ...
  <Link to={`/empresas/${item.empresa.id}`} onClick={(e) => e.stopPropagation()}>  // inner <a> → HTML inválido
    {item.empresa.nombre}
  </Link>
  ...
</Link>
```

El comentario en líneas 35-38 menciona "patrón Option B" usando `stopPropagation` para el handler de click, pero `stopPropagation` **NO arregla** el HTML anidado — solo evita la doble navegación. El warning persiste porque `<a>` dentro de `<a>` es HTML inválido por spec.

**Fix candidato**: convertir el `<Link>` interior en un `<button>` con `onClick={(e) => { e.stopPropagation(); navigate('/empresas/...'); }}` y `role="link"` para semántica, O extraer la fila para que el link de empresa quede fuera del wrapper `<Link>` (rediseño del row). Decisión final en `sdd-design`.

### Componentes UI faltantes

- **No existe** `Combobox` / `Autocomplete` / `Command` en `src/components/ui/`. Para el toggle Cliente/Prospecto necesitaremos decidir UX:
  - **A**: dos `<Select>` shadcn condicionales (uno aparece según el toggle), cargando todo el listado del lado seleccionado.
  - **B**: agregar shadcn `Command` (Popover + Input filter) — net-new, ~3 archivos.

Si el universo de clientes+prospectos es chico (<100), **A es suficiente y más rápido**. B se justifica solo si volumen escala.

---

## Affected Areas

### A crear (greenfield Change 6a)

- `src/features/tratos/` — feature completo (greenfield)
  - `schemas/trato.schema.ts` — Zod con XOR cliente_id/prospecto_id (`superRefine`) y validación condicional `motivo_perdida` required si `estado='perdido'`.
  - `hooks/useTratos.ts` — list paramétrico (cliente_id, prospecto_id, estado, responsable_id).
  - `hooks/useTrato.ts` — detail.
  - `hooks/useCreateTrato.ts`, `useUpdateTrato.ts`, `useDeleteTrato.ts` — mutaciones con invalidación.
  - `hooks/useGanarTrato.ts`, `usePerderTrato.ts` — mutaciones de cambio de estado.
  - `pages/TratosListPage.tsx`, `pages/TratoDetailPage.tsx`.
  - `components/TratosTable.tsx`, `TratoForm.tsx`, `TratoCreate/Edit/DeleteDialog.tsx`, `TratoEstadoBadge.tsx`, `TratoEstadoMenu.tsx` (inline state change), `TratoPerderDialog.tsx` (modal motivo_perdida).
  - `__tests__/` — Strict TDD: un test por hook y página antes de la implementación.

### A modificar

- `src/routes/router.tsx` — agregar `tratos/:id`; reemplazar `TratosPlaceholder` por `TratosListPage`.
- `src/routes/placeholders.tsx` — eliminar `TratosPlaceholder` (queda solo `TablerosPlaceholder` para Change 7).
- `src/components/layout/Sidebar.tsx` — línea 19, quitar `disabled: true, badge: 'Próximamente'` del item Tratos (patrón #155).
- `src/mocks/handlers/tratos.ts` — agregar override `DELETE /tratos/:id` → 409 si hay tareas asociadas (consulta a `tareasFixture`).
- `src/features/clientes/hooks/useTratosByCliente.ts` — **eliminar** tras migrar consumidor.
- `src/features/clientes/hooks/useClientes.ts` — eliminar `clientesKeys.tratos`.
- `src/features/clientes/components/ClienteTratosTab.tsx` — consumir `useTratos({ cliente_id })` desde `features/tratos/hooks/`, agregar:
  - Botón "Crear trato" (header del tab) con prefill `cliente_id` (UX deferida Change 5).
  - Link en nombre de trato → `/tratos/:id` (homologación tablas clickeables).
- `src/features/prospectos/components/ProspectoConvertidosList.tsx` — fix WARN-05 + agregar link al cliente convertido y a sus tratos (UX deferida Change 5).

### A reescribir tests previos

- `src/features/clientes/__tests__/useTratosByCliente.test.tsx` — eliminar (hook migrado).
- `src/features/clientes/__tests__/ClienteDetailPage.test.tsx` — actualizar imports si el tab cambia su API.
- Si MSW handlers de tratos cambian (DELETE 409), agregar tests a `src/mocks/handlers/__tests__/tratos.handler.test.ts` (no existe aún).

---

## Approaches

### 1. **Hook paramétrico único `useTratos({ filters })`** + migración de useTratosByCliente al mismo

- **Pros**: una sola fuente de verdad para todos los listados de tratos (página principal, tab del cliente, futuro tab del prospecto). Homologa con `useClientes(filters)`. Permite invalidación uniforme con prefix matching (`['tratos']`).
- **Cons**: refactor del consumidor existente (`ClienteTratosTab`). Tests del hook viejo se eliminan.
- **Effort**: Low (el handler MSW ya soporta los filtros).

### 2. Mantener `useTratosByCliente` separado + crear `useTratos` solo para la página principal

- **Pros**: cero refactor del consumidor existente. Cambio mínimo.
- **Cons**: dos hooks haciendo lo mismo. Acoplamiento cruzado `clientes → tratos` permanece. Rompe el patrón establecido en Change 5 (migración limpia de `useClientes`).
- **Effort**: Low.

### 3. Hook paramétrico + endpoint dedicado `/clientes/:id/tratos` (mantener ambos endpoints)

- **Pros**: backend reportedly expone ambos endpoints, así que mantenerlos es válido.
- **Cons**: confusión sobre cuál usar; sin valor agregado para el frontend.
- **Effort**: Medium.

### Polimorfismo Cliente/Prospecto en form — sub-decisión UX

| Opción | Descripción | Effort |
|---|---|---|
| **A**: doble Select condicional | Toggle radio elige tipo; aparece un `<Select>` con todos los clientes O prospectos. Simple, sin nueva dependencia. | Low |
| **B**: Combobox shadcn (Popover + filtro) | UX premium con filtrado in-place. Requiere agregar componente shadcn `Command`. | Medium |

Recomendado **A** para Change 6a (volumen actual bajo). B queda para iteración futura si crece la base.

### Cambio de estado inline — sub-decisión UX

| Opción | Descripción |
|---|---|
| **DropdownMenu en cada fila de tabla** + botones en detalle | Acción rápida desde la tabla; coherente con el patrón observado en muchas tablas CRUD. |
| **Botones solo en detalle** | Más fricción pero más explícito; menos espacio en tabla. |
| **Inline Select en columna estado** | Edición en línea; cómodo pero ruidoso visualmente. |

Recomendado **DropdownMenu en fila + botones en detalle**. Al cambiar a 'perdido' (en cualquier ubicación), abre `TratoPerderDialog` con textarea obligatorio.

---

## Recommendation

**Approach 1** (hook paramétrico único) + opción A (doble Select condicional) + DropdownMenu para cambio de estado inline.

Razones:
1. Homologa con el patrón de Change 5 (migración limpia de hooks) — el usuario fue explícito sobre evitar romper homologación.
2. Effort total Low/Medium — sin componentes shadcn nuevos (el UX de Command queda para iteración si se valida con el usuario).
3. El handler MSW ya soporta todos los filtros (`?cliente_id=&prospecto_id=&estado=`) — cero trabajo backend mock adicional.
4. `useDeleteCliente.ts` es plantilla directa para `useDeleteTrato.ts` (manejo 409 idéntico).
5. `ClienteForm` + tabs detail es plantilla directa para `TratoForm` y `TratoDetailPage`.

---

## Risks

1. **Net-new pattern: XOR Zod refine** — el polimorfismo cliente_id/prospecto_id requiere validación cruzada vía `.superRefine()` o `.refine()` con check de exactamente-uno-no-vacío. No hay precedente exacto en el proyecto. Riesgo de Zod inputs/outputs divergiendo si no se modela bien. **Mitigación**: sdd-design debe incluir ADR específica con el schema completo.

2. **WARN-05 fix conceptual, no cosmético** — requiere replantear si el componente externo o el interno cambia de `<Link>` a otra cosa. **Mitigación**: sdd-design decide cuál cambia y por qué; agregar test para validar HTML sin nesting.

3. **Migración useTratosByCliente con consumidor activo** — `ClienteTratosTab` está ya en producción (Change 5). El refactor debe ser atómico en un commit (siguiendo el patrón ADR-032 de Change 5 al migrar `useClientes`). Si se separa, hay window de tests fallidos.

4. **Sobrescritura del Placeholder + UX deferida en mismo Change** — son 3 mejoras UX (link cliente↔tratos, prospecto convertido → cliente, botón crear trato en tab cliente). Cada una toca un archivo distinto. Riesgo de creep: sdd-tasks debe etiquetar cada una como tarea separada para no esconder scope.

5. **DELETE 409 override en MSW** — `makeCrudHandlers` genera DELETE por defecto. Hay que sobrescribirlo (no agregar — sobrescribir). Patrón a seguir: el override de DELETE en `src/mocks/handlers/__tests__/clientes.handler.test.ts` indica que esto es conocido del codebase pero hay que verificar **cómo** se montó el override en `clientes.ts` (probablemente posicional en el array).

6. **No-test del Sidebar** — pattern #155 advierte que tests de integración con `MemoryRouter` NO detectan el bug de sidebar disabled. Strict TDD no captura esto. **Mitigación**: tarea explícita en sdd-tasks + smoke manual al cierre.

---

## Ready for Proposal

**Yes.** Toda la información necesaria está capturada:

- Contrato API verificado y completo.
- Backend mock 80% listo (falta solo override DELETE 409).
- Patrones de homologación identificados (5 archivos clientes son plantilla directa).
- Brechas net-new claramente acotadas: Zod XOR refine, modal motivo_perdida, dropdown estado inline, WARN-05 fix.
- Migración del hook tiene plan claro (atómica, commit estilo ADR-032).
- Riesgos enumerados con mitigaciones concretas.

**Sugerencia al orquestador**: continuar con `sdd-propose` para fijar scope, justificación, rollback plan, y ADRs candidatas. Las decisiones UX sub-pendientes (doble Select vs Combobox, DropdownMenu fila vs solo detalle) caen naturalmente en sdd-design, no en propose.

**Pausa Interactive sugerida**: al cierre de propose para confirmar scope antes de spec/design.
