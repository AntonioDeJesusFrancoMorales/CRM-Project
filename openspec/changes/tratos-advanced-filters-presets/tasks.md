# Tasks: tratos-advanced-filters-presets

## 1. Lógica pura de filtros

- [x] 1.1 Crear `src/features/tratos/lib/tratoFilters.ts`.
- [x] 1.2 Definir `TratoFilters` y `CierreEsperadoFilter`.
- [x] 1.3 Implementar `createEmptyTratoFilters()`.
- [x] 1.4 Implementar `hasActiveTratoFilters()`.
- [x] 1.5 Implementar `applyTratoFilters(tratos, filters, now?)`.
- [x] 1.6 Cubrir search, estado, tipo, responsable, contacto, valor y cierre esperado.

## 2. Presets locales reusable

- [x] 2.1 Crear módulo reusable de presets locales.
- [x] 2.2 Implementar carga defensiva desde `localStorage`.
- [x] 2.3 Implementar guardado defensivo en `localStorage`.
- [x] 2.4 Implementar creación de preset con id estable.
- [x] 2.5 Cubrir storage vacío, válido, inválido y errores.

## 3. UI Tratos

- [x] 3.1 Mover filtrado completo a `TratosListPage` usando `applyTratoFilters`.
- [x] 3.2 Ajustar `TratosTable` para recibir lista ya filtrada o evitar doble filtrado.
- [x] 3.3 Agregar filtros de estado, tipo contrato, responsable y contacto.
- [x] 3.4 Agregar filtros de valor mínimo/máximo.
- [x] 3.5 Agregar filtro de cierre esperado.
- [x] 3.6 Agregar contador `Mostrando X de Y tratos`.
- [x] 3.7 Agregar botón `Limpiar filtros`.
- [x] 3.8 Mover la UI de filtros para que sea visible en Lista y Kanban.
- [x] 3.9 Aplicar filtros al Kanban mediante IDs de tratos permitidos.

## 4. UI Presets

- [x] 4.1 Cargar presets desde `crm:list-presets:tratos`.
- [x] 4.2 Agregar control para aplicar preset.
- [x] 4.3 Agregar acción `Guardar vista`.
- [x] 4.4 Agregar acción para eliminar preset.
- [x] 4.5 Tolerar presets corruptos sin romper render.

## 5. Tests

- [x] 5.1 Crear tests unitarios para `tratoFilters`.
- [x] 5.2 Crear tests unitarios para presets locales.
- [x] 5.3 Actualizar `TratosListPage.test.tsx` con filtros avanzados.
- [x] 5.4 Verificar que filtros no agregan query params ni refetch.
- [x] 5.5 Verificar guardar/aplicar/eliminar preset.
- [x] 5.6 Verificar que Kanban recibe y aplica los IDs filtrados.

## 6. Verificación

- [x] 6.1 Ejecutar tests focales de tratos/presets.
- [x] 6.2 Ejecutar `pnpm type-check`.
- [x] 6.3 No ejecutar build.
