# Tasks: Prospectos CRUD (Change 4)

**Change**: prospectos-crud
**Strict TDD**: activo (RED → GREEN por cada hook/página crítica)
**Total**: 39 tareas agrupadas en 6 lotes

---

## Lote A — Contrato atómico (1 commit, todo junto o nada)

> Sin este lote, TypeScript no compila en el resto del Change.

- [x] T_A.1 — Extender `EstadoPosibleCliente` con `'convertido'` y agregar `prospecto_origen_id: string | null` a `Cliente`
  - Archivo: `src/api/types.ts`
  - Cubre: REQ-CONV-TIPOS-001, REQ-CONV-TIPOS-002
  - ADR: ADR-024, ADR-025
  - Done when: los dos cambios están en el archivo y TypeScript no rompe en aislamiento del archivo

- [x] T_A.2 — Actualizar records exhaustivos `Record<EstadoPosibleCliente, string>` para incluir `convertido`
  - Archivo: `src/features/empresas/components/EmpresaProspectosTab.tsx` (líneas 17-27)
  - Cubre: REQ-CONV-TIPOS-003, REQ-CONV-TIPOS-004
  - ADR: ADR-025
  - Done when: el record cubre las 4 claves del enum sin error de TypeScript

- [x] T_A.3 — Reescribir handler `POST /prospectos/:id/convertir` para mutar prospecto y crear cliente con FK
  - Archivo: `src/mocks/handlers/prospectos.ts`
  - Cubre: REQ-CONV-ACCION-001, REQ-CONV-ACCION-004
  - ADR: ADR-025
  - Done when: el handler setea `estado_posible_cliente='convertido'`, `actualizado_en=nowIso()` y crea cliente con `prospecto_origen_id=prospecto.id`

- [x] T_A.4 — Agregar `prospecto_origen_id: null` a los 2 clientes existentes en el fixture
  - Archivo: `src/mocks/fixtures/clientes.ts`
  - Cubre: REQ-CONV-TIPOS-002
  - ADR: ADR-024
  - Done when: los 2 objetos del fixture tienen el campo y `pnpm type-check` pasa

- [x] T_A.5 — Agregar 2 prospectos con `estado: 'convertido'` al fixture de prospectos
  - Archivo: `src/mocks/fixtures/prospectos.ts`
  - Cubre: REQ-CONV-TAB-001, REQ-CONV-TAB-002
  - ADR: ADR-023
  - Done when: fixture tiene al menos 1 prospecto convertido este mes y 1 de mes anterior

- [x] T_A.6 — Verificación de lote: `pnpm type-check` + `pnpm test:run` (suite previa) exit 0
  - Cubre: REQ-CONV-TIPOS-001 (Scenario: Type-check pasa tras commit atómico)
  - Done when: ningún error TS; tests de Changes 1-3 siguen verdes

---

## Lote B — API client, schema Zod y 7 hooks (TDD)

- [x] T_B.1 — Instalar primitivos shadcn `collapsible` y `scroll-area`
  - Archivos: `src/components/ui/collapsible.tsx`, `src/components/ui/scroll-area.tsx`
  - Cubre: (infraestructura para Kanban y Tab Convertidos)
  - Done when: ambos archivos existen y se puede importar sin error

- [x] T_B.2 — Crear schema Zod `prospecto.schema.ts` con `ProspectoCreateInput` y `ProspectoUpdateInput`
  - Archivo: `src/features/prospectos/schemas/prospecto.schema.ts`
  - Cubre: REQ-PROS-CREAR-002 (validación client-side), REQ-PROS-EDITAR-002
  - ADR: (Zod v4, patrón de Changes previos)
  - Done when: tipos inferidos tienen todos los campos del formulario; `nombre_contacto` es requerido

- [x] T_B.3 — TEST RED: `useProspectos` devuelve lista filtrada por `responsable_id`
  - Archivo: `src/features/prospectos/__tests__/useProspectos.test.tsx`
  - Cubre: REQ-PROS-FILTROS-002, REQ-PROS-FILTROS-003, REQ-PROS-FILTROS-004
  - ADR: ADR-023
  - Done when: test falla con "Cannot find module" o equivalente; mensaje de fallo claro

- [x] T_B.4 — GREEN: implementar `useProspectos` con query `['prospectos']` y param `responsable_id` opcional
  - Archivo: `src/features/prospectos/hooks/useProspectos.ts`
  - Cubre: REQ-PROS-LISTADO-001, REQ-PROS-FILTROS-002, REQ-PROS-FILTROS-003
  - ADR: ADR-023, ADR-029
  - Done when: test T_B.3 pasa en verde

- [x] T_B.5 — TEST RED: `useCreateProspecto` invalida `['prospectos']` tras POST exitoso
  - Archivo: `src/features/prospectos/__tests__/useCreateProspecto.test.tsx`
  - Cubre: REQ-PROS-CREAR-001, REQ-PROS-CACHE-001
  - Done when: test falla porque el hook no existe

- [x] T_B.6 — GREEN: implementar `useCreateProspecto` con invalidación de `['prospectos']`
  - Archivo: `src/features/prospectos/hooks/useCreateProspecto.ts`
  - Cubre: REQ-PROS-CREAR-001, REQ-PROS-CACHE-001
  - Done when: test T_B.5 pasa en verde

- [x] T_B.7 — TEST RED: `useDeleteProspecto` elimina query `['prospectos', id]` e invalida `['prospectos']`
  - Archivo: `src/features/prospectos/__tests__/useDeleteProspecto.test.tsx`
  - Cubre: REQ-PROS-ELIMINAR-001, REQ-PROS-CACHE-003
  - Done when: test falla porque el hook no existe

- [x] T_B.8 — GREEN: implementar `useDeleteProspecto` con `removeQueries` + `invalidateQueries`
  - Archivo: `src/features/prospectos/hooks/useDeleteProspecto.ts`
  - Cubre: REQ-PROS-ELIMINAR-001, REQ-PROS-CACHE-003
  - Done when: test T_B.7 pasa en verde

- [x] T_B.9 — TEST RED: `useConvertirProspecto` invalida las 5 query keys (incluyendo empresa-clientes y empresa-prospectos)
  - Archivo: `src/features/prospectos/__tests__/useConvertirProspecto.test.tsx`
  - Cubre: REQ-CONV-ACCION-001, REQ-PROS-CACHE-005 (`empresa-clientes`, `empresa-prospectos`)
  - ADR: ADR-025
  - Done when: test falla con mensaje claro sobre las 5 keys esperadas; cubre `['empresa-clientes', empresaId]` y `['empresa-prospectos', empresaId]`

- [x] T_B.10 — GREEN: implementar `useConvertirProspecto` con invalidación de 5 keys
  - Archivo: `src/features/prospectos/hooks/useConvertirProspecto.ts`
  - Cubre: REQ-CONV-ACCION-001, REQ-PROS-CACHE-005
  - ADR: ADR-025
  - Done when: test T_B.9 pasa en verde; las 5 invalidaciones están presentes explícitamente

- [x] T_B.11 — Implementar hooks restantes (sin test directo — cobertura indirecta vía page tests)
  - Archivos: `src/features/prospectos/hooks/useProspecto.ts`, `useProspectoTratos.ts`, `useUpdateProspecto.ts`
  - Cubre: REQ-PROS-EDITAR-001, REQ-PROS-CACHE-002, REQ-PROS-TRATOS-001, REQ-PROS-DETALLE-001
  - ADR: ADR-027 (lazy tratos), ADR-026 (update sin cambio de contrato)
  - Done when: los 3 archivos existen con la query/mutation correspondiente y los tipos son correctos

- [x] T_B.12 — Verificación de lote: `pnpm type-check` + `pnpm test:run` (4 tests nuevos) exit 0
  - Done when: 4 tests de hooks pasan; no hay errores TS en hooks ni schema

---

## Lote C — Componentes UI (sin tests directos per ADR-020)

- [x] T_C.1 — Crear `ProspectoCard` con Select inline de estado y botón Convertir (condicional)
  - Archivo: `src/features/prospectos/components/ProspectoCard.tsx`
  - Cubre: REQ-PROS-LISTADO-001, REQ-PROS-ESTADO-001, REQ-PROS-ESTADO-002, REQ-CONV-ACCION-002
  - ADR: ADR-028 (Select inline, no DnD), ADR-026
  - Done when: recibe `prospecto` como prop; muestra Select con `frio/tibio/caliente`; oculta botón Convertir si `estado === 'convertido'`

- [x] T_C.2 — Crear `KanbanColumn` con `ScrollArea` y empty state
  - Archivo: `src/features/prospectos/components/KanbanColumn.tsx`
  - Cubre: REQ-PROS-LISTADO-002, REQ-PROS-LISTADO-003
  - ADR: ADR-022
  - Done when: recibe `label` y `prospectos[]`; muestra "Sin prospectos en este estado" si el array está vacío

- [x] T_C.3 — Crear `ProspectosKanban` que divide prospectos en 3 columnas
  - Archivo: `src/features/prospectos/components/ProspectosKanban.tsx`
  - Cubre: REQ-PROS-LISTADO-001, REQ-PROS-FILTROS-001
  - ADR: ADR-022, ADR-023
  - Done when: filtra `estado !== 'convertido'`; agrupa por `frio/tibio/caliente`; aplica filtro de búsqueda client-side por `nombre_contacto`

- [x] T_C.4 — Crear `ProspectoConvertidosList` con secciones "Este mes" y Collapsible "Anteriores"
  - Archivo: `src/features/prospectos/components/ProspectoConvertidosList.tsx`
  - Cubre: REQ-CONV-TAB-001, REQ-CONV-TAB-002, REQ-CONV-TAB-003, REQ-CONV-TAB-004
  - ADR: ADR-023
  - Done when: join client-side con `clientes` por `prospecto_origen_id`; sección "este mes" + `Collapsible`; empty states para ambas secciones

- [x] T_C.5 — Crear `ProspectoForm` con prop `isLocked` para modo post-conversión
  - Archivo: `src/features/prospectos/components/ProspectoForm.tsx`
  - Cubre: REQ-PROS-EDITAR-002, REQ-PROS-EDITAR-003
  - ADR: ADR-026, ADR-029
  - Done when: todos los campos `disabled` si `isLocked=true`, excepto `notas`; Selects de empresa y responsable vía `useEmpresas()` / `useUsuarios()`

- [x] T_C.6 — Crear `ProspectoFormDialog` modo create y modo edit
  - Archivo: `src/features/prospectos/components/ProspectoFormDialog.tsx`
  - Cubre: REQ-PROS-CREAR-001, REQ-PROS-CREAR-003, REQ-PROS-EDITAR-001, REQ-PROS-EDITAR-004
  - Done when: recibe `mode` y `prospecto?`; en edit pasa `isLocked` si estado es convertido; mapea errores 422 con `setError`

- [x] T_C.7 — Crear `ProspectoDeleteDialog` como AlertDialog de confirmación
  - Archivo: `src/features/prospectos/components/ProspectoDeleteDialog.tsx`
  - Cubre: REQ-PROS-ELIMINAR-001, REQ-PROS-ELIMINAR-002, REQ-PROS-ELIMINAR-003
  - Done when: confirmar llama `useDeleteProspecto`; cancelar cierra sin action; toast en éxito y en 404

- [x] T_C.8 — Crear `ConvertirProspectoDialog` como AlertDialog de conversión
  - Archivo: `src/features/prospectos/components/ConvertirProspectoDialog.tsx`
  - Cubre: REQ-CONV-ACCION-001, REQ-CONV-ACCION-003, REQ-CONV-ACCION-004
  - Done when: confirmar llama `useConvertirProspecto`; cancelar cierra sin invocar endpoint; toast de error en 500

- [x] T_C.9 — Crear `ProspectoInfoTab` con campos del detalle y link a empresa
  - Archivo: `src/features/prospectos/components/ProspectoInfoTab.tsx`
  - Cubre: REQ-PROS-DETALLE-001, REQ-PROS-DETALLE-003
  - Done when: muestra todos los campos del prospecto; `empresa_id` es link a `/empresas/:id`; nulls se renderizan como "—"; badge "Convertido" visible si estado corresponde

- [x] T_C.10 — Crear `ProspectoTratosTab` con lista read-only y lazy load
  - Archivo: `src/features/prospectos/components/ProspectoTratosTab.tsx`
  - Cubre: REQ-PROS-TRATOS-001, REQ-PROS-TRATOS-002, REQ-PROS-TRATOS-003
  - ADR: ADR-027
  - Done when: usa `useProspectoTratos(id)`; empty state "Sin tratos vinculados"; mensaje de error en 500

- [x] T_C.11 — Verificación de lote: `pnpm type-check` exit 0 (no hay test directo de componentes)
  - Done when: TypeScript no reporta errores en ninguno de los 10 componentes nuevos

---

## Lote D — Páginas, wiring del router y cleanup

- [x] T_D.1 — TEST RED: `ProspectosListPage` renderiza Kanban con fixtures y responde a filtros
  - Archivo: `src/features/prospectos/__tests__/ProspectosListPage.test.tsx`
  - Cubre: REQ-PROS-LISTADO-001, REQ-PROS-FILTROS-001, REQ-PROS-FILTROS-004, REQ-PROS-ROUTING-001
  - Done when: test falla porque el módulo no existe

- [x] T_D.2 — GREEN: implementar `ProspectosListPage` con tabs Activos/Convertidos y top-bar
  - Archivo: `src/features/prospectos/pages/ProspectosListPage.tsx`
  - Cubre: REQ-PROS-LISTADO-001..003, REQ-PROS-FILTROS-001..004, REQ-CONV-TAB-001..004, REQ-PROS-ROUTING-001
  - ADR: ADR-022, ADR-023, ADR-028
  - Done when: test T_D.1 pasa; tab Activos muestra `ProspectosKanban`; tab Convertidos muestra `ProspectoConvertidosList`; botón "Nuevo prospecto" abre `ProspectoFormDialog`

- [x] T_D.3 — TEST RED: `ProspectoDetailPage` carga detalle, muestra tabs y acciones
  - Archivo: `src/features/prospectos/__tests__/ProspectoDetailPage.test.tsx`
  - Cubre: REQ-PROS-DETALLE-001..003, REQ-PROS-TRATOS-001..003, REQ-CONV-ACCION-001, REQ-CONV-ACCION-002, REQ-PROS-ROUTING-002
  - Done when: test falla porque el módulo no existe

- [x] T_D.4 — GREEN: implementar `ProspectoDetailPage` con header de acciones y tabs
  - Archivo: `src/features/prospectos/pages/ProspectoDetailPage.tsx`
  - Cubre: REQ-PROS-DETALLE-001..003, REQ-PROS-TRATOS-001..003, REQ-CONV-ACCION-002, REQ-PROS-EDITAR-001..002
  - ADR: ADR-026, ADR-027
  - Done when: test T_D.3 pasa; redirect a `/prospectos` en 404; badge "Convertido" visible; botón Convertir oculto si ya convertido; Select de estado in-place

- [x] T_D.5 — Reemplazar `ProspectosPlaceholder` por `ProspectosListPage` en el router y agregar ruta detalle
  - Archivo: `src/routes/router.tsx`
  - Cubre: REQ-PROS-ROUTING-001, REQ-PROS-ROUTING-002
  - Done when: ruta `/prospectos` apunta a `ProspectosListPage`; ruta `/prospectos/:id` apunta a `ProspectoDetailPage`

- [x] T_D.6 — Eliminar export de `ProspectosPlaceholder`
  - Archivo: `src/routes/placeholders.tsx`
  - Cubre: REQ-PROS-ROUTING-003
  - Done when: el export ya no existe; no hay referencia huérfana en el codebase

- [x] T_D.7 — Verificación de lote: `pnpm type-check` + `pnpm test:run` (6 tests nuevos + suite previa) exit 0
  - Done when: todos los tests verdes; no hay errores TS; `pnpm lint` exit 0

---

## Lote E — Integración cruzada con EmpresaDetailPage

> Valida que la invalidación de `empresa-clientes` y `empresa-prospectos` en `useConvertirProspecto` funcione en el contexto real de `EmpresaDetailPage`.

- [x] T_E.1 — Verificar que `EmpresaProspectosTab` muestra badge "Convertido" para el fixture nuevo
  - Archivo: `src/features/empresas/__tests__/EmpresaDetailPage.test.tsx` (modificar test existente)
  - Cubre: REQ-CONV-TIPOS-004
  - ADR: ADR-025
  - Done when: el test existente de `EmpresaDetailPage` cubre el badge "Convertido" con un prospecto del fixture que tiene `estado='convertido'`; pasa en verde

- [x] T_E.2 — Verificación de lote: `pnpm test:run` (suite completa Changes 1-4) exit 0
  - Done when: ningún test regresiona; los 6 tests nuevos + todos los previos están verdes

---

## Lote F — Verificación final + smoke manual

- [ ] T_F.1 — Ejecutar verificación completa final: `pnpm lint` + `pnpm type-check` + `pnpm test:run`
  - Done when: los 3 comandos exit 0; no hay warnings sin suprimir

- [ ] T_F.2 — SMOKE MANUAL: checklist de validación en browser

  Antes de marcar este lote como completo, validar en el browser con `pnpm dev`:

  **Kanban y filtros**
  - [ ] Login → `/prospectos` muestra Kanban con 3 columnas (`Frío`, `Tibio`, `Caliente`) pobladas con fixtures
  - [ ] Escribir en búsqueda filtra cards en tiempo real (sin recargar)
  - [ ] Toggle "Solo míos" filtra por usuario en sesión
  - [ ] Select de responsable filtra por responsable

  **CRUD en lista**
  - [ ] Botón "Nuevo prospecto" abre dialog con Selects de empresa y responsable poblados
  - [ ] Submit exitoso cierra dialog, aparece card nueva en columna correcta, toast de éxito
  - [ ] Validación requerida: enviar sin `nombre_contacto` muestra error inline
  - [ ] Select inline en card mueve card a la columna correspondiente
  - [ ] Eliminar abre AlertDialog → confirmar → card desaparece + toast

  **Tab Convertidos**
  - [ ] Tab "Convertidos" muestra sección "Este mes" con timestamp correcto
  - [ ] Sección "Anteriores" disponible via Collapsible

  **Detalle `/prospectos/:id`**
  - [ ] Click en card navega a `/prospectos/:id` con tabs Información y Tratos
  - [ ] Tab Información muestra datos del contacto + link a empresa vinculada
  - [ ] Tab Tratos carga al activar (lazy); muestra tratos o "Sin tratos vinculados"
  - [ ] Badge "Convertido" visible en header si corresponde
  - [ ] Botón "Convertir a cliente" → dialog → confirmar → prospecto desaparece de columnas activas + aparece en tab Convertidos
  - [ ] Botón "Convertir a cliente" oculto cuando estado ya es convertido
  - [ ] Editar prospecto convertido: todos los campos `disabled` salvo `notas`
  - [ ] Navegar a id inexistente redirige automáticamente a `/prospectos` con toast

  **Integración cruzada**
  - [ ] `EmpresaDetailPage` → tab "Prospectos" muestra badge "Convertido" para prospectos convertidos sin error TS

  Done when: todos los checkboxes del smoke marcados como OK

---

---

## Lote G — Fixes post-verify (WARN-01, WARN-04, smoke gap)

> Correcciones identificadas en el verify-report y durante smoke manual.
> Strict TDD: RED → GREEN para cada fix.

- [x] T_G.1 — TEST RED: Filtros top-bar "Solo míos" + Select responsable — tests en `ProspectosListPage.test.tsx`
  - Cubre: REQ-PROS-FILTROS-002, REQ-PROS-FILTROS-003
  - Done when: 2 tests nuevos fallan porque los controles no existen en la UI

- [x] T_G.2 — GREEN: Implementar toggle "Solo míos" y Select responsable en `ProspectosListPage.tsx`
  - Archivos: `src/features/prospectos/pages/ProspectosListPage.tsx`
  - Cubre: REQ-PROS-FILTROS-002, REQ-PROS-FILTROS-003
  - Comportamiento: soloMios usa `useAuthStore.usuario.id`; Select usa `useUsuarios()`; mutuamente excluyentes; pasan `responsable_id` a `useProspectos`
  - Done when: los 2 tests de T_G.1 pasan

- [x] T_G.3 — TEST RED: Botón "Reintentar" en error state — test en `ProspectosListPage.test.tsx`
  - Cubre: REQ-PROS-LISTADO-001 Scenario Error
  - Done when: test falla porque el botón no existe

- [x] T_G.4 — GREEN: Agregar `<Button onClick={() => void refetch()}>Reintentar</Button>` en el error state
  - Archivo: `src/features/prospectos/pages/ProspectosListPage.tsx`
  - Done when: test de T_G.3 pasa; click en botón dispara segundo request que trae los datos

- [x] T_G.5 — TEST RED: Filas de `ProspectoConvertidosList` no son clickeables — nuevo test file
  - Archivo: `src/features/prospectos/__tests__/ProspectoConvertidosList.test.tsx` (creado)
  - Done when: 3 tests fallan porque la fila es un `<div>` sin navegación

- [x] T_G.6 — GREEN: `ConvertidoRow` convertido a `<Link>` con empresa como link anidado (Option B)
  - Archivo: `src/features/prospectos/components/ProspectoConvertidosList.tsx`
  - Patrón: fila = `<Link to="/prospectos/:id">`; empresa = `<Link to="/empresas/:id" onClick={stopPropagation}>`
  - Done when: los 3 tests de T_G.5 pasan

- [x] T_G.7 — Verificación final: `pnpm type-check` + `pnpm test:run` 60/60 verdes + `pnpm lint` 0 errores
  - Done when: suite completa verde; type-check exit 0; lint 0 errores (7 warnings pre-existentes en shadcn aceptables)

---

## Resumen de cobertura por REQ-ID

| Capability | REQ total | Scenarios | Tareas principales |
|---|---|---|---|
| prospectos-management | 9 REQs | 27 scenarios | T_B.3-T_B.11, T_C.1-T_C.10, T_D.1-T_D.6 |
| prospecto-conversion | 3 REQs | 11 scenarios | T_A.1-T_A.5, T_B.9-T_B.10, T_C.8, T_C.4, T_E.1 |
| **Total** | **12 REQs** | **38 scenarios** | **39 tareas** |
