# Design: tratos-advanced-filters-presets

## Architecture

El cambio separa tres responsabilidades:

1. **Estado/UI de filtros** en `TratosListPage`.
2. **Lógica pura de filtrado** en `src/features/tratos/lib/tratoFilters.ts`.
3. **Persistencia local de presets** en un módulo reusable, preferentemente `src/features/list-presets/lib/listPresets.ts`.

La tabla debe renderizar datos y acciones. El filtrado completo debe vivir fuera de `TratosTable`, porque si una tabla filtra internamente y la page también filtra, se duplica lógica y los tests se vuelven frágiles.

## Data Model

### TratoFilters

```ts
export type CierreEsperadoFilter =
  | 'todas'
  | 'vencidas'
  | 'proximos-7'
  | 'proximos-30'
  | 'sin-fecha';

export interface TratoFilters {
  search: string;
  estado?: EstadoTrato;
  tipoContrato?: TipoContrato;
  responsableId?: string;
  contactoId?: string;
  valorMin?: number;
  valorMax?: number;
  cierreEsperado?: CierreEsperadoFilter;
}
```

Valores vacíos de selects/inputs se normalizan a `undefined` para que `applyTratoFilters` no tenga que interpretar strings sentinela.

### ListPreset

```ts
export interface ListPreset<TFilters> {
  id: string;
  name: string;
  filters: TFilters;
  createdAt: string;
}
```

Storage key para Tratos:

```txt
crm:list-presets:tratos
```

## Filtering Rules

`applyTratoFilters(tratos, filters, now = new Date())`:

- `search`: compara contra `trato.nombre` en minúsculas.
- `estado`: igualdad contra `trato.estado`.
- `tipoContrato`: igualdad contra `trato.tipoContrato`.
- `responsableId`: igualdad contra `trato.responsableId`.
- `contactoId`: igualdad contra `trato.contactoId`.
- `valorMin`: incluye `valorEstimado >= valorMin`; `null` no pasa cuando hay mínimo.
- `valorMax`: incluye `valorEstimado <= valorMax`; `null` no pasa cuando hay máximo.
- `cierreEsperado`:
  - `todas`/undefined: no filtra.
  - `vencidas`: fecha no nula y menor que `now`.
  - `proximos-7`: fecha no nula entre `now` y `now + 7 días`.
  - `proximos-30`: fecha no nula entre `now` y `now + 30 días`.
  - `sin-fecha`: `fechaCierreEsperada === null`.

## Preset Persistence

Funciones propuestas:

```ts
export function loadListPresets<TFilters>(storageKey: string): ListPreset<TFilters>[];
export function saveListPresets<TFilters>(storageKey: string, presets: ListPreset<TFilters>[]): void;
export function createListPreset<TFilters>(name: string, filters: TFilters): ListPreset<TFilters>;
```

Reglas:

- `loadListPresets` devuelve `[]` si:
  - no hay valor.
  - JSON inválido.
  - la forma no es array.
  - `localStorage` tira excepción.
- `saveListPresets` ignora errores de `localStorage`.
- `createListPreset` usa `crypto.randomUUID()` si existe; fallback a timestamp.

## UI Design

En `TratosListPage`, por encima de los tabs `Lista/Kanban`:

1. Primera fila:
   - búsqueda por nombre.
   - preset select/dropdown.
   - botón `Guardar vista`.
   - botón `Limpiar filtros`.
2. Segunda fila con filtros:
   - Estado.
   - Tipo contrato.
   - Responsable.
   - Contacto.
   - Valor mínimo.
   - Valor máximo.
   - Cierre esperado.
3. Texto de feedback:
   - `Mostrando X de Y tratos`.

El tab `Lista` recibe `filteredTratos` directamente.

El tab `Kanban` recibe los IDs permitidos derivados de `filteredTratos`:

```tsx
<KanbanTabContent tipo="TRATOS" allowedEntityIds={filteredTratos.map((t) => t.id)} />
```

`KanbanBoardEmbebido` filtra fichas así:

- si `tipoFicha === 'TRATO'`, usa `ficha.tratoId`.
- si `tipoFicha === 'TAREA'`, usa `ficha.tareaId`.
- si `allowedEntityIds` es `undefined`, mantiene comportamiento actual.
- si `allowedEntityIds` es `[]`, muestra columnas sin fichas.

`Guardar vista` usa un `Dialog` de la interfaz con `Input` para nombrar el preset. No se usa `window.prompt`, porque el aviso nativo del navegador rompe la experiencia visual de la app.

## Tests

### Unit

- `tratoFilters.test.ts`:
  - filtra por search.
  - filtra por estado.
  - filtra por tipo.
  - filtra por responsable/contacto.
  - filtra por rango de valor.
  - filtra por vencidas/próximas/sin fecha.
- `listPresets.test.ts`:
  - carga `[]` sin storage.
  - carga presets válidos.
  - tolera JSON inválido.
  - guarda presets.

### Integration

- `TratosListPage.test.tsx`:
  - filtro estado muestra solo tratos esperados.
  - filtro responsable no hace request nuevo.
  - guardar preset persiste en `localStorage`.
  - aplicar preset restaura resultado.
  - eliminar preset remueve del storage.

## Non-Goals

- No se cambia backend.
- No se agregan query params de filtros.
- No se persisten presets por usuario real.
- No se tocan Empresas/Contactos/Tareas en esta iteración.
- No se ejecuta build.
