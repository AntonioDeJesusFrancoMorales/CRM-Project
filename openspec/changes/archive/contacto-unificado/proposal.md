# Propuesta — Change 2: `contacto-unificado`

**Fase**: sdd-propose  
**Fecha**: 2026-05-28  
**Fuente de verdad**: back AR-CRM (Spring Boot, hexagonal)  
**Alcance**: unificación de `prospectos/` + `clientes/` → `contactos/`  
**Orden**: Change 2 de la reconciliación (depende de Change 1 `contrato-endpoints-rpc`)

---

## 1. Why

El back AR-CRM modela una única entidad `Contacto` con `estadoRelacion: PROSPECTO|ACTIVO|INACTIVO`. El front "Pipely" expone dos features separadas (`prospectos/`, `clientes/`) que llaman endpoints inexistentes (`/api/prospectos`, `/api/clientes`), mantienen campos fantasma (`notas`, `estado_posible_cliente`, `prospecto_origen_id`) y un enum `ComoNosConocio` con valores distintos al back (que usa String libre). Mientras esto persista, las operaciones de creación y edición de contactos están rotas contra el back real. Este change cierra esa deuda: elimina la dualidad, crea `src/features/contactos/` alineado al contrato verificado, y resuelve S-01 del verify-report del Change 1 (`useEmpresaProspectos`/`useEmpresaClientes`).

---

## 2. What changes

- **Nueva feature `src/features/contactos/`**: hooks, componentes, páginas y tests que reemplazan completamente `prospectos/` y `clientes/`.
- **Tipo `Contacto` en `src/api/types.ts`**: reemplaza las interfaces `Prospecto` y `Cliente`; naming camelCase del back; elimina campos fantasma; `comoNosConocio: string | null` (elimina enum).
- **`endpoints.contactos` en `src/api/endpoints.ts`**: bloque RPC con los 5 endpoints (`get-all`, `get-by-id?id=`, `create`, `edit?id=` con PUT, `delete?id=`).
- **Página `/contactos` con tabs por `estadoRelacion`**: PROSPECTO / ACTIVO / INACTIVO. Una única ruta; la segmentación es client-side sobre `GET /contactos/get-all`.
- **Validación de transiciones de estado client-side**: bloquea en UI retroceder a PROSPECTO y pasar a INACTIVO con tratos activos (workaround del bug `EditContactoService.reconstitute()`).
- **`comoNosConocio` como combobox**: sugerencias fijas (Referido, Redes, Web, Evento, Otro) + texto libre; maxLength=200; tipo `string | null`.
- **`useEmpresaContactos`**: reemplaza `useEmpresaProspectos` + `useEmpresaClientes`; filtro client-side de `useContactos()` por `empresaId` + `estadoRelacion` (cierra S-01).
- **`EmpresaContactosTab`**: reemplaza `EmpresaProspectosTab` + `EmpresaClientesTab` en la detail de empresa.
- **Actualización de tratos**: `TratoForm`, `TratoDetailPage`, `TratoInfoTab` pasan a importar `useContactos` en lugar de `useProspectos`/`useClientes`. Links a `/contactos/:id`. El modelo `Trato` (`prospecto_id`/`cliente_id`) se mantiene intacto.
- **MSW reescrito**: `handlers/contactos.ts` + `fixtures/contactos.ts` fieles al contrato real del back (PUT en edit, query param id, sin filtros server-side).
- **Sidebar y router**: "Prospectos" y "Clientes" → "Contactos" con ruta `/contactos` y `/contactos/:id`.

---

## 3. Impact

### Specs openspec afectadas

| Acción | Spec |
|--------|------|
| **CREAR** | `openspec/specs/contactos-management/spec.md` (nueva spec unificada) |
| **ELIMINAR** | `openspec/specs/prospectos-management/spec.md` (si existe) |
| **ELIMINAR** | `openspec/specs/clientes-management/spec.md` (si existe) |

### Archivos (alto nivel)

**Crear (~22 archivos)**
- `src/features/contactos/schemas/contacto.schema.ts`
- `src/features/contactos/hooks/useContactos.ts`, `useContacto.ts`, `useCreateContacto.ts`, `useUpdateContacto.ts`, `useDeleteContacto.ts`
- `src/features/contactos/pages/ContactosListPage.tsx`, `ContactoDetailPage.tsx`
- `src/features/contactos/components/ContactoForm.tsx`, `ContactoFormDialog.tsx`, `ContactoDeleteDialog.tsx`, `ContactoInfoTab.tsx`, `ContactoTratosTab.tsx`
- `src/mocks/handlers/contactos.ts`, `src/mocks/fixtures/contactos.ts`
- `src/features/contactos/__tests__/` (7 archivos de test)

**Modificar (~11 archivos)**
- `src/api/types.ts` — interface `Contacto`, eliminar `Prospecto`/`Cliente`/`ComoNosConocio`/`EstadoPosibleCliente`
- `src/api/endpoints.ts` — agregar `contactos`
- `src/routes/router.tsx` — reemplazar rutas
- `src/components/layout/Sidebar.tsx` — item "Contactos"
- `src/features/empresas/hooks/useEmpresaProspectos.ts` → `useEmpresaContactos.ts`
- `src/features/empresas/components/EmpresaProspectosTab.tsx` → `EmpresaContactosTab.tsx`
- `src/features/empresas/pages/EmpresaDetailPage.tsx` — actualizar tabs
- `src/mocks/handlers/index.ts` — reemplazar handlers
- `src/mocks/handlers/empresas.ts` — eliminar handlers `/empresas/:id/prospectos` y `/empresas/:id/clientes`
- `src/features/tratos/components/TratoForm.tsx` — importar `useContactos`
- `src/features/tratos/pages/TratoDetailPage.tsx` — importar `useContactos`

**Eliminar (~50 archivos)**
- `src/features/prospectos/` (directorio completo — 27 archivos)
- `src/features/clientes/` (directorio completo — 23 archivos)
- `src/mocks/handlers/prospectos.ts`, `clientes.ts`
- `src/mocks/fixtures/prospectos.ts`, `clientes.ts`
- `src/features/empresas/hooks/useEmpresaClientes.ts`
- `src/features/empresas/components/EmpresaClientesTab.tsx`

---

## 4. Constraints heredados del Change 1

- `src/api/endpoints.ts` es la única fuente de verdad de rutas. Ningún hook, handler MSW ni test hardcodea paths.
- `apiClient.put` ya existe — usarlo para todos los edits de contactos.
- `BASE_URL = /api` ya está configurado — los endpoints en `endpoints.ts` no incluyen el prefijo.
- Filtros de listas son siempre client-side (el back no expone query params de filtrado).
- Enums del back (`EstadoRelacion`) viven en `src/api/types.ts`.
- `pnpm test:run` es el comando de verificación. `pnpm build` no se ejecuta.

---

## 5. Decisiones bloqueadas (del usuario — no renegociar)

1. **UX**: Página única `/contactos` con tabs por `estadoRelacion` (PROSPECTO / ACTIVO / INACTIVO). La segmentación es client-side sobre `GET /contactos/get-all`.

2. **Validación de transiciones de estado**: CLIENT-SIDE COMPLETA. Bloquear en UI:
   - No retroceder a `PROSPECTO` desde ACTIVO o INACTIVO.
   - No pasar a `INACTIVO` si el contacto tiene tratos activos.
   - Razón: `EditContactoService.reconstitute()` en el back bypasea `cambiarEstadoRelacion()`. Cuando el back corrija el bug, agregar manejo del 4xx que retorne.

3. **`comoNosConocio`**: Combobox con sugerencias (Referido, Redes, Web, Evento, Otro) + texto libre. MaxLength=200. Tipo TypeScript → `string | null`. Eliminar enum `ComoNosConocio`.

---

## 6. Out of scope

- **Auth**: intacta.
- **Trato modelo**: `prospecto_id`/`cliente_id` en la interface `Trato` y en fixtures de tratos se mantienen hasta el change de tratos acordado.
- **Trato estado / Kanban / ganar / perder**: sin tocar.
- **Usuarios**: bloqueado (divergencia `rolId`/`passwordHash` del Change 1).
- **Kanban frío/tibio/caliente**: `EstadoPosibleCliente` desaparece del modelo sin reemplazante UX (no existe en el back).
- **`notas`** (prospectos/clientes): campo fantasma; se elimina sin reemplazante.
- **`prospecto_origen_id`**: campo fantasma; se elimina.
- **Endpoint `POST /convertir`**: no existe en el back; la "conversión" es PUT /edit con `estadoRelacion: ACTIVO` — no hay flujo de conversión especial.

---

## 7. Riesgos

- **R1 — Bug back `EditContactoService`**: el back no rechaza transiciones de estado inválidas vía PUT /edit (`reconstitute()` bypasea `cambiarEstadoRelacion()`). El front es la única línea de defensa. Cuando se corrija el back (deuda documentada), agregar manejo del error 4xx correspondiente.

- **R2 — Tests de tratos se rompen si no se migran imports**: `TratoForm`, `TratoDetailPage` y `TratoInfoTab` importan `useProspectos`/`useClientes` que desaparecen. Si no se actualizan esos imports en este change, sus tests fallarán por módulos inexistentes. La migración de imports (sin tocar el modelo `Trato`) está en scope para evitar esto.

- **R3 — Links y bookmarks a `/prospectos` y `/clientes`**: rutas que quedarán muertas. Se recomienda agregar redirects en el router (`/prospectos` → `/contactos?tab=PROSPECTO`, `/clientes` → `/contactos?tab=ACTIVO`) o al menos rutas catch-all.

- **R4 — `comoNosConocio` con valores legacy**: datos existentes en el back pueden tener strings que no corresponden a ninguna de las sugerencias del combobox. El front debe renderizarlos como texto libre sin error (el combobox ya lo soporta por diseño).

- **R5 — Fixtures de tratos con IDs de prospectos/clientes**: `tratosFixture` referencia `prospecto_id: 'b1111...'` y `cliente_id: 'c1111...'`. Al eliminar `prospectos.ts` y `clientes.ts`, los handlers que resolvían esas relaciones desaparecen. Los tests de tratos que dependan de resolución cruzada necesitan revisión.

---

## 8. Next phases

Las siguientes fases pueden ejecutarse en **paralelo** por ser independientes:

- **`sdd-spec`** — delta spec `contactos-management`: requisitos de la lista con tabs, detalle, create/edit/delete, validaciones de transición de estado, `comoNosConocio` combobox; eliminar specs `prospectos-management`/`clientes-management` si existen.
- **`sdd-design`** — decisiones de arquitectura: estructura de `useContactos` y `queryKey`, composición del combobox `comoNosConocio`, patrón de validación de transiciones client-side, `useEmpresaContactos` como derivación de `useContactos`.

Luego de ambas: **`sdd-tasks`** para el desglose de implementación.
