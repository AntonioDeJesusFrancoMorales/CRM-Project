# clientes-management — Delta Spec

**Capability**: clientes-management
**Change**: contacto-unificado (Change 2)
**Base spec**: openspec/specs/clientes-management/spec.md
**Delta tipo**: REMOVED (capability eliminada — unificada en contactos-management)
**Status**: proposed
**Fecha**: 2026-05-28

---

## Contexto del delta

La spec base `clientes-management` describe una capability construida sobre endpoints inexistentes en el back AR-CRM (`/api/v1/clientes`) y sobre campos que no existen en el dominio del back (`prospecto_origen_id`, `notas`, badge de origen, filtro server-side por empresa/origen). El back modela clientes como `Contacto` con `estadoRelacion: ACTIVO`; no existe una entidad "Cliente" separada.

Este delta marca todos los requirements de `clientes-management` como **REMOVED** y los reemplaza con la capability `contactos-management` (ver `openspec/changes/contacto-unificado/specs/contactos-management/spec.md`).

---

## REMOVED Requirements

> Razon de eliminacion para todos: **unificado en contactos-management**.
> Los "clientes" pasan a ser `Contacto` con `estadoRelacion: ACTIVO`. La entidad separada `Cliente`, sus endpoints `/api/v1/clientes` y sus campos exclusivos (`prospecto_origen_id`, `notas`) no existen en el back.

---

### ~~Requirement: Sidebar navegable (clientes)~~

**REMOVED** — Razon: El item "Clientes" en el sidebar se reemplaza por el item unificado "Contactos" que navega a `/contactos` (ver `contactos-management`).

---

### ~~Requirement: Routing de paginas (clientes)~~

**REMOVED** — Razon: Las rutas `/clientes` y `/clientes/:id` se reemplazan por `/contactos` y `/contactos/:id`. Se SHOULD agregar redirect `/clientes` → `/contactos` para bookmarks existentes.

---

### ~~Requirement: Listado de clientes~~

**REMOVED** — Razon: El endpoint `GET /api/v1/clientes` no existe. El listado unificado usa `GET /api/contactos/get-all` con filtro client-side `estadoRelacion === 'ACTIVO'` en la tab "Activos" de `ContactosListPage` (ver `contactos-management`).

---

### ~~Requirement: Filtros del listado (clientes)~~

**REMOVED** — Razon: Los filtros server-side por `empresa_id` y `origen` no existen en el back. Los filtros de contactos son 100% client-side (ver `contactos-management`). El concepto de "origen" (prospecto/manual) no existe en el modelo `Contacto` del back.

---

### ~~Requirement: Crear cliente~~

**REMOVED** — Razon: El endpoint `POST /api/v1/clientes` no existe. La creacion de contactos usa `POST /api/contactos/create` con `estadoRelacion: ACTIVO` (ver `contactos-management`). El campo `prospecto_origen_id` no existe en el back y se elimina del modelo.

---

### ~~Requirement: Editar cliente~~

**REMOVED** — Razon: El endpoint `PATCH /api/v1/clientes/:id` no existe. La edicion usa `PUT /api/contactos/edit?id=` (ver `contactos-management`).

---

### ~~Requirement: Eliminar cliente con validacion 409~~

**REMOVED** — Razon: El endpoint `DELETE /api/v1/clientes/:id` no existe. La eliminacion usa `DELETE /api/contactos/delete?id=` que tambien retorna 409 si hay tratos vinculados (ver `contactos-management`).

---

### ~~Requirement: Detalle del cliente — header y badge de origen~~

**REMOVED** — Razon: La ruta `/clientes/:id` y el endpoint `GET /api/v1/clientes/:id` no existen. El detalle unificado usa `/contactos/:id`. El campo `prospecto_origen_id` no existe en `ContactoResponse`; el badge de origen y el link "Ver prospecto de origen" desaparecen.

---

### ~~Requirement: Tab Informacion del detalle (clientes)~~

**REMOVED** — Razon: Reemplazada por `ContactoInfoTab` en el detalle unificado de contacto (ver `contactos-management`). Los campos `nombre_contacto`, `correo_contacto`, etc. pasan a ser `nombre`, `correo`, etc. en camelCase del back.

---

### ~~Requirement: Tab Tratos del detalle (clientes)~~

**REMOVED** — Razon: El endpoint `GET /api/v1/clientes/:id/tratos` no existe. Los tratos vinculados a un contacto se consultan directamente desde el feature de tratos usando `contactoId` (ver detalle de contacto en `contactos-management`).

---

### ~~Requirement: Migracion del hook useClientes sin regresion~~

**REMOVED** — Razon: El hook `useClientes` desaparece junto con la feature `clientes/`. Reemplazado por `useContactos` con filtro client-side `estadoRelacion === 'ACTIVO'` (ver `contactos-management`). La queryKey `['clientes']` se elimina; la nueva key es `['contactos']`.

---

### ~~Requirement: Invalidacion de cache tras mutaciones (clientes)~~

**REMOVED** — Razon: La queryKey `['clientes']` desaparece. Reemplazada por `['contactos']` (ver `contactos-management`).

---

## Archivos eliminados por este delta

| Archivo / Directorio |
|---|
| `src/features/clientes/` (directorio completo — 23 archivos) |
| `src/mocks/handlers/clientes.ts` |
| `src/mocks/fixtures/clientes.ts` |
| `src/features/empresas/hooks/useEmpresaClientes.ts` |
| `src/features/empresas/components/EmpresaClientesTab.tsx` |

---

## Reemplazado por

`openspec/changes/contacto-unificado/specs/contactos-management/spec.md`
