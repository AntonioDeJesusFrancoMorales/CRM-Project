# Exploración: clientes-management (Change 5)

> Fecha: 2026-05-23  
> Modo: hybrid (openspec/ + engram)  
> Strict TDD: ACTIVO — test runner: `pnpm test:run`

---

## Estado actual del sistema

### Contrato API (`src/api/types.ts`)

**`Cliente` — campos verificados:**

| Campo | Tipo | Notas |
|---|---|---|
| `id` | `string` | UUID |
| `empresa_id` | `string` | FK obligatorio |
| `responsable_id` | `string` | FK obligatorio |
| `creado_por` | `string` | FK obligatorio |
| `nombre_contacto` | `string` | Obligatorio |
| `correo_contacto` | `string \| null` | Opcional |
| `telefono_contacto` | `string \| null` | Opcional |
| `cargo_contacto` | `string \| null` | Opcional |
| `como_nos_conocio` | `ComoNosConocio \| null` | Opcional — `'referido' \| 'redes_sociales' \| 'busqueda' \| 'evento' \| 'otro'` |
| `notas` | `string \| null` | Opcional |
| `prospecto_origen_id` | `string \| null` | FK de trazabilidad. Null = creación manual |
| `creado_en` | `string` | ISO 8601 |
| `actualizado_en` | `string` | ISO 8601 |

**`Trato` — `cliente_id` es `string | null`.** El campo existe. El handler MSW de `GET /tratos` ya filtra por `cliente_id` como query param.

**`EstadoPosibleCliente`** ya incluye `'convertido'` — no necesita modificación.

**`ComoNosConocio`** es un tipo union string — `'referido' | 'redes_sociales' | 'busqueda' | 'evento' | 'otro'`. No hay `'manual'`; el origen manual se expresa como `prospecto_origen_id = null`.

---

### MSW Handlers actuales

#### `src/mocks/handlers/clientes.ts`
Usa `makeCrudHandlers<Cliente>` que genera:
- `GET /api/v1/clientes` — lista completa (sin filtros por query param)
- `GET /api/v1/clientes/:id` — por id (ya existe)
- `POST /api/v1/clientes` — crea. **Nota**: fija `prospecto_origen_id: null`, no permite pasarlo. Adecuado para creación manual.
- `PATCH /api/v1/clientes/:id` — actualiza (spread + `actualizado_en`)
- `DELETE /api/v1/clientes/:id` — **ELIMINA SIN VALIDAR tratos asociados** — NO tiene lógica de bloqueo 409.

También tiene:
- `GET /api/v1/clientes/:id/tratos` — filtra `tratosFixture` por `cliente_id`. **Ya existe.**

**Gaps identificados:**
1. `DELETE /api/v1/clientes/:id` no tiene validación 409 cuando hay tratos asociados. Debe agregarse un handler custom (override del genérico) similar a cómo tratos sobreescribe el GET con filtros.
2. `GET /api/v1/clientes` no tiene filtros por query param (`empresa_id`, `origen`). Debe agregarse handler custom con filtros client-side de MSW.

#### `src/mocks/handlers/tratos.ts`
`GET /api/v1/tratos` ya soporta filtro por `cliente_id` como query param. El hook `useTratosByCliente` puede usar este endpoint con `?cliente_id=X`.

**ALTERNATIVA al endpoint `/clientes/:id/tratos`:** el handler de ese endpoint ya existe en `clientes.ts`. Ambas opciones son válidas. Se recomienda usar `/clientes/:id/tratos` para consistencia con el patrón de prospectos.

#### `src/mocks/handlers/prospectos.ts`
El handler `POST /prospectos/:id/convertir` crea un `Cliente` correctamente con `prospecto_origen_id` seteado. **Seguirá funcionando sin cambios** — solo agrega el cliente al `clientesFixture` array compartido.

#### `src/mocks/fixtures/clientes.ts`
4 clientes de fixture: 2 con `prospecto_origen_id = null` (origen manual), 2 con FK a prospectos b4444444 y b5555555. El fixture con tratos vinculados: `c1111111` tiene 1 trato (`d2222222`) y `c2222222` tiene 1 trato (`d3333333`). El cliente `c3333333` (Valentina Cruz, prospecto b4444444) y `c4444444` (Marco Herrera, prospecto b5555555) no tienen tratos.

---

### Hook a migrar

**`src/features/prospectos/hooks/useClientes.ts`** — hook temporal documentado como "Change 5 lo moverá".

**Consumidores actuales:**
- `src/features/prospectos/pages/ProspectosListPage.tsx` — importa con path relativo `'../hooks/useClientes'`. **Este import se romperá** cuando el hook migre.
- `src/features/prospectos/hooks/useConvertirProspecto.ts` — **NO usa `useClientes`**. Solo invalida `['clientes']` como query key. No necesita cambios de import.

El `ConvertirProspectoDialog.tsx` **no importa `useClientes`** — usa solo `useConvertirProspecto`. La suposición en el brief era incorrecta.

**Import que debe actualizarse post-migración:**
```
// ProspectosListPage.tsx línea 22 — cambiar de:
import { useClientes } from '../hooks/useClientes';
// a:
import { useClientes } from '@/features/clientes/hooks/useClientes';
```

---

### Routing

**`src/routes/router.tsx`:**
- `{ path: 'clientes', element: <ClientesPlaceholder /> }` — placeholder activo
- No existe `clientes/:id` — debe agregarse
- No existe `clientes/nuevo` — debe agregarse (la decisión fue `/clientes/nuevo` como page dedicada)

**`src/routes/placeholders.tsx`:**
- `ClientesPlaceholder` está definido y referenciado. Debe eliminarse y reemplazarse con imports reales.

---

### Sidebar

**`src/components/layout/Sidebar.tsx` — línea 18:**
```typescript
{ label: 'Clientes', to: '/clientes', icon: Users, disabled: true, badge: 'Próximamente' },
```
Para habilitar: eliminar `disabled: true, badge: 'Próximamente'` del objeto.

---

## Áreas afectadas

| Archivo/Directorio | Acción requerida |
|---|---|
| `src/features/clientes/` | CREAR — feature completa (hooks, components, pages, schemas) |
| `src/features/prospectos/hooks/useClientes.ts` | MOVER a `src/features/clientes/hooks/useClientes.ts` + extender |
| `src/features/prospectos/pages/ProspectosListPage.tsx` | Actualizar import de `useClientes` |
| `src/mocks/handlers/clientes.ts` | Agregar filtros a GET, agregar validación 409 a DELETE |
| `src/routes/router.tsx` | Wirear `clientes`, `clientes/:id`, `clientes/nuevo` |
| `src/routes/placeholders.tsx` | Eliminar `ClientesPlaceholder` |
| `src/components/layout/Sidebar.tsx` | Quitar `disabled + badge` del item Clientes (línea 18) |

---

## Estructura propuesta de la feature

```
src/features/clientes/
├── hooks/
│   ├── useClientes.ts         (migrado + extendido)
│   ├── useCliente.ts          (GET /clientes/:id)
│   ├── useCreateCliente.ts
│   ├── useUpdateCliente.ts
│   ├── useDeleteCliente.ts
│   └── useTratosByCliente.ts  (GET /clientes/:id/tratos)
├── schemas/
│   └── cliente.schema.ts      (Zod — similar a prospecto pero sin estado_posible_cliente)
├── components/
│   ├── ClientesTable.tsx       (tabla filtrable — homologada con EmpresasTable)
│   ├── ClienteFormDialog.tsx   (create/edit — homologado con EmpresaFormDialog/ProspectoFormDialog)
│   ├── ClienteForm.tsx         (form RHF+Zod — homologado)
│   ├── ClienteDeleteDialog.tsx (bloqueo 409 — homologado con delete patterns)
│   ├── ClienteInfoTab.tsx      (presentacional — homologado con ProspectoInfoTab)
│   └── ClienteTratosTab.tsx   (presentacional — homologado con ProspectoTratosTab)
└── pages/
    ├── ClientesListPage.tsx    (tabla + filtros — homologada con EmpresasListPage)
    ├── ClienteDetailPage.tsx   (detalle con tabs — homologada con ProspectoDetailPage)
    └── ClienteCreatePage.tsx   (page dedicada en /clientes/nuevo)
```

---

## Patrones documentados a reutilizar

### 1. Zod schema — `cliente.schema.ts`

Similar a `prospecto.schema.ts` con diferencias:
- **Sin** `estado_posible_cliente` (los clientes no tienen estado pipeline)
- **Sin** `empresa_id` como requerido en el schema de form — se selecciona con Select igual que prospecto
- `como_nos_conocio` es `.enum([...]).optional()` — **GOTCHA WARN-03**: en Zod v4 + `@hookform/resolvers@5`, el campo opcional con enum debe declararse como `.optional()` (no `.default()`). El prospecto ya lo hace correctamente con `.optional()` + `value={field.value ?? ''}` en el Select.

### 2. Query keys — `clientesKeys`

Patrón idéntico a `empresasKeys`:
```typescript
export const clientesKeys = {
  all: ['clientes'] as const,
  list: () => ['clientes'] as const,
  detail: (id: string) => ['clientes', id] as const,
  tratos: (id: string) => ['clientes', id, 'tratos'] as const,
};
```
Nota: `useConvertirProspecto` invalida `['clientes']` hardcodeado — al crear `clientesKeys.list()` que devuelve `['clientes']`, la invalidación existente seguirá siendo compatible.

### 3. Nombre clickeable en tabla

`EmpresasTable` usa `<button type="button" onClick={() => onView(empresa)}>` para el nombre clickeable. El mismo patrón aplica para `ClientesTable`. No usar `Link` dentro de `TableRow` que ya es clicable (nested `<a>` / botones gotcha de Change 4).

### 4. Hook de lazy loading para tab Tratos

Idéntico a `useProspectoTratos` — `enabled` prop para activar fetch solo cuando el tab está activo (ADR-027).

### 5. Delete con bloqueo 409

`useDeleteCliente` debe manejar 409 en `onError`:
```typescript
onError: (error) => {
  if (isHttpError(error) && error.status === 409) {
    toast.error(`No se puede eliminar, tiene N tratos asociados. Resuelve los tratos primero.`);
    return;
  }
  // fallback genérico
}
```
El MSW handler de DELETE debe agregar validación custom para 409 cuando hay tratos vinculados.

### 6. Badge `prospecto_origen_id` en detalle

En `ClienteDetailPage`, el header mostrará un badge/enlace:
- Si `cliente.prospecto_origen_id != null` → `<Link to={'/prospectos/${cliente.prospecto_origen_id}'}>Origen: Prospecto convertido</Link>`
- Si `null` → texto `Origen: Manual`

---

## Gaps en MSW que deben llenarse

| Gap | Archivo | Descripción |
|---|---|---|
| DELETE sin 409 | `clientes.ts` | Agregar handler custom con validación de tratos vinculados |
| GET lista sin filtros | `clientes.ts` | Agregar filtros por `empresa_id` y `origen` (prospecto/manual) |
| Fixture de tratos por cliente | `tratos.ts` | Ya existe — `c1111111` → 1 trato, `c2222222` → 1 trato |

---

## Patrones de testing

### Tests de hook (patrón de `useCreateEmpresa.test.tsx`, `useDeleteEmpresa.test.tsx`)
- `renderHook` + `setupTestWrapper()`
- `server.use(...)` para sobrescribir handlers en escenarios de error
- `waitFor(() => expect(result.current.isSuccess).toBe(true))`

### Tests de page integration (patrón de `EmpresasListPage.test.tsx`, `ProspectosListPage.test.tsx`)
- `render(<Page />, { wrapper: Wrapper })`
- `waitFor` para esperar a que el fetch MSW resuelva
- `userEvent` para interacciones

### Tests de page con routing (patrón de `EmpresaDetailPage.test.tsx`)
- Renderiza con `MemoryRouter` + `Routes` + `Route` path param
- Testea redirección 404

### WARN-TDD: Zonas que requerirán atención en Strict TDD
1. **`ClienteCreatePage`** — page nueva sin referencia directa. Difícil escribir RED test sin saber exactamente qué campos valida el form (depende del schema que se diseñe).
2. **Badge `prospecto_origen_id`** — requiere datos relacionados (prospectos fixture) en el test de detalle.
3. **Delete con 409** — el test necesita un cliente fixture con tratos para triggear el 409.

---

## Riesgos identificados

| # | Riesgo | Impacto | Mitigación |
|---|---|---|---|
| R1 | **Cirugía cross-feature** — migrar `useClientes.ts` de `prospectos/` a `clientes/` rompe el import en `ProspectosListPage.tsx` | Alto (falla en tests y runtime) | Actualizar el import en `ProspectosListPage.tsx` como parte de la misma tarea de migración |
| R2 | **Zod v4 + `como_nos_conocio` optional** — en Zod v4 `.optional()` en enums puede comportarse distinto al esperado con RHF resolver v5 | Medio | Usar exactamente el mismo patrón que `prospecto.schema.ts` — ya funciona en producción |
| R3 | **MSW delete sin 409** — el handler DELETE actual de clientes elimina sin validar | Alto (el mock no simula la realidad del diseño) | Agregar handler custom que sobreescriba el genérico de `makeCrudHandlers` |
| R4 | **`clientesKeys.list()` = `['clientes']`** — `useConvertirProspecto` invalida con `['clientes']` hardcodeado. Si se cambia la estructura de la key, se rompe la invalidación post-conversión | Bajo | Mantener `clientesKeys.list()` retornando `['clientes'] as const` para compatibilidad |
| R5 | **`ClienteCreatePage` vs Dialog** — la decisión fue `/clientes/nuevo` como page dedicada (no dialog). Es un patrón diferente al de empresas y prospectos que usan Dialog en la ListPage. Mayor superficie de código y tests | Medio | Documentar en design que `ClienteCreatePage` es page, no dialog. En sdd-tasks separar como tarea independiente. |
| R6 | **Nested link en detalle header** — el badge de `prospecto_origen_id` es un `<Link>`. Si el header ya tiene otros elementos interactivos (Editar, Eliminar), no hay riesgo de anidamiento, pero hay que verificar que no quede dentro de otro `<a>` | Bajo | Revisar estructura del header en sdd-design |

---

## Enfoques explorados

### Opción A — Page dedicada `/clientes/nuevo` (decisión ya tomada)
- Pros: URL bookmarkeable, coherente para flujos de onboarding largo, fácil de navegar con botón Back
- Cons: Más archivos (una page adicional), el router necesita una ruta más
- Esfuerzo: Medio

### Opción B — Dialog en ListPage (como Empresas/Prospectos)
- Pros: Menos código, misma UX que el resto del CRM
- Cons: No coherente con la decisión pre-explore, pierde bookmarkeability
- Esfuerzo: Bajo

La decisión ya está tomada: **Opción A**.

---

## Recomendación

La arquitectura es clara y los patrones están establecidos. La exploración no descubrió bloqueantes — solo un gap en el MSW handler de DELETE (sin 409) y la necesidad de actualizar el import de `useClientes` en `ProspectosListPage`. Ambos son conocidos y manejables.

**Listo para propuesta**: Sí. El `sdd-propose` puede arrancar con los datos de esta exploración.

---

## Archivos de referencia clave

- `src/features/empresas/` — template CRUD completo a homologar
- `src/features/prospectos/components/ProspectoInfoTab.tsx` — template InfoTab
- `src/features/prospectos/components/ProspectoTratosTab.tsx` — template TratosTab
- `src/features/prospectos/pages/ProspectoDetailPage.tsx` — template DetailPage con badge estado
- `src/mocks/handlers/clientes.ts` — handler actual a extender
- `src/mocks/utils/crud.ts` — `makeCrudHandlers` factory
- `src/mocks/utils/error.ts` — `errors.` helpers (para agregar 409 custom)
- `src/routes/router.tsx` — router a actualizar
- `src/components/layout/Sidebar.tsx` línea 18 — item Clientes a habilitar
