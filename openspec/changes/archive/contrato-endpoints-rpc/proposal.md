# Propuesta — Change 1: `contrato-endpoints-rpc`

**Fase**: sdd-propose
**Fecha**: 2026-05-27
**Fuente de verdad**: back AR-CRM (Spring Boot, hexagonal)
**Alcance**: recursos `usuarios`, `empresas`, `tareas` (los que YA coinciden en modelo con el back)
**Orden**: Change 1 de una reconciliación por fases (A en el grafo de la exploración)

---

## 1. Why / Intent

El back AR-CRM es la fuente de la verdad y ya está corriendo. Hoy el front "Pipely" emite llamadas HTTP a un contrato que **el back no expone**, por lo que las operaciones reales (crear, editar, eliminar) NO funcionan contra el back puesto. Las divergencias verificadas contra el código:

| Dimensión | Front actual | Back real (verificado) |
|-----------|--------------|------------------------|
| Prefijo | `/api/v1/{recurso}` | `/api/{recurso}` (sin versión) |
| Listar | `GET /{recurso}` | `GET /{recurso}/get-all` |
| Detalle | `GET /{recurso}/:id` | `GET /{recurso}/get-by-id?id={uuid}` |
| Crear | `POST /{recurso}` | `POST /{recurso}/create` |
| Editar | `PATCH /{recurso}/:id` | `PUT /{recurso}/edit?id={uuid}` |
| Eliminar | `DELETE /{recurso}/:id` | `DELETE /{recurso}/delete?id={uuid}` |
| ID | path param | query param (`@RequestParam`) SIEMPRE |
| Filtros | query params server-side | NINGUNO — el back no filtra |

Además del contrato HTTP, hay un **dolor estructural**: las rutas están **triplicadas** (hook + handler MSW + test), cada una con el string literal hardcodeado. Ejemplo concreto verificado en `tareas`:
- Hook: `apiClient.post(`/tratos/${trato_id}/tareas`, ...)` (`useCreateTarea.ts:21`)
- Handler MSW: `http.post(`${API}/tratos/:id/tareas`, ...)` (`tareas.ts:66`)
- Test: `http.post(`/api/v1/tratos/${TRATO_ID}/tareas`, ...)` (`useCreateTarea.test.tsx:19`)

Cualquier cambio de ruta exige tocar 3 sitios y es propenso a drift. **El objetivo del usuario es explícito: "que el crear funcione con el back puesto".**

Este change adapta SOLO los tres recursos cuyo modelo de dominio ya coincide con el back (`usuarios`, `empresas`, `tareas`), creando una única fuente de verdad de rutas y alineando payloads/enums. Es infraestructura: los demás changes de la reconciliación dependen de él.

---

## 2. What changes

### 2.1 Nueva fuente única de verdad de rutas: `src/api/endpoints.ts`
- Objeto por recurso, con funciones que arman la URL en estilo RPC del back.
- Reemplaza los strings literales hoy triplicados. Hook, handler MSW y test importan de acá.
- Diseño detallado en §4.

### 2.2 `apiClient` gana el método `put` (`src/api/client.ts`)
- Hoy `Method = 'GET' | 'POST' | 'PATCH' | 'DELETE'` y `apiClient` expone `get/post/patch/delete`.
- El back edita con **PUT**, no PATCH. Agregar `'PUT'` al type `Method` y `put: <T>(path, body) => request<T>('PUT', path, body)` al objeto.
- `PATCH` se mantiene por ahora (otros recursos fuera de alcance lo usan); no se elimina en este change.
- **`BASE_URL` baja de `/api/v1` a `/api`** (variable `VITE_API_BASE_URL` y fallback en `client.ts:11`).

### 2.3 Migración por recurso

**`usuarios`** (`src/features/usuarios/`)
- `useUsuarios`: `GET /usuarios` → `endpoints.usuarios.getAll()`.
- `useCreateUsuario`: `POST /usuarios` → `endpoints.usuarios.create()`.
- `useUpdateUsuario`: `PATCH /usuarios/:id` → `endpoints.usuarios.edit(id)` con **`apiClient.put`**.
- `useDeleteUsuario`: `DELETE /usuarios/:id` → `endpoints.usuarios.delete(id)`.
- `useUsuario` (detalle): → `endpoints.usuarios.getById(id)`.
- `useDesactivarUsuario` (`PATCH /usuarios/:id/desactivar`): el endpoint **NO existe en el back**. Se reimplementa como `put(endpoints.usuarios.edit(id), { ...activo:false })`. (Ver pregunta abierta P2 sobre `passwordHash`.)
- Schema/payload: el back's `CreateUsuarioRequest`/`EditUsuarioRequest` es `{ nombre, correo, passwordHash (NotBlank), rolId: UUID }`. El front modela `{ nombre, correo, rol_sistema, rol_empresa }`. **Divergencia de modelo no trivial** → ver §6/P2 antes de tocar el schema.

**`empresas`** (`src/features/empresas/`)
- `useEmpresas`: `GET /empresas` → `endpoints.empresas.getAll()`.
- `useCreateEmpresa`: `POST /empresas` → `endpoints.empresas.create()`.
- `useUpdateEmpresa`: `PATCH /empresas/:id` → `endpoints.empresas.edit(id)` con **`apiClient.put`**.
- `useDeleteEmpresa`: `DELETE /empresas/:id` → `endpoints.empresas.delete(id)`.
- `useEmpresa` (detalle): el back **NO tiene `get-by-id` para empresa** (confirmado: `EmpresaController` solo declara create/get-all/edit/delete). El detalle se resuelve **client-side** filtrando el `get-all` por id. Eliminar/redireccionar el endpoint de detalle hacia getAll + find.
- `useEmpresaProspectos` (`GET /empresas/:id/prospectos`) y `useEmpresaClientes` (`GET /empresas/:id/clientes`): **NO existen en el back**. **Fuera de alcance de este change** porque dependen de prospectos/clientes (Change 2). Se dejan intactos para no romper compilación; se anotan como deuda para Change 2. (Ver P3.)
- Payload/enum: el back's `Create/EditEmpresaRequest` incluye `estadoRelacion: ACTIVO|INACTIVO|PROSPECTO`, `responsableId`, `creadoPor` (solo create), `notas`, y `paginaWeb` (camelCase). El front modela solo `nombre, sector, telefono, pagina_web, facebook, instagram, twitter`. Hay que: (a) renombrar `pagina_web` → `paginaWeb`, (b) agregar `estadoRelacion` (enum), (c) decidir sobre `responsableId/creadoPor/notas` (ver P4).

> **CORRECCIÓN al brief**: el brief mencionaba `tipoContrato` para empresas con valores `SERVICIO|LICENCIA|SUSCRIPCION|PERMANENTE|OTRO`. Verificado contra el código: **Empresa NO tiene `tipoContrato`**. Ese enum pertenece a **Trato** (`CreateTratoRequest`), que está FUERA de alcance. El enum real de Empresa es **`estadoRelacion: ACTIVO|INACTIVO|PROSPECTO`** (`EstadoRelacion.java`).

**`tareas`** (`src/features/tareas/`)
- `useTareas`: `GET /tareas?<filtros>` → `endpoints.tareas.getAll()`. **Eliminar el armado de query params** (el back ignora todos). Los filtros (`trato_id`, `responsable_id`, `prioridad`, `vencimiento`, etc.) pasan a **client-side** sobre la lista completa.
- `useCreateTarea`: hoy `POST /tratos/:trato_id/tareas` con `tratoId` en el PATH → cambiar a `POST /tareas/create` con `tratoId` **en el body** (`endpoints.tareas.create()`). El endpoint nested NO existe en el back.
- `useUpdateTarea`: `PATCH /tareas/:id` → `endpoints.tareas.edit(id)` con **`apiClient.put`**.
- `useDeleteTarea`: → `endpoints.tareas.delete(id)`.
- `useTarea` (detalle): → `endpoints.tareas.getById(id)`.
- `useCompletarTarea` (`PATCH /tareas/:id/completar`): el endpoint **NO existe**. La Tarea del back **no tiene `estado`**; "completar" = `put(endpoints.tareas.edit(id), { ...fechaCompletada: now })`. (Ver P5: el front tiene `estado: pendiente|en_progreso|completada` que el back no respalda.)
- Enums (verificados en `TipoTarea.java` y `PrioridadTarea.java`):
  - `tipo`: front `llamada|reunion|email|demo|seguimiento` → back **`GENERAL|SEGUIMIENTO|NEGOCIACION|CIERRE`**.
  - `prioridad`: front `1|2|3` (number) → back **`BAJA|MEDIA|ALTA|URGENTE`** (string enum).
- `fechaLimite`: el back lo exige **`@NotNull` `LocalDateTime`** (con hora) en create Y edit. El front lo tiene `string | null` (date-only). Hay que hacerlo requerido y formatear a `LocalDateTime`.
- Eliminar del schema/type el campo `estado` de Tarea (no existe en el back). (Ver P5.)

### 2.4 Handlers MSW reescritos para imitar el contrato REAL del back
- Reescribir `usuarios.ts`, `empresas.ts`, `tareas.ts` para usar las rutas RPC (`endpoints.ts`), método **PUT** en edit, ids por query param, **sin filtros server-side**, y campos/enums del back.
- Fixtures (`fixtures/usuarios.ts`, `empresas.ts`, `tareas.ts`) ajustadas a la forma del back (enums nuevos, `paginaWeb`, `estadoRelacion`, `rolId`, sin `estado` de tarea).
- Objetivo: mocks **fieles y drop-in** — cuando el back esté disponible, basta apuntar `VITE_API_BASE_URL` sin tocar hooks ni tests.
- Evaluar si `makeCrudHandlers` (`utils/crud.ts`) se adapta al estilo RPC (rutas `/create`, `/edit?id=`, `/delete?id=`, PUT) o si se crea un `makeRpcCrudHandlers` paralelo. Decisión de diseño para sdd-design.

### 2.5 Tests migrados
- Tests de hooks/handlers de los 3 recursos importan rutas desde `endpoints.ts` en vez de literales `/api/v1/...`.
- Ajustar expectativas de método (PUT en edit), forma de payload (enums nuevos, `tratoId` en body de tarea) y ausencia de filtros server-side.
- `useCompletarTarea.test.tsx`, `useDesactivarUsuario.test.tsx`, `TareaEstadoMenu.test.tsx`: se reescriben para el nuevo flujo (edit) o se ajustan según P2/P5.

---

## 3. Out of scope (NO tocar, NO proponer)

- **Auth**: el back no la tiene. Intacta — `apiClient` Bearer/401, `useLogin`, `useMe`, `authStore`, rutas protegidas. (Solo se agrega `put` y se baja `BASE_URL`; el header Bearer y el manejo de 401 quedan igual.)
- **Trato / estado / ganar / perder / Kanban**: parkeado para reunión. (Por eso `tipoContrato` queda afuera.)
- **`tratos` CRUD**: diferido — payload enganchado con `estado` + `prospecto_id`/`cliente_id`.
- **`prospectos` / `clientes`**: su unificación al modelo `Contacto` del back es el **Change 2**. No migrar acá. (Por eso `useEmpresaProspectos`/`useEmpresaClientes` se dejan intactos como deuda.)
- **`tableros` / `columnas` / `fichas`, `roles`, `superusuarios`, `etiquetas`, `comentarios`**: fuera de este change.

---

## 4. Diseño propuesto de `src/api/endpoints.ts`

Objeto por recurso. Listar/crear devuelven path constante; detalle/editar/eliminar son funciones que reciben el `id` y arman el query param. **`endpoints.ts` NO incluye el prefijo `/api`** — ese vive en `BASE_URL` del `apiClient` (que pasa a `/api`).

```ts
// Única fuente de verdad de rutas. Estilo RPC del back AR-CRM.
// El prefijo /api vive en apiClient (BASE_URL). Acá solo el path por recurso.

function rpc(recurso: string) {
  return {
    getAll: () => `/${recurso}/get-all`,
    getById: (id: string) => `/${recurso}/get-by-id?id=${id}`,
    create: () => `/${recurso}/create`,
    edit: (id: string) => `/${recurso}/edit?id=${id}`,
    delete: (id: string) => `/${recurso}/delete?id=${id}`,
  };
}

export const endpoints = {
  usuarios: rpc('usuarios'),
  empresas: {
    // Empresa NO tiene get-by-id en el back: se omite a propósito.
    getAll: () => '/empresas/get-all',
    create: () => '/empresas/create',
    edit: (id: string) => `/empresas/edit?id=${id}`,
    delete: (id: string) => `/empresas/delete?id=${id}`,
  },
  tareas: rpc('tareas'),
} as const;
```

Decisiones de diseño abiertas para sdd-design:
- ¿Factory `rpc()` compartida vs objetos explícitos por recurso? (Empresa rompe el molde por no tener `getById` → quizá explícito es más honesto.)
- ¿`endpoints.ts` debe encodear el id (`encodeURIComponent`) ya que va como query param? Recomendado sí.
- ¿El prefijo `/api` se centraliza solo en `BASE_URL`, o `endpoints.ts` expone también el recurso base para que los handlers MSW lo reutilicen? (Los handlers MSW necesitan la ruta ABSOLUTA `/api/usuarios/...`; hay que exponer un helper para que el mock no re-hardcodee `/api`.)

---

## 5. Impact

### Archivos / áreas afectadas
- **Nuevo**: `src/api/endpoints.ts`.
- **Modificado**: `src/api/client.ts` (+`put`, `BASE_URL`), `.env.development` (`VITE_API_BASE_URL=/api`).
- **usuarios**: `hooks/{useUsuarios,useCreateUsuario,useUpdateUsuario,useDeleteUsuario,useUsuario,useDesactivarUsuario}.ts`, `schemas/usuario.schema.ts`, sus `__tests__/`.
- **empresas**: `hooks/{useEmpresas,useCreateEmpresa,useUpdateEmpresa,useDeleteEmpresa,useEmpresa}.ts`, `schemas/empresa.schema.ts`, sus `__tests__/`. (`useEmpresaProspectos`/`useEmpresaClientes` intactos.)
- **tareas**: `hooks/{useTareas,useCreateTarea,useUpdateTarea,useDeleteTarea,useTarea,useCompletarTarea}.ts`, `schemas/tarea.schema.ts`, `components/{TareaForm,TareasTable,TareaEstadoMenu}.tsx` (enums/estado), sus `__tests__/`.
- **types**: `src/api/types.ts` → `Usuario`, `Empresa`, `Tarea`, enums `TipoTarea`/nueva `PrioridadTarea`/`EstadoRelacion`; remover `EstadoTarea` de Tarea.
- **MSW**: `mocks/handlers/{usuarios,empresas,tareas}.ts`, `mocks/fixtures/{usuarios,empresas,tareas}.ts`, posiblemente `mocks/utils/crud.ts`.

### Specs openspec impactadas
- **`tareas-management`** → **MODIFICA**: enums `tipo` (GENERAL/SEGUIMIENTO/NEGOCIACION/CIERRE) y `prioridad` (BAJA/MEDIA/ALTA/URGENTE), eliminación de `estado`, "completar" via edit, `fechaLimite` requerido, rutas RPC.
- **`usuarios-management`** (si existe) → **MODIFICA**: rutas RPC, edit con PUT, `desactivar` via edit. Revisar el modelo `rolId` vs `rol_sistema`/`rol_empresa` (P2).
- **`empresas-management`** (si existe) → **MODIFICA**: rutas RPC, edit con PUT, `paginaWeb`, `estadoRelacion`, sin `get-by-id`.
- (sdd-spec escribe los delta specs concretos.)

---

## 6. Riesgos

- **R1 — Modelo de Usuario divergente (no solo de nombres)**. El back exige `rolId: UUID` y `passwordHash` (NotBlank) en create Y edit; el front modela `rol_sistema: 'admin'|'usuario'` + `rol_empresa: string|null` y **no tiene flujo de passwords**. Adaptar `usuarios` "para que crear funcione" implica decidir de dónde sale `rolId` y `passwordHash`. **Esto puede exceder lo mecánico.** Ver P2.
- **R2 — Empresa sin `get-by-id`**. El detalle de empresa pasa a client-side (getAll + find). Aceptable para volúmenes chicos; degrada con datos grandes.
- **R3 — Filtros client-side**. Quitar filtros server-side de tareas mueve toda la lógica al cliente sobre listas completas. Funciona contra el back real pero no escala. Riesgo de performance conocido y aceptado para esta fase.
- **R4 — `estado` de Tarea desaparece**. La UI actual (`TareaEstadoMenu`, columna de estado en `TareasTable`) depende de `pendiente|en_progreso|completada`. El back solo tiene `fechaCompletada`. Hay que decidir qué pasa con la UI de estado. Ver P5.
- **R5 — Conversión de enums rompe fixtures y datos existentes**. Cambiar `prioridad` de number a string y `tipo` a los valores del back invalida fixtures y cualquier dato seed. Migración mecánica pero amplia.
- **R6 — `LocalDateTime` vs date-only**. El back exige `fechaLimite` con hora y obligatorio. El front usa date-only nullable. Hay que decidir formato de envío (`T00:00:00` o un date-time picker real) y hacerlo requerido.
- **R7 — MSW drop-in**. Si los handlers no imitan EXACTAMENTE el contrato (PUT, query param id, enums), los tests pasan en verde pero el front sigue roto contra el back real. La fidelidad del mock es crítica.

---

## 7. Preguntas abiertas para el usuario

- **P1** — `endpoints.ts`: ¿factory `rpc()` compartida, o objetos explícitos por recurso (más honesto con Empresa que no tiene `getById`)?
- **P2** — **Usuario**: el back exige `rolId: UUID` y `passwordHash`. El front no tiene catálogo de roles ni gestión de passwords. ¿Cómo "hacemos que crear funcione"? Opciones: (a) hardcodear/derivar un `rolId` por defecto y un `passwordHash` placeholder, (b) traer el catálogo de roles del back (`/api/roles`, fuera de alcance), (c) diferir `usuarios` create/edit hasta resolver roles. **Bloqueante para que crear usuario funcione de verdad.**
- **P3** — `useEmpresaProspectos`/`useEmpresaClientes`: confirmamos que quedan **intactos como deuda de Change 2** (no se migran ni se eliminan ahora), ¿correcto?
- **P4** — **Empresa**: ¿agregamos `estadoRelacion`, `responsableId`, `creadoPor`, `notas` al modelo/form del front ahora, o solo lo mínimo para crear (mandar `estadoRelacion` default + `nombre`) y dejamos el resto para después?
- **P5** — **Tarea**: el back no tiene `estado`. ¿Eliminamos la UI de estado (`TareaEstadoMenu`, columna estado) por completo, o la derivamos client-side de `fechaCompletada` (completada vs pendiente, sin `en_progreso`)?
- **P6** — **Tarea `fechaLimite`**: el back lo exige obligatorio con hora. ¿Cambiamos el form a date-time requerido, o enviamos `fecha + T00:00:00` y mantenemos el date picker?
- **P7** — Homologación: ¿la migración debe mantener la homologación entre los 3 CRUDs (UI/hooks paramétricos/nombre clickeable) en el mismo change, o solo el contrato HTTP ahora y la homologación visual después?

---

## 8. Verificación

- `pnpm type-check` verde (los tipos de `Usuario`/`Empresa`/`Tarea` y enums propagan correctamente).
- `pnpm test:run` (vitest) verde: hooks, handlers y tests de los 3 recursos consumen `endpoints.ts`; los mocks reflejan el contrato real del back.
- Inspección manual: ningún literal `/api/v1` ni ruta REST (`/recurso/:id`) en los 3 recursos; las rutas RPC viven solo en `endpoints.ts`; `apiClient.put` se usa en los edits.
- Criterio drop-in: apuntando `VITE_API_BASE_URL` al back real, `crear` de empresa/tarea (y usuario, sujeto a P2) debe funcionar sin tocar hooks ni tests.
- **NO** ejecutar `pnpm build`.

---

## 9. Next recommended

`sdd-spec` — escribir los delta specs de `tareas-management` (enums, sin estado, fechaLimite requerido, RPC) y de `usuarios`/`empresas` según corresponda, una vez resueltas P2/P4/P5.
