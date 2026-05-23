# Proposal: Prospectos CRUD (Change 4)

**Change**: prospectos-crud
**Fecha**: 2026-05-22 (America/Mexico_City)
**Autor**: orchestrator + sub-agent sdd-propose
**Persistencia**: hybrid
**Strict TDD**: enabled

## Intent

Reemplazar el placeholder de `/prospectos` por la **vista completa de Prospectos con layout Kanban** y la **página de detalle `/prospectos/:id`**, habilitando el pipeline comercial central del CRM Pipely: gestionar el embudo de leads por estado, convertir prospectos en clientes con trazabilidad de origen, y consultar tratos vinculados desde el detalle.

Es el primer Change que rompe el patrón de tabla densa establecido en Empresas y Usuarios — el Kanban es la unidad de trabajo natural de un comercial y desbloquea visualmente el flujo `frío → tibio → caliente → convertido`. Ahora es el momento porque los dos cambios previos (Empresas y Usuarios) ya proveen los hooks reusables (`useEmpresas`, `useUsuarios`) que los Selects del form de prospecto consumirán, y los patrones de testing strict-TDD están establecidos.

El Change también introduce los primeros cambios al **contrato de tipos** (`src/api/types.ts`) desde Change 1: agrega el valor `'convertido'` al enum `EstadoPosibleCliente` y el campo `prospecto_origen_id` a `Cliente`. Estos cambios son la base arquitectónica para la trazabilidad prospecto-cliente, y bloquean implícitamente el archivo `EmpresaProspectosTab.tsx` (Change 2) que usa records exhaustivos sobre el enum.

## Scope

### In Scope

- Instalación de primitivos shadcn faltantes: `collapsible`, `scroll-area`
- Feature completa `src/features/prospectos/` con 5 carpetas (`schemas/`, `hooks/`, `components/`, `pages/`, `__tests__/`)
- Schema Zod `prospecto.schema.ts` con tipos `ProspectoCreateInput` y `ProspectoUpdateInput`
- 7 hooks TanStack Query: `useProspectos`, `useProspecto`, `useProspectoTratos`, `useCreateProspecto`, `useUpdateProspecto`, `useDeleteProspecto`, `useConvertirProspecto`
- Componentes UI del Kanban: `ProspectoKanban`, `ProspectoKanbanColumn`, `ProspectoCard`, `ProspectosConvertidos`
- Componentes de form y diálogos: `ProspectoFormDialog`, `ProspectoForm`, `ProspectoDeleteDialog`, `ConvertirProspectoDialog`
- Componentes del detalle: `ProspectoInfoTab`, `ProspectoTratosTab`
- Página `ProspectosListPage` con tabs nivel-superior **Activos / Convertidos** y top-bar (búsqueda + Select responsable + toggle "solo míos")
- Página `ProspectoDetailPage` (`/prospectos/:id`) con tabs **Información / Tratos** + acciones (Convertir / Editar / Eliminar / Select estado in-place)
- Layout **Kanban de 3 columnas activas** (`frio`, `tibio`, `caliente`) con cards que permiten cambiar de estado vía Select inline
- Tab "Convertidos" con vista default "convertidos este mes" (join `clientes[].creado_en` por `prospecto_origen_id`) y `Collapsible` "Ver convertidos anteriores"
- **Edición post-conversión bloqueada salvo notas**: cuando `estado === 'convertido'`, el form abre con todos los campos `disabled` salvo `notas`
- **Cambios al contrato (5 modificaciones, 1 bloqueante)**:
  1. `src/api/types.ts` — `EstadoPosibleCliente` suma `'convertido'`
  2. `src/api/types.ts` — `Cliente` suma `prospecto_origen_id: string | null`
  3. `src/mocks/handlers/prospectos.ts` — handler `POST /prospectos/:id/convertir` muta el prospecto (`estado='convertido'` + `actualizado_en`) y setea `prospecto_origen_id` en el cliente nuevo
  4. `src/mocks/fixtures/clientes.ts` — agregar `prospecto_origen_id: null` a los 2 clientes existentes (compilación)
  5. **BLOQUEANTE**: `src/features/empresas/components/EmpresaProspectosTab.tsx` — actualizar los `Record<EstadoPosibleCliente, string>` (líneas 17-27) para incluir entrada `convertido` EN EL MISMO COMMIT que `types.ts`
- Fixture opcional: 1-2 prospectos con estado `'convertido'` para datos de prueba del tab Convertidos
- 6 tests Vitest strict-TDD (RED→GREEN): `useProspectos`, `useCreateProspecto`, `useDeleteProspecto`, `useConvertirProspecto`, `ProspectosListPage`, `ProspectoDetailPage`
- Wiring en `src/routes/router.tsx`: reemplazar `ProspectosPlaceholder` por `ProspectosListPage` y agregar ruta `/prospectos/:id`
- Eliminar export de `ProspectosPlaceholder` en `src/routes/placeholders.tsx`

### Out of Scope

- CRUD de tratos (es otro Change — aquí solo se consume read-only `GET /prospectos/:id/tratos`)
- Drag-and-drop entre columnas del Kanban (decisión final: Select inline en card; sin librería DnD)
- Paginación o virtualización del Kanban (documentado como Riesgo R6 — futuro, YAGNI con fixtures actuales)
- Bulk actions (selección múltiple de cards, conversión masiva)
- Export CSV o impresión
- Filtro top-bar por `estado_posible_cliente` (eliminado definitivamente — redundante con el agrupamiento visual del Kanban)
- Prefetch explícito del tab Tratos (lazy default de Radix es suficiente)
- Endpoint `PATCH /prospectos/:id/restaurar` (no aplica — un convertido no se "des-convierte")
- Cambios al `useAuthStore`, `RoleGuard`, Login, Empresas (más allá del fix bloqueante de `EmpresaProspectosTab.tsx`) o cualquier otra feature
- Optimistic updates
- Dark mode toggle, responsive mobile

## Rationale

| Decisión | Rationale |
|----------|-----------|
| Kanban como layout principal (no tabla) | Es la representación natural del pipeline comercial. Un prospecto se mueve en estados — la columna comunica el estado visualmente sin necesidad de leer una celda. La tabla densa de Empresas/Usuarios es ideal para datos planos; el prospecto NO lo es. |
| Filtrado Activos/Convertidos **client-side** (Opción B del explore) | El hook `useProspectos()` trae todo el store; `ProspectoKanban` filtra `!== 'convertido'` y el tab Convertidos filtra `=== 'convertido'`. Mantiene el handler simple, evita breaking change en el endpoint, y con 3-5 registros fixture el overhead es despreciable. Si crece, se agrega paginación server-side en un Change futuro. |
| `'convertido'` como **valor del enum** (no campo separado `convertido: boolean`) | El estado de un prospecto es una sola dimensión, no dos. Tener un campo `estado` + `convertido` desnormaliza y abre la puerta a estados inconsistentes (`estado='caliente'` AND `convertido=true`). El enum es la fuente de verdad. |
| `prospecto_origen_id` en `Cliente` (FK desde Cliente, no espejo en Prospecto) | La relación es 1:1 desde el lado del cliente convertido. Poner la FK en `Cliente` mantiene la dirección semántica correcta ("este cliente vino de este prospecto") sin duplicar info. El prospecto retiene su identidad como registro histórico. |
| Edición post-conversión limitada a `notas` | Los datos de contacto del prospecto convertido ya viven en `Cliente`. Editarlos en el prospecto crea divergencia de datos. La nota es la única información que tiene sentido seguir actualizando (contexto histórico tipo "convertido por referido especial"). Bloqueo es **client-side** (campos `disabled` en el form). |
| Select inline para cambio de estado (no drag-and-drop) | DnD requiere librería externa (`@dnd-kit` ~30 KB), polyfills adicionales para tests, y complejidad de UX (zonas de drop, validación, accesibilidad). Select inline es accesible por defecto, testeable trivialmente con `userEvent.selectOptions`, y el usuario lo confirmó. |
| Filtro top-bar de estado **eliminado** | Confirmado en checkpoint post-explore: el Kanban ya agrupa visualmente por estado. Tener otro filtro encima sería redundancia que confunde. Top-bar final: búsqueda + responsable + toggle "solo míos". |
| Tab "Convertidos" con default "este mes" + Collapsible "anteriores" | Un comercial revisa típicamente lo reciente (cuántas conversiones este mes); los anteriores son referencia histórica. Mostrar todo de golpe en una lista plana pierde la métrica relevante. El Collapsible mantiene la UI limpia y el dato accesible. |
| Reuso de `useEmpresas()` y `useUsuarios()` para Selects del form | Patrón ya establecido. No duplicar fetchers. Los hooks son cacheables por React Query y se invalidan apropiadamente. |
| Lazy loading del tab Tratos (default Radix, sin prefetch) | El usuario abre el detalle típicamente para ver info, no tratos. Cargar tratos antes es overhead innecesario. Si en el futuro se mide que el 80% de usuarios siempre va al tab Tratos, se puede agregar `prefetchQuery` al hover del trigger. YAGNI. |
| Cambio bloqueante a `EmpresaProspectosTab.tsx` en el **mismo commit** que `types.ts` | TypeScript reportará error en los `Record<EstadoPosibleCliente, string>` apenas se agregue `'convertido'`. Separarlos en commits distintos rompe el build en el medio (`bisect` queda peor). Política: un solo commit atómico para el cambio de contrato + sus consumers. |
| Persistencia híbrida + Strict TDD | Coherente con Changes 2 y 3. El alumno necesita el trail de archivos en `openspec/` para defender la propuesta y el respaldo en engram para recuperación cross-session. Strict TDD ya está validado para hooks/pages. |

## Capabilities

### New Capabilities

- `prospectos-management`: CRUD completo de prospectos + Kanban por estado + detalle con tabs + conversión a cliente con trazabilidad
- `prospecto-conversion`: flujo dedicado de conversión (handler que muta prospecto + crea cliente con `prospecto_origen_id`) — se separa porque tiene reglas propias (edición post-conversión limitada, tab Convertidos)

### Modified Capabilities

- `data-contract`: extensión del contrato (`EstadoPosibleCliente` suma `'convertido'`; `Cliente` suma `prospecto_origen_id`)
- `empresas-management`: fix bloqueante en `EmpresaProspectosTab.tsx` para soportar el nuevo valor del enum (NO es change de comportamiento, es ajuste exhaustivo de records)
- `app-shell`: la ruta `/prospectos` deja de apuntar a placeholder y se agrega `/prospectos/:id`

## Approach

### Estrategia general

Replicar el patrón de `src/features/empresas/` (CRUD + detalle con tabs) adaptando la vista de lista de tabla a **Kanban de 3 columnas + tab Convertidos**. Reusar `useEmpresas()` y `useUsuarios()` para los Selects del form. Aplicar las compact rules del skill-registry (Conventional Commits, NO Co-Authored-By, español neutro de México) y las lecciones aprendidas del Change 3:

- **Wiring de 3 archivos al final**: `router.tsx`, `placeholders.tsx`, y verificación de sidebar (ya habilitado por commit `4d79993`).
- **Handlers MSW mutan el fixture directo** (patrón ya en uso en `makeCrudHandlers`).
- **Tests E2E de mutations** verifican `POST → invalidate → siguiente GET refleja el cambio`.

### Cambios al contrato — orden de ejecución

1. **Lote A (atómico, un solo commit)**: modificar `src/api/types.ts` + `src/features/empresas/components/EmpresaProspectosTab.tsx` + `src/mocks/handlers/prospectos.ts` + `src/mocks/fixtures/clientes.ts` + fixture opcional de prospectos. Verificar `pnpm type-check` exit 0 antes de commitear.
2. **Lote B**: schemas Zod + 7 hooks TanStack Query (TDD: RED → GREEN por cada hook crítico).
3. **Lote C**: componentes del Kanban + componentes de form/dialog + componentes del detalle (sin tests directos por política `ADR-020` heredada).
4. **Lote D**: páginas `ProspectosListPage` + `ProspectoDetailPage` con tests integration + wiring del router + cleanup de placeholder.

### Decisión clave de diseño

- **Filtrado Activos/Convertidos = client-side (Opción B)**. `useProspectos()` trae todo, los componentes filtran al renderizar.
- **Cambio de estado in-place** = Select inline en card del Kanban + Select en página detalle (mismo componente reusable).
- **Tab "Convertidos"** = vista default "convertidos este mes" via join `clientes[].creado_en` por `prospecto_origen_id`. `Collapsible` "Ver convertidos anteriores" para el resto.
- **Edición post-conversión** = form abre con todos los campos `disabled` salvo `notas`. Validación client-side, backend no necesita cambio.

### Estructura nueva (resumen, detalle en `exploration.md`)

```
src/features/prospectos/
├── schemas/prospecto.schema.ts
├── hooks/           (7 hooks: useProspectos, useProspecto, useProspectoTratos,
│                    useCreate, useUpdate, useDelete, useConvertir)
├── components/      (10 componentes: 4 del Kanban + 4 form/dialog + 2 tabs detalle)
├── pages/           (ProspectosListPage, ProspectoDetailPage)
└── __tests__/       (6 archivos: 4 hooks críticos + 2 pages)
```

### Riesgos asumidos (re-listados del explore con plan)

| ID | Riesgo | Plan en este Change |
|----|--------|---------------------|
| R1 | **CRÍTICO** — Ruptura de tipo en `EmpresaProspectosTab` por agregar `'convertido'` al enum | Task 0 obligatoria del Lote A: actualizar records exhaustivos EN EL MISMO COMMIT que `types.ts`. Sin esto, build rompe. |
| R2 | Handler de conversión incompleto (no muta prospecto) | Modificado en Lote A: muta `estado` + `actualizado_en` + setea `prospecto_origen_id` en cliente. |
| R3 | GET /prospectos devuelve convertidos por defecto | Resuelto con filtrado client-side (Opción B). Handler NO se modifica para excluir convertidos por defecto. |
| R4 | Edición post-conversión genera datos divergentes | Form `disabled` excepto `notas` cuando `estado === 'convertido'`. Test obligatorio. |
| R5 | Filtro top-bar de estado redundante con Kanban | Eliminado definitivamente (checkpoint usuario). Top-bar = búsqueda + responsable + toggle. |
| R6 | Performance Kanban con muchos prospectos | Documentado, **NO implementado** (YAGNI con fixtures). Si crece, paginación o `@tanstack/react-virtual` en Change futuro. |
| R7 | Prefetch del tab Tratos | NO se implementa. Lazy default de Radix `TabsContent` es suficiente. |

## ADRs propuestos (preview para Design)

Continuación numérica desde Change 3 (último ADR = ADR-021). Este Change introduce ADR-022 a ADR-029.

- **ADR-022**: Kanban como layout principal para prospectos (no tabla)
- **ADR-023**: Filtrado Activos/Convertidos client-side (Opción B, hook trae todo)
- **ADR-024**: `prospecto_origen_id` como FK desde `Cliente` (no espejo en `Prospecto`)
- **ADR-025**: `'convertido'` como valor del enum `EstadoPosibleCliente` (no campo `convertido: boolean` separado)
- **ADR-026**: Edición post-conversión limitada a `notas` (bloqueo client-side, backend no valida)
- **ADR-027**: Lazy loading del tab Tratos (default Radix `TabsContent`, sin `prefetchQuery`)
- **ADR-028**: Select inline para cambio de estado (descartado drag-and-drop)
- **ADR-029**: Reuso de `useEmpresas()` y `useUsuarios()` para Selects del `ProspectoForm` (no duplicar fetchers)

Design puede agregar 1-2 ADRs adicionales si surgen decisiones de UX detalladas (ej: política de toasts en conversión, layout responsive del Kanban si aplica).

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/features/prospectos/` | New | Feature completo (schemas, hooks, components, pages, tests) |
| `src/api/types.ts` | Modified | `EstadoPosibleCliente` suma `'convertido'`; `Cliente` suma `prospecto_origen_id` |
| `src/mocks/handlers/prospectos.ts` | Modified | Handler `POST /:id/convertir` muta prospecto + setea FK en cliente |
| `src/mocks/fixtures/clientes.ts` | Modified | Agregar `prospecto_origen_id: null` a los 2 registros |
| `src/mocks/fixtures/prospectos.ts` | Modified (opt) | Agregar 1-2 registros con estado `'convertido'` para test fixture |
| `src/features/empresas/components/EmpresaProspectosTab.tsx` | Modified (**BLOQUEANTE**) | Records `Record<EstadoPosibleCliente, string>` deben cubrir `convertido` |
| `src/routes/router.tsx` | Modified | Reemplazar `<ProspectosPlaceholder />` por `<ProspectosListPage />`; agregar `/prospectos/:id` |
| `src/routes/placeholders.tsx` | Modified | Eliminar export de `ProspectosPlaceholder` |
| `src/components/ui/{collapsible,scroll-area}.tsx` | New | Primitivos shadcn vía `pnpm dlx shadcn@latest add collapsible scroll-area` |

### Archivos NO tocados

- `src/store/authStore.ts` — solo lectura del `usuario.id` para toggle "solo míos"
- `src/components/RoleGuard.tsx` — `/prospectos` no es admin-only
- `src/features/empresas/` (más allá de `EmpresaProspectosTab.tsx`) — Empresas intacta
- `src/features/usuarios/` — Usuarios intacto
- Login, app-shell, layout — sin cambios

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| R1 — Build TS rompe si se commitea `types.ts` sin actualizar `EmpresaProspectosTab.tsx` | High (si no se controla) | Lote A atómico: un solo commit con `types.ts` + `EmpresaProspectosTab.tsx` + handler + fixtures. `pnpm type-check` antes de commitear. |
| R2 — Handler de conversión actual no muta prospecto | High (si no se modifica) | Modificación obligatoria en Lote A. Test del hook `useConvertirProspecto` verifica que tras POST, el siguiente GET muestra `estado='convertido'`. |
| R3 — Filtrado client-side puede degradar con muchos prospectos | Low | Aceptado por YAGNI. Fixture tiene 3-5 registros. Si crece, paginación server-side en Change futuro. |
| R4 — Edición post-conversión bypassed (admin edita prospecto convertido y diverge datos) | Med | Bloqueo client-side con `disabled` en el form + test obligatorio. Backend mock no valida — es decisión consciente (defensa en profundidad client-only). |
| R5 — Select inline en card causa re-renders excesivos del Kanban | Low | React Query cachea; `useMutation` solo invalida `['prospectos']`. Si surge bug visible, memoizar `ProspectoCard` con `React.memo`. |
| R6 — `Collapsible` o `ScrollArea` shadcn requieren provider o polyfills | Low | Verificar en docs shadcn. Polyfills actuales (`hasPointerCapture`, `scrollIntoView`) cubren Radix Tabs y Collapsible. |
| R7 — Tests del Kanban son complejos (3 columnas + cards + Select inline) | Med | Tests integration de página cubren el flujo; tests unitarios solo en hooks. Patrón ya validado en Change 3. |
| R8 — Reuso de `useEmpresas`/`useUsuarios` puede causar requests redundantes | Low | React Query deduplica por `queryKey`. Si surge bug, agregar `staleTime` apropiado. |

## Rollback Plan

1. `rm -rf src/features/prospectos/`
2. Revertir `src/api/types.ts` al estado pre-Change 4 (quitar `'convertido'` y `prospecto_origen_id`)
3. Revertir `src/features/empresas/components/EmpresaProspectosTab.tsx` (quitar entradas `convertido` de los records)
4. Revertir `src/mocks/handlers/prospectos.ts` (handler convertir original, sin mutar prospecto)
5. Revertir `src/mocks/fixtures/clientes.ts` (quitar `prospecto_origen_id`)
6. Revertir `src/mocks/fixtures/prospectos.ts` (quitar registros convertidos opcionales si se agregaron)
7. Restaurar `ProspectosPlaceholder` en `src/routes/placeholders.tsx` y referencia en `router.tsx`; eliminar ruta `/prospectos/:id`
8. Desinstalar primitivos shadcn `collapsible` y `scroll-area` si se quiere limpieza total (opcional, no estorban)

Reversible 100% — todos los cambios son aditivos o reemplazos puntuales. Como el Lote A es atómico, un solo `git revert` del commit del Lote A deshace contrato + handler + fix de Empresas en un paso.

## Dependencies

- **Change 1 (foundation-and-login)**: completado. Provee bootstrap, MSW, layout, auth, `RoleGuard`, hooks base.
- **Change 2 (empresas-crud)**: completado. Provee `useEmpresas()` para Select de empresa en el form.
- **Change 3 (usuarios-management)**: completado. Provee `useUsuarios()` para Select de responsable y patrón de testing strict-TDD con `useAuthStore.setState()`.
- **Bloquea**: nada inmediato. Changes 5+ (clientes-crud, tratos-crud) consumirán este patrón pero no dependen de Prospectos para empezar.

## Plan de fases (preview)

| Fase | Objetivo | Estado |
|------|----------|--------|
| Explore | Verificar contratos, identificar cambios exactos, documentar riesgos | ✅ completado |
| Propose | Esta fase — alcance, decisiones, ADRs preview | en curso |
| Spec | Requirements + scenarios formales por capability | pendiente |
| Design | ADRs formales (ADR-022 a ADR-029) + diagramas de componentes + UX detallada | pendiente |
| Tasks | Checklist en 4 lotes (A: contrato + bloqueante, B: schemas/hooks, C: componentes, D: pages + wiring) | pendiente |
| Apply | Implementación TDD en 4 lotes | pendiente |
| Verify | Validación vs specs | pendiente |
| Archive | Cierre + push | pendiente |

## Testing strategy

Strict TDD activo (heredado de Changes 2 y 3, política `ADR-020`). Por cada hook/página crítica:

1. **RED**: test que falla porque el artefacto no existe.
2. **GREEN**: implementación mínima que pasa el test.
3. **REFACTOR**: cleanup si aplica, manteniendo verde.
4. **Integration**: test que verifica flujo completo (POST → `invalidateQueries` → siguiente GET refleja cambio).

Archivos de test esperados (6):

- `src/features/prospectos/__tests__/useProspectos.test.tsx`
- `src/features/prospectos/__tests__/useCreateProspecto.test.tsx`
- `src/features/prospectos/__tests__/useDeleteProspecto.test.tsx`
- `src/features/prospectos/__tests__/useConvertirProspecto.test.tsx`
- `src/features/prospectos/__tests__/ProspectosListPage.test.tsx`
- `src/features/prospectos/__tests__/ProspectoDetailPage.test.tsx`

NO se escriben tests directos para componentes presentacionales (`ProspectoCard`, `ProspectoKanbanColumn`, `ProspectoForm`, etc.) — cobertura indirecta vía page tests, consistente con `ADR-020`.

`useProspecto`, `useProspectoTratos`, `useUpdateProspecto` no tienen test directo (cobertura indirecta vía `ProspectoDetailPage.test.tsx`), siguiendo el patrón de `ADR-021`.

## Success Criteria

- [ ] Login → `/prospectos` muestra Kanban con 3 columnas (`Frío`, `Tibio`, `Caliente`) pobladas con fixtures
- [ ] Tab "Convertidos" muestra prospectos con `estado='convertido'` (sección "Este mes" + Collapsible "Anteriores")
- [ ] Top-bar funcional: búsqueda por `nombre_contacto` filtra cards en tiempo real, Select de responsable filtra server-side, toggle "solo míos" prefiltra `responsable_id = usuario_actual`
- [ ] Botón "Nuevo prospecto" abre `ProspectoFormDialog` con Selects de empresa y responsable poblados
- [ ] Submit éxito refresca el Kanban con la nueva card en la columna correcta
- [ ] Select de estado in-place en card mueve la card a la columna correspondiente sin recargar
- [ ] Click en card navega a `/prospectos/:id` con tabs **Información** y **Tratos**
- [ ] Tab Información muestra datos del contacto + link a empresa vinculada
- [ ] Tab Tratos muestra tratos vinculados (read-only, lazy load)
- [ ] Botón "Convertir a cliente" abre `ConvertirProspectoDialog`; confirmar muta prospecto a `'convertido'` y crea cliente con `prospecto_origen_id`
- [ ] Botón "Convertir a cliente" se oculta cuando `estado === 'convertido'`
- [ ] Editar prospecto convertido: form abre con todos los campos `disabled` salvo `notas`
- [ ] Eliminar abre `AlertDialog`, confirmar → card desaparece + toast
- [ ] `EmpresaProspectosTab.tsx` muestra badge "Convertido" para prospectos con estado nuevo (sin romper Empresas)
- [ ] 6 tests nuevos + suite existente (Changes 1-3) verde
- [ ] `pnpm lint`, `pnpm type-check`, `pnpm test:run` exit 0

## Próxima fase

**sdd-spec** (puede ejecutarse en paralelo con `sdd-design`)
