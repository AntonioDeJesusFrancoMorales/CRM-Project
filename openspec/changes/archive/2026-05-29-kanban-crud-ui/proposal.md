# Proposal: Kanban CRUD UI (Change 5)

## Intent

Change 4 dejó toda la plomería del Kanban (hooks de lectura/escritura, board DnD, derivación de estado) pero sin UI para mutar. Quedaron 5 scenarios PARTIAL en el verify: crear ficha, eliminar ficha, asignar columna y quitar columna desde la interfaz. Change 5 completa esa UI CRUD sobre la plomería existente y corrige dos bugs de contrato contra el back AR-CRM (MOCK_USER no-UUID y `limiteWip` sin `@Min(1)`).

## Scope

### In Scope
- `FichaCreateDialog` + `FichaForm`: crear ficha TRATO con selector de trato (solo tratos sin ficha), selector de responsable (`useUsuarios()`), `columnaId` precargado.
- `FichaDeleteDialog`: confirmación AlertDialog desde `KanbanCard` (hook interno).
- Botón "+" en header de cada `KanbanColumn` que precarga `columnaId`.
- Botón "Quitar columna" en header de `KanbanColumn` + NUEVO hook `useQuitarColumna` (`DELETE /tableros/eliminar-columna`, maneja 409 cuando la columna tiene fichas).
- UI "Asignar columna" al tablero (catálogo `useColumnas()` + `limiteWip`/`estadoTrato`/`totalValorEstimado`).
- Fix bug: `creadoPor` = UUID fake fijo `00000000-0000-0000-0000-000000000001`.
- Fix bug: validación `limiteWip` `.min(1)` en schema/hook de asignar columna.
- (Opcional UX) `KanbanCard` muestra `trato.nombre` en vez del UUID.

### Out of Scope
- Catálogo CRUD de columnas (Create/Edit/Delete `Columna`).
- Reordenar columnas con drag.
- Editar ficha desde UI (hook `useUpdateFicha` ya existe; sin dialog en este change).

## Capabilities

### New Capabilities
- None

### Modified Capabilities
- `kanban-management`: añade requisitos de UI para crear/eliminar fichas, asignar/quitar columnas del tablero, y corrige el contrato de `creadoPor` (UUID válido) y `limiteWip` (`@Min(1)`).

## Approach

Homologar al patrón existente (TratoCreateDialog+TratoForm, TratoDeleteDialog, EmpresaDeleteDialog): Radix Dialog para crear, AlertDialog para borrar, react-hook-form + zodResolver, manejo `serverErrors` 422. El selector de responsable reutiliza `useUsuarios()` tal como ya lo hace `TratoForm`. El selector de trato cruza `useTratos()` + `useFichas()` filtrando tratos sin ficha. Strict TDD: test primero, `pnpm test:run`.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/features/kanban/components/FichaCreateDialog.tsx` | New | Dialog crear ficha |
| `src/features/kanban/components/FichaForm.tsx` | New | Form rhf+zod |
| `src/features/kanban/components/FichaDeleteDialog.tsx` | New | AlertDialog borrar |
| `src/features/kanban/hooks/useQuitarColumna.ts` | New | DELETE eliminar-columna, 409 |
| `src/features/kanban/components/KanbanColumn.tsx` | Modified | Botón "+" y "Quitar columna" |
| `src/features/kanban/components/KanbanCard.tsx` | Modified | Dropdown eliminar + nombre trato |
| `src/features/kanban/schemas/*` | Modified | `limiteWip.min(1)`, schema form ficha |
| `src/features/kanban/lib/mockUser.ts` | New | `MOCK_USER_ID` UUID fake |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| 409 al quitar columna con fichas | Med | `useQuitarColumna` maneja 409 con mensaje claro, distinto de 422 |
| `limiteWip=0` rechazado por back | Med | `.min(1)` en Zod del form asignar columna |
| Crear fichas duplicadas por trato | Low | Selector filtra tratos sin ficha (D3) |
| `useUsuarios()` ausente | Resuelto | VERIFICADO: existe y ya se usa en TratoForm como selector responsableId |

## Rollback Plan

Componentes y hook nuevos son aditivos; revertir el commit del change restaura el estado de Change 4 (485/485 tests). Los fixes de schema (`limiteWip.min(1)`, `MOCK_USER_ID`) se revierten con el mismo commit sin afectar lectura.

## Dependencies

- Change 3 (`useUsuarios()` para selector de responsable) — VERIFICADO presente.
- Change 4 (hooks y board Kanban) — archivado, base de la rama.

## Success Criteria

- [ ] Los 5 scenarios PARTIAL del verify de Change 4 quedan cubiertos.
- [ ] Crear ficha envía `creadoPor` UUID válido y `responsableId` elegido del selector.
- [ ] Asignar columna valida `limiteWip >= 1` antes de enviar.
- [ ] Quitar columna con fichas muestra mensaje 409 sin romper la UI.
- [ ] `pnpm test:run` verde (sin regresiones).
