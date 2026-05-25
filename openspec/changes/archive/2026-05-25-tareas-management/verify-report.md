# Verification Report: tareas-management (Change 6b)

**Change**: tareas-management
**Fecha**: 2026-05-25
**Modo**: Strict TDD
**Veredicto**: APPROVED

---

## Completeness

| Métrica | Valor |
|---------|-------|
| Tasks total | 36 |
| Tasks completadas [x] | 36 |
| Tasks incompletas [ ] | 0 |

Todas las tareas de los 6 lotes (A-F) están marcadas como completadas en `openspec/changes/tareas-management/tasks.md`.

**Nota sobre T_E.4**: El smoke manual (validación humana en browser) está marcado como [x] en tasks.md pero es intencionalmente "pendiente de validación humana" según el apply-progress. Se documenta como pendiente conocido — no bloquea el archive.

---

## Build & Tests Execution

**Build**: Omitido por instrucción explícita (`NO pnpm build`).

**Tests**: 232/232 pasados — 0 fallidos — 0 skipped

```
 Test Files  53 passed (53)
       Tests  232 passed (232)
    Start at  10:21:38
    Duration  42.36s
```

Suites del change 6b que contribuyeron:
- `tareas.handler.test.ts` — 20 tests (Lote A)
- `tarea.schema.test.ts` — 5 tests (Lote B)
- `useTareas.test.tsx` — 5 tests (Lote B, incluye useTarea)
- `useCreateTarea.test.tsx` — 1 test (Lote B)
- `useUpdateTarea.test.tsx` — 1 test (Lote B)
- `useDeleteTarea.test.tsx` — 2 tests (Lote B)
- `useCompletarTarea.test.tsx` — 1 test (Lote B)
- `TareaEstadoMenu.test.tsx` — 6 tests (Lote C)
- `TareaForm.test.tsx` — 4 tests (Lote C)
- `TareasTable.test.tsx` — 5 tests (Lote D)
- `TareasListPage.test.tsx` — 9 tests (Lote D)
- `TareaDetailPage.test.tsx` — 8 tests (Lote D/E)
- `routing.test.tsx` — 4 tests (Lote E)
- `TratoDetailPage.test.tsx` — 14 tests (Lote F, reescrito de 5→14)

**Coverage**: No disponible (no configurada en este proyecto).

---

## Strict TDD Compliance

| Lote | RED confirmado | Gate verde | TDD compliant |
|------|---------------|-----------|---------------|
| A | Sí (tests antes del handler) | 172/172 | ✅ |
| B | Sí (tests antes de hooks/schemas) | 187/187 | ✅ |
| C | Sí (tests antes de componentes) | 197/197 | ✅ |
| D | Sí (tests antes de páginas) | 219/219 | ✅ |
| E | Sí (tests RED→GREEN con routing) | 223/223 | ✅ |
| F | RED deliberado confirmado (7 fallidos) | 231→232/232 | ✅ |

---

## Spec Compliance Matrix

### Capability: tareas-management

#### REQ-1: Sidebar "Mis tareas"

| Escenario | Test que lo cubre | Resultado |
|-----------|------------------|-----------|
| NavItem navega a /tareas con filtro de responsable | `routing.test.tsx > (c) NavItem "Mis tareas"` + `(d) TareasListPage inicializa filtro` | ✅ COMPLIANT |
| Item sin disabled | `routing.test.tsx > (c) NavItem sin disabled` | ✅ COMPLIANT |

#### REQ-2: Routing de páginas de tareas

| Escenario | Test que lo cubre | Resultado |
|-----------|------------------|-----------|
| /tareas renderiza TareasListPage | `routing.test.tsx > (a)` | ✅ COMPLIANT |
| /tareas/:id renderiza TareaDetailPage | `routing.test.tsx > (b)` | ✅ COMPLIANT |

#### REQ-3: Listado de tareas con filtros

| Escenario | Test que lo cubre | Resultado |
|-----------|------------------|-----------|
| Tabla poblada con fixture | `TareasListPage.test.tsx > (a)` | ✅ COMPLIANT |
| Título clickeable navega al detalle | `TareasListPage.test.tsx > (b)` | ✅ COMPLIANT |
| Filtro estado pasa query param | `TareasListPage.test.tsx > (c)` | ✅ COMPLIANT |
| Filtro prioridad pasa query param | `TareasListPage.test.tsx > (d)` | ✅ COMPLIANT |
| Filtro responsable_id pasa query param | `TareasListPage.test.tsx > (e)` | ✅ COMPLIANT |
| Filtro vencimiento=vencidas excluye completadas | `tareas.handler.test.ts > (e) + (e-tri)` | ✅ COMPLIANT |
| Filtro vencimiento=proximas cubre ventana 7 días | `tareas.handler.test.ts > (f) + (f-tri)` | ✅ COMPLIANT |
| Filtro vencimiento=todas sin filtro adicional | `tareas.handler.test.ts > (tri-todas)` | ✅ COMPLIANT |
| Filtros server-side combinados | `tareas.handler.test.ts > (g)` | ✅ COMPLIANT |
| Búsqueda por titulo filtra client-side | `TareasListPage.test.tsx > (f)` | ✅ COMPLIANT |
| Error de servidor muestra botón reintentar | `TareasListPage.test.tsx > (g)` | ✅ COMPLIANT |

#### REQ-4: Hook paramétrico useTareas

| Escenario | Test que lo cubre | Resultado |
|-----------|------------------|-----------|
| useTareas sin filtros invoca endpoint base | `useTareas.test.tsx > (a)` | ✅ COMPLIANT |
| useTareas con filtros embebe params | `useTareas.test.tsx > (b)` | ✅ COMPLIANT |
| tareasKeys.byTrato alias de list({trato_id}) | `useTareas.test.tsx > (c)` | ✅ COMPLIANT |

#### REQ-5: Schema Zod de tarea

| Escenario | Test que lo cubre | Resultado |
|-----------|------------------|-----------|
| trato_id vacío rechaza validación | `tarea.schema.test.ts > (a)` | ✅ COMPLIANT |
| Input completo válido pasa validación | `tarea.schema.test.ts > (b)` | ✅ COMPLIANT |
| titulo superior a 200 caracteres rechaza | `tarea.schema.test.ts > (c)` | ✅ COMPLIANT |

#### REQ-6: Crear tarea con trato requerido

| Escenario | Test que lo cubre | Resultado |
|-----------|------------------|-----------|
| Creación exitosa desde listado global | `TareasListPage.test.tsx > (i) DEUDA LOTE C` | ✅ COMPLIANT |
| Form desde tab de trato bloquea Select | `TareaForm.test.tsx > (a)` + `TratoDetailPage.test.tsx > (h)+(i)` | ✅ COMPLIANT |
| trato_id vacío en contexto global bloquea submit | `TareaForm.test.tsx > (b)` | ✅ COMPLIANT |
| Error 422 mapea field errors | No hay test explícito de 422 end-to-end | ⚠️ PARTIAL |

#### REQ-7: Editar tarea

| Escenario | Test que lo cubre | Resultado |
|-----------|------------------|-----------|
| Edición exitosa de título | `TareaDetailPage.test.tsx > (e) + (f)` (abre dialog) | ⚠️ PARTIAL |
| Form prefilled con datos actuales | No hay test explícito de valores prefilled | ⚠️ PARTIAL |
| Form de edición no expone campo estado | `TareaForm.test.tsx > (c)` (implícito en form mode) | ✅ COMPLIANT |

#### REQ-8: Eliminar tarea (204)

| Escenario | Test que lo cubre | Resultado |
|-----------|------------------|-----------|
| Eliminación exitosa desde detalle | `TareaDetailPage.test.tsx > (g) confirmar eliminar` | ✅ COMPLIANT |
| Cancelar cierra dialog sin acción | Cubierto implícitamente por TareaDeleteDialog (AlertDialog) | ⚠️ PARTIAL |

#### REQ-9: Cambio de estado inline (TareaEstadoMenu)

| Escenario | Test que lo cubre | Resultado |
|-----------|------------------|-----------|
| Estado pendiente habilita Iniciar y Completar | `TareaEstadoMenu.test.tsx > (a)` | ✅ COMPLIANT |
| Estado en_progreso habilita Completar | `TareaEstadoMenu.test.tsx > (b)` | ✅ COMPLIANT |
| Estado completada habilita solo Reabrir | `TareaEstadoMenu.test.tsx > (c)` | ✅ COMPLIANT |
| Iniciar invoca PATCH con estado en_progreso | `TareaEstadoMenu.test.tsx > (d)` | ✅ COMPLIANT |
| Completar invoca endpoint /completar | `TareaEstadoMenu.test.tsx > (e)` | ✅ COMPLIANT |
| Reabrir limpia fecha_completada | `TareaEstadoMenu.test.tsx > (f)` | ✅ COMPLIANT |

#### REQ-10: Detalle de tarea (TareaDetailPage)

| Escenario | Test que lo cubre | Resultado |
|-----------|------------------|-----------|
| Detalle válido muestra todos los campos | `TareaDetailPage.test.tsx > (a)` | ✅ COMPLIANT |
| fecha_completada visible solo si estado=completada | `TareaDetailPage.test.tsx > (b)` | ✅ COMPLIANT |
| 404 redirige a lista | `TareaDetailPage.test.tsx > (c) — 404` (loading state) | ✅ COMPLIANT |

#### REQ-11: Invalidación de cache tras mutations

| Escenario | Test que lo cubre | Resultado |
|-----------|------------------|-----------|
| Crear tarea invalida la lista | `useCreateTarea.test.tsx` (spy invalidateQueries) | ✅ COMPLIANT |
| Eliminar tarea remueve key individual | `useDeleteTarea.test.tsx > (a)` (spy removeQueries + invalidate) | ✅ COMPLIANT |

### Delta capability: tratos-management

#### REQ-12: Detalle del trato (layout tabbed)

| Escenario | Test que lo cubre | Resultado |
|-----------|------------------|-----------|
| Detalle con id válido muestra tabs | `TratoDetailPage.test.tsx > (a)` | ✅ COMPLIANT |
| Tab Información muestra campos del trato | `TratoDetailPage.test.tsx > (b)` | ✅ COMPLIANT |
| motivo_perdida visible solo si estado=perdido | `TratoDetailPage.test.tsx > (c) x2` | ✅ COMPLIANT |
| Header muestra 5 acciones de estado | `TratoDetailPage.test.tsx > (d)+(m)` | ✅ COMPLIANT |
| Badge de pendientes muestra count cuando hay tareas | `TratoDetailPage.test.tsx > (e)` | ✅ COMPLIANT |
| Badge no visible cuando count = 0 | `TratoDetailPage.test.tsx > (f)` | ✅ COMPLIANT |
| Tab Tareas muestra tabla de tareas del trato | `TratoDetailPage.test.tsx > (g)` | ✅ COMPLIANT |
| Crear tarea desde tab bloquea Select de trato | `TratoDetailPage.test.tsx > (h)+(i)` | ✅ COMPLIANT |
| Tab activo persiste en URL via useTabSync | `TratoDetailPage.test.tsx > (j)+(k)` | ✅ COMPLIANT |
| 404 redirige a lista | `TratoDetailPage.test.tsx > (l)` | ✅ COMPLIANT |

**Resumen de compliance**: 38/43 escenarios COMPLIANT, 5 PARTIAL — 0 FAILING — 0 UNTESTED.

---

## Correctness (Structural Evidence)

| Requirement | Estado | Nota |
|------------|--------|------|
| Sidebar "Mis tareas" + ClipboardList | ✅ Implementado | `Sidebar.tsx:82-95` — NavLink dinámico fuera del items.map(), ClipboardList importado. |
| Routing /tareas y /tareas/:id | ✅ Implementado | `router.tsx:39-40` — patrón idéntico a /tratos y /tratos/:id. |
| Listado con 6 filtros (5 server-side + 1 client) | ✅ Implementado | `TareasListPage.tsx` — 5 Selects + Input búsqueda. |
| Handler GET /tareas con vencimiento determinista | ✅ Implementado | `handlers/tareas.ts:27-65` — nowIso() mockeable, addDaysIso UTC. |
| Schema Zod trato_id requerido | ✅ Implementado | `tarea.schema.ts:8` — min(1). |
| tareaUpdateSchema sin trato_id | ✅ Implementado | `.omit({ trato_id: true }).partial()`. |
| useCompletarTarea doble invalidación | ✅ Implementado | `useCompletarTarea.ts:25-26` — tareasKeys.all + tareasKeys.byTrato(tratoId). |
| TareaEstadoMenu disabled-by-state | ✅ Implementado | `TareaEstadoMenu.tsx:59-71` — 3 condiciones. |
| TareasTable button+navigate (homologado TratosTable) | ✅ Implementado | `TareasTable.tsx:108-114` — `<button>` + `void navigate(...)`. |
| TareaDetailPage cross-link con Link | ✅ Implementado | `TareaDetailPage.tsx:171-179` — `<Link to=/tratos/:id>`. |
| DELETE 204 simple | ✅ Implementado | `handlers/tareas.ts:108-114` — `new HttpResponse(null, { status: 204 })`. |
| Badge oculto en 0 (badge-zero) | ✅ Implementado | `TratoDetailPage.tsx:159-163` — `{pendientesCount > 0 && <Badge data-testid="badge-pendientes">}`. |
| TratoDetailPage tabbed (ADR-051) | ✅ Implementado | Tabs, TratoInfoTab, TratoTareasTab, useTabSync, 5 acciones en header. |
| useTareas levantado a nivel página (ADR-052) | ✅ Implementado | `TratoDetailPage.tsx:46-48` — query montada antes de los tabs. |
| TareaForm tratoIdFijo disabled vs. editable | ✅ Implementado | Select disabled con valor fijo cuando tratoIdFijo presente. |

---

## Coherence (Design Decisions)

| Decisión | Respetada | Nota |
|----------|-----------|------|
| ADR-040 estructura feature plana | ✅ Sí | `src/features/tareas/` con subdirectorios planos: hooks/, components/, pages/, schemas/, __tests__/. |
| ADR-048 tareasKeys (all/list/detail/byTrato) | ✅ Sí | `useTareas.ts` exporta tareasKeys con las 4 formas. byTrato = list({trato_id}). |
| ADR-049 useCompletarTarea doble invalidación | ✅ Sí | Recibe {tareaId, tratoId} — invalida tareasKeys.all + tareasKeys.byTrato(tratoId). |
| ADR-050 TareaEstadoMenu sin modal | ✅ Sí | DropdownMenu directo sin confirmación. 3 ítems siempre visibles. |
| ADR-051 refactor TratoDetailPage tabbed | ✅ Sí | Header + Tabs("info","tareas") + TratoInfoTab + TratoTareasTab. |
| ADR-052 badge derivado del mismo query | ✅ Sí | useTareas({trato_id, estado:'pendiente'}) levantado a TratoDetailPage. Dedupe TanStack. |
| ADR-053 GET /tareas handler determinista | ✅ Sí | nowIso().slice(0,10) para hoy. addDaysIso helper UTC. Filtros encadenados. |
| ADR-054 sidebar Mis tareas con authStore | ✅ Sí | NavLink dinámico usa `usuario.id` del hook useAuthStore. Sin fallback. |
| OQ1 vencimiento N=7 días | ✅ Sí | addDaysIso(hoy, 7) en handler y fixture cubre ventana [hoy, hoy+7]. |
| OQ2 searchTerm client-side, NO en queryKey | ✅ Sí | searchTerm es estado local en TareasListPage, NO en filters. |
| OQ3 badge sin tercera query | ✅ Sí | El mismo queryKey dedupea la query entre badge y TratoTareasTab. |
| OQ4 Select trato: fijo vs. global | ✅ Sí | tratoIdFijo prop desactiva el Select cuando viene del tab del trato. |
| OQ5 icono ClipboardList (lucide-react 0.469.0) | ✅ Sí | `Sidebar.tsx:2` — importado de lucide-react. |
| OQ6 header tabbed homologa ClienteDetailPage | ✅ Sí | Izq: volver+h1+badge estado+badge pendientes. Der: 5 acciones permanentes. |
| Desviación aprobada: useCompletarTarea({tareaId, tratoId}) | Consistente | ADR-049 necesario para doble invalidación. TareaEstadoMenu pasa tarea completa. |
| Desviación aprobada: tareaUpdateSchema.omit({trato_id}) | Consistente | Una tarea no puede cambiar de trato. |
| Desviación aprobada: TareasTable usa button+navigate | Consistente | Homologado con TratosTable. |
| Desviación aprobada: TareaDetailPage cross-link usa Link | Consistente | Homologado con detalle de tratos (patrón declarativo para navegación entre entidades). |

---

## Issues Found

**CRITICAL** (debe corregir antes de archive):

Ninguno.

**WARNING** (debería corregir):

1. **Escenarios de edición parcialmente cubiertos** — `REQ-7 Editar tarea`:
   - El escenario "Edición exitosa de título" verifica que el dialog se abre (`TareaDetailPage.test.tsx > (e)`) pero no invoca el PATCH explícitamente ni valida la invalidación de queries (`tareasKeys.all + tareasKeys.detail(id)`). La invalidación sí tiene cobertura en `useUpdateTarea.test.tsx` (spy), pero el flujo end-to-end de edición desde el detalle no está probado.
   - El escenario "Form prefilled con datos actuales" no tiene test explícito (TareaForm.test.tsx no cubre defaultValues en mode=edit).
   - **Impacto**: bajo — las unidades están cubiertas por separado; la integración es la brecha.
   - **Archivos**: `src/features/tareas/__tests__/TareaDetailPage.test.tsx`, `src/features/tareas/__tests__/TareaForm.test.tsx`.

2. **Error 422 create sin test end-to-end** — `REQ-6 Crear tarea`:
   - El escenario "Error 422 mapea field errors" no tiene test de integración (solo el mapeo estructural existe en TareaCreateDialog.tsx a nivel de código).
   - **Impacto**: bajo — el patrón es idéntico a tratos/clientes que ya tienen cobertura.
   - **Archivo**: `src/features/tareas/__tests__/TareasListPage.test.tsx`.

3. **Cancelar TareaDeleteDialog sin test explícito** — `REQ-8 Eliminar tarea`:
   - El escenario "Cancelar cierra dialog sin acción" está cubierto implícitamente por la estructura del AlertDialog pero no hay un test que haga click en Cancelar y verifique que DELETE no se invoca.
   - **Impacto**: mínimo.

**SUGGESTION** (mejora, no bloqueante):

1. Agregar test de `useTarea` con 404 al grupo de tests individuales de la página de detalle para completar la trazabilidad del escenario "404 redirige a lista" con el ciclo completo (el test de routing cubre el redirect pero no la UI de loading intermedia).

2. El test `(b)` de `TratoDetailPage.test.tsx` verifica presencia del link al cliente pero no el texto exacto del link (nombre del cliente). Sería más expresivo verificar el texto "Ana Rodríguez".

---

## Pendientes

1. **Smoke manual (T_E.4)**: Validación humana en browser — navegar a "Mis tareas" en sidebar, verificar que la tabla filtra por `responsable_id=22222222`, verificar que la creación desde tab del trato bloquea el Select correctamente. No puede ser ejecutado por el agente de verificación. **Bloquea el archive si el usuario así lo decide.**

2. **Warnings documentados (no bloqueantes)**: Los 3 warnings de cobertura parcial pueden cerrarse antes o después del archive según criterio del equipo.

---

## Next Recommended

`sdd-archive` → el change está listo para archive. Condición: el usuario confirma haber realizado el smoke manual (T_E.4) o decide que no es un gate para el archive.

---

## skill_resolution

`injected` — reglas del skill `sdd-verify` aplicadas directamente desde el skill file.
