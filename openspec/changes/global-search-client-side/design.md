# Design: global-search-client-side

## Overview

Se implementará una búsqueda global frontend-only con un componente `GlobalSearch` montado en `Topbar`. La búsqueda consumirá hooks existentes y usará utilidades puras para normalizar texto, crear resultados y agruparlos por entidad.

La decisión central es NO introducir dependencia `cmdk`. Para esta primera versión alcanza con `Dialog`, `Input`, `Button`, `Badge` y `ScrollArea`, reduciendo superficie de riesgo.

## Architecture

```txt
Topbar
└── GlobalSearch
    ├── useEmpresas()
    ├── useContactos()
    ├── useTratos()
    ├── useTareas()
    ├── buildGlobalSearchResults()  // pure lib
    └── navigate(result.to)
```

## New files

```txt
src/features/global-search/
├── components/
│   └── GlobalSearch.tsx
├── lib/
│   └── search.ts
└── __tests__/
    ├── search.test.ts
    └── GlobalSearch.test.tsx
```

## Modified files

```txt
src/components/layout/Topbar.tsx
src/components/layout/__tests__/Topbar.test.tsx   // only if needed for mocks
```

## Data model

### Search entity type

```ts
type GlobalSearchEntity = 'empresa' | 'contacto' | 'trato' | 'tarea';
```

### Search result

```ts
interface GlobalSearchResult {
  id: string;
  type: GlobalSearchEntity;
  title: string;
  subtitle?: string;
  badge?: string;
  to: string;
  haystack: string;
}
```

`haystack` queda en la capa de búsqueda pura, no necesariamente se renderiza.

## Search behavior

### Normalización

- `trim()`
- `toLowerCase()`
- quitar diacríticos con `normalize('NFD')` + regex unicode

Esto permite que `Perez` encuentre `Pérez`.

### Campos por entidad

Empresas:
- `nombre`
- `sector`
- `telefono`
- `paginaWeb`

Contactos:
- `nombre`
- `correo`
- `telefono`
- `cargo`
- `comoNosConocio`

Tratos:
- `nombre`
- `tipoContrato`
- `estado`
- `motivoPerdida`

Tareas:
- `titulo`
- `descripcion`
- `tipo`
- `prioridad`

## Component behavior

### Topbar integration

`Topbar` renderiza `<GlobalSearch />` entre el título y el theme toggle/avatar. En mobile debe mantenerse compacto.

### Dialog

- Botón visible: texto en desktop, ícono en mobile si hace falta.
- `DialogTitle`: "Búsqueda global".
- Input placeholder: "Buscar empresas, contactos, tratos o tareas...".
- Query mínima: 2 caracteres.
- Resultados agrupados.
- Cada resultado como botón full-width.

### Keyboard shortcut

`GlobalSearch` registra `keydown` en `window` con cleanup en `useEffect`.

Condición:

```ts
if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k')
```

Debe llamar `event.preventDefault()`.

## Loading/error policy

- `isLoadingAny`: muestra hint "Cargando datos...".
- `isErrorAny`: muestra warning no bloqueante "Algunos datos no pudieron cargarse".
- Si hay resultados disponibles de otras fuentes, se muestran igual.

## Testing strategy

### Unit tests: `search.test.ts`

- normaliza mayúsculas/minúsculas.
- normaliza acentos.
- no devuelve resultados con query menor a 2 chars.
- agrupa empresas/contactos/tratos/tareas.
- limita resultados por grupo.
- genera rutas correctas.

### Integration tests: `GlobalSearch.test.tsx`

- abre dialog al click.
- abre dialog con `Ctrl+K`.
- muestra resultados agrupados al escribir.
- navega y cierra al seleccionar resultado.
- muestra empty state sin resultados.

Hooks de datos se mockean para no depender de MSW en este componente.

## Tradeoffs

### Client-side search vs backend search

Client-side es correcto para esta etapa porque:

- no requiere contrato backend nuevo;
- el proyecto ya usa listas completas y filtros client-side;
- reduce riesgo y acelera entrega.

No es solución definitiva para grandes volúmenes.

### Sin `cmdk`

Evita dependencia nueva y simplifica testing. Se pierde navegación avanzada con flechas en primera versión, aceptable para el alcance actual.

## Migration / Rollback

No hay migración de datos. Rollback simple: quitar `GlobalSearch` del Topbar y eliminar `src/features/global-search/`.
