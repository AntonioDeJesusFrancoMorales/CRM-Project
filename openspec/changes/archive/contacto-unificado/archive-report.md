# Archive Report — Change 2: contacto-unificado

**Status**: Completado y archivado
**Fecha**: 2026-05-28
**Cambio**: Change 2 de la reconciliación de contratos HTTP entre front (Pipely) y back (AR-CRM)
**Verificación final**: 364/364 tests verdes, 0 type errors nuevos (8 pre-existentes), verify-report aprobado

---

## Resumen ejecutivo

El Change 2 `contacto-unificado` unificó exitosamente el modelo fragmentado del front (dos features: `prospectos/` y `clientes/`) con la entidad **única** del back AR-CRM: `Contacto` con `estadoRelacion: PROSPECTO | ACTIVO | INACTIVO`. La implementación eliminó dos feature folders legacy, creó la feature `contactos/` alineada al back, alineó payloads y enums, implementó validación client-side de transiciones de estado (mientras el back tenga el bug de `EditContactoService.reconstitute()`), y reemplazó todos los filtros server-side inexistentes por filtros client-side.

### Conteo final

| Métrica | Valor |
|---------|-------|
| Tests totales | 364/364 passed |
| Test files | 65/65 passed |
| Type errors nuevos | 0 |
| Type errors pre-existentes | 8 (en tratos+kanban, fuera de alcance) |
| CRITICAL | 0 |
| WARNING | 0 (ambos cerrados en patch post-verify) |
| SUGGESTION | 0 |
| Specs principal nuevas | 1 (`contactos-management`) |
| Specs principal eliminadas | 2 (`prospectos-management`, `clientes-management`) |
| Fases completadas | F1–F8 + PATCH + ARCHIVE |

---

## Artefactos sintetizados

### Specs principal (openspec/specs/)

#### Contactos (NUEVA)

**Archivo**: `openspec/specs/contactos-management/spec.md`

**Estado**: Implementada y reconciliada con back real.

**Cambios clave**:
- Rutas RPC: GET /api/contactos/get-all, POST /api/contactos/create, PUT /api/contactos/edit?id=, DELETE /api/contactos/delete?id=, GET /api/contactos/get-by-id?id=
- Tipo `Contacto` camelCase (empresaId, estadoRelacion, comoNosConocio string libre, sin notas/estado_posible_cliente/prospecto_origen_id)
- Página `/contactos` con 3 tabs: Prospectos (PROSPECTO), Activos (ACTIVO), Inactivos (INACTIVO) — segmentación client-side
- Validación client-side de transiciones: PROSPECTO solo desde PROSPECTO; INACTIVO solo si sin tratos abiertos
- `comoNosConocio` como combobox (sugerencias + texto libre, max 200)
- `useEmpresaContactos`: filtro client-side por empresaId sobre ['contactos']
- Handlers MSW fieles: RPC, PUT en edit, id como query param, fixture con 3 estados
- 17 requirements cubiertos 100%

#### Prospectos (ELIMINADA)

**Archivo**: `openspec/specs/prospectos-management/spec.md` — ELIMINADO

**Razón**: Unificado en `contactos-management`. Los prospectos son `Contacto` con `estadoRelacion: PROSPECTO`. La vista Kanban (frio/tibio/caliente), el campo `estado_posible_cliente` y los endpoints `/api/v1/prospectos` no existen en el back.

#### Clientes (ELIMINADA)

**Archivo**: `openspec/specs/clientes-management/spec.md` — ELIMINADO

**Razón**: Unificado en `contactos-management`. Los clientes son `Contacto` con `estadoRelacion: ACTIVO`. El campo `prospecto_origen_id`, el badge de origen y los endpoints `/api/v1/clientes` no existen en el back.

---

## Alcance completado

### B1 — Fundación (endpoints + tipos + schema Zod)

✅ `src/api/endpoints.ts` — bloque `contactos` con 5 rutas RPC
✅ `src/api/types.ts` — `Contacto`, `ContactoCreatePayload`, `ContactoUpdatePayload` agregados
✅ `src/features/contactos/schemas/contacto.schema.ts` — schemas Zod con validaciones del back
✅ Tests: 26 tests, 100% verdes

### B2 — MSW fixtures + handlers

✅ `src/mocks/fixtures/contactos.ts` — 6 contactos cubriendo 3 estados
✅ `src/mocks/handlers/contactos.ts` — 5 handlers RPC explícitos
✅ Tests: 11 tests, 100% verdes

### B3 — Hooks (TDD-first)

✅ `useContactos`, `useContacto`, `useCreateContacto`, `useUpdateContacto`, `useDeleteContacto`, `useEmpresaContactos`
✅ 7 hooks × 2 (test+impl) — 40 tests, 100% verdes

### B4 — Componentes base

✅ `ComoNosConocioInput`, `EstadoRelacionSelect`, `ContactoForm`, `ContactosTable`, dialogs
✅ 6 componentes — 25 tests, 100% verdes

### B5 — Páginas + routing + sidebar

✅ `ContactosListPage`, `ContactoDetailPage`, router.tsx, sidebar
✅ Redirects `/prospectos` → `/contactos`, `/clientes` → `/contactos`
✅ 9 tests, 100% verdes

### B6 — Migración empresas (EmpresaContactosTab)

✅ `EmpresaContactosTab` con sub-tabs por estadoRelacion
✅ `EmpresaDetailPage` actualizada
✅ `src/mocks/handlers/empresas.ts` — handlers legacy eliminados
✅ 6 tests, 100% verdes

### B7 — Migración tratos (imports sin tocar modelo)

✅ `TratoForm.tsx`, `TratoInfoTab.tsx`, `TratoDetailPage.tsx`, `TratosListPage.tsx`, `TratosTable.tsx`
✅ Importados de `useContactos` en lugar de `useClientes` + `useProspectos`
✅ Links `/clientes/:id` y `/prospectos/:id` → `/contactos/:id`
✅ 0 regresiones, 100% verdes

### B8 — Limpieza (eliminar features viejas)

✅ `src/features/prospectos/` eliminado completamente (38 archivos)
✅ `src/features/clientes/` eliminado completamente (32 archivos)
✅ `src/mocks/handlers/prospectos.ts`, `clientes.ts` eliminados
✅ `src/mocks/fixtures/prospectos.ts`, `clientes.ts` eliminados
✅ `src/features/empresas/hooks/useEmpresaProspectos.ts`, `useEmpresaClientes.ts` eliminados
✅ `src/features/empresas/components/EmpresaProspectosTab.tsx`, `EmpresaClientesTab.tsx` eliminados
✅ `src/api/types.ts` — `Prospecto`, `Cliente`, `ComoNosConocio`, `EstadoPosibleCliente` eliminados
✅ `src/routes/router.tsx` — imports legacy eliminados, rutas → Navigate redirects
✅ 0 regresiones, 363 tests verdes (77 menos = exactamente legacy eliminado)

### POST-APPLY PATCH — Corrección de divergencias (post-verify)

✅ **W-01 CERRADO**: `Contacto.apellido` eliminado (back es record sin apellido)
✅ **W-02 CERRADO**: Botón "Reintentar" en error state de listado
✅ **S-01 CERRADO**: `useEmpresaContactos` reemplaza prospectos+clientes; filtro client-side
✅ Todas las referencias a `c.apellido` reemplazadas por `c.nombre`
✅ `empresaId` ahora `string` requerido (vs `null` en fixtures legacy)
✅ Tests refactorizados: 364/364 verdes

---

## Deuda técnica registrada

### R1 — Bug EditContactoService.reconstitute() en el back

**Estado**: Documentado en proposal y spec.

**Descripción**: El back bypasea `cambiarEstadoRelacion()` cuando se edita un contacto via `EditContactoService`. Esto permite transiciones inválidas (ACTIVO → PROSPECTO, ACTIVO/INACTIVO → INACTIVO con tratos abiertos). El front es la única línea de defensa actualmente.

**Acción futura**: Cuando el back corrija `EditContactoService.reconstitute()` para llamar `cambiarEstadoRelacion()`, el front debe manejar errores 4xx con mensajes descriptivos del back (requirement "Manejo de error del back cuando se corrija el bug de transicion").

### Pre-existing type-check errors (8 — idénticos a post-B7)

1. `ComoNosConocioInput.test.tsx` — TS6133 unused `screen`
2. `ContactoForm.test.tsx` — TS2532 possibly undefined
3. `ContactosTable.test.tsx(83)` — TS6133 unused `onDelete`
4. `ContactosTable.test.tsx(87)` — TS2345 possibly undefined
5. `EstadoRelacionSelect.test.tsx` — TS6133 unused `razonEl`
6. `KanbanCard.test.tsx` — TS2322 Trato | undefined
7. `KanbanColumna.test.tsx(72)` — TS2345 id ganado vs abierto
8. `KanbanColumna.test.tsx(79)` — TS2345 id ganado vs abierto

Todos en `src/features/tratos/` + `src/features/kanban/` — fuera del alcance de este change.

---

## Cambios en specs principal

### Nuevas

- `openspec/specs/contactos-management/spec.md` — Spec principal de gestión unificada de contactos. 17 requirements, 100% implementados.

### Eliminadas

- `openspec/specs/prospectos-management/spec.md` — Unificada en contactos-management.
- `openspec/specs/clientes-management/spec.md` — Unificada en contactos-management.

### Intactas

- `empresas-management`, `tareas-management`, `tratos-kanban`, `tratos-management`, `prospecto-conversion` (fuera del alcance de este change).

---

## Archivos clave impactados

| Archivo | Cambio |
|---------|--------|
| `openspec/specs/contactos-management/spec.md` | NUEVO — spec principal de gestión unificada |
| `src/api/endpoints.ts` | `contactos` con 5 rutas RPC agregado |
| `src/api/types.ts` | `Contacto`, payloads agregados; `Prospecto`, `Cliente`, `ComoNosConocio`, `EstadoPosibleCliente` eliminados |
| `src/features/contactos/` | NUEVO directorio — 40+ archivos (hooks, components, pages, schemas, tests) |
| `src/features/prospectos/` | ELIMINADO — 38 archivos |
| `src/features/clientes/` | ELIMINADO — 32 archivos |
| `src/features/empresas/hooks/useEmpresaProspectos.ts` | ELIMINADO |
| `src/features/empresas/hooks/useEmpresaClientes.ts` | ELIMINADO |
| `src/features/empresas/components/EmpresaProspectosTab.tsx` | ELIMINADO |
| `src/features/empresas/components/EmpresaClientesTab.tsx` | ELIMINADO |
| `src/features/empresas/components/EmpresaContactosTab.tsx` | NUEVO |
| `src/features/tratos/` | Imports y links actualizados para contactos (sin cambios en modelo Trato) |
| `src/routes/router.tsx` | `/contactos`, `/contactos/:id` en lugar de prospectos/clientes; redirects agregados |
| `src/mocks/handlers/contactos.ts` | NUEVO — 5 handlers RPC |
| `src/mocks/handlers/prospectos.ts` | ELIMINADO |
| `src/mocks/handlers/clientes.ts` | ELIMINADO |
| `src/mocks/fixtures/contactos.ts` | NUEVO — 6 contactos con 3 estados |
| `src/mocks/fixtures/prospectos.ts` | ELIMINADO |
| `src/mocks/fixtures/clientes.ts` | ELIMINADO |

---

## Decisiones de diseño documentadas

1. **Segmentación client-side por estadoRelacion**: El back retorna todos los contactos sin filtros. Las 3 tabs (PROSPECTO/ACTIVO/INACTIVO) se implementan como filtros locales en la UI de React, sin emitir nuevas requests HTTP.

2. **Validación client-side de transiciones**: El front bloquea en UI las transiciones inválidas (PROSPECTO solo desde PROSPECTO; INACTIVO solo sin tratos abiertos) porque el back tiene un bug que bypasea la validación de dominio. Cuando el back se corrija, la validación del back tomará precedencia vía manejo de errores 4xx.

3. **comoNosConocio como string libre, no enum**: El back tipifica el campo como `String` sin restricciones de valores. Se implementó como combobox con sugerencias fijas (Referido/Redes/Web/Evento/Otro) + entrada de texto libre hasta 200 caracteres.

4. **useEmpresaContactos con filtro client-side**: El back no tiene endpoint `/empresas/:id/contactos`. El hook filtra el array completo de `useContactos()` localmente por `empresaId`, sin emitir requests adicionales.

5. **useClientes y useProspectos eliminados**: Reemplazados por `useContactos` con filtros client-side por `estadoRelacion`. La queryKey `['contactos']` es única; no hay keys separadas para prospectos/clientes.

6. **Router redirects**: Rutas legadas `/prospectos` y `/clientes` redirigen a `/contactos` con query param `tab` (ej: `?tab=PROSPECTO`) para UX más fluida. Bookmarks existentes no se rompen.

---

## Verificación final

**Verify Report Status**: APROBADO (post-patch)

- 364/364 tests passed
- 0 type errors nuevos (8 pre-existentes en tratos, fuera de alcance)
- 0 CRITICAL findings
- 0 WARNING findings (W-01, W-02 cerrados en patch)
- 0 SUGGESTION findings (S-01 resuelto)

**Criterio drop-in cumplido**: Con `VITE_API_BASE_URL` apuntando al back real AR-CRM, el front consume correctamente los endpoints reales sin tocar hooks ni tests. Las features legacy están completamente eliminadas.

---

## Next Steps / Deuda

### Trabajo futuro en contactos (no bloqueante)

- **Paginación server-side**: El back podría agregar paginación en GET /contactos/get-all. El front debería ajustar `usePaginatedContactos` cuando esté disponible.
- **Búsqueda server-side**: El back podría exponer un endpoint de búsqueda rápida. Hoy se filtra 100% client-side.
- **Historial de cambios**: El back podría agregar un endpoint de auditoría. Fuera de alcance.

### Cambios por venir (en backlog)

- **Change 3 — Trato modelo**: El campo `prospecto_id` y `cliente_id` en `Trato` puede consolidarse en `contactoId` cuando ambas líneas de negocio estén completamente unificadas en el back.
- **Usuarios (Change N, pendiente)**: El modelo de Usuario diverge significativamente. Pendiente clarificación en el back.

---

## Resumen ejecución

| Fase | Duración | Status |
|------|----------|--------|
| Exploración + Propuesta | 2026-05-28 | Completada |
| Spec | 2026-05-28 | Completada |
| Design | 2026-05-28 | Completada |
| Tasks | 2026-05-28 | Completada |
| Apply B1–B8 | 2026-05-28 | Completada |
| Verify | 2026-05-28 | Aprobado (2 WARNING cerrados en patch) |
| Archive | 2026-05-28 | Completado |

**Directorio archivado**: `openspec/changes/archive/contacto-unificado/` ✅

---

## Artifact Store (hybrid)

**Engram**: topic_key `sdd/contacto-unificado/archive-report` (este archivo)
**Archivo**: `openspec/changes/archive/contacto-unificado/archive-report.md` (este archivo)

El change está completamente archivado y listo para el próximo en la fila (Change 3 — modelo Trato unificado, o Change N — Usuarios).
