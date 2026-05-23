# Archive Report — prospectos-crud (Change 4)

**Fecha de archivado**: 2026-05-22 (America/Mexico_City)  
**Veredicto de verify**: APPROVED-WITH-WARNINGS  
**Persistencia**: hybrid (artifacts en openspec/ + engram)  
**Engram observation IDs**: proposal #146, spec #147, design #148, tasks #149, apply-progress #150, verify-report #156

---

## Executive Summary

Change 4 `prospectos-crud` implementó la gestión completa de prospectos en el CRM Pipely: vista Kanban de 3 columnas (`frio`, `tibio`, `caliente`), página de detalle `/prospectos/:id` con tabs Información y Tratos, creación/edición/eliminación, cambio de estado inline, conversión a cliente con trazabilidad de origen, y tab Convertidos con agrupación temporal (este mes / anteriores). La implementation es **sólida y funcional** (60/60 tests verdes, type-check exit 0, lint exit 0), pero contiene **4 warnings documentados** como deuda técnica que se recomienda resolver en Changes futuros.

---

## Estado de implementación

| Métrica | Valor |
|---------|-------|
| Tests ejecutados | 60/60 passed |
| Type-check | ✅ exit 0 |
| Lint | ✅ exit 0 (7 warnings pre-existentes en shadcn/ui) |
| Tareas completadas | 46/46 (39 originales + 7 del Lote G post-verify) |
| Spec scenarios | 38 total |
| Scenarios COMPLIANT (con test ejecutado) | 17/38 |
| Scenarios PARTIAL (código sí, test directo no) | 19/38 |
| Scenarios UNTESTED | 2/38 |
| CRITICAL issues | 0 |
| WARNINGS | 4 (documentadas como deuda) |
| SUGGESTIONS | 4 (futuras mejoras) |

---

## Veredicto de verify

**APPROVED-WITH-WARNINGS**

Los warnings se dividen en dos categorías:

### Warnings críticos para el feature (resueltos en Lote G)

- **WARN-01**: Filtros top-bar "Solo míos" + Select responsable ausentes en UI (pero infraestructura de hook existe). **Resuelto en Lote G** — ambos controles implementados y testeados.
- **WARN-04**: Botón "Reintentar" ausente en error state del listado. **Resuelto en Lote G** — botón agregado.

### Warnings de coverage de test (documentados como deuda técnica)

- **WARN-02**: `ProspectoForm.tsx` — el campo `notas` se mantiene editable cuando `isLocked=true` (correcto per ADR-026), pero sin test directo que lo verifique. Implementación correcta; gap de test.
- **WARN-03**: `estado_posible_cliente` es `.optional()` en lugar de `.default('frio')`. Mitigado por `EMPTY_DEFAULTS` en el form; riesgo residual menor si el form se reutiliza sin defaults.

---

## Smoke manual

✅ **Completado y validado** en browser por el desarrollador al final de la fase apply (Lote G):

- Sidebar link de `/prospectos` funciona y no estaba deshabilitado
- Filtros top-bar (búsqueda, "Solo míos", Select responsable) operacionales
- Kanban muestra 3 columnas con prospectos activos; convertidos excluidos
- Filas del tab Convertidos clickeables y navegan a detalle
- Badge "Convertido" no duplicado en detalle
- Nombre de empresa en tabla de convertidos clickeable (vinculado a empresa detail)
- Conversión exitosa muta prospecto y crea cliente con FK
- Invalidación de queries funcional para cambios de estado
- Redirect 404 en detalle inexistente

---

## Archivos archivados

Moved de `openspec/changes/prospectos-crud/` a `openspec/changes/archive/2026-05-22-prospectos-crud/`:

| Archivo | Tamaño | Descripción |
|---------|--------|-------------|
| `proposal.md` | 23 KB | Propuesta del Change: intent, scope, rationale, capabilities |
| `design.md` | 25 KB | Diseño técnico: 8 ADRs (022-029), decomposición de componentes |
| `exploration.md` | 22 KB | Exploración previa: opciones de layout (tabla vs Kanban), análisis de filtros |
| `tasks.md` | 18 KB | Desglose de 39 tareas en 6 lotes (A-G) — todas completadas con [x] |
| `verify-report.md` | 21 KB | Reporte de verify: compliance matrix, correctness, coherence, scenarios verificados |

**Nota**: Los deltas de specs (`prospectos-management/spec.md` y `prospecto-conversion/spec.md`) fueron movidos a `openspec/specs/` como specs principales (fuente de verdad). No se duplican en el archive.

---

## Specs principales actualizadas

Las dos capabilities del Change fueron promovidas a specs principales en `openspec/specs/`:

### 1. `openspec/specs/prospectos-management/spec.md` (15 KB)

Capability que cubre:
- Listado Kanban de 3 columnas (frio, tibio, caliente)
- Filtros top-bar (búsqueda, Select responsable, Toggle "Solo míos")
- CRUD: crear, editar, eliminar prospecto
- Cambio de estado in-place (Select inline en card)
- Página de detalle `/prospectos/:id` con tabs Información + Tratos (read-only)
- Routing y wiring (`/prospectos`, `/prospectos/:id`)
- Invalidación de cache tras mutations

**9 requisitos principales**, 27 scenarios.

### 2. `openspec/specs/prospecto-conversion/spec.md` (7 KB)

Capability que cubre:
- Extensión de contrato: `EstadoPosibleCliente` suma `'convertido'`; `Cliente` suma `prospecto_origen_id`
- Acción de convertir a cliente (AlertDialog + `POST /prospectos/:id/convertir`)
- Tab Convertidos con agrupación temporal (este mes / anteriores en Collapsible)
- Trazabilidad: join `prospectos` + `clientes` por `prospecto_origen_id`

**3 requisitos principales**, 11 scenarios.

---

## Deuda técnica documentada

### WARN-02 — Test directo de `ProspectoForm.isLocked`

**Qué**: El campo `notas` del form mantiene `disabled={false}` incluso cuando `isLocked=true`, pero no hay test que lo verifique.

**Por qué**: Política ADR-020 (sin tests directos de componentes). La cobertura es implícita por test de detalle que verifica el badge "Convertido".

**Recomendación**: Agregar test unitario que monte `ProspectoForm` con `isLocked={true}` y verifique:
```javascript
expect(screen.getByLabelText('Nombre contacto')).toBeDisabled()
expect(screen.getByLabelText('Notas')).not.toBeDisabled()
```

**Archivo**: `src/features/prospectos/__tests__/ProspectoForm.test.tsx` (crear)

---

### WARN-03 — `estado_posible_cliente` schema es `.optional()` (no `.default('frio')`)

**Qué**: El schema Zod define `estado_posible_cliente: z.enum([...]).optional()` sin default, pero el form inicializa con `EMPTY_DEFAULTS = { estado_posible_cliente: 'frio' }`.

**Por qué**: Conflicto de tipos entre `.default()` y RHF `Resolver<>` durante la implementación del Lote B. La solución fue cambiar a `.optional()` y mitigar en el form.

**Riesgo residual**: Si el form se reutiliza en otro contexto sin `EMPTY_DEFAULTS`, el campo podría enviarse `undefined`.

**Recomendación**: Investigar si es posible cambiar el schema a `.default('frio')` y resolver el conflicto con el Resolver, o agregar test que verifique el valor default en el submit.

**Archivo**: `src/features/prospectos/schemas/prospecto.schema.ts` (línea 25)

---

### Patrón: Sidebar link en wiring (SUG-04)

**Hallazgo**: El link de `/prospectos` en `Sidebar.tsx` tenía `disabled: true` y fue corregido en un commit anterior a la finalización del Change (commit `cf27c83`). 

**Recomendación para futuros Changes**: Agregar al checklist de wiring (ej: T_D.5) el punto explícito: "Verificar que el item correspondiente en `Sidebar.tsx` NO tiene `disabled: true`". Esto podría automatizarse en SDD tasks como `Done when: Sidebar link is enabled`.

---

### UX: empresa name no es clickeable en tab Convertidos post-archive

**Observación**: En el tab Convertidos, la columna de empresa muestra el nombre como link a `/empresas/:id`, pero este patrón se estableció durante el Lote G. Si se agrega paginación o más datos al tab Convertidos en futuros Changes, la navegación a empresa detail debe ser clara.

**Recommendation**: Documentar en la spec principal `prospectos-management` > REQ-5 que los links a empresa en todas las vistas (cards del Kanban, Convertidos) deben tener `onClick={(e) => e.stopPropagation()}` para evitar navegación anidada.

---

## Commits del Change

| Hash | Mensaje | Descripción |
|------|---------|-------------|
| `5fd47f4` | `fix(prospectos): quitar badge Convertido duplicado en detalle` | Lote G final — arreglo estético |
| `14cff27` | `feat(prospectos): hacer clickeables filas del tab Convertidos` | Lote G — navegación desde Convertidos |
| `bb98b20` | `feat(prospectos): completar filtros top-bar y botón reintentar` | Lote G — resueltos WARN-01 y WARN-04 |
| `cf27c83` | `fix(prospectos): habilitar link en sidebar` | Pre-Change 4 (Change 3) — pero vinculado |
| `0d16ef0` | `feat(prospectos): implementar CRUD + flujo de conversión a cliente (Change 4, sin smoke)` | Implementación completa (Lotes A-F) |

**Total**: 5 commits asociados; 1 + 1 + 1 = 3 commits de Lote G post-verify.

---

## Estructura del Change archivado

```
openspec/changes/archive/2026-05-22-prospectos-crud/
├── proposal.md              ← Propuesta: intent, scope, rationale
├── design.md                ← Diseño técnico: 8 ADRs, decomposición
├── exploration.md           ← Exploración: opciones analizadas
├── tasks.md                 ← Breakdown: 39 tareas + Lote G (7 adicionales)
├── verify-report.md         ← Verify: compliance matrix, warnings, suggestions
└── archive-report.md        ← Este archivo
```

**Nota**: Los directorios `specs/prospectos-management/` y `specs/prospecto-conversion/` NO están en el archive — fueron sincronizados a `openspec/specs/` como source of truth.

---

## Testing Strategy (SDD Strict TDD, 60/60 tests)

### Lotes A-E: Desarrollo forward

- **Lote A** (atomic commit): contract changes + fixture. Tests preexistentes pasan.
- **Lote B** (7 hooks): RED→GREEN TDD para cada hook. 2 tests por hook = 14 tests verdes.
- **Lote C** (11 componentes): UI components testeados a nivel de página (ProspectosListPage.test, ProspectoDetailPage.test).
- **Lote D** (7 tareas): Páginas, routing, wiring. 53/53 tests después de Lote D.
- **Lote E** (2 tareas): Integración con EmpresaDetailPage. 54/54 tests.

### Lote G: Post-verify fixes

- **RED→GREEN** para 3 scenarios nuevos (filtros, reintentar, navegación desde Convertidos).
- **Resultado**: 60/60 tests verdes.

### Cobertura alcanzada

- **Hooks**: completa (TDD strict)
- **Pages**: completa (integration tests)
- **Components**: parcial (policy ADR-020: sin tests directos, cobertura implícita por page-level tests)
- **Scenarios spec compliance**: 17/38 COMPLIANT (test ejecutado), 19/38 PARTIAL (código sí, test directo no), 2/38 UNTESTED

---

## Próximos pasos recomendados

1. **Commit de archivo**: `git add openspec/changes/archive/2026-05-22-prospectos-crud/ openspec/specs/`  
   → Commit: `chore(prospectos): archivar artifacts SDD del Change 4`

2. **Verificar main build**: `pnpm test:run` + `pnpm type-check` + `pnpm lint` en main post-archive

3. **Backlog de deuda técnica**:
   - [ ] WARN-02: Agregar test directo de `ProspectoForm.isLocked` (PRE)
   - [ ] WARN-03: Investigar `.default('frio')` vs `.optional()` en schema (PRE)
   - [ ] SUG-01: Empty state para "Ver convertidos anteriores" si vacío (FUT)
   - [ ] SUG-02: Botón "Volver a Prospectos" durante 1500ms en 404 (FUT)

4. **Change 5**: `clientes-management` — CRUD completo de clientes. El contrato ya está extendido por este Change.

---

## Archivos clave modificados en la implementación

### Core Features

- `src/features/prospectos/` — feature folder completa (11 archivos de componentes, 7 hooks, 3 páginas)
- `src/features/prospectos/__tests__/` — 8 test files (hooks + pages)
- `src/api/types.ts` — extensión de `EstadoPosibleCliente` y `Cliente`

### Integration Points

- `src/mocks/handlers/prospectos.ts` — handler `POST /prospectos/:id/convertir` + CRUD handlers
- `src/mocks/fixtures/prospectos.ts` — fixture con 2 prospectos convertidos
- `src/mocks/fixtures/clientes.ts` — agregado `prospecto_origen_id` a clientes existentes
- `src/features/empresas/components/EmpresaProspectosTab.tsx` — actualización exhaustiva de `Record<EstadoPosibleCliente>`
- `src/routes/router.tsx` — reemplazo de placeholder + nueva ruta `/prospectos/:id`
- `src/routes/placeholders.tsx` — eliminación de export de `ProspectosPlaceholder`
- `src/components/sidebar/Sidebar.tsx` — fix de link deshabilitado (pre-Change 4)

### Specs (Nuevas)

- `openspec/specs/prospectos-management/spec.md` — 9 REQs, 27 scenarios
- `openspec/specs/prospecto-conversion/spec.md` — 3 REQs, 11 scenarios

---

## Conclusión

Change 4 `prospectos-crud` cierra un ciclo importante del CRM Pipely: el pipeline comercial (prospecto → cliente) tiene ahora una representación visual completa (Kanban), trazabilidad de origen (prospecto_origen_id), y pages dedicadas para gestión detallada. La implementación es **sólida, testeable, y escalable** (60/60 tests, strict TDD activado). Los 4 warnings documentados son **deuda técnica conocida** que no bloquea el archive — representan gaps de coverage de test y una decisión de design pendiente sobre el schema Zod que pueden resolverse en Changes futuros sin retrabajar la implementación.

**Veredicto final**: ✅ **APROBADO PARA ARCHIVO**

---

**Generado por**: sdd-archive (sub-agent)  
**Modo**: hybrid (openspec + engram)  
**Fecha**: 2026-05-22  
**Observación engram**: topic_key `sdd/prospectos-crud/archive-report`
