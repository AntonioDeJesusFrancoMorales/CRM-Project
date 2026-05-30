# Exploración: contacto-unificado

**Fecha**: 2026-05-28  
**Change**: `contacto-unificado`  
**Branch base**: `feat/contrato-endpoints-rpc` (Change 1 completado)

---

## 1. Contrato real del back — verificado contra código fuente

### 1.1 ContactoController (`/api/contactos`)

**Archivo**: `infrastructure/src/main/java/com/ar/crm2/adapter/in/rest/ContactoController.java`

| Endpoint | Método HTTP | Firma |
|----------|-------------|-------|
| `/api/contactos/create` | `POST` | `@RequestBody CreateContactoRequest` |
| `/api/contactos/get-all` | `GET` | sin params |
| `/api/contactos/get-by-id` | `GET` | `@RequestParam UUID id` |
| `/api/contactos/edit` | `PUT` | `@RequestParam UUID id` + `@RequestBody EditContactoRequest` |
| `/api/contactos/delete` | `DELETE` | `@RequestParam UUID id` |

Respuestas:
- `create` → `201 Created` + `ContactoResponse`
- `get-all` → `200 OK` + `List<ContactoResponse>`
- `get-by-id` → `200 OK` + `ContactoResponse`
- `edit` → `200 OK` + `ContactoResponse`
- `delete` → `204 No Content`

**Patrón RPC idéntico al de empresas/tareas del Change 1.** El `id` siempre va como query param, nunca en path.

### 1.2 CreateContactoRequest — campos y validaciones

**Archivo**: `infrastructure/.../dto/request/CreateContactoRequest.java`

| Campo | Tipo Java | Restricción | Obligatorio |
|-------|-----------|-------------|-------------|
| `empresaId` | `UUID` | `@NotNull` | SI |
| `nombre` | `String` | `@NotBlank`, `@Size(1, 150)` | SI |
| `correo` | `String` | `@Email`, `@Size(max=150)` | NO (nullable) |
| `estadoRelacion` | `EstadoRelacion` | `@NotNull` | SI |
| `responsableId` | `UUID` | — | NO (nullable) |
| `creadoPor` | `UUID` | — | NO (nullable) |
| `telefono` | `String` | `@Size(max=50)` | NO (nullable) |
| `cargo` | `String` | `@Size(max=100)` | NO (nullable) |
| `comoNosConocio` | `String` | `@Size(max=200)` | NO (nullable, String libre) |

**IMPORTANTE**: `comoNosConocio` es **String libre** (max 200), NO un enum. El front usa enum `ComoNosConocio = 'referido' | 'redes_sociales' | 'busqueda' | 'evento' | 'otro'`. El back acepta cualquier string de hasta 200 caracteres.

### 1.3 EditContactoRequest — campos y validaciones

**Archivo**: `infrastructure/.../dto/request/EditContactoRequest.java`

| Campo | Tipo Java | Restricción | Obligatorio | Diferencia vs Create |
|-------|-----------|-------------|-------------|---------------------|
| `nombre` | `String` | `@NotBlank`, `@Size(1, 150)` | SI | — |
| `correo` | `String` | `@Email`, `@Size(max=150)` | NO | — |
| `estadoRelacion` | `EstadoRelacion` | `@NotNull` | SI | — |
| `responsableId` | `UUID` | — | NO | — |
| `telefono` | `String` | `@Size(max=50)` | NO | — |
| `cargo` | `String` | `@Size(max=100)` | NO | — |
| `comoNosConocio` | `String` | `@Size(max=200)` | NO | — |

Edit NO incluye `empresaId` (inmutable tras crear) ni `creadoPor` (siempre el creador original).

### 1.4 ContactoResponse — campos de respuesta

**Archivo**: `infrastructure/.../dto/response/ContactoResponse.java`

```
UUID         id
UUID         empresaId
String       nombre
String       correo          (nullable)
EstadoRelacion estadoRelacion
UUID         responsableId   (nullable)
UUID         creadoPor       (nullable)
String       telefono        (nullable)
String       cargo           (nullable)
String       comoNosConocio  (nullable, String libre)
LocalDateTime creadoEn
LocalDateTime actualizadoEn  (nullable)
```

### 1.5 Enum EstadoRelacion

**Archivo**: `domain/src/main/java/com/ar/crm2/model/enums/EstadoRelacion.java`

Valores: `ACTIVO`, `INACTIVO`, `PROSPECTO`

No hay un cuarto valor. No hay `CONVERTIDO`.

### 1.6 Entidad dominio Contacto

**Archivo**: `domain/src/main/java/com/ar/crm2/model/entity/Contacto.java`

Campos del agregado:
- `ContactoId id`, `EmpresaId empresaId`, `UsuarioId responsableId`, `UsuarioId creadoPor`
- `String nombre`, `String correo`, `String telefono`, `String cargo`, `String comoNosConocio`
- `EstadoRelacion estadoRelacion`
- `LocalDateTime creadoEn`, `LocalDateTime actualizadoEn`

**NO existe `notas`** en el dominio Contacto del back.  
**NO existe `estado_posible_cliente` (frio/tibio/caliente/convertido)** en el back.

### 1.7 Reglas de negocio del dominio — método `cambiarEstadoRelacion`

**Archivo**: `domain/.../model/entity/Contacto.java`, método `cambiarEstadoRelacion(EstadoRelacion, boolean)`

**Regla 1 — No volver a PROSPECTO** (líneas 143-146):
```java
if (nuevoEstado == EstadoRelacion.PROSPECTO && this.estadoRelacion != EstadoRelacion.PROSPECTO) {
    throw ContactoStateTransitionException.transicionAProspectoNoPermitida(this.estadoRelacion.name());
}
```
Mensaje: `"No se puede volver a Prospecto desde el estado {estadoActual}."`

**Regla 2 — No INACTIVO con tratos activos** (líneas 148-150):
```java
if (nuevoEstado == EstadoRelacion.INACTIVO && tieneTratosActivos) {
    throw ContactoStateTransitionException.inactivoConTratosActivos();
}
```
Mensaje: `"No se puede marcar como inactivo un contacto con tratos activos."`

**Regla 3 — Idempotencia** (líneas 139-141): mismo estado retorna la misma instancia sin error.

**HALLAZGO CRÍTICO**: `EditContactoService` (líneas 33-48) usa `Contacto.reconstitute()` directamente, NO `cambiarEstadoRelacion()`. Esto significa que las reglas de transición de estado del dominio **NO se aplican via el endpoint PUT /edit**. El back acepta cualquier transición de `estadoRelacion` sin restricción en el servicio de edición. Las reglas existen en el dominio pero están bypass. Este es un bug del back, no del front — el front no puede depender de que el back rechace estas transiciones.

### 1.8 Relaciones entre entidades

**Trato → Contacto**: `Trato` tiene campo `ContactoId contactoId` (`@NotNull` en `Trato.create()`). Un Trato pertenece a UN Contacto. El back NO tiene `prospecto_id`/`cliente_id` XOR — es solo `contactoId`.

**Contacto → Empresa**: `Contacto` tiene campo `EmpresaId empresaId` (`@NotNull`). Un Contacto pertenece a una Empresa.

**DeleteContactoService**: guarda que no puede eliminarse si `ExistsTratosByContactoIdPort.existsTratosByContactoId()` retorna `true` → lanza `ContactoHasAssociatedTratosException`.

### 1.9 No existe endpoint de conversión

`POST /contactos/:id/convertir` **no existe** en el back. La "conversión" de prospecto a activo es `PUT /contactos/edit?id={id}` con `estadoRelacion: "ACTIVO"`.

---

## 2. Estado actual del front

### 2.1 Inventario de features actuales

**`src/features/prospectos/`** — 27 archivos:
- Hooks: `useProspectos`, `useProspecto`, `useCreateProspecto`, `useUpdateProspecto`, `useDeleteProspecto`, `useConvertirProspecto`, `useProspectoTratos`
- Components: `ProspectosKanban`, `KanbanColumn`, `ProspectoCard`, `ProspectoFormDialog`, `ProspectoForm`, `ProspectoInfoTab`, `ProspectoTratosTab`, `ProspectoDeleteDialog`, `ConvertirProspectoDialog`, `ProspectoConvertidosList`
- Pages: `ProspectosListPage`, `ProspectoDetailPage`
- Schema: `prospecto.schema.ts`
- Tests: 7 archivos

**`src/features/clientes/`** — 23 archivos:
- Hooks: `useClientes`, `useCliente`, `useCreateCliente`, `useUpdateCliente`, `useDeleteCliente`
- Components: `ClientesTable`, `ClienteCreateDialog`, `ClienteEditDialog`, `ClienteDeleteDialog`, `ClienteForm`, `ClienteInfoTab`, `ClienteTratosTab`, `ClienteOrigenBadge`
- Pages: `ClientesListPage`, `ClienteDetailPage`
- Schema: `cliente.schema.ts`
- Tests: 7 archivos

**Total a migrar/eliminar: ~50 archivos (hooks + components + pages + schemas + tests + MSW handlers + fixtures).**

### 2.2 Modelo de datos actual del front (tipos en `src/api/types.ts`)

**Prospecto** (interface actual):
```ts
id, empresa_id, responsable_id, creado_por,
nombre_contacto, correo_contacto, telefono_contacto, cargo_contacto,
como_nos_conocio: ComoNosConocio | null,       // enum, NO string libre
estado_posible_cliente: EstadoPosibleCliente,   // NO existe en back
notas: string | null,                           // NO existe en back
creado_en, actualizado_en
```

**Cliente** (interface actual):
```ts
id, empresa_id, responsable_id, creado_por,
nombre_contacto, correo_contacto, telefono_contacto, cargo_contacto,
como_nos_conocio: ComoNosConocio | null,
notas: string | null,                           // NO existe en back
prospecto_origen_id: string | null,             // NO existe en back
creado_en, actualizado_en
```

**`ComoNosConocio`**: enum `'referido' | 'redes_sociales' | 'busqueda' | 'evento' | 'otro'` — el back usa String libre.  
**`EstadoPosibleCliente`**: `'frio' | 'tibio' | 'caliente' | 'convertido'` — **NO existe en el back en ninguna forma**.  
**`EstadoRelacion`** ya existe en `types.ts` como `'ACTIVO' | 'INACTIVO' | 'PROSPECTO'` (correcto).

### 2.3 Rutas y llamadas HTTP actuales (prospectos)

| Operación | Método + ruta actual | Ruta correcta del back |
|-----------|---------------------|------------------------|
| Listar | `GET /prospectos?empresa_id=&responsable_id=` | `GET /contactos/get-all` |
| Detalle | `GET /prospectos/:id` | `GET /contactos/get-by-id?id=` |
| Crear | `POST /prospectos` | `POST /contactos/create` |
| Editar | `PATCH /prospectos/:id` | `PUT /contactos/edit?id=` |
| Eliminar | `DELETE /prospectos/:id` | `DELETE /contactos/delete?id=` |
| Convertir | `POST /prospectos/:id/convertir` | **NO existe** — usar PUT /contactos/edit con `estadoRelacion: ACTIVO` |
| Tratos de prospecto | `GET /prospectos/:id/tratos` | Usar tratos endpoint con filtro client-side |

### 2.4 Rutas y llamadas HTTP actuales (clientes)

| Operación | Método + ruta actual | Ruta correcta del back |
|-----------|---------------------|------------------------|
| Listar | `GET /clientes?empresa_id=&origen=` | `GET /contactos/get-all` (+ filtro client-side) |
| Detalle | `GET /clientes/:id` | `GET /contactos/get-by-id?id=` |
| Crear | `POST /clientes` | `POST /contactos/create` |
| Editar | `PATCH /clientes/:id` | `PUT /contactos/edit?id=` |
| Eliminar | `DELETE /clientes/:id` | `DELETE /contactos/delete?id=` |

### 2.5 MSW handlers actuales

- `src/mocks/handlers/prospectos.ts`: maneja `/api/prospectos` con filtros query, CRUD vía `makeCrudHandlers`, `POST /prospectos/:id/convertir` (crea cliente + muta prospecto), `GET /prospectos/:id/tratos`
- `src/mocks/handlers/clientes.ts`: maneja `/api/clientes` con filtros empresa/origen, DELETE con guarda 409
- `src/mocks/fixtures/prospectos.ts`: 5 prospectos (3 activos + 2 convertidos), modelo `Prospecto` con `estado_posible_cliente`
- `src/mocks/fixtures/clientes.ts`: 4 clientes, 2 con `prospecto_origen_id`
- `src/mocks/handlers/empresas.ts` (líneas 71-78): handlers GET `/empresas/:id/prospectos` y `/empresas/:id/clientes` — ambos filtran de fixtures actuales

### 2.6 Hooks de empresa que dependen de prospectos/clientes

- `src/features/empresas/hooks/useEmpresaProspectos.ts`: llama `GET /empresas/:id/prospectos` — endpoint **NO existe** en back
- `src/features/empresas/hooks/useEmpresaClientes.ts`: llama `GET /empresas/:id/clientes` — endpoint **NO existe** en back
- `src/features/empresas/components/EmpresaProspectosTab.tsx`: usa `useEmpresaProspectos`, muestra `estado_posible_cliente` con badge frio/tibio/caliente/convertido
- `src/features/empresas/components/EmpresaClientesTab.tsx`: usa `useEmpresaClientes`

### 2.7 Referencias cross-feature en tratos (OUT OF SCOPE — solo documentar)

Los siguientes archivos de tratos importan o referencian prospectos/clientes directamente. Se deben conservar intactos hasta el change de tratos:

- `src/features/tratos/components/TratoForm.tsx`: importa `useClientes` y `useProspectos`, implementa toggle Cliente|Prospecto con XOR y filtro de no-convertidos
- `src/features/tratos/pages/TratoDetailPage.tsx`: importa `useClientes` y `useProspectos`, resuelve `cliente`/`prospecto` para `TratoInfoTab`
- `src/features/tratos/components/TratoInfoTab.tsx`: links a `/clientes/:id` y `/prospectos/:id`
- `src/mocks/fixtures/tratos.ts`: usa `prospecto_id` (2 fixtures) y `cliente_id` (2 fixtures)
- `src/mocks/handlers/tratos.ts`: maneja tratos con `prospecto_id`/`cliente_id` (presunto — no leído en esta sesión)
- `src/api/types.ts` — interface `Trato`: tiene `prospecto_id`, `cliente_id`, `estado: EstadoTrato` — fuera de scope

**Estos archivos NO se tocan en este change.**

### 2.8 Hooks de empresa S-01 (Change 1 verify-report)

El verify-report del Change 1 marcó como SUGGESTION (S-01) que `useEmpresaProspectos` y `useEmpresaClientes` deben migrarse junto con el unificado de contactos. Este change los reemplazará con `useEmpresaContactos` (filtro client-side sobre `GET /contactos/get-all`).

### 2.9 endpoints.ts actual

`src/api/endpoints.ts` solo tiene `empresas` y `tareas`. No tiene contactos aún.

---

## 3. Análisis delta (back vs front campo a campo)

### 3.1 Endpoint shape

| Dimensión | Back (fuente de verdad) | Front actual | Acción |
|-----------|------------------------|--------------|--------|
| Prefijo | `/api/contactos` | `/api/prospectos` y `/api/clientes` | Unificar en `/contactos` |
| Listar | `GET /get-all` | `GET /prospectos` y `GET /clientes` | Migrar a `/contactos/get-all` |
| Detalle | `GET /get-by-id?id=` | `GET /prospectos/:id` y `GET /clientes/:id` | Migrar a query param |
| Crear | `POST /create` | `POST /prospectos` y `POST /clientes` | Migrar |
| Editar | `PUT /edit?id=` | `PATCH /prospectos/:id` y `PATCH /clientes/:id` | Cambiar a PUT + query param |
| Eliminar | `DELETE /delete?id=` | `DELETE /prospectos/:id` y `DELETE /clientes/:id` | Migrar a query param |

### 3.2 Campos DTO campo a campo

| Campo back (`ContactoResponse`) | Equivalente front actual | Tipo back | Tipo front | Mismatch | Acción |
|--------------------------------|-------------------------|-----------|------------|----------|--------|
| `id` | `id` | `UUID` → `string` | `string` | Ninguno | Igual |
| `empresaId` | `empresa_id` | `UUID` → `string` | `string` | **Naming** (`empresaId` vs `empresa_id`) | Usar `empresaId` |
| `nombre` | `nombre_contacto` | `String` | `string` | **Naming** | Usar `nombre` |
| `correo` | `correo_contacto` | `String` (nullable) | `string \| null` | **Naming** | Usar `correo` |
| `estadoRelacion` | `estado_posible_cliente` (prospecto) / ausente (cliente) | `EstadoRelacion` enum | `EstadoPosibleCliente` enum distinto | **Semántica y tipo completamente distintos** | Usar `estadoRelacion: EstadoRelacion` |
| `responsableId` | `responsable_id` | `UUID` (nullable) | `string` | **Naming** | Usar `responsableId` |
| `creadoPor` | `creado_por` | `UUID` (nullable) | `string` | **Naming** | Usar `creadoPor` |
| `telefono` | `telefono_contacto` | `String` (nullable) | `string \| null` | **Naming** | Usar `telefono` |
| `cargo` | `cargo_contacto` | `String` (nullable) | `string \| null` | **Naming** | Usar `cargo` |
| `comoNosConocio` | `como_nos_conocio` | `String` libre max200 (nullable) | `ComoNosConocio` enum (nullable) | **Tipo distinto**: back es string libre, front es enum | Cambiar a `string \| null` |
| `creadoEn` | `creado_en` | `LocalDateTime` → ISO string | `string` | **Naming** | Usar `creadoEn` |
| `actualizadoEn` | `actualizado_en` | `LocalDateTime` → ISO string | `string` | **Naming** | Usar `actualizadoEn` |
| — | `notas` | **NO EXISTE** en back | `string \| null` | **Campo fantasma** | Eliminar |
| — | `estado_posible_cliente` | **NO EXISTE** | `EstadoPosibleCliente` | **Campo fantasma** | Eliminar |
| — | `prospecto_origen_id` (Cliente) | **NO EXISTE** | `string \| null` | **Campo fantasma** | Eliminar |

**Resumen naming**: el back usa camelCase (`empresaId`, `creadoPor`, `creadoEn`) no snake_case. Igual que Empresa (ya migrado en Change 1).

### 3.3 HTTP Method

- Back usa `PUT` para editar (ya establecido en Change 1).
- Front actual usa `PATCH` → cambiar a `PUT`.

### 3.4 Reglas de estado (back guards vs front UX)

| Regla back | Impacto en UI del front |
|-----------|------------------------|
| No transición a PROSPECTO si ya es ACTIVO o INACTIVO | UI debe ocultar/deshabilitar opción PROSPECTO en formulario de edición cuando el estado actual no es PROSPECTO |
| No INACTIVO si tiene tratos activos → 409 del back | Front debe manejar 409 con toast informativo |
| `cambiarEstadoRelacion` NO se llama desde `EditContactoService` (bug del back) | El back actualmente NO rechaza transiciones inválidas vía PUT /edit. El front debe implementar las restricciones UI de todas formas para coherencia, pero no puede confiar en que el back las valide |

### 3.5 Filtros

El back NO tiene filtros por query param en `/contactos/get-all`. La segmentación PROSPECTO/ACTIVO/INACTIVO se hace **client-side** sobre el array completo, igual que en Change 1.

---

## 4. Impacto de la migración

### 4.1 Archivos a CREAR

| Archivo | Descripción |
|---------|-------------|
| `src/features/contactos/schemas/contacto.schema.ts` | Zod schema con campos del back |
| `src/features/contactos/hooks/useContactos.ts` | GET /contactos/get-all + query keys |
| `src/features/contactos/hooks/useContacto.ts` | GET /contactos/get-by-id?id= |
| `src/features/contactos/hooks/useCreateContacto.ts` | POST /contactos/create |
| `src/features/contactos/hooks/useUpdateContacto.ts` | PUT /contactos/edit?id= |
| `src/features/contactos/hooks/useDeleteContacto.ts` | DELETE /contactos/delete?id= |
| `src/features/contactos/pages/ContactosListPage.tsx` | Lista unificada con segmentación por estadoRelacion |
| `src/features/contactos/pages/ContactoDetailPage.tsx` | Detalle unificado |
| `src/features/contactos/components/ContactoForm.tsx` | Formulario unificado |
| `src/features/contactos/components/ContactoFormDialog.tsx` | Dialog create/edit |
| `src/features/contactos/components/ContactoDeleteDialog.tsx` | Dialog confirmar eliminación |
| `src/features/contactos/components/ContactoInfoTab.tsx` | Tab info del detalle |
| `src/features/contactos/components/ContactoTratosTab.tsx` | Tab tratos del detalle (delegado a hooks de tratos) |
| `src/mocks/handlers/contactos.ts` | Handlers MSW para `/api/contactos/*` (RPC) |
| `src/mocks/fixtures/contactos.ts` | Fixtures unificadas con `estadoRelacion` + datos del back |
| `src/features/contactos/__tests__/useContactos.test.tsx` | Tests |
| `src/features/contactos/__tests__/useContacto.test.tsx` | Tests |
| `src/features/contactos/__tests__/useCreateContacto.test.tsx` | Tests |
| `src/features/contactos/__tests__/useUpdateContacto.test.tsx` | Tests |
| `src/features/contactos/__tests__/useDeleteContacto.test.tsx` | Tests |
| `src/features/contactos/__tests__/ContactosListPage.test.tsx` | Tests |
| `src/features/contactos/__tests__/ContactoDetailPage.test.tsx` | Tests |

### 4.2 Archivos a EDITAR

| Archivo | Cambio |
|---------|--------|
| `src/api/types.ts` | Reemplazar `Prospecto` y `Cliente` con `Contacto`; eliminar `ComoNosConocio` enum, `EstadoPosibleCliente`; conservar `EstadoRelacion` (ya correcto) |
| `src/api/endpoints.ts` | Agregar bloque `contactos` con los 5 endpoints RPC |
| `src/routes/router.tsx` | Cambiar rutas `/prospectos` y `/clientes` → `/contactos` y `/contactos/:id` |
| `src/components/layout/Sidebar.tsx` | Reemplazar items "Prospectos" y "Clientes" → "Contactos" |
| `src/features/empresas/hooks/useEmpresaProspectos.ts` | Reemplazar por `useEmpresaContactos.ts` (filtro client-side de `/contactos/get-all` por `empresaId`) |
| `src/features/empresas/hooks/useEmpresaClientes.ts` | Eliminar — fusionado en `useEmpresaContactos` |
| `src/features/empresas/components/EmpresaProspectosTab.tsx` | Reemplazar con `EmpresaContactosTab.tsx` unificado (muestra todos los contactos de la empresa segmentados por `estadoRelacion`) |
| `src/features/empresas/components/EmpresaClientesTab.tsx` | Eliminar — fusionado en `EmpresaContactosTab` |
| `src/features/empresas/pages/EmpresaDetailPage.tsx` | Actualizar tabs para usar `EmpresaContactosTab` |
| `src/mocks/handlers/index.ts` | Reemplazar `prospectosHandlers` y `clientesHandlers` → `contactosHandlers` |
| `src/mocks/handlers/empresas.ts` | Reemplazar handlers `/empresas/:id/prospectos` y `/empresas/:id/clientes` → handler client-side o eliminar (la empresa detail usará `useEmpresaContactos` que llama `/contactos/get-all`) |

### 4.3 Archivos a ELIMINAR

| Directorio / Archivo |
|----------------------|
| `src/features/prospectos/` (directorio completo — 27 archivos) |
| `src/features/clientes/` (directorio completo — 23 archivos) |
| `src/mocks/handlers/prospectos.ts` |
| `src/mocks/handlers/clientes.ts` |
| `src/mocks/fixtures/prospectos.ts` |
| `src/mocks/fixtures/clientes.ts` |
| `src/features/empresas/hooks/useEmpresaClientes.ts` |
| `src/features/empresas/hooks/useEmpresaProspectos.ts` |
| `src/features/empresas/components/EmpresaProspectosTab.tsx` |
| `src/features/empresas/components/EmpresaClientesTab.tsx` |

### 4.4 Referencias cross-feature que se conservan INTACTAS (tratos — fuera de scope)

Los siguientes archivos referencian `Prospecto`, `Cliente`, `useProspectos`, `useClientes`, rutas `/prospectos/:id`, `/clientes/:id`. No se tocan en este change; quedarán temporalmente "rotos" hasta el change de tratos:

- `src/features/tratos/components/TratoForm.tsx`
- `src/features/tratos/pages/TratoDetailPage.tsx`
- `src/features/tratos/components/TratoInfoTab.tsx`
- `src/mocks/fixtures/tratos.ts` (usa `prospecto_id`, `cliente_id`)
- `src/mocks/handlers/tratos.ts`
- `src/api/types.ts` — interface `Trato` (conservar `prospecto_id`, `cliente_id`, `estado` hasta change tratos)

**Estrategia**: las referencias de tratos a `useProspectos`/`useClientes` se actualizarán para apuntar a `useContactos` con el filtro adecuado, pero el modelo `Trato` (con `prospecto_id`/`cliente_id`) se mantiene hasta que se acuerde el change de tratos.

### 4.5 Handlers MSW de empresa

Los handlers `GET /empresas/:id/prospectos` y `GET /empresas/:id/clientes` en `empresas.ts` (líneas 71-78) se eliminan. La `EmpresaDetailPage` pasará a usar `useEmpresaContactos` que hace `GET /contactos/get-all` y filtra client-side por `empresaId`.

### 4.6 Segmentación UX de la lista unificada

**Pregunta abierta para el usuario** (ver sección 6). El back devuelve todos los contactos. La UI puede segmentarlos por `estadoRelacion`. Opciones:
1. Una sola página `/contactos` con tabs "Prospectos (PROSPECTO)" / "Activos (ACTIVO)" / "Inactivos (INACTIVO)"
2. Una sola página con filtro/select de `estadoRelacion`
3. Mantener dos rutas pero ambas alimentadas por el mismo hook

La opción recomendada para la propuesta: **tabs** dentro de una sola ruta `/contactos`, homologando el patrón de `ProspectosListPage` (que ya tiene tabs Activos/Convertidos).

### 4.7 Test count estimado a reemplazar

- 7 tests de prospectos + 7 tests de clientes + handler tests de prospectos/clientes = ~14-16 archivos de test a eliminar/reescribir
- Los nuevos tests de contacto deberían producir cobertura equivalente

---

## 5. Fuera del alcance — confirmado

Los siguientes ítems están explícitamente excluidos de este change:

| Ítem | Razón |
|------|-------|
| **Auth** | El back no tiene auth aún; fuera de alcance de toda la reconciliación |
| **Tratos** (estado, ganar, perder, contactoId vs prospecto_id/cliente_id, Kanban) | Pendiente de reunión; los archivos de tratos no se tocan |
| **Usuarios** | Bloqueado: back requiere `rolId` UUID + `passwordHash` que el front no tiene |
| **Tableros/Fichas** | Change separado posterior |
| **Etiquetas / Comentarios** | No tienen respaldo en el back |
| **`notas`** (prospectos/clientes) | NO existe en el back; se elimina del modelo |
| **`estado_posible_cliente` (frio/tibio/caliente)** | NO existe en el back; se elimina |
| **`prospecto_origen_id`** | NO existe en el back; se elimina |
| **Endpoint `POST /convertir`** | NO existe; la conversión es PUT /edit con estadoRelacion: ACTIVO |

---

## 6. Preguntas abiertas y riesgos

### Pregunta 1 — UX de la lista unificada (DECISIÓN DE USUARIO)

El frente actual tiene dos páginas separadas: `/prospectos` (Kanban frio/tibio/caliente) y `/clientes` (tabla). Con la unificación hay que decidir la UX:

**Opción A**: Una sola página `/contactos` con tabs por `estadoRelacion`: "Prospectos", "Activos", "Inactivos"  
**Opción B**: Una sola página `/contactos` con filtro select de `estadoRelacion`  
**Opción C**: Mantener rutas separadas (`/prospectos` → redirige a `/contactos?estado=PROSPECTO`, `/clientes` → `/contactos?estado=ACTIVO`)

*El Kanban de prospectos (frio/tibio/caliente) pierde su razón de ser porque ese campo NO existe en el back.*

### Pregunta 2 — ¿Qué hacer con los links cruzados de tratos?

`TratoForm`, `TratoDetailPage`, `TratoInfoTab` tienen links a `/prospectos/:id` y `/clientes/:id`. Opciones:
- **Actualizar ahora**: redirigir todos a `/contactos/:id` en este change (los tratos temporalmente mostrarán el contacto unificado en lugar del prospecto/cliente separado)
- **Dejar para el change de tratos**: los links quedarán rotos hasta el change de tratos

Recomendación: actualizar los links/rutas a `/contactos/:id` ya en este change para no dejar rutas muertas.

### Pregunta 3 — Eliminación de tests de prospectos convertidos

`ProspectoConvertidosList.test.tsx`, `useConvertirProspecto.test.tsx`: testean funcionalidad que desaparece (convertir + lista de convertidos). No tienen equivalente en el new feature porque esa UI se elimina (la "conversión" pasa a ser simplemente editar `estadoRelacion`).

### Riesgo 1 — Tratos con prospecto_id/cliente_id

Después de este change, los tratos existentes en fixture aún referencian `prospecto_id` y `cliente_id` (que desaparecen del modelo). Los handlers de tratos que resuelven `useProspectos()` y `useClientes()` en `TratoDetailPage` fallarán porque esos hooks ya no existen. **Si los tratos y sus tests quedan intactos, sus tests importarán de hooks que ya no existen.**

**Mitigación**: actualizar las importaciones en tratos (`TratoForm`, `TratoDetailPage`, `TratoInfoTab`) para usar `useContactos` con filtros. Esto es necesario aunque el modelo `Trato.prospecto_id`/`cliente_id` se conserve.

### Riesgo 2 — Bug del back en EditContactoService

`EditContactoService` usa `reconstitute()` en lugar de `cambiarEstadoRelacion()`, por lo que el back NO valida transiciones inválidas en PUT /edit. El front debe implementar la lógica de restricción de UI (deshabilitar opción PROSPECTO en select si el estado actual es ACTIVO/INACTIVO) sin poder confiar en que el back la rechace como salvaguarda.

### Riesgo 3 — comoNosConocio es String libre en el back

El enum `ComoNosConocio` del front ('referido'|'redes_sociales'|'busqueda'|'evento'|'otro') no tiene contraparte en el back. El back acepta cualquier string. El front puede seguir mostrando esas opciones en un `<select>` de opciones predefinidas, pero el tipo TypeScript debe ser `string | null`, no el enum `ComoNosConocio`. Los valores que hoy los usuarios tienen en el back pueden ser strings arbitrarios no contemplados por el enum actual.

### Riesgo 4 — Fixtures de tratos con prospecto_id/cliente_id

Los fixtures de tratos (`tratosFixture`) tienen `prospecto_id: 'b1111111...'` y `cliente_id: 'c1111111...'`. Las IDs referencian fixtures de prospectos/clientes que se eliminan. Los tests de tratos que dependen de esas IDs pueden fallar si intentan resolver esas relaciones. Revisar qué tests de tratos harán `useClientes()`/`useProspectos()`.

---

## Referencias de archivos clave

**Back:**
- `C:\Users\PanNeton\Documents\GitHub\AR-CRM\infrastructure\src\main\java\com\ar\crm2\adapter\in\rest\ContactoController.java`
- `C:\Users\PanNeton\Documents\GitHub\AR-CRM\infrastructure\src\main\java\com\ar\crm2\adapter\in\rest\dto\request\CreateContactoRequest.java`
- `C:\Users\PanNeton\Documents\GitHub\AR-CRM\infrastructure\src\main\java\com\ar\crm2\adapter\in\rest\dto\request\EditContactoRequest.java`
- `C:\Users\PanNeton\Documents\GitHub\AR-CRM\infrastructure\src\main\java\com\ar\crm2\adapter\in\rest\dto\response\ContactoResponse.java`
- `C:\Users\PanNeton\Documents\GitHub\AR-CRM\domain\src\main\java\com\ar\crm2\model\entity\Contacto.java`
- `C:\Users\PanNeton\Documents\GitHub\AR-CRM\domain\src\main\java\com\ar\crm2\model\enums\EstadoRelacion.java`
- `C:\Users\PanNeton\Documents\GitHub\AR-CRM\application\src\main\java\com\ar\crm2\application\contacto\service\EditContactoService.java`
- `C:\Users\PanNeton\Documents\GitHub\AR-CRM\application\src\main\java\com\ar\crm2\application\contacto\service\DeleteContactoService.java`

**Front:**
- `C:\Users\PanNeton\Desktop\CRM-Project\src\api\types.ts`
- `C:\Users\PanNeton\Desktop\CRM-Project\src\api\endpoints.ts`
- `C:\Users\PanNeton\Desktop\CRM-Project\src\routes\router.tsx`
- `C:\Users\PanNeton\Desktop\CRM-Project\src\components\layout\Sidebar.tsx`
- `C:\Users\PanNeton\Desktop\CRM-Project\src\features\prospectos\` (directorio completo)
- `C:\Users\PanNeton\Desktop\CRM-Project\src\features\clientes\` (directorio completo)
- `C:\Users\PanNeton\Desktop\CRM-Project\src\features\empresas\hooks\useEmpresaProspectos.ts`
- `C:\Users\PanNeton\Desktop\CRM-Project\src\features\empresas\hooks\useEmpresaClientes.ts`
- `C:\Users\PanNeton\Desktop\CRM-Project\src\features\empresas\components\EmpresaProspectosTab.tsx`
- `C:\Users\PanNeton\Desktop\CRM-Project\src\features\empresas\components\EmpresaClientesTab.tsx`
- `C:\Users\PanNeton\Desktop\CRM-Project\src\mocks\handlers\prospectos.ts`
- `C:\Users\PanNeton\Desktop\CRM-Project\src\mocks\handlers\clientes.ts`
- `C:\Users\PanNeton\Desktop\CRM-Project\src\mocks\fixtures\prospectos.ts`
- `C:\Users\PanNeton\Desktop\CRM-Project\src\mocks\fixtures\clientes.ts`
