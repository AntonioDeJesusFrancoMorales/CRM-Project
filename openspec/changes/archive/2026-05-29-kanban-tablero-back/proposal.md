# Proposal: Kanban de Tratos backed por el contrato real del back

## Intent

El Change 3 eliminó el Kanban inventado (ADRs 055-061) y dejó al Trato sin ciclo de vida: el modelo ya no expone `estado`. El back AR-CRM sí modela el ciclo vía Tablero/Columna/Ficha, pero el front no lo consume. Además arrastra la deuda W1: `tieneTratosActivos` usa `length>0`, bloqueando INACTIVO con cualquier trato (incluso GANADO/PERDIDO). Este Change reintroduce el Kanban REAL de Tratos y deriva el estado del trato desde la columna.

## Scope

### In Scope
- Nueva feature `kanban` (solo `TipoTablero.TRATOS`).
- Schemas zod: Tablero, ColumnaTableroDto, Columna (catálogo), Ficha — alineados al contrato RPC.
- Hooks: `useTableros`/`useColumnas`/`useFichas` + `useCreate/useUpdate/useDelete`. Mover ficha = `useUpdateFicha` cambiando `columnaId` (no hay endpoint dedicado).
- Tablero Kanban con `@dnd-kit/core` (drag solo ENTRE columnas).
- Reescritura de fixtures + handlers MSW de tableros al patrón RPC (`?id=`).
- `endpoints.ts`: agregar tableros/columnas/fichas.
- Derivación de estado del trato: `tratoId → Ficha → columna.estadoTrato`.
- Fix W1 en ContactoDetailPage (`tieneTratosActivos` = alguna ficha del trato en columna `estadoTrato === ABIERTO`).
- Habilitar entrada Tableros en Sidebar; reemplazar `TablerosPlaceholder`.

### Out of Scope
- Tableros `TAREAS` (futuro Change).
- Persistencia de orden intra-columna (orden derivado del back, ej. `creadoEn`).
- Auth, gestión de usuarios.
- Re-agregar campo `estado` al modelo Trato.

## Capabilities

### New Capabilities
- `kanban-management`: tablero TRATOS, columnas en contexto de tablero, fichas como tarjetas, mover ficha entre columnas, derivación del estado del trato desde la columna.

### Modified Capabilities
- `tratos-management`: el estado del trato (ABIERTO/GANADO/PERDIDO) se documenta como derivado de la ficha/columna; el modelo Trato no cambia.
- `contactos-management`: regla de `tieneTratosActivos` pasa a derivar de `estadoTrato === ABIERTO` (fix W1).

## Approach

Feature-flat ADR-040: `src/features/kanban/{schemas,hooks,components,pages,__tests__}`. Render del tablero = 2 llamadas (`tableros/get-by-id` para estructura + `fichas/get-all` filtrado client-side por `columnaId`). El estado del trato se deriva cruzando `ficha.tratoId` con `columna.estadoTrato`. DnD ejecuta `PUT /api/fichas/edit` con el nuevo `columnaId` (estado completo de la ficha en cliente). W1 reusa la derivación cargando fichas en ContactoDetailPage.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/features/kanban/` | New | Feature completa kanban |
| `src/api/endpoints.ts` | Modified | tableros/columnas/fichas |
| `src/mocks/fixtures/tableros.ts` | Modified | Reescritura al contrato RPC |
| `src/mocks/handlers/tableros.ts` | Modified | Rutas RPC `?id=` |
| `src/features/contactos/.../ContactoDetailPage.tsx` | Modified | Fix W1 |
| `src/components/layout/Sidebar.tsx` | Modified | Habilitar Tableros |
| `src/routes/placeholders.tsx` | Modified | Quitar TablerosPlaceholder |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Costo de red al cargar fichas para derivar estado (W1, D2) | Med | Reusar query cache de fichas; queryKey compartida |
| Nombres de enums del back sin confirmar (`TipoEstadoColumnaTableroTrato`) | Med | Confirmar en spec/design contra Java |
| `totalValorEstimado` obligatorio en asignar-columna | Low | Definir en schema en design |

## Rollback Plan

Revertir el commit del feature. Como la feature es aditiva (nueva carpeta + endpoints + handlers reescritos), restaurar `TablerosPlaceholder` y el Sidebar `disabled` revierte la UI. El fix W1 vuelve a `length>0`.

## Dependencies

- Nueva dependencia: `@dnd-kit/core` (re-agregar, desinstalada en Change 3).

## Success Criteria

- [ ] Tablero TRATOS renderiza columnas y fichas desde el back (mocked MSW al contrato RPC).
- [ ] Drag mueve una ficha entre columnas vía `PUT /api/fichas/edit`.
- [ ] Estado del trato se deriva correctamente de la columna.
- [ ] `tieneTratosActivos` deriva de `estadoTrato === ABIERTO`.
- [ ] Fixtures/handlers de tableros siguen el patrón RPC del back.
