# Proposal: tratos-advanced-filters-presets

## Intent

Agregar filtros avanzados y presets locales al listado de Tratos para mejorar la operabilidad comercial del CRM sin cambiar backend ni contrato API.

La primera iteración se enfoca en `Tratos` y deja un patrón reusable para aplicar luego en Empresas, Contactos y Tareas.

## Scope

### In Scope

- Filtros client-side en `TratosListPage`, visibles para ambas vistas `Lista` y `Kanban`:
  - búsqueda por nombre.
  - estado del trato.
  - tipo de contrato.
  - responsable.
  - contacto.
  - valor estimado mínimo/máximo.
  - cierre esperado.
- Presets locales de filtros para Tratos usando `localStorage`.
- Lógica pura reusable para:
  - aplicar filtros de Tratos.
  - serializar/deserializar presets.
- UI mínima para:
  - guardar vista actual como preset.
  - aplicar preset guardado.
  - eliminar preset guardado.
  - limpiar filtros.
- Tests focales de lógica y página.

### Out of Scope

- Backend de vistas guardadas.
- Sincronización entre usuarios/dispositivos.
- Filtros server-side.
- Paginación server-side.
- Ordenamiento avanzado.
- Aplicar presets a Empresas/Contactos/Tareas en esta iteración.
- Cambiar el comportamiento del botón `<-`.

## Capabilities

### New Capabilities

- `list-filter-presets`: presets locales de filtros por listado.
- `tratos-advanced-filtering`: filtros client-side avanzados para tratos.

### Modified Capabilities

- `tratos-management`: listado de tratos gana filtros avanzados y presets locales.

## Approach

1. Crear un módulo de filtros de tratos con funciones puras.
2. Crear un módulo de presets locales defensivo frente a errores de `localStorage`.
3. Mover el filtrado de `TratosTable` hacia `TratosListPage` o hacer que la tabla reciba ya el dataset filtrado.
4. Agregar controles de filtros a nivel de página de Tratos usando componentes UI existentes.
5. Agregar UI de presets localStorage.
6. Cubrir con tests unitarios y tests de integración de la página.

## Affected Areas

| Area | Impact | Description |
| --- | --- | --- |
| `src/features/tratos/pages/TratosListPage.tsx` | Modified | Agrega estado de filtros, aplicación client-side y UI de presets compartida por Lista/Kanban. |
| `src/features/kanban/components/KanbanTabContent.tsx` | Modified | Acepta IDs de entidades permitidas para filtrar fichas TRATO/TAREA. |
| `src/features/kanban/components/KanbanBoardEmbebido.tsx` | Modified | Filtra fichas embebidas por IDs permitidos. |
| `src/features/tratos/components/TratosTable.tsx` | Modified | Reduce filtrado interno o acepta data ya filtrada. |
| `src/features/tratos/lib/` | New | Lógica pura de filtros. |
| `src/features/list-presets/` o `src/lib/` | New | Persistencia local reusable de presets. |
| `src/features/tratos/__tests__/` | Modified/New | Tests de filtros, presets y página. |
| `openspec/changes/tratos-advanced-filters-presets/` | New | SDD del cambio. |

## Risks

| Risk | Likelihood | Mitigation |
| --- | --- | --- |
| Duplicar filtrado entre page y table | Media | Centralizar filtrado en función pura y pasar array filtrado a tabla. |
| Presets corruptos rompen la pantalla | Media | Parse defensivo; si falla, devolver `[]`. |
| UX saturada por muchos filtros | Media | Layout compacto con wrap; botón limpiar; contador de resultados. |
| Confundir KPIs globales con filtrados | Baja | Mantener KPIs globales y agregar texto `Mostrando X de Y`. |
| `localStorage` no disponible | Baja | Try/catch en lectura/escritura. |

## Rollback Plan

- Revertir cambios en `TratosListPage` y `TratosTable`.
- Eliminar módulos nuevos de filtros/presets.
- Eliminar tests asociados.
- Eliminar artefactos SDD del change si no se adopta.

## Dependencies

- Hooks existentes:
  - `useTratos`
  - `useContactos`
  - `useUsuarios`
- Componentes UI existentes:
  - `Input`
  - `Select`
  - `Button`
  - `DropdownMenu`
  - `Badge`
  - `Tabs`
- `localStorage` del navegador.

## Success Criteria

- [ ] La página de Tratos permite filtrar por estado, tipo, responsable, contacto, valor y cierre esperado.
- [ ] Los filtros son visibles tanto en Lista como en Kanban.
- [ ] El Kanban de Tratos muestra solo fichas cuyos `tratoId` pertenecen a los tratos filtrados.
- [ ] Los filtros se aplican client-side sobre los datos ya cargados.
- [ ] Cambiar filtros no dispara requests nuevos ni query params al backend.
- [ ] La búsqueda por nombre sigue funcionando.
- [ ] El usuario puede guardar la vista actual como preset local.
- [ ] El usuario puede aplicar un preset guardado.
- [ ] El usuario puede eliminar un preset guardado.
- [ ] Presets corruptos en `localStorage` no rompen la página.
- [ ] Tests focales pasan.
- [ ] `pnpm type-check` pasa.
- [ ] No se ejecuta build.
