# Exploración: prospectos-crud (Change 4)

**Fecha**: 2026-05-22 (America/Mexico_City)
**Persistencia**: hybrid (openspec/ + engram)
**Strict TDD**: activo (en Apply/Verify, no en Explore)

---

## Contexto

Este Change implementa la gestión completa de prospectos en el CRM Pipely. Actualmente `/prospectos` muestra un placeholder (Change 4 pendiente). El contrato de datos y los handlers MSW ya existen, pero requieren extensiones para soportar el flujo de conversión definitivo y la UX Kanban.

---

## Decisiones de entrada (del usuario)

Tomadas tras dos rondas de alineación antes de esta exploración. Son input fijo — no se re-cuestionan.

1. **Layout = Kanban por `estado_posible_cliente`**
   - Columnas fijas: `frio` / `tibio` / `caliente` (sin acentos, tal como están en el enum).
   - Cards con datos clave. NO se replica la tabla densa de Empresas/Usuarios.
   - Cambio de estado in-place: Select inline desde la card.
   - Tab nivel-superior "Activos / Convertidos".

2. **Filtros top-bar**: búsqueda por `nombre_contacto` (client-side) + Select de responsable (server-side via `responsable_id`) + toggle "solo míos" (prefiltra `responsable_id = usuario_actual`).
   - El filtro por estado queda eliminado (redundante con Kanban). A confirmar formalmente en design.

3. **Crear = solo desde `/prospectos`**. Botón "Nuevo prospecto" arriba del Kanban.

4. **Conversión a cliente = enfoque híbrido** con cambios al contrato:
   - Agregar `'convertido'` a `EstadoPosibleCliente`.
   - Agregar `prospecto_origen_id: string | null` a `Cliente`.
   - El handler POST convertir actualiza el prospecto (estado + `actualizado_en`) Y crea el cliente con `prospecto_origen_id`.
   - Post-conversión: prospecto sigue existible en estado `'convertido'` con badge.
   - Tab "Convertidos" separado en el Kanban (NO 4ta columna activa).
   - Sub-sección colapsable "Ver convertidos anteriores".

5. **Página de detalle `/prospectos/:id`**:
   - Tab "Información": datos del contacto + enlace a empresa.
   - Tab "Tratos": GET `/prospectos/:id/tratos` (read-only en este Change).
   - Acciones: "Convertir a cliente" (oculto si ya convertido), cambio de estado in-place, editar, eliminar.

---

## Contratos verificados

### `src/api/types.ts`

```
Línea 6:  export type EstadoPosibleCliente = 'frio' | 'tibio' | 'caliente';
Línea 7:  export type TipoContrato = 'precio_fijo' | 'tiempo_materiales' | 'retainer';
Línea 8:  export type EstadoTrato = 'abierto' | 'ganado' | 'perdido';
Línea 36: export interface Prospecto {
Línea 37:   id: string;
Línea 38:   empresa_id: string;
Línea 39:   responsable_id: string;
Línea 40:   creado_por: string;
Línea 41:   nombre_contacto: string;
Línea 42:   correo_contacto: string | null;
Línea 43:   telefono_contacto: string | null;
Línea 44:   cargo_contacto: string | null;
Línea 45:   como_nos_conocio: ComoNosConocio | null;
Línea 46:   estado_posible_cliente: EstadoPosibleCliente;
Línea 47:   notas: string | null;
Línea 48:   creado_en: string;
Línea 49:   actualizado_en: string;
Línea 50: }
Línea 52: export interface Cliente {
           -- NO tiene prospecto_origen_id --
Línea 65: }
Línea 67: export interface Trato {
Línea 68:   id: string;
Línea 69:   prospecto_id: string | null;
Línea 70:   cliente_id: string | null;
```

**Constatado**: `Cliente` NO tiene `prospecto_origen_id`. `EstadoPosibleCliente` NO tiene `'convertido'`. Ambos deben agregarse.

### `src/mocks/handlers/prospectos.ts`

```
Línea 13-24: GET /prospectos — filtra por: estado_posible_cliente, empresa_id, responsable_id.
             NO filtra `convertido` por defecto. Devuelve todo el store.
Línea 25-45: makeCrudHandlers<Prospecto> — GET :id, POST, PATCH, DELETE.
             .slice(1) omite el GET de lista (ya definido arriba con filtros).
Línea 46-66: POST /prospectos/:id/convertir
             ACTUAL: solo crea Cliente, NO actualiza el prospecto (ni estado ni actualizado_en).
             REQUERIDO: también debe hacer prospecto.estado_posible_cliente = 'convertido'
             y prospecto.actualizado_en = nowIso(), y setear cliente.prospecto_origen_id = prospecto.id
Línea 67-70: GET /prospectos/:id/tratos — filtra tratosFixture por prospecto_id.
```

### `src/mocks/fixtures/prospectos.ts`

- **3 registros** en el fixture:
  - `b1111111` — Carlos Méndez — estado: `'caliente'` — responsable: `22222222`
  - `b2222222` — Lucía Pérez — estado: `'tibio'` — responsable: `22222222`
  - `b3333333` — Roberto Sánchez — estado: `'frio'` — responsable: `11111111`
- Ninguno tiene estado `'convertido'`.
- Distribución actual: 1 caliente, 1 tibio, 1 frío. Se recomienda agregar al menos 1-2 convertidos para testear el tab.

### `src/mocks/fixtures/clientes.ts`

- **2 registros** en el fixture:
  - `c1111111` — Ana Rodríguez — empresa: `a1111111` — NO tiene `prospecto_origen_id`.
  - `c2222222` — Diego Vargas — empresa: `a2222222` — NO tiene `prospecto_origen_id`.
- Ninguno tiene vínculo con prospecto. Ambos deben actualizarse con `prospecto_origen_id: null` cuando se agregue el campo al tipo.

### `src/mocks/fixtures/tratos.ts`

- `d1111111` — vinculado a `prospecto_id: 'b1111111...'` — esto significa Carlos Méndez ya tiene un trato. El tab Tratos del detalle de ese prospecto lo mostrará.

---

## Cambios al contrato requeridos

### 1. `src/api/types.ts`

**Cambio A** — `EstadoPosibleCliente` (línea 6):
```typescript
// ANTES:
export type EstadoPosibleCliente = 'frio' | 'tibio' | 'caliente';
// DESPUÉS:
export type EstadoPosibleCliente = 'frio' | 'tibio' | 'caliente' | 'convertido';
```

**Cambio B** — `Cliente` (agregar campo al final del interface, antes del cierre en línea 65):
```typescript
prospecto_origen_id: string | null;
```

### 2. `src/mocks/handlers/prospectos.ts`

**Cambio C** — Handler POST /prospectos/:id/convertir (líneas 46-66):
Actualmente NO modifica el prospecto. Debe:
1. Marcar `prospecto.estado_posible_cliente = 'convertido'`
2. Actualizar `prospecto.actualizado_en = nowIso()`
3. Crear el cliente con `prospecto_origen_id = prospecto.id`

### 3. `src/mocks/fixtures/clientes.ts`

**Cambio D** — Agregar `prospecto_origen_id: null` a los 2 clientes existentes (para que el tipo compile).

### 4. `src/mocks/fixtures/prospectos.ts`

**Cambio E (opcional pero recomendado)** — Agregar 1-2 prospectos con estado `'convertido'` para que el tab Convertidos tenga datos de prueba desde el inicio.

### 5. `src/features/empresas/components/EmpresaProspectosTab.tsx`

**ALERTA CRÍTICA — Cambio F**: Este archivo tiene en líneas 17-27 un `Record<EstadoPosibleCliente, string>` exhaustivo. Al agregar `'convertido'` al type, TypeScript reportará error de compilación porque el record no cubre el nuevo valor.

```typescript
// Línea 17-21 — estadoBadgeClass — DEBE ACTUALIZARSE:
const estadoBadgeClass: Record<EstadoPosibleCliente, string> = {
  frio: '...',
  tibio: '...',
  caliente: '...',
  // FALTA: convertido: '...'
};
// Línea 23-27 — estadoLabel — IGUAL:
const estadoLabel: Record<EstadoPosibleCliente, string> = {
  frio: 'Frío',
  tibio: 'Tibio',
  caliente: 'Caliente',
  // FALTA: convertido: 'Convertido'
};
```

Este cambio es BLOQUEANTE — si no se corrige, el build TypeScript fallará al agregar `'convertido'`.

---

## Patrón de referencia

### Patrones a replicar tal cual (de empresas/usuarios)

| Patrón | Archivo de referencia | Se replica en prospectos |
|--------|----------------------|--------------------------|
| `useEmpresas()` / `useQuery` con queryKeys | `src/features/empresas/hooks/useEmpresas.ts` | `useProspectos()` con misma estructura |
| `useMutation` + `invalidateQueries` + `toast` + `isHttpError` | `useCreateEmpresa.ts`, `useDeleteEmpresa.ts` | Igual para useCreateProspecto, useDeleteProspecto |
| `stringsToNulls` / `nullsToStrings` en mutations y forms | `lib/form-utils.ts` + todos los hooks | Igual — los campos opcionales del Prospecto son `string | null` |
| Schema Zod con `.optional().or(z.literal(''))` para campos opcionales | `empresa.schema.ts` | Para `correo_contacto`, `telefono_contacto`, etc. |
| `makeCrudHandlers` + `.slice(1)` | `handlers/prospectos.ts` (ya en uso) | Ya implementado — solo extender |
| AlertDialog para confirmación destructiva | `EmpresaDeleteDialog.tsx` | Reutilizar patrón para "Convertir a cliente" |
| Tabs en DetailPage | `EmpresaDetailPage.tsx` líneas 101-116 | ProspectoDetailPage con tabs Información + Tratos |
| `useEffect` para 404 redirect + toast | `EmpresaDetailPage.tsx` líneas 28-35 | Igual en ProspectoDetailPage |
| `setupTestWrapper` | `src/test/wrappers.tsx` | Igual para tests de hooks |
| `useAuthStore.setState()` en beforeEach para tests | `UsuariosListPage.test.tsx` líneas 48-59 | Necesario para el toggle "solo míos" |
| `isHttpError` + `status === 422` con server errors inline | `EmpresaFormDialog.tsx` líneas 37-42 | En ProspectoFormDialog |

### Patrones que NO aplican (por diseño Kanban)

| Patrón | Por qué no aplica |
|--------|-------------------|
| `EmpresasTable.tsx` / `UsuariosTable.tsx` (tabla densa con columnas) | El layout es Kanban, no tabla. Se crean columnas con cards en lugar de filas de tabla. |
| Búsqueda en el header top-bar de tabla | Se mantiene el input de búsqueda pero el resultado se refleja filtrando las cards del Kanban, no filas de una tabla. |
| Navegación a detalle desde fila de tabla con `navigate()` | En Kanban, el click en la card navega al detalle. El patrón es similar pero el trigger es la card completa. |

---

## Estructura propuesta `src/features/prospectos/`

```
src/features/prospectos/
├── schemas/
│   └── prospecto.schema.ts         # Zod create/update schema
├── hooks/
│   ├── useProspectos.ts            # useQuery GET /prospectos (con params opcionales)
│   ├── useProspecto.ts             # useQuery GET /prospectos/:id
│   ├── useProspectoTratos.ts       # useQuery GET /prospectos/:id/tratos
│   ├── useCreateProspecto.ts       # useMutation POST /prospectos
│   ├── useUpdateProspecto.ts       # useMutation PATCH /prospectos/:id
│   ├── useDeleteProspecto.ts       # useMutation DELETE /prospectos/:id
│   └── useConvertirProspecto.ts    # useMutation POST /prospectos/:id/convertir
├── components/
│   ├── ProspectoKanban.tsx         # Contenedor principal del Kanban (3 columnas activas)
│   ├── ProspectoKanbanColumn.tsx   # Una columna del Kanban (frio/tibio/caliente)
│   ├── ProspectoCard.tsx           # Card individual de un prospecto con Select de estado
│   ├── ProspectosConvertidos.tsx   # Sección "Convertidos" con collapsible "anteriores"
│   ├── ProspectoFormDialog.tsx     # Dialog create/edit (mismo patrón que EmpresaFormDialog)
│   ├── ProspectoForm.tsx           # Form RHF+Zod (Nombre, empresa Select, responsable Select, etc.)
│   ├── ProspectoDeleteDialog.tsx   # AlertDialog confirmación eliminar
│   ├── ConvertirProspectoDialog.tsx # AlertDialog confirmación conversión
│   ├── ProspectoInfoTab.tsx        # Tab "Información" del detalle
│   └── ProspectoTratosTab.tsx      # Tab "Tratos" (read-only, lista de tratos)
├── pages/
│   ├── ProspectosListPage.tsx      # Página principal con filtros top-bar + Kanban
│   └── ProspectoDetailPage.tsx     # Detalle /prospectos/:id con tabs + acciones
└── __tests__/
    ├── useProspectos.test.tsx
    ├── useCreateProspecto.test.tsx
    ├── useDeleteProspecto.test.tsx
    ├── useConvertirProspecto.test.tsx
    └── ProspectosListPage.test.tsx
    └── ProspectoDetailPage.test.tsx
```

---

## Primitivos shadcn a instalar

### Ya instalados (verificados en `src/components/ui/`)

| Primitivo | Archivo | Uso previsto |
|-----------|---------|--------------|
| `tabs` | `tabs.tsx` | Tab "Activos/Convertidos" y tabs del detalle |
| `card` | `card.tsx` | Cards del Kanban |
| `separator` | `separator.tsx` | División visual entre columnas o secciones |
| `alert-dialog` | `alert-dialog.tsx` | Confirmación de conversión y eliminación |
| `select` | `select.tsx` | Cambio de estado in-place en card; filtro de responsable |
| `badge` | `badge.tsx` | Badge "Convertido" en cards y detalle |
| `button`, `input`, `form`, `label`, `dialog`, `tooltip`, `dropdown-menu` | — | Varios usos |

### Pendientes de instalar

| Primitivo | Justificación |
|-----------|---------------|
| `collapsible` | Necesario para la sub-sección "Ver convertidos anteriores" dentro del tab Convertidos. Alternativa: implementar manualmente con estado booleano + CSS, pero `collapsible.tsx` de shadcn es la opción idiomática del stack. |
| `scroll-area` | Recomendado para las columnas del Kanban cuando haya muchas cards, evitando que el layout del page se desplace. Permite scroll independiente por columna. Si no se instala, se puede usar `overflow-y-auto` directo con altura máxima fija. |

**Nota sobre drag-and-drop**: el usuario decidió usar Select inline para cambio de estado. No se requiere ninguna librería de DnD (ni `@dnd-kit` ni `react-beautiful-dnd`).

**Nota sobre polyfills**: `setupTests.ts` ya tiene `hasPointerCapture` y `scrollIntoView`. Los primitivos `Tabs` y `Collapsible` de Radix no requieren polyfills adicionales (no procesan eventos de puntero como `Select` o `DropdownMenu`). El polyfill existente es suficiente.

---

## Riesgos y trade-offs

### Riesgo 1 — CRÍTICO: Ruptura de tipo en `EmpresaProspectosTab`

**Problema**: Al agregar `'convertido'` a `EstadoPosibleCliente`, los `Record<EstadoPosibleCliente, string>` en `src/features/empresas/components/EmpresaProspectosTab.tsx` (líneas 17-27) quedarán incompletos. TypeScript lo reportará como error de compilación.

**Recomendación**: En el mismo commit donde se modifica `types.ts`, actualizar `EmpresaProspectosTab.tsx` con entrada para `convertido` en ambos records. Valor sugerido: badge gris (`bg-gray-100 text-gray-600`) y label `'Convertido'`.

**Impacto**: Si se omite, el proyecto no compila. Es la tarea más urgente del lote Apply.

---

### Riesgo 2 — Handler de conversión incompleto (contrato actual vs. requerido)

**Problema**: El handler actual (líneas 46-66 de `handlers/prospectos.ts`) NO modifica el prospecto al convertir — solo crea el cliente. Esto significa que tras llamar a POST /prospectos/:id/convertir, el prospecto sigue apareciendo en el Kanban como `'caliente'`, `'tibio'` o `'frío'`, y el tab Activos lo sigue mostrando.

**Recomendación**: Modificar el handler para que:
1. Busque el índice del prospecto en el store (`prospectosFixture.findIndex`).
2. Mute el objeto: `prospecto.estado_posible_cliente = 'convertido'` y `prospecto.actualizado_en = nowIso()`.
3. El cliente nuevo recibe `prospecto_origen_id: prospecto.id`.

**Trade-off**: La mutación directa del fixture (patrón ya existente en `makeCrudHandlers`) es suficiente para dev/test. No aplica para producción.

---

### Riesgo 3 — Filtrado de "Convertidos" en el GET /prospectos

**Problema**: El handler GET `/prospectos` devuelve TODO el store incluidos convertidos (si se pasa `estado=convertido` filtra solo esos, pero sin param devuelve todos). El tab "Activos" del Kanban NO debe mostrar convertidos.

**Dos opciones**:

**Opción A — Filtrar en el servidor (modificar handler)**:
Cuando NO se pasa `estado_posible_cliente`, el handler excluye automáticamente los de estado `'convertido'`. Para traer convertidos se pasa `estado=convertido` explícitamente.

- Pros: el API es semánticamente correcto ("lista de activos" por defecto); el frontend no necesita lógica extra.
- Contras: cambia el comportamiento del endpoint actual (breaking change para cualquier otro consumer). Menos transparente.

**Opción B — Filtrar en el frontend (client-side en el tab Activos)**:
El hook `useProspectos()` trae TODO. El componente `ProspectoKanban` filtra `p.estado_posible_cliente !== 'convertido'` al renderizar las 3 columnas activas. Para el tab Convertidos filtra `=== 'convertido'`.

- Pros: el handler no cambia (backward compatible); el frontend tiene control total; más fácil de testear en componentes.
- Contras: se traen datos de convertidos al cliente aunque no se muestren en Activos (overhead mínimo con 3 registros fixture, pero puede escalar).

**Recomendación**: Opción B. Con el volumen actual y previsible de prospectos en este CRM, el overhead es despreciable. Mantener el handler simple y trasladar la lógica de vista al frontend es más idiomático con React Query. Si en el futuro hay miles de registros, se añade paginación server-side.

---

### Riesgo 4 — Edición post-conversión

**Problema**: Si un prospecto tiene `estado_posible_cliente = 'convertido'`, semánticamente sus datos de contacto ya viven en el `Cliente` creado. Permitir editar el prospecto crea datos divergentes (el prospecto dice una cosa, el cliente otra).

**Recomendación**: Bloquear el formulario de edición cuando `estado === 'convertido'`. Mantener únicamente el campo `notas` editable (información de contexto histórico). El botón "Editar" puede deshabilitarse o el form puede renderizarse en modo read-only con solo el campo de notas activo.

**Por qué**: En un CRM, un prospecto convertido es un registro histórico. Sus datos "viven" en el Cliente. Editar el prospecto post-conversión genera confusión de estado. La nota es la única información que tiene sentido actualizar (ej: "convertido por referido especial").

---

### Riesgo 5 — Filtro top-bar de estado vs. Kanban

**Problema**: Las decisiones de entrada eliminan el filtro de estado de la top-bar (redundante con las columnas del Kanban). Sin embargo, esto no está aún en el diseño formal.

**Recomendación para design**: confirmar explícitamente la eliminación del filtro. Si se mantiene, en el Kanban solo se mostrarían las columnas del estado seleccionado (colapsar columnas no seleccionadas). Si se elimina, la top-bar queda con: búsqueda + responsable + toggle "solo míos". Dejar este punto como pregunta abierta para el usuario antes de Propose.

---

### Riesgo 6 — Performance del Kanban con muchos prospectos

**Problema**: Si hay 200-500 prospectos, renderizar todas las cards simultáneamente puede causar lag.

**Recomendación**: Establecer un límite de paginación server-side (`limit=50 por columna`) o implementar virtualización con `@tanstack/react-virtual`. Para el MVP con datos fixture (3 registros), no es urgente. Se documenta para futura consideración. En este Change: priorizar `limit` configurable en el hook y dejar la virtualización para cuando sea necesario.

---

### Riesgo 7 — Prefetch de tratos en el detalle

**Pregunta**: al entrar a `/prospectos/:id`, ¿se prefetchea el tab Tratos inmediatamente o se carga lazy cuando el usuario hace click en ese tab?

**Recomendación**: Lazy loading. Los tabs de Radix/shadcn montan el contenido del tab activo; el tab Tratos solo hace la query cuando se activa. Esto es el comportamiento por defecto con `TabsContent` — NO es necesario implementar prefetch explícito. Si en el futuro se quiere prefetch, se puede usar `queryClient.prefetchQuery` al hacer hover sobre el trigger del tab.

---

## Hooks reusables confirmados

### `useEmpresas()` — CONFIRMADO disponible
- Archivo: `src/features/empresas/hooks/useEmpresas.ts`
- Exporta: `useEmpresas(): UseQueryResult<Empresa[]>` y `empresasKeys`
- **Uso en prospectos**: reutilizar directamente en `ProspectoForm` para el Select de empresa. El form mapea `empresa_id` del prospecto.

### `useUsuarios()` — CONFIRMADO disponible
- Archivo: `src/features/usuarios/hooks/useUsuarios.ts`
- Exporta: `useUsuarios(): UseQueryResult<Usuario[]>` y `usuariosKeys`
- **Uso en prospectos**: reutilizar en `ProspectoForm` para el Select de responsable.

### `useAuthStore` — CONFIRMADO en `src/store/authStore.ts`
- El store tiene `usuario.id` (campo `id` en `AuthUser`).
- Para el toggle "solo míos": `useAuthStore((s) => s.usuario?.id)` retorna el ID del usuario actual.
- Patrón ya establecido en `UsuariosListPage.test.tsx`: `useAuthStore.setState(...)` en `beforeEach` para inyectar el usuario en tests.

**Nota**: La carpeta es `src/store/` (no `src/stores/`). Solo dos archivos: `authStore.ts` y `uiStore.ts`.

---

## Estado actual del routing

`src/routes/router.tsx` (líneas 30-31):
```typescript
{ path: 'prospectos', element: <ProspectosPlaceholder /> },
```

El Change 4 debe:
1. Agregar `{ path: 'prospectos/:id', element: <ProspectoDetailPage /> }` al router.
2. Reemplazar `ProspectosPlaceholder` con `ProspectosListPage`.
3. Importar los componentes desde `@/features/prospectos/pages/`.

El sidebar ya tiene el link a `/prospectos` habilitado (confirmado por el commit `4d79993` que arregla handlers MSW y habilita el link).

---

## Cuestiones abiertas para el usuario

Solo una cuestión permanece abierta tras esta exploración:

**Pregunta 1 — Filtro de estado en top-bar**:
Las decisiones de entrada eliminan el filtro de estado del top-bar. ¿Se confirma oficialmente? Opciones:
- (A) Eliminado definitivamente — top-bar solo tiene búsqueda + responsable + toggle.
- (B) Mantener como filtro que colapsa columnas en el Kanban (ej: seleccionar "Caliente" muestra solo esa columna).

Esta decisión afecta el diseño del componente `ProspectosListPage` y la lógica de filtrado. Si no se responde antes de Propose, la propuesta asumirá la opción A (eliminado).

---

## Siguiente fase

**sdd-propose**

Con los contratos verificados, los cambios exactos identificados y los riesgos documentados, la fase de propuesta puede arrancar sin ambigüedades. Los únicos inputs pendientes son la respuesta a la Pregunta 1 (filtro de estado en top-bar) — si no se responde, Propose asume opción A.
