# Exploration: global-search-client-side

Fecha: 2026-06-27

## Problema

Pipely tiene módulos separados para empresas, contactos, tratos y tareas, pero no tiene una forma rápida de encontrar una entidad desde cualquier pantalla. El usuario pidió avanzar con funcionalidades frontend-only usando SDD para reducir errores. Del roadmap `docs/crm-roadmap-faltantes.md`, el primer candidato recomendado es la búsqueda global client-side.

## Estado actual verificado

### Layout

- `src/components/layout/AppShell.tsx` compone `Sidebar`, `Topbar` y `Outlet`.
- `src/components/layout/Topbar.tsx` muestra título de ruta, theme toggle y menú de usuario.
- El Topbar ya tiene tests en `src/components/layout/__tests__/Topbar.test.tsx`.

### Data fetching

Los hooks principales ya traen listas completas con TanStack Query:

- `useEmpresas()` → `Empresa[]`, query key `['empresas']`, endpoint `/empresas/get-all`.
- `useContactos()` → `Contacto[]`, query key `['contactos']`, endpoint `/contactos/get-all`.
- `useTratos()` → `Trato[]`, query key `['tratos']`, endpoint `/tratos/get-all`.
- `useTareas()` → `Tarea[]`, query key `['tareas']`, endpoint `/tareas/get-all`.

El propio código documenta filtros client-side en varios lugares:

- `src/features/empresas/pages/EmpresasListPage.tsx` filtra empresas por búsqueda.
- `src/features/contactos/pages/ContactosPage.tsx` mantiene `searchTerm` local.
- `src/features/tareas/components/TareasTable.tsx` filtra por título.
- `src/features/tratos/hooks/useTratos.ts` indica que el backend no filtra server-side.

### UI disponible

Hay componentes shadcn/Radix existentes:

- `Dialog`
- `Button`
- `Input`
- `Badge`
- `ScrollArea`
- `Skeleton`
- `DropdownMenu`

No se encontró componente `Command` ni dependencia `cmdk` en el proyecto. Conviene no agregar dependencia nueva salvo necesidad real.

## UX candidata

### Opción A: input visible en Topbar

Pros:
- Muy descubrible.
- Simple.

Contras:
- Consume espacio en mobile.
- Puede pelear con el título actual.

### Opción B: botón/input compacto que abre dialog de búsqueda

Pros:
- Funciona bien en desktop y mobile.
- Permite resultados agrupados y navegación por teclado.
- No requiere rediseñar demasiado Topbar.

Contras:
- Un clic extra si no se agrega atajo.

### Recomendación

Usar un **botón de búsqueda en Topbar** que abre un `Dialog` tipo command palette, con atajo `Ctrl/Cmd + K`.

## Entidades y campos a buscar

### Empresas

Ruta: `/empresas/:id`

Campos candidatos:
- `nombre`
- `sector`
- `telefono`
- `paginaWeb`
- redes sociales si existen

### Contactos

Ruta: `/contactos/:id`

Campos candidatos:
- `nombre`
- `correo`
- `telefono`
- `cargo`
- `comoNosConocio`

### Tratos

Ruta: `/tratos/:id`

Campos candidatos:
- `nombre`
- `tipoContrato`
- `estado`
- `motivoPerdida`

### Tareas

Ruta: `/tareas/:id`

Campos candidatos:
- `titulo`
- `descripcion`
- `tipo`
- `prioridad`

## Edge cases

- Query vacía: mostrar ayuda breve o últimos grupos vacíos; no listar todo para no saturar.
- Menos de 2 caracteres: no buscar todavía, salvo match exacto no requerido.
- Loading: mostrar estado "Cargando datos..." si algún hook está cargando.
- Error parcial: mostrar resultados de fuentes disponibles y un aviso no bloqueante.
- Sin resultados: empty state con el término buscado.
- Auth: el componente vive dentro de `AppShell`, por lo tanto solo en rutas protegidas.
- Performance: limitar resultados por grupo, por ejemplo 5 por entidad; buscar en memoria es aceptable para volumen bajo/medio.
- Accesibilidad: input con `autoFocus`, botones de resultado reales, `aria-label`, escape/cierre vía Dialog.
- Navegación: al seleccionar resultado, cerrar dialog y `navigate(to)`.
- Datos relacionados: para primera versión no enriquecer tratos con nombre de contacto ni tareas con nombre de trato, para evitar complejidad accidental. Puede agregarse después.

## Archivos probables

Crear:

- `src/features/global-search/components/GlobalSearch.tsx`
- `src/features/global-search/lib/search.ts`
- `src/features/global-search/__tests__/search.test.ts`
- `src/features/global-search/__tests__/GlobalSearch.test.tsx`

Modificar:

- `src/components/layout/Topbar.tsx`
- `src/components/layout/__tests__/Topbar.test.tsx` si el nuevo botón afecta expectativas.

## Riesgos

- Duplicar lógica de búsqueda de cada listado. Mitigación: centralizar normalización y búsqueda en `features/global-search/lib/search.ts`.
- Sobrecargar Topbar. Mitigación: botón compacto y dialog.
- Agregar dependencia innecesaria. Mitigación: usar `Dialog` + `Input` + botones existentes, sin `cmdk`.
- Tests frágiles por múltiples hooks. Mitigación: testear lógica pura por separado y UI con mocks de hooks.

## Decisiones tomadas

- Primera versión frontend-only.
- Sin endpoint nuevo.
- Sin dependencia `cmdk`.
- Resultados agrupados por entidad.
- Atajo `Ctrl/Cmd + K`.
- Límite de resultados por grupo para evitar ruido.
