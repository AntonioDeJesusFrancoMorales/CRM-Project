# Tasks: global-search-client-side

## 1. Lógica pura de búsqueda

- [x] 1.1 Crear `src/features/global-search/lib/search.ts`.
- [x] 1.2 Definir tipos `GlobalSearchEntity`, `GlobalSearchResult` y estructura agrupada.
- [x] 1.3 Implementar normalización case-insensitive y accent-insensitive.
- [x] 1.4 Implementar builders de resultados para empresas, contactos, tratos y tareas.
- [x] 1.5 Implementar filtrado por query mínima de 2 caracteres.
- [x] 1.6 Implementar límite por grupo.

## 2. Tests unitarios

- [x] 2.1 Crear `src/features/global-search/__tests__/search.test.ts`.
- [x] 2.2 Cubrir normalización por mayúsculas/minúsculas.
- [x] 2.3 Cubrir normalización por acentos.
- [x] 2.4 Cubrir query menor a 2 caracteres.
- [x] 2.5 Cubrir rutas correctas por entidad.
- [x] 2.6 Cubrir límite por grupo.

## 3. Componente GlobalSearch

- [x] 3.1 Crear `src/features/global-search/components/GlobalSearch.tsx`.
- [x] 3.2 Consumir `useEmpresas`, `useContactos`, `useTratos`, `useTareas`.
- [x] 3.3 Renderizar botón de búsqueda.
- [x] 3.4 Renderizar dialog con input enfocado.
- [x] 3.5 Agregar atajo `Ctrl/Cmd + K` con cleanup.
- [x] 3.6 Renderizar estados: query vacía, loading, error parcial, sin resultados.
- [x] 3.7 Renderizar resultados agrupados.
- [x] 3.8 Navegar y cerrar dialog al seleccionar resultado.

## 4. Integración en layout

- [x] 4.1 Importar y montar `GlobalSearch` en `Topbar.tsx`.
- [x] 4.2 Ajustar layout responsivo del Topbar si hace falta.
- [x] 4.3 Ajustar mocks de `Topbar.test.tsx` si hace falta.

## 5. Tests de integración

- [x] 5.1 Crear `src/features/global-search/__tests__/GlobalSearch.test.tsx`.
- [x] 5.2 Mockear hooks de datos.
- [x] 5.3 Test: abre por click.
- [x] 5.4 Test: abre por `Ctrl+K`.
- [x] 5.5 Test: muestra resultados agrupados.
- [x] 5.6 Test: selección navega al detalle.
- [x] 5.7 Test: sin resultados muestra empty state.

## 6. Verificación

- [x] 6.1 Ejecutar tests focales de global-search.
- [x] 6.2 Ejecutar tests de Topbar/layout afectados.
- [x] 6.3 No ejecutar build, por restricción del usuario.
