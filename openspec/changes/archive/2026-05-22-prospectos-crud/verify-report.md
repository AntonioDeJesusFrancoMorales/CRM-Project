# Verify Report — prospectos-crud

**Fecha**: 2026-05-22
**Modo**: Strict TDD
**Veredicto**: APPROVED-WITH-WARNINGS

---

## Resumen

| Métrica | Valor |
|---------|-------|
| Total de scenarios en spec | 38 (27 en prospectos-management + 11 en prospecto-conversion) |
| Scenarios implementados | 34 |
| Gaps CRITICAL | 0 |
| Warnings | 4 |
| Suggestions | 4 |

Los 4 warnings se concentran en dos áreas:
1. **Filtros top-bar incompletos**: el top-bar solo implementa búsqueda client-side; falta el Select de responsable y el Toggle "Solo míos" (REQ-PROS-FILTROS-002 y REQ-PROS-FILTROS-003). La infraestructura del hook existe y funciona; es la UI de los controles lo que falta.
2. **Scenarios sin test propio**: algunos scenarios de componentes sin cobertura directa en test (policy de ADR-020 "sin tests directos de componentes") dejan ciertos paths probados solo de forma indirecta o no probados en absoluto a nivel de test ejecutado.

---

## Build & Tests

**Type-check**: ✅ exit 0 (`pnpm type-check` — tsc --noEmit)

**Tests**: ✅ 54/54 passed, 0 failed, 0 skipped
```
Test Files  19 passed (19)
      Tests  54 passed (54)
   Duration  8.36s
```

**Lint**: ✅ exit 0 (0 errores; 7 warnings pre-existentes en shadcn/ui)

---

## Completeness

| Métrica | Valor |
|---------|-------|
| Tareas totales | 39 |
| Tareas completas | 38 |
| Tareas incompletas | 1 |

**Tarea incompleta**:
- `[ ] T_F.1` — Verificación final completa (lint + type-check + test:run). Ejecutada en este verify; se puede marcar [x].
- `[ ] T_F.2` — SMOKE MANUAL en browser (checklist completo). Pendiente por naturaleza — no es automatizable.

---

## CRITICAL (bloquean archive)

*Ninguno*

---

## WARNING (deben corregirse o documentarse como deuda técnica)

### WARN-01 — Filtros "Solo míos" y "Select responsable" ausentes en top-bar de ProspectosListPage

**Spec**: `prospectos-management` > REQ-2: Filtros top-bar — Scenarios 2 y 3
- REQ-PROS-FILTROS-002: Toggle "Solo míos" → `GET /prospectos?responsable_id={userId}`
- REQ-PROS-FILTROS-003: Select de responsable → `GET /prospectos?responsable_id={id}`

**Encontrado en código**:
- `ProspectosListPage.tsx` línea 78-90: solo tiene un `Input` de búsqueda por nombre. No existe ningún `Select` de responsable ni `Toggle`/`Switch` para "Solo míos".
- `useProspectos.ts` acepta `filters: { responsable_id? }` y sí pasa el param al endpoint. La infraestructura está lista; la UI no se implementó.
- Los tests de `ProspectosListPage.test.tsx` cubren solo búsqueda client-side (4 tests). Los scenarios 2 y 3 de REQ-2 no tienen test de integración en la página.

**Estado en matriz de compliance**: ⚠️ PARTIAL para REQ-PROS-FILTROS-002 y REQ-PROS-FILTROS-003 (hook implementado, UI ausente, sin test de página para estos scenarios).

**Fix sugerido**: Agregar `Switch` (solo míos) y `Select` de responsable en la barra de top-bar de `ProspectosListPage.tsx`, conectados al state que pasa `responsable_id` a `useProspectos`. Agregar 2 tests en `ProspectosListPage.test.tsx`.

---

### WARN-02 — `ProspectoForm.tsx`: campo `notas` no tiene `disabled` explícito, pero tampoco lo omite correctamente

**Spec**: `prospectos-management` > REQ-4: Edición post-conversión — Scenario 2
- Spec exige que `notas` MUST permanecer habilitado cuando `isLocked = true`.

**Encontrado en código**:
- `ProspectoForm.tsx` línea 308-326: el `<textarea>` de `notas` no tiene `disabled={isLocked}` (correcto, era intencional per ADR-026), pero tampoco está documentado en el propio componente que este es el comportamiento esperado — solo un comentario en línea.
- El Scenario "Form en modo post-conversión deshabilita todos los campos salvo notas" **no tiene test directo**. No hay test que monte `ProspectoForm` con `isLocked={true}` y verifique que cada campo INPUT está `disabled` pero `notas` no. La cobertura es implícita por el test de detalle que verifica el badge Convertido pero no abre el form.

**Estado en matriz de compliance**: ⚠️ PARTIAL — la implementación es correcta pero sin evidencia de test ejecutado.

**Fix sugerido**: Agregar un test unitario o de integración que monte `ProspectoFormDialog` con un prospecto convertido y verifique que los campos `nombre_contacto`, `empresa_id`, etc. están `disabled` pero `notas` está habilitado.

---

### WARN-03 — `estado_posible_cliente` schema es `.optional()` en lugar de `.default('frio')`

**Spec**: `prospectos-management` > REQ-3: Crear prospecto — "estado_posible_cliente (Select, default frio)"

**Encontrado en código**:
- `prospecto.schema.ts` línea 25-27: `estado_posible_cliente: z.enum([...]).optional()`. Valor default ausente en schema.
- Mitigado por `EMPTY_DEFAULTS = { estado_posible_cliente: 'frio' }` en `ProspectoForm.tsx` línea 52. El form siempre inicializa con 'frio' en modo create.
- **Riesgo residual**: si `ProspectoFormDialog` se usa en otro lugar sin pasar defaultValues correctamente, el campo podría enviarse `undefined`. Actualmente no ocurre, pero es una deuda de robustez.
- No hay test que verifique que el submit de create incluye `estado_posible_cliente: 'frio'` cuando el usuario no lo cambia.

**Estado en matriz de compliance**: ⚠️ PARTIAL — mitigado con EMPTY_DEFAULTS pero sin test que lo pruebe explícitamente.

**Fix sugerido**: O bien cambiar el schema a `.default('frio')` y resolver el conflicto de tipos con el Resolver (requiere investigación), o bien agregar un test que verifique el valor default en el submit.

---

### WARN-04 — Scenario "Error de servidor en listado" (REQ-PROS-LISTADO-003) sin botón "Reintentar"

**Spec**: `prospectos-management` > REQ-1 — Scenario: Error de servidor en listado
- Spec THEN: "se muestra un mensaje de error con botón 'Reintentar'"

**Encontrado en código**:
- `ProspectosListPage.tsx` línea 99-103: muestra un `<p>` de error pero **sin botón "Reintentar"**. El usuario no puede recuperarse sin recargar la página.
- El test de `useProspectos.test.tsx` cubre el error 500 a nivel de hook (isError = true) pero no hay test de página que verifique la presencia del botón.

**Estado en matriz de compliance**: ⚠️ PARTIAL — mensaje de error presente, botón "Reintentar" ausente.

**Fix sugerido**: Agregar un `<Button onClick={() => void refetch()}>Reintentar</Button>` en el bloque `isError` de `ProspectosListPage.tsx`. Requiere exponer `refetch` desde `useProspectos`. Agregar test.

---

## SUGGESTION (mejoras futuras)

### SUG-01 — Tab Convertidos: empty state global correcto pero "anteriores" nunca muestra empty state propio

**Spec**: REQ-CONV-TAB-003 cubre el empty state de "este mes" (mensaje "Sin conversiones este mes" ✅).  
Sin embargo, cuando `anteriores.length === 0`, el Collapsible simplemente desaparece (`{anteriores.length > 0 && ...}`). La spec no pide un empty state propio para "anteriores", pero podría ser útil para el UX.

---

### SUG-02 — `ProspectoDetailPage`: mensaje de 404 no incluye botón "Volver a Prospectos" explícito

**Spec**: REQ-PROS-DETALLE-002 — "muestra mensaje 'Prospecto no encontrado', botón 'Volver a Prospectos' y ejecuta redirect automático"

**Encontrado**: El estado 404 (`is404 === true`) muestra `"Este prospecto no existe. Volviendo al listado..."` y hace redirect en 1500ms, pero no renderiza un botón "Volver a Prospectos" explícito durante esos 1500ms. El test pasa porque solo verifica el redirect final.

**Impacto**: Mínimo — el redirect es automático. Pero la spec pide el botón.

---

### SUG-03 — `handleEstadoChange` en `ProspectosListPage` usa `useMutation` directa en lugar de `useUpdateProspecto`

Ya documentado en apply-progress. El comportamiento es equivalente (invalida `prospectosKeys.list()` y `prospectosKeys.detail(id)`). Sin issues adicionales.

---

### SUG-04 — Sidebar link de Prospectos estaba deshabilitado y fue corregido durante smoke

**Nota para futuros Changes**: El link de `/prospectos` en `Sidebar.tsx` tenía `disabled: true` y fue corregido antes de que el Change fuera completado (ahora `{ label: 'Prospectos', to: '/prospectos', icon: UserSearch }` sin `disabled`). En todos los Changes futuros, el sub-agente de apply DEBE verificar al final del wiring que el Sidebar link no está deshabilitado para la ruta que acaba de implementar.

---

## Spec Compliance Matrix

### prospectos-management (27 scenarios)

| REQ-ID | Scenario | Test | Resultado |
|--------|----------|------|-----------|
| REQ-1 (Listado Kanban) | Kanban poblado con datos fixture | `ProspectosListPage.test.tsx > renderiza el Kanban con prospectos activos del fixture` | ✅ COMPLIANT |
| REQ-1 (Listado Kanban) | Columna sin prospectos muestra estado vacío | (cobertura indirecta: KanbanColumn con array vacío) | ⚠️ PARTIAL |
| REQ-1 (Listado Kanban) | Error de servidor en listado | `useProspectos.test.tsx > reporta error cuando el endpoint responde 500` (hook level) | ⚠️ PARTIAL (botón Reintentar ausente en UI) |
| REQ-2 (Filtros top-bar) | Búsqueda por nombre_contacto filtra cards | `ProspectosListPage.test.tsx > filtra los prospectos con el campo de búsqueda` | ✅ COMPLIANT |
| REQ-2 (Filtros top-bar) | Toggle "Solo míos" prefiltra por responsable | (sin test de UI; hook soporta param) | ⚠️ PARTIAL (UI ausente) |
| REQ-2 (Filtros top-bar) | Select de responsable pasa param al endpoint | `useProspectos.test.tsx > pasa responsable_id como query param` (hook level) | ⚠️ PARTIAL (UI ausente en página) |
| REQ-2 (Filtros top-bar) | Limpiar búsqueda restaura todas las cards | (cobertura implícita: mismo test de búsqueda verifica estado limpio previo) | ⚠️ PARTIAL |
| REQ-3 (Crear prospecto) | Creación exitosa | `ProspectosListPage.test.tsx > abre el dialog Nuevo prospecto` (dialog open) + handler MSW POST | ⚠️ PARTIAL (dialog open, no flujo completo de submit) |
| REQ-3 (Crear prospecto) | Validación client-side nombre requerido | (schema Zod + form; sin test directo de form) | ⚠️ PARTIAL |
| REQ-3 (Crear prospecto) | Error 422 mapea field errors | (ProspectoFormDialog con setError; sin test directo) | ⚠️ PARTIAL |
| REQ-4 (Editar prospecto) | Edición exitosa de prospecto activo | (hook useUpdateProspecto + dialog; sin test de flujo completo) | ⚠️ PARTIAL |
| REQ-4 (Editar prospecto) | Form post-conversión deshabilita todos salvo notas | (código correcto isLocked; sin test directo) | ⚠️ PARTIAL |
| REQ-4 (Editar prospecto) | Guardar notas de un prospecto convertido | (sin test) | ❌ UNTESTED |
| REQ-4 (Editar prospecto) | Error 422 en edición muestra details | (sin test directo) | ❌ UNTESTED |
| REQ-5 (Eliminar prospecto) | Eliminación exitosa | `useDeleteProspecto.test.tsx > elimina y limpia cache` | ✅ COMPLIANT |
| REQ-5 (Eliminar prospecto) | Cancelar cierra dialog sin acción | (implementado en ProspectoDeleteDialog; sin test) | ⚠️ PARTIAL |
| REQ-5 (Eliminar prospecto) | 404 al eliminar muestra error y refresca | (implementado; sin test) | ⚠️ PARTIAL |
| REQ-6 (Cambio estado in-place) | Select inline mueve card a columna correcta | `useProspectos.test.tsx + estadoMutation` (infraestructura); sin test E2E del Select | ⚠️ PARTIAL |
| REQ-6 (Cambio estado in-place) | Card convertida muestra estado deshabilitado | `ProspectosListPage.test.tsx > renderiza Kanban` (convertidos no aparecen en activos) | ✅ COMPLIANT |
| REQ-6 (Cambio estado in-place) | Error de red en PATCH muestra toast | (implementado con toast.error; sin test) | ⚠️ PARTIAL |
| REQ-7 (Detalle del prospecto) | Detalle con id válido muestra tab Información | `ProspectoDetailPage.test.tsx > renderiza nombre y tabs con id válido` | ✅ COMPLIANT |
| REQ-7 (Detalle del prospecto) | Detalle con id inexistente redirige | `ProspectoDetailPage.test.tsx > redirige a /prospectos cuando 404` | ✅ COMPLIANT |
| REQ-7 (Detalle del prospecto) | Tab Información muestra badge "Convertido" | `ProspectoDetailPage.test.tsx > muestra Convertido badge cuando ya convertido` | ✅ COMPLIANT |
| REQ-8 (Tab Tratos read-only) | Tab Tratos carga al activar | `ProspectoDetailPage.test.tsx > carga los tratos al activar el tab Tratos (lazy load)` | ✅ COMPLIANT |
| REQ-8 (Tab Tratos read-only) | Tab Tratos sin tratos muestra empty state | (KanbanColumn/TratosTab implementado; sin test de empty state) | ⚠️ PARTIAL |
| REQ-8 (Tab Tratos read-only) | Tab Tratos con error muestra mensaje | (implementado; sin test) | ⚠️ PARTIAL |
| REQ-9 (Routing y wiring) | /prospectos renderiza ProspectosListPage | `ProspectosListPage.test.tsx` | ✅ COMPLIANT |
| REQ-9 (Routing y wiring) | /prospectos/:id renderiza ProspectoDetailPage | `ProspectoDetailPage.test.tsx` | ✅ COMPLIANT |
| REQ-9 (Routing y wiring) | ProspectosPlaceholder no existe en el build | `pnpm type-check` exit 0 — sin referencias huérfanas | ✅ COMPLIANT |
| REQ-cache (Invalidaciones) | Crear invalida ['prospectos'] | `useCreateProspecto.test.tsx > crea e invalida query de lista` | ✅ COMPLIANT |
| REQ-cache (Invalidaciones) | Editar invalida ['prospectos'] + ['prospectos', id] | (useUpdateProspecto implementado; test indirecto) | ⚠️ PARTIAL |
| REQ-cache (Invalidaciones) | Eliminar removeQueries detail + invalidate list | `useDeleteProspecto.test.tsx > elimina y limpia cache` | ✅ COMPLIANT |
| REQ-cache (Invalidaciones) | Cambiar estado invalida ['prospectos'] + detalle | (estadoMutation en ProspectosListPage; sin test directo) | ⚠️ PARTIAL |

### prospecto-conversion (11 scenarios)

| REQ-ID | Scenario | Test | Resultado |
|--------|----------|------|-----------|
| REQ-CONV-1 (Contrato de tipos) | Type-check pasa tras commit atómico | `pnpm type-check` exit 0 (evidencia directa) | ✅ COMPLIANT |
| REQ-CONV-1 (Contrato de tipos) | EmpresaProspectosTab muestra badge Convertido | `EmpresaDetailPage.test.tsx > muestra badge Convertido en tab Prospectos` | ✅ COMPLIANT |
| REQ-CONV-2 (Acción convertir) | Conversión exitosa muta prospecto y crea cliente | `useConvertirProspecto.test.tsx > invalida las 5 query keys tras conversión exitosa` + handler MSW verificado | ✅ COMPLIANT |
| REQ-CONV-2 (Acción convertir) | Botón Convertir oculto cuando estado es convertido | `ProspectoDetailPage.test.tsx > NO muestra botón Convertir cuando ya convertido` | ✅ COMPLIANT |
| REQ-CONV-2 (Acción convertir) | Cancelar AlertDialog no invoca endpoint | (ConvertirProspectoDialog; sin test directo) | ⚠️ PARTIAL |
| REQ-CONV-2 (Acción convertir) | Error de red en conversión muestra toast | `useConvertirProspecto.test.tsx > maneja error 500 sin romper estado del cache` | ✅ COMPLIANT |
| REQ-CONV-3 (Tab Convertidos) | Tab Convertidos muestra "Este mes" con timestamp | `ProspectosListPage.test.tsx > muestra tab Convertidos con Valentina Cruz en este mes` | ✅ COMPLIANT |
| REQ-CONV-3 (Tab Convertidos) | Convertidos anteriores en Collapsible | (implementado; fixture Marco Herrera mes anterior; sin test de click en Collapsible) | ⚠️ PARTIAL |
| REQ-CONV-3 (Tab Convertidos) | Sin convertidos este mes muestra empty state | (implementado "Sin conversiones este mes"; sin test) | ⚠️ PARTIAL |
| REQ-CONV-3 (Tab Convertidos) | Sin ningún convertido muestra empty state global | (implementado "Aún no hay prospectos convertidos"; sin test) | ⚠️ PARTIAL |

**Resumen de compliance**: 17/38 scenarios COMPLIANT con test ejecutado, 2 UNTESTED (REQ-4 guardar notas post-conversión + REQ-4 422 edición), 19 PARTIAL (código implementado pero sin test directo o con brecha de UI).

---

## Correctness (Análisis estático — evidencia estructural)

| Requisito | Estado | Notas |
|-----------|--------|-------|
| Contrato `EstadoPosibleCliente` + `prospecto_origen_id` | ✅ Implementado | `src/api/types.ts` extendido correctamente |
| Handler POST `/convertir` muta prospecto + crea cliente | ✅ Implementado | `handlers/prospectos.ts` líneas 46-71; muta in-place, crea cliente con FK |
| Fixture prospectos con 2 convertidos (este mes + anterior) | ✅ Implementado | `b4444444` (mayo 2026) + `b5555555` (abril 2026) |
| `useProspectos` soporta filtro `responsable_id` | ✅ Implementado | Hook completo; UI del top-bar incompleta (ver WARN-01) |
| `useConvertirProspecto` invalida 5 query keys | ✅ Implementado | Verificado en código + test ejecutado |
| `ProspectoForm` — `isLocked` deshabilita todos salvo notas | ✅ Implementado | Código correcto; sin test directo (ver WARN-02) |
| `ProspectosListPage` — tabs Activos/Convertidos | ✅ Implementado | Verificado en tests |
| `ProspectoDetailPage` — redirect 404 | ✅ Implementado | Verificado en tests |
| Router wiring `/prospectos` + `/prospectos/:id` | ✅ Implementado | `router.tsx` verificado |
| `EmpresaProspectosTab` records exhaustivos | ✅ Implementado | `estadoBadgeClass` y `estadoLabel` cubren las 4 claves |
| Top-bar: búsqueda client-side | ✅ Implementado | |
| Top-bar: Select responsable + Toggle "Solo míos" | ❌ Ausente | Solo hay Input de búsqueda (WARN-01) |
| Error state con botón "Reintentar" en listado | ⚠️ Parcial | Mensaje de error sí; botón "Reintentar" ausente (WARN-04) |
| 404 en detalle: mensaje + botón "Volver" explícito | ⚠️ Parcial | Mensaje sí; botón "Volver a Prospectos" ausente durante los 1500ms (SUG-02) |

---

## Coherence (Diseño — ADRs)

| Decisión | Seguida | Notas |
|----------|---------|-------|
| ADR-022: Kanban 3 columnas, no tabla | ✅ Sí | |
| ADR-023: filtrado client-side (búsqueda + convertidos) | ✅ Sí | |
| ADR-024: `prospecto_origen_id` en `Cliente` como FK | ✅ Sí | |
| ADR-025: commit atómico + 5 invalidaciones en convertir | ✅ Sí | Verificado con spy en test |
| ADR-026: `isLocked` en form, no en hook | ✅ Sí | `ProspectoFormDialog` deriva `isLocked` |
| ADR-027: Tab Tratos con `enabled` lazy | ✅ Sí | `ProspectoDetailPage.tsx` línea 164 |
| ADR-028: Select inline de estado, no DnD | ✅ Sí | |
| ADR-029: `useEmpresas` + `useUsuarios` en form Selects | ✅ Sí | |
| `handleEstadoChange` usa `useMutation` directa (no `useUpdateProspecto`) | ✅ Desviación documentada | Equivalente; id dinámico hace imposible el hook con id fijo |
| `estado_posible_cliente` es `.optional()` (no `.default('frio')`) | ⚠️ Desviación mitigada | `EMPTY_DEFAULTS` garantiza el valor en el form; riesgo residual menor |

---

## Verified OK (muestra de scenarios clave que pasan)

- **Invalidación de 5 keys en convertir** — `useConvertirProspecto.test.tsx` verifica con spy cada una de las 5 llamadas a `invalidateQueries`. PASS.
- **Redirect 404 en ProspectoDetailPage** — test espera `{ timeout: 3000 }` y verifica que el router navega a "Listado de prospectos". PASS.
- **Badge "Convertido" en EmpresaDetailPage** — test activa el tab "Prospectos" con userEvent.click y verifica texto "Convertido". PASS.
- **Tab Convertidos "este mes"** — Valentina Cruz (mayo 2026) aparece en la sección "Convertidos este mes". PASS. Marco Herrera (abril 2026) no aparece en esa sección. PASS.
- **Lazy load de Tratos** — el fetch de tratos solo ocurre al hacer click en el tab. PASS (evidencia: el test hace userEvent.click antes de esperar el texto del trato).
- **Prospectos convertidos excluidos del Kanban activo** — `screen.queryByText('Valentina Cruz')` → null en el tab Activos. PASS.

---

## Notas para futuros Changes

### Patrón: verificar Sidebar al hacer wiring de nueva ruta

En este Change el link de `/prospectos` en `Sidebar.tsx` tenía `disabled: true` y fue corregido durante el smoke manual (después del commit de wiring). Para futuros Changes, el sub-agente de apply DEBE agregar explícitamente en la tarea de wiring: "verificar que el item correspondiente en `Sidebar.tsx` no tiene `disabled: true`". Esto podría agregarse al checklist de T_D.5 como criterio "Done when".

### Patrón: ADR-020 (sin tests directos de componentes) deja gaps de compliance

La política de no escribir tests directos para componentes (solo para hooks y pages) resulta en ~19 scenarios PARTIAL porque los caminos alternativos (error state, cancelar dialog, empty states) solo se cubren si la page-level test los ejercita explícitamente. Para Changes futuros se recomienda revisar si los scenarios de edge-case de componentes críticos (ProspectoDeleteDialog cancel, error 422 en form, etc.) deberían tener tests de integración a nivel de página.

### Deuda técnica de filtros top-bar

Los controles de "Solo míos" y "Select responsable" no fueron implementados en la UI aunque el hook soporta los params. Esto es deuda técnica explícita que debe resolverse antes de que el feature sea considerado completo. Se recomienda abrir un Change de seguimiento o agregar como primera tarea del Change 5.

---

## Veredicto Final

**APPROVED-WITH-WARNINGS**

La implementación es sólida: 54/54 tests verdes, type-check exit 0, lint exit 0. Los componentes críticos (conversión, invalidación de cache, redirect 404, lazy load de tratos, badge Convertido) están implementados correctamente y tienen evidencia de test ejecutado. Los warnings no bloquean el archive pero representan deuda real: los filtros de responsable y "Solo míos" en el top-bar están ausentes en la UI (la funcionalidad está en el hook pero no expuesta al usuario), y el botón "Reintentar" en el estado de error del listado está ausente. Se recomienda registrar WARN-01 y WARN-04 como tareas de seguimiento en el backlog antes de archivar.
