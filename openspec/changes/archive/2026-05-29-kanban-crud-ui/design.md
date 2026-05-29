# Design: Kanban CRUD UI (Change 5)

## Technical Approach

Completar la UI de mutación del Kanban (Change 4 dejó la plomería) homologando el patrón existente de Tratos/Empresas: Radix `Dialog` (create) + react-hook-form + zodResolver + `serverErrors` 422 para crear ficha; Radix `AlertDialog` (presentacional) para eliminar ficha y quitar columna; un hook nuevo `useQuitarColumna`. Se threadea `tableroId` por props desde `KanbanPage` hasta `KanbanColumn` (hoy no existe), requisito para quitar/asignar columna e invalidar `['tableros', tableroId]`. Back es fuente de verdad; español neutro; feature-flat ADR-040. Ver spec `kanban-management`.

## Architecture Decisions

| Decisión | Elección | Alternativa descartada | Razón |
|----------|----------|------------------------|-------|
| Fake `creadoPor` | Constante `MOCK_USER_ID = '00000000-0000-0000-0000-000000000001'` en `kanban/lib/mockUser.ts`, marcada como placeholder temporal hasta auth | Hardcode inline en dialog; reusar string `'MOCK_USER'` actual | Single source of truth, UUID válido (el back rechaza 'MOCK_USER' por `@NotNull UUID`); fácil de borrar cuando entre auth |
| Estructura form crear ficha | `FichaCreateDialog` (wrapper Dialog + `useCreateFicha`) + `FichaForm` (presentacional, rhf+zod). Schema form: `tratoId` (selector), `responsableId` (selector `useUsuarios()`). `columnaId`/`tipoFicha`/`creadoPor` los inyecta el dialog, no el form | Form monolítico con todo dentro | Homologa TratoCreateDialog+TratoForm; el form solo expone campos editables; el dialog arma el `FichaCreateInput` completo |
| "Tratos sin ficha" | Hook derivado `useTratosSinFicha()` en `kanban/lib` que cruza `useTratos()` + `useFichas()` (`tratos.filter(t => !fichas.some(f => f.tratoId === t.id))`) | Cruce inline en el dialog | Reutilizable, testeable aislado, mantiene el dialog delgado |
| `useQuitarColumna` | Hook nuevo en `kanban/hooks`. Invalida `tablerosKeys.detail(tableroId)` (igual que `useAsignarColumna`). 409 distinto de 422 | Invalidar `['columnas']`; tratar 409 como genérico | Consistencia con asignar; la columna pertenece al tablero, no al catálogo |
| Validación `limiteWip` | Nuevo `asignarColumnaSchema` en `columna.schema.ts` con `limiteWip: z.number().int().min(1)` | Validar en el hook; tocar `columnaSchema` (catálogo) | `columnaSchema` es del catálogo de lectura; el form de asignar necesita su propio schema de input |
| Ubicación de acciones | "+" (crear ficha) y "Quitar columna" en header de `KanbanColumn`; "Eliminar" en dropdown de `KanbanCard`; "Asignar columna" a nivel board (acción en `KanbanPage`/board header) | Todo a nivel board | Coherente con decisión D4; el `columnaId`/contexto está en la columna |

## Data Flow

    KanbanPage (tablero.id) ──props──> KanbanBoard (tableroId) ──props──> KanbanColumn (tableroId, columna)
       │                                                                      │  "+"            │ "Quitar"
       │                                                                      ▼                 ▼
       │                                                          FichaCreateDialog    useQuitarColumna
       │                                                          (useCreateFicha)     (DELETE eliminar-columna)
       ▼                                                                  │                     │
    Asignar columna (useAsignarColumna)                                   ▼                     ▼
       │                                                          invalida ['fichas']   invalida ['tableros', id]
       └────────────────── invalida ['tableros', tableroId] ◄──────────────────────────────────┘

    FichaForm: useTratosSinFicha() [useTratos()+useFichas()], useUsuarios() (filter activo)
    KanbanCard ──"Eliminar"──> FichaDeleteDialog (AlertDialog) ──onConfirm──> useDeleteFicha ──> ['fichas']

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `kanban/lib/mockUser.ts` | Create | `MOCK_USER_ID` UUID placeholder temporal (comentario: borrar al integrar auth) |
| `kanban/lib/useTratosSinFicha.ts` | Create | Hook derivado: tratos sin ficha activa (cruza useTratos+useFichas) |
| `kanban/hooks/useQuitarColumna.ts` | Create | DELETE eliminar-columna; invalida `['tableros', id]`; 409 distinto de 422 |
| `kanban/components/FichaForm.tsx` | Create | rhf+zod; selectores tratoId/responsableId; serverErrors 422 |
| `kanban/components/FichaCreateDialog.tsx` | Create | Dialog wrapper + useCreateFicha; inyecta columnaId/tipoFicha/creadoPor |
| `kanban/components/FichaDeleteDialog.tsx` | Create | AlertDialog presentacional (onConfirm/isDeleting) |
| `kanban/schemas/columna.schema.ts` | Modify | + `asignarColumnaSchema` con `limiteWip.min(1)` |
| `kanban/hooks/useCreateFicha.ts` | Modify | Quitar comentario 'MOCK_USER'; sin cambio funcional (el dialog pasa el UUID) |
| `kanban/components/KanbanColumn.tsx` | Modify | + prop `tableroId`; botón "+" y "Quitar columna" en header |
| `kanban/components/KanbanBoard.tsx` | Modify | + prop `tableroId`, threadea a KanbanColumn |
| `kanban/components/KanbanCard.tsx` | Modify | + dropdown con "Eliminar" (abre FichaDeleteDialog); muestra `trato.nombre` si disponible |
| `kanban/pages/KanbanPage.tsx` | Modify | Pasa `tableroId={tablero.id}`; aloja UI "Asignar columna" |

## Interfaces / Contracts

```ts
// kanban/lib/mockUser.ts — placeholder temporal hasta auth
export const MOCK_USER_ID = '00000000-0000-0000-0000-000000000001';

// kanban/hooks/useQuitarColumna.ts
interface QuitarColumnaVars { tableroId: string; columnaId: string; }
function useQuitarColumna(): UseMutationResult<void, Error, QuitarColumnaVars>;
// mutationFn: apiClient.delete(endpoints.tableros.eliminarColumna(tableroId, columnaId))
// onSuccess: invalidateQueries(tablerosKeys.detail(tableroId)); toast.success('Columna quitada')
// onError: isHttpError && status === 409 -> toast.error('La columna tiene fichas; muévelas o elimínalas antes de quitarla')
//          status === 422 -> return (no toast genérico); else toast.error(message)

// kanban/schemas/columna.schema.ts (NUEVO, junto al existente columnaSchema)
export const asignarColumnaSchema = z.object({
  limiteWip: z.number().int().min(1, 'El límite WIP debe ser al menos 1'),
  estadoTrato: estadoTrato.optional(),          // ABIERTO|GANADO|PERDIDO
  totalValorEstimado: z.number().min(0),         // @NotNull BigDecimal, default 0
});

// FichaForm schema (campos editables del usuario)
const fichaFormSchema = z.object({
  tratoId: z.string().min(1, 'Selecciona un trato'),
  responsableId: z.string().min(1, 'Selecciona un responsable'),
});
// El dialog compone FichaCreateInput: { ...formValues, columnaId, tipoFicha:'TRATO', creadoPor: MOCK_USER_ID }
```

`estadoTrato` se importa de `tablero.schema.ts` (ya exporta el enum `estadoTrato`).

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | `useTratosSinFicha` filtra correctamente; `asignarColumnaSchema` rechaza `limiteWip<1`; `mockUser` exporta UUID | vitest |
| Hook | `useQuitarColumna` invoca DELETE con id&columnaId, invalida `['tableros', id]`, 409 vs 422 distinto | renderHook + QueryClient + mock apiClient |
| Component | Dialog precarga columnaId no editable; selector muestra solo tratos sin ficha; tratoId requerido; AlertDialog cancelar no invoca DELETE | RTL + user-event |
| Integration | Crear envía `creadoPor` UUID + responsableId; 422 -> serverError en campo; eliminar ficha; asignar/quitar columna invalidan | RTL con mutaciones mockeadas |

Strict TDD: test primero, `pnpm test:run`. NUNCA `pnpm build`.

## Migration / Rollout

No migration required. Cambios aditivos (componentes/hook nuevos) + threading de `tableroId` por props. Revertir el commit del change restaura Change 4 (485/485 tests verde).

## Open Questions

- None — todas las decisiones de diseño quedaron resueltas (D1–D4 + las 6 de arquitectura).
