# Archive Report — Change 1: contrato-endpoints-rpc

**Status**: Completado y archivado
**Fecha**: 2026-05-28
**Cambio**: Change 1 de la reconciliación de contratos HTTP entre front (Pipely) y back (AR-CRM)
**Verificación final**: 318/318 tests verdes, 0 type errors nuevos, verify-report aprobado

---

## Resumen ejecutivo

El Change 1 `contrato-endpoints-rpc` reconcilió exitosamente el contrato HTTP del front Pipely con el contrato **real** del back AR-CRM para los 3 recursos cuyo modelo de dominio coincide: `usuarios`, `empresas`, `tareas`. La implementación creó infraestructura única de fuente de verdad de rutas (`endpoints.ts`), migró todos los CRUD a rutas RPC del back (GET /get-all, POST /create, PUT /edit?id=, DELETE /delete?id=), alineó payloads y enums del back, y eliminó filtros server-side.

### Conteo final

| Métrica | Valor |
|---------|-------|
| Tests totales | 318/318 passed |
| Test files | 64/64 passed |
| Type errors nuevos | 0 |
| Type errors pre-existentes | 3 (en tratos, fuera de alcance) |
| CRITICAL | 0 |
| WARNING | 0 (ambos cerrados en patch) |
| SUGGESTION | 1 (fuera de alcance: S-01, Change 2) |
| Specs principal nuevas | 1 (`empresas-management`) |
| Specs principal modificadas | 1 (`tareas-management`) |
| Fases completadas | F1–F6 + PATCH |

---

## Artefactos sintetizados

### Specs principal (openspec/specs/)

#### Empresas (NUEVA)

**Archivo**: `openspec/specs/empresas-management/spec.md`

**Estado**: Implementada y reconciliada con back real.

**Cambios clave**:
- Rutas RPC: GET /api/empresas/get-all, POST /api/empresas/create, PUT /api/empresas/edit?id=, DELETE /api/empresas/delete?id=
- Sin GET /empresas/get-by-id: detalle resuelto client-side desde getAll
- Filtros client-side: nombre, sector, estadoRelacion
- Payload camelCase: paginaWeb, estadoRelacion (enum ACTIVO|INACTIVO|PROSPECTO), responsableId, notas, creadoPor
- 10 requirements cubiertos 100%
- Handlers MSW fieles al back: rutas RPC, PUT, query param id, camelCase, sin filtros server-side

#### Tareas (MODIFICADA)

**Archivo**: `openspec/specs/tareas-management/spec.md`

**Base**: spec anterior (`Change 6b`) escrita contra contrato inexistente

**Cambios del delta sincronizados**:
- Rutas RPC: GET /api/tareas/get-all, GET /api/tareas/get-by-id?id=, POST /api/tareas/create (tratoId en body), PUT /api/tareas/edit?id=, DELETE /api/tareas/delete?id=
- Enums del back (no valores antiguos): TipoTarea (GENERAL|SEGUIMIENTO|NEGOCIACION|CIERRE), PrioridadTarea (BAJA|MEDIA|ALTA|URGENTE)
- fechaLimite obligatorio como LocalDateTime ISO (no date-only, no nullable)
- Sin estado en el back: estado es client-only en localStorage (clave tarea-estado-${id})
- Filtros 100% client-side: tratoId, responsableId, tipo, prioridad, vencimiento
- Schema Zod alineado: sin campo estado, tratoId en create (no en edit)
- Handlers MSW: rutas RPC, sin filtros, sin estado en response, enums del back, tratoId en body de create

**Cobertura**: 12/12 requirements (100%)

---

## Alcance completado

### F1 — Infraestructura

✅ `src/api/endpoints.ts` — objeto centralizador de rutas RPC
✅ `apiClient.put()` agregado al cliente HTTP
✅ `BASE_URL` bajado de `/api/v1` a `/api`
✅ Todos los tests de infraestructura en verde

### F2 — Handlers MSW + Fixtures

✅ Reescritura de handlers de empresas y tareas con rutas RPC
✅ Fixtures con campos camelCase del back, enums nuevos, sin estado en tareas
✅ Tests de handlers interceptan las nuevas rutas correctamente

### F3 — Empresas (CRUD client-side)

✅ Tipos actualizados: EstadoRelacion, Empresa con paginaWeb/estadoRelacion/responsableId
✅ Detalle client-side: useEmpresa resuelve desde cache o get-all
✅ Schema Zod: nombre requerido, estadoRelacion enum opcional
✅ Hooks: useEmpresas, useCreateEmpresa, useUpdateEmpresa, useDeleteEmpresa usando endpoints.ts
✅ Tests: 100% verdes

### F4 — Tareas (tipos, enums, hooks)

✅ Tipos TipoTarea, PrioridadTarea alineados al back
✅ Schema Zod: enums del back (no valores antiguos), fechaLimite requerido, sin estado
✅ Hooks: useTareas (queryKey ['tareas'] plana, sin filtros), useCreateTarea (tratoId en body), useUpdateTarea (PUT), useTarea (get-by-id), useDeleteTarea
✅ Tests: 100% verdes

### F5 — Estado client-only en localStorage

✅ Funciones getTareaEstado, setTareaEstado, clearTareaEstado
✅ TareaEstadoMenu: dropdown con Iniciar/Completar/Reabrir (solo localStorage, sin HTTP)
✅ useDeleteTarea limpia entrada en localStorage
✅ Tests: 100% verdes

### F6 — Verificación final

✅ Linting: cero rutas literales `/api/v1/`, `/tareas/:id`, `/empresas/:id` fuera de endpoints.ts
✅ Cleanup: useCompletarTarea eliminado
✅ type-check: 3 errores pre-existentes en tratos (fuera de alcance), 0 nuevos
✅ test:run: 318 tests verdes

### PATCH — Corrección de divergencias (post-verify)

✅ **W-01 CERRADO**: useTareas con queryKey plana ['tareas'], sin query params al back. Filtros 100% client-side.
✅ **W-02 CERRADO**: Schema Zod con enums del back (GENERAL/SEGUIMIENTO/NEGOCIACION/CIERRE, BAJA/MEDIA/ALTA/URGENTE), fechaLimite requerido, sin estado.

---

## Deuda técnica registrada

### S-01 — Rutas literal con id en el path (out-of-scope)

**Archivos**: `useEmpresaProspectos.ts`, `useEmpresaClientes.ts`

**Estado**: Documentado como out-of-scope de este change, deuda de Change 2.

**Acción**: Los hooks usan `/empresas/${id}/prospectos` y `/empresas/${id}/clientes` porque estos endpoints no son verificados aún en el back. Cuando se reconcilien prospectos/clientes con el back (Change 2), estos hooks se actualizarán con rutas RPC.

---

## Errores pre-existentes documentados

Tres errores de type-check en `src/features/tratos/__tests__/` (KanbanCard.test.tsx:29, KanbanColumna.test.tsx:72 y 79), fuera del alcance de este change. El change NO introdujo errores nuevos en los recursos alcanzados.

---

## Cambios en specs principal

### Nuevas

- `openspec/specs/empresas-management/spec.md` — Spec principal de gestión de empresas, reconciliada con back real. 10 requirements.

### Modificadas

- `openspec/specs/tareas-management/spec.md` — Delta del change 1 sincronizado a la spec principal. Antes estaba escrita contra contrato inexistente; ahora es fiel al back real. 12 requirements.

### Intactas

- `clientes-management`, `prospectos-management`, `prospecto-conversion`, `tratos-kanban`, `tratos-management` (fuera del alcance de este change).

---

## Archivos clave impactados

| Archivo | Cambio |
|---------|--------|
| `src/api/endpoints.ts` | NUEVO — fuente única de rutas RPC |
| `src/api/client.ts` | `put()` agregado, BASE_URL bajado a /api |
| `src/api/types.ts` | EstadoRelacion, TipoTarea, PrioridadTarea, Empresa, Tarea actualizadas |
| `src/features/empresas/hooks/*` | Migradas a endpoints.ts, detalle client-side |
| `src/features/empresas/schemas/empresa.schema.ts` | paginaWeb (camelCase), estadoRelacion enum |
| `src/features/tareas/hooks/*` | Migradas a endpoints.ts, tratoId en body |
| `src/features/tareas/schemas/tarea.schema.ts` | Enums del back, fechaLimite requerido, sin estado |
| `src/features/tareas/hooks/useTareaEstado.ts` | NUEVO — localStorage para estado client-only |
| `src/mocks/handlers/{empresas,tareas}.ts` | Reescritos con rutas RPC del back |
| `src/mocks/fixtures/{empresas,tareas}.ts` | Campos camelCase, enums del back |

---

## Decisiones de diseño documentadas

1. **detalle client-side de empresa**: dado que el back no tiene GET /empresas/get-by-id, el detalle se resuelve leyendo la cache de ['empresas'] o ejecutando get-all si está vacía.

2. **useTareas sin parámetros de filtro**: aunque los componentes usan filtros (responsableId, tratoId, tipo, prioridad), la queryKey es ['tareas'] plana, sin embeber los filtros. El back retorna todo; los filtros se aplican client-side.

3. **tratoId en el body de create, no en path**: el back espera POST /tareas/create con tratoId en el body, no en el path de rutas anidadas.

4. **estado client-only en localStorage**: el back no tiene estado de tarea. El front lo mantiene como capa de presentación en localStorage bajo clave tarea-estado-${id}, sin enviarlo al back.

5. **Enums del back en el schema Zod**: se migró completamente de valores antiguos (llamada|reunion|1|2|3) a enums del back (GENERAL|SEGUIMIENTO|..., BAJA|MEDIA|...) en el schema de validación.

---

## Verificación final

**Verify Report Status**: APROBADO

- 318/318 tests passed
- 0 type errors nuevos (solo 3 pre-existentes en tratos, fuera de alcance)
- 0 CRITICAL findings
- 0 WARNING findings (ambos cerrados en patch)
- 1 SUGGESTION (S-01, fuera de alcance de este change)

**Criterio drop-in cumplido**: Con VITE_API_BASE_URL apuntando al back real AR-CRM, el front consume correctamente los endpoints reales sin tocar hooks ni tests.

---

## Next Steps / Deuda

### Change 2 — Contacto Unificado (prospectos/clientes)

- Reconciliar `useEmpresaProspectos` y `useEmpresaClientes` con rutas RPC del back (hoy fuera de alcance)
- Unificar el modelo `Prospecto|Cliente` al modelo `Contacto` del back
- Actualizar S-01 de este change

### Usuarios (Change 1, pendiente clarificación)

- Modelo de Usuario diverge no solo en nombres: el back exige `rolId: UUID` y `passwordHash` (NotBlank). El front no tiene catálogo de roles ni flujo de passwords.
- Pendiente decidir: ¿hardcodear rolId/passwordHash, traer catálogo del back, o diferir usuarios?

### Estado en el back (futuro)

- Sincronizar estado client-only con el back cuando agrege el campo `estado` en TareaResponse (hoy fuera de alcance).

---

## Resumen ejecución

| Fase | Duración | Status |
|------|----------|--------|
| Exploración + Propuesta | 2026-05-27 | Completada |
| Spec | 2026-05-27 | Completada |
| Design | 2026-05-27 | Completada |
| Tasks | 2026-05-27 | Completada |
| Apply | 2026-05-27 | Completada |
| Verify | 2026-05-28 | Aprobado (2 WARNING cerrados en patch) |
| Archive | 2026-05-28 | Completado |

**Directorio archivado**: `openspec/changes/archive/contrato-endpoints-rpc/` ✅

---

## Artifact Store (hybrid)

**Engram**: topic_key `sdd/contrato-endpoints-rpc/archive-report` (este archivo)
**Archivo**: `openspec/changes/archive/contrato-endpoints-rpc/archive-report.md` (este archivo)

El change está completamente archivado y listo para el próximo en la fila de reconciliación (Change 2 — Contacto Unificado).
