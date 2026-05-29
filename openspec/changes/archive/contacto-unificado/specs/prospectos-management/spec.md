# prospectos-management — Delta Spec

**Capability**: prospectos-management
**Change**: contacto-unificado (Change 2)
**Base spec**: openspec/specs/prospectos-management/spec.md
**Delta tipo**: REMOVED (capability eliminada — unificada en contactos-management)
**Status**: proposed
**Fecha**: 2026-05-28

---

## Contexto del delta

La spec base `prospectos-management` describe una capability construida sobre endpoints inexistentes en el back AR-CRM (`/api/v1/prospectos`) y sobre un modelo de datos que no tiene respaldo en el dominio del back (`estado_posible_cliente: frio|tibio|caliente|convertido`, `notas`, Kanban por estado posible). El back modela prospectos como `Contacto` con `estadoRelacion: PROSPECTO`; no existe una entidad "Prospecto" separada.

Este delta marca todos los requirements de `prospectos-management` como **REMOVED** y los reemplaza con la capability `contactos-management` (ver `openspec/changes/contacto-unificado/specs/contactos-management/spec.md`).

---

## REMOVED Requirements

> Razon de eliminacion para todos: **unificado en contactos-management**.
> Los "prospectos" pasan a ser `Contacto` con `estadoRelacion: PROSPECTO`. La entidad separada `Prospecto`, sus endpoints `/api/v1/prospectos` y su vista Kanban (frio/tibio/caliente) no existen en el back.

---

### ~~Requirement: Listado Kanban de prospectos activos~~

**REMOVED** — Razon: El campo `estado_posible_cliente` (frio/tibio/caliente/convertido) no existe en el back AR-CRM. La vista Kanban que lo sustentaba se elimina. La segmentacion de contactos se realiza por `estadoRelacion` (PROSPECTO/ACTIVO/INACTIVO) via tabs en `ContactosListPage`.

---

### ~~Requirement: Filtros top-bar~~

**REMOVED** — Razon: Los filtros server-side por `responsable_id` y `estado_posible_cliente` no existen en el back. Los filtros de contactos son 100% client-side (ver `contactos-management`).

---

### ~~Requirement: Crear prospecto~~

**REMOVED** — Razon: El endpoint `POST /api/v1/prospectos` no existe. La creacion de contactos usa `POST /api/contactos/create` con `estadoRelacion: PROSPECTO` (ver `contactos-management`). Los campos de formulario cambian: `nombre_contacto` → `nombre`, `como_nos_conocio` (enum) → `comoNosConocio` (string libre), se eliminan `notas` y `estado_posible_cliente`.

---

### ~~Requirement: Editar prospecto~~

**REMOVED** — Razon: El endpoint `PATCH /api/v1/prospectos/:id` no existe. La edicion usa `PUT /api/contactos/edit?id=` (ver `contactos-management`). La logica de "edicion post-conversion con campos disabled" desaparece porque el estado `convertido` no existe en el back.

---

### ~~Requirement: Eliminar prospecto~~

**REMOVED** — Razon: El endpoint `DELETE /api/v1/prospectos/:id` no existe. La eliminacion usa `DELETE /api/contactos/delete?id=` (ver `contactos-management`).

---

### ~~Requirement: Cambio de estado in-place (frio/tibio/caliente)~~

**REMOVED** — Razon: El campo `estado_posible_cliente` no existe en el back. No hay cambio de estado "posible cliente" en el nuevo modelo. El cambio de `estadoRelacion` (PROSPECTO → ACTIVO → INACTIVO) se hace via el form de edicion con validacion de transiciones client-side (ver `contactos-management`).

---

### ~~Requirement: Detalle del prospecto~~

**REMOVED** — Razon: La ruta `/prospectos/:id` y el endpoint `GET /api/v1/prospectos/:id` no existen. El detalle de contacto usa `/contactos/:id` con `GET /api/contactos/get-by-id?id=` (ver `contactos-management`). Los cross-links `prospecto_origen_id` → `/clientes/:id` desaparecen (ese campo no existe en el back).

---

### ~~Requirement: Tab Tratos del detalle (prospectos)~~

**REMOVED** — Razon: El endpoint `GET /api/v1/prospectos/:id/tratos` no existe. Los tratos vinculados a un contacto se consultan directamente desde el feature de tratos usando `contactoId` (ver detalle de contacto en `contactos-management`).

---

### ~~Requirement: Routing y wiring (prospectos)~~

**REMOVED** — Razon: Las rutas `/prospectos` y `/prospectos/:id` se reemplazan por `/contactos` y `/contactos/:id`. Se SHOULD agregar redirect `/prospectos` → `/contactos` para bookmarks existentes.

---

### ~~Requirement: Invalidacion de cache tras mutations (prospectos)~~

**REMOVED** — Razon: La queryKey `['prospectos']` desaparece. Reemplazada por `['contactos']` (ver `contactos-management`).

---

## Archivos eliminados por este delta

| Archivo / Directorio |
|---|
| `src/features/prospectos/` (directorio completo — 27 archivos) |
| `src/mocks/handlers/prospectos.ts` |
| `src/mocks/fixtures/prospectos.ts` |
| `src/features/empresas/hooks/useEmpresaProspectos.ts` |
| `src/features/empresas/components/EmpresaProspectosTab.tsx` |

---

## Reemplazado por

`openspec/changes/contacto-unificado/specs/contactos-management/spec.md`
