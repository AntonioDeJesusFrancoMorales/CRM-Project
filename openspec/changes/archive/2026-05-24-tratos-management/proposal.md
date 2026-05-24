# Proposal: tratos-management (Change 6a)

## Intent

Convertir `Trato` en entidad de primer nivel del CRM Pipely: CRUD completo, cambio de estado inline (ganar/perder con motivo), y polimorfismo `cliente_id`/`prospecto_id`. Cierra la brecha entre el contrato API (ya existente) y la UI (hoy placeholder en `/tratos`). Habilita el ciclo de vida real de oportunidades comerciales, paso previo obligatorio al Kanban (Change 7).

Plan macro #104 listaba "Change 6 = Tratos + Tareas". Tras dimensionar (~8-9 lotes monolíticos vs ~5 por separado), se partió en **6a = Tratos** y **6b = Tareas**. Mantiene PRs digeribles y respeta el ritmo de Changes 3-5.

## Scope

### In Scope
- CRUD completo Trato (listado filtrable, crear/editar via Dialog, eliminar con 409 si hay tareas).
- Cambio de estado inline `abierto → ganado | perdido` desde tabla (DropdownMenu por fila) y detalle.
- **Modal obligatorio** `TratoPerderDialog` con `motivo_perdida` requerido (Zod) al transicionar a `perdido`.
- Form con **toggle "Asociar a:"** (Cliente | Prospecto) + Select dependiente. **Zod XOR**: exactamente uno, nunca ambos ni ninguno.
- **Migración atómica** del hook `useTratosByCliente` desde `features/clientes/` a `features/tratos/` (estilo ADR-032 de Change 5) → unificar en `useTratos({ cliente_id?, prospecto_id?, estado? })`.
- **Habilitar sidebar** Tratos (patrón recurrente #155, tarea explícita).
- **UX deferida**: (a) fix WARN-05 `<a>` anidado en `ProspectoConvertidosList.tsx`, (b) botón "Crear trato" + link al detalle en tab Tratos del cliente, (c) link desde prospecto convertido al cliente y sus tratos.
- Override `DELETE /tratos/:id` en MSW handler → 409 si hay tareas asociadas.

### Out of Scope
- CRUD de Tareas (Change 6b).
- Kanban / dnd-kit (Change 7).
- Componente shadcn `Command`/Combobox (diferido si volumen lo justifica).
- Etiquetas, comentarios (Change 8).

## Capabilities

### New Capabilities
- `tratos-management`: listado, filtros, CRUD, cambio de estado, polimorfismo, sidebar.

### Modified Capabilities
- `clientes-management`: requirement "Tab Tratos del detalle" (línea 258 spec actual) pasa de read-only sin links a permitir botón "Crear trato" + link al detalle del trato.
- `prospecto-conversion` o `prospectos-management` (sdd-spec resuelve cuál): nuevo requirement de cross-links desde prospecto convertido al cliente resultante y sus tratos.

## Approach

Approach 1 de exploración (hook paramétrico único) + opción A polimorfismo (doble Select condicional) + DropdownMenu estado inline. `useDeleteCliente`, `ClienteForm`, `ClienteDetailPage` son plantillas directas. Backend mock ya cubre 80% (solo falta override DELETE 409). Detalle técnico → `sdd-design`.

## Affected Areas

| Área | Impacto | Descripción |
|---|---|---|
| `src/features/tratos/` | Nuevo | Feature completo greenfield |
| `src/routes/router.tsx`, `placeholders.tsx` | Modificado | Wirear `/tratos`, `/tratos/:id`; eliminar `TratosPlaceholder` |
| `src/components/layout/Sidebar.tsx` | Modificado | Quitar disabled+badge línea 19 |
| `src/mocks/handlers/tratos.ts` | Modificado | Override DELETE 409 si hay tareas |
| `src/features/clientes/hooks/useTratosByCliente.ts` | Eliminado | Migrado a `useTratos` |
| `src/features/clientes/hooks/useClientes.ts` | Modificado | Quitar `clientesKeys.tratos` |
| `src/features/clientes/components/ClienteTratosTab.tsx` | Modificado | Consumir `useTratos` + botón crear + link al detalle |
| `src/features/prospectos/components/ProspectoConvertidosList.tsx` | Modificado | Fix WARN-05 + links a cliente/tratos |
| `openspec/specs/clientes-management/spec.md` | Delta | Revisar requirement "Tab Tratos del detalle" |

## Risks

| Riesgo | Probabilidad | Mitigación |
|---|---|---|
| Zod XOR refine net-new | Media | ADR específica en sdd-design con schema completo |
| WARN-05 fix conceptual | Media | sdd-design decide componente que cambia; test HTML válido |
| Migración no atómica deja consumidor roto | Baja | Commit único con consumidor + hook (patrón ADR-032) |
| Creep de UX deferida | Media | Cada mejora = tarea separada en sdd-tasks |
| Pattern #155 escapa a tests | Alta | Tarea explícita en sdd-tasks + smoke manual |

## Rollback Plan

Lotes implementados como commits atómicos por capa (mocks → schema → hooks → components → pages → wiring/sidebar → UX deferida). Cada commit revertible individual vía `git revert <sha>` sin tocar Change 5. La migración del hook (ADR-041 candidata) es **un único commit** — revertir restaura el hook viejo y su consumidor en un paso. Mejoras UX van en commits separados de prospectos y clientes → revert quirúrgico.

## Dependencies

- Change 5 (`clientes-management`) cerrado ✅
- Contrato API `Trato`/`Tarea` en `types.ts` ✅
- MSW handler `tratos.ts` ya implementado al 80% ✅

## Success Criteria

- [ ] Sidebar "Tratos" navegable, lleva a `/tratos`.
- [ ] CRUD Trato funciona: crear con XOR cliente/prospecto, editar, eliminar (con 409 si hay tareas).
- [ ] Cambio de estado inline desde tabla o detalle; `perdido` exige `motivo_perdida` vía modal.
- [ ] Tab Tratos del cliente permite crear trato (prefilled) y navegar al detalle.
- [ ] WARN-05 resuelto (HTML válido sin `<a>` anidado).
- [ ] `pnpm test:run` verde con tests Strict TDD por hook/componente/página.
- [ ] `pnpm tsc --noEmit` exit 0; lint sin errores nuevos.
- [ ] Spec delta `clientes-management` actualizado en archivar.

## Open Questions for sdd-design

1. **DropdownMenu estado inline — estilo exacto**: ¿ítems "Marcar ganado" / "Marcar perdido…" / "Reabrir"? ¿deshabilitar opciones según estado actual?
2. **XOR Zod refine — firma exacta**: `superRefine` con custom issue, o `refine` con discriminated union por toggle. Decisión afecta UX de errores.
3. **WARN-05 fix — componente que cambia**: ¿el `<Link>` externo se vuelve `<button role="link">` con navigate?, ¿o el interno?, ¿o se rediseña la fila?
4. **Capability del cross-link prospecto→cliente**: ¿spec `prospecto-conversion` o `prospectos-management`? Requiere leer ambos.
5. **Fixture trato sin tareas**: agregar un trato adicional al fixture para validar el path DELETE 204 (hoy todos los tratos del fixture activo probablemente tienen tareas o ninguno — confirmar).
6. **Backend dual endpoint**: `GET /clientes/:id/tratos` queda huérfano en frontend tras migración. ¿Deprecar handler MSW o dejar para retro-compat? Recomendación: dejar el handler hasta limpieza posterior.

## ADR Candidates (numeración continúa desde ADR-039 de Change 5)

- ADR-040: Hook paramétrico `useTratos({ filters })` + queryKeys propias bajo namespace `tratos`.
- ADR-041: Migración atómica `useTratosByCliente` → `useTratos({ cliente_id })` en un único commit.
- ADR-042: Zod XOR refine para `cliente_id`/`prospecto_id`.
- ADR-043: Modal obligatorio `TratoPerderDialog` para `motivo_perdida` (vs validación inline en form).
- ADR-044: DropdownMenu por fila para cambio de estado inline (vs Select inline o botones).
- ADR-045: WARN-05 fix — estrategia de des-anidamiento de `<Link>` en `ProspectoConvertidosList`.
- ADR-046: Override `DELETE /tratos/:id` con 409 si hay tareas (homologa ADR-031 de clientes).
- ADR-047: Tarea explícita habilitar sidebar (institucionaliza patrón #155).

## Test Surface (Strict TDD activo — runner `pnpm test:run`)

Tests requeridos por capa, todos escritos **antes** de la implementación:
- Hooks: 1 test por `useTratos`, `useTrato`, `useCreate/Update/DeleteTrato`, `useGanarTrato`, `usePerderTrato`.
- Componentes: `TratosTable`, `TratoForm` (XOR validation, modos create/edit), `TratoEstadoMenu`, `TratoPerderDialog`.
- Páginas: `TratosListPage` (filtros + lista), `TratoDetailPage` (load, 404, acciones).
- MSW handler: DELETE 409.
- Regresión: tests del tab Tratos del cliente (botón crear + nav), tests de `ProspectoConvertidosList` post-WARN-05 fix.
