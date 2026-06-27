# Proposal: global-search-client-side

## Intent

Agregar una búsqueda global frontend-only para que el usuario pueda encontrar rápidamente empresas, contactos, tratos y tareas desde cualquier pantalla protegida de Pipely.

La funcionalidad debe sentirse como una command palette liviana: accesible desde el Topbar, con atajo de teclado, resultados agrupados por entidad y navegación directa al detalle.

## Scope

### In Scope

- Botón de búsqueda global en `Topbar`.
- Dialog de búsqueda con input enfocado al abrir.
- Atajo `Ctrl/Cmd + K` para abrir/cerrar.
- Búsqueda client-side sobre:
  - empresas
  - contactos
  - tratos
  - tareas
- Resultados agrupados por entidad.
- Navegación a:
  - `/empresas/:id`
  - `/contactos/:id`
  - `/tratos/:id`
  - `/tareas/:id`
- Estados UX:
  - query vacía
  - cargando
  - error parcial
  - sin resultados
- Tests de lógica pura de búsqueda.
- Tests de integración del componente principal.

### Out of Scope

- Backend `/search`.
- Paginación server-side.
- Ranking avanzado/fuzzy search.
- Búsqueda sobre WhatsApp, agenda, usuarios, roles o etiquetas.
- Crear entidades desde la búsqueda.
- Historial de búsquedas recientes.
- Dependencia `cmdk` u otra command palette externa.

## Capabilities

### New Capabilities

- `global-search`: búsqueda global client-side sobre entidades principales del CRM.

### Modified Capabilities

- `app-shell`: Topbar incorpora acceso a búsqueda global.

## Approach

1. Crear utilidades puras de búsqueda:
   - normalización de texto
   - armado de índice por entidad
   - filtrado por query
   - límite por grupo
2. Crear `GlobalSearch` como componente autocontenido:
   - consume hooks existentes
   - abre dialog desde botón
   - maneja atajo `Ctrl/Cmd + K`
   - navega al seleccionar resultado
3. Integrar `GlobalSearch` en `Topbar`.
4. Agregar tests:
   - unitarios de `search.ts`
   - integración de `GlobalSearch`
   - ajustar `Topbar.test.tsx` solo si hace falta.

## Affected Areas

| Area | Impact | Description |
| --- | --- | --- |
| `src/features/global-search/` | New | Componente, lib y tests de búsqueda global. |
| `src/components/layout/Topbar.tsx` | Modified | Agrega botón/componente de búsqueda global. |
| `src/components/layout/__tests__/Topbar.test.tsx` | Modified | Mocks/expectativas si el nuevo componente afecta render. |

## Risks

| Risk | Likelihood | Mitigation |
| --- | --- | --- |
| Performance con muchos registros | Media futura | Limitar resultados por entidad y documentar que es FE-only. |
| UI sobrecargada en mobile | Media | Botón compacto en Topbar y dialog responsive. |
| Tests difíciles por hooks reales | Media | Mockear hooks en tests de UI; lógica pura testeada aparte. |
| Resultados pobres por falta de relaciones | Baja | Primera versión simple; enriquecer después. |

## Rollback Plan

- Eliminar `src/features/global-search/`.
- Quitar import/render de `GlobalSearch` en `Topbar.tsx`.
- Revertir tests asociados.

## Dependencies

- Hooks existentes: `useEmpresas`, `useContactos`, `useTratos`, `useTareas`.
- Componentes UI existentes: `Dialog`, `Input`, `Button`, `Badge`, `ScrollArea`.
- React Router `useNavigate`.

## Success Criteria

- [ ] El Topbar muestra acceso a búsqueda global.
- [ ] `Ctrl/Cmd + K` abre el dialog de búsqueda.
- [ ] Query de al menos 2 caracteres muestra resultados agrupados.
- [ ] Seleccionar una empresa navega a `/empresas/:id`.
- [ ] Seleccionar un contacto navega a `/contactos/:id`.
- [ ] Seleccionar un trato navega a `/tratos/:id`.
- [ ] Seleccionar una tarea navega a `/tareas/:id`.
- [ ] Sin resultados muestra empty state claro.
- [ ] Loading/error parcial no rompe el Topbar.
- [ ] Tests nuevos pasan con `pnpm test:run` o comando focal equivalente.
