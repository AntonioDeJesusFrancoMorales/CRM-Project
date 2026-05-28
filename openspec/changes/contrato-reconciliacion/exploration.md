# Exploración de contrato back-front (reconciliación)

**Change**: contrato-reconciliacion
**Fase**: explore
**Fecha**: 2026-05-27
**Fuente de verdad**: back AR-CRM (Spring Boot, hexagonal)
**Política**: el back manda; el front se adapta. Auth excluida del alcance.

---

## 1. Confirmación del estilo RPC del back (válida para TODOS los recursos)

El hipótesis del doc de ayer es CORRECTA y aplica a todos los controllers sin excepción.

| Operación | Estilo back real | Estilo front actual |
|-----------|-----------------|---------------------|
| Prefijo base | `/api/{recurso}` (sin versión) | `/api/v1/{recurso}` |
| Listar | `GET /get-all` | `GET /` |
| Detalle | `GET /get-by-id?id={uuid}` | `GET /:id` |
| Crear | `POST /create` | `POST /` |
| Editar | `PUT /edit?id={uuid}` + body | `PATCH /:id` + body |
| Eliminar | `DELETE /delete?id={uuid}` | `DELETE /:id` |

**NOVEDADES no contempladas en el doc de ayer:**
- El back usa `PUT` para editar (no `PATCH`). El front usa `PATCH` en todos los hooks.
- El id viaja SIEMPRE como `@RequestParam` (query param), NUNCA en el path. Incluso en la operación de edit: `PUT /api/tratos/edit?id=<uuid>` con body.
- No hay paginación en ningún endpoint (todos devuelven listas completas).
- No hay filtros por query param en el back (el back no filtra por `estado`, `responsable_id`, etc.) — el front y sus mocks sí tienen filtros, pero son puramente client-side o propios del mock.

---

## 2. Mapa recurso por recurso (VERIFICADO contra código real)

### 2.1 Usuarios

**Back** (`/api/usuarios`):
- `POST /create` body: `{ nombre: String, correo: String, passwordHash: String, rolId: UUID }`
- `GET /get-all` response: `[{ id, nombre, correo, rolId, creadoEn, activo }]`
- `GET /get-by-id?id=` response: `{ id, nombre, correo, rolId, creadoEn, activo }`
- `PUT /edit?id=` body: `{ nombre, correo, passwordHash, rolId }` (mismos campos que create)
- `DELETE /delete?id=`

**Front** (`/api/v1/usuarios`):
- Types.ts: `{ id, nombre, correo, rol_sistema: 'admin'|'usuario', rol_empresa: string|null, activo, creado_en }`
- Hook `useUsuarios` → `GET /usuarios`
- Hook `useDesactivarUsuario` → `PATCH /usuarios/:id/desactivar`

**Divergencias**:
- Campo `rolId` (back, UUID) vs `rol_sistema: 'admin'|'usuario'` + `rol_empresa: string|null` (front). Son conceptos distintos: el back referencia a una entidad `Rol` por UUID; el front usa strings literales de rol.
- El endpoint `/usuarios/:id/desactivar` NO EXISTE en el back (el back solo tiene `PUT /edit?id=` — desactivar se haría via edit con `activo: false`).
- El back expone `creadoEn` (LocalDateTime), el front espera `creado_en` (ISO string).
- El back requiere `passwordHash` en create y edit — el front no lo manda (no hay flujo de gestión de passwords en el front).
- El back NO tiene endpoint `GET /usuarios` sin acción (solo `/get-all`).

---

### 2.2 Empresas

**Back** (`/api/empresas`):
- `POST /create` body: `{ nombre*: String, sector, telefono, paginaWeb, facebook, instagram, twitter, estadoRelacion: ACTIVO|INACTIVO|PROSPECTO, responsableId: UUID, creadoPor: UUID, notas }`
- `GET /get-all` response: `[{ id, nombre, sector, telefono, paginaWeb, facebook, instagram, twitter, estadoRelacion, responsableId, creadoPor, notas, creadoEn, actualizadoEn }]`
- `PUT /edit?id=` body: `{ nombre*, sector, telefono, paginaWeb, facebook, instagram, twitter, estadoRelacion, responsableId, notas }` (sin creadoPor en edit)
- `DELETE /delete?id=`
- NO hay `GET /get-by-id` para empresa (el controller no lo declara — confirmado en código).

**Front** (`/api/v1/empresas`):
- Types.ts: `{ id, nombre, sector, telefono, pagina_web, facebook, instagram, twitter, creado_en, actualizado_en }` (sin estadoRelacion, sin responsableId, sin creadoPor, sin notas)
- Schema zod: valida nombre, sector, telefono, pagina_web, facebook, instagram, twitter
- Hook `useEmpresaProspectos` → `GET /empresas/:id/prospectos` (NO existe en back)
- Hook `useEmpresaClientes` → `GET /empresas/:id/clientes` (NO existe en back)

**Divergencias**:
- El back tiene `estadoRelacion` en Empresa (ACTIVO/INACTIVO/PROSPECTO) — el front no lo modela en types.ts ni en el schema.
- El back tiene `responsableId`, `creadoPor`, `notas` — el front los ignora.
- El back tiene `paginaWeb` (camelCase) vs el front usa `pagina_web` (snake_case).
- El back valida URLs en paginaWeb/facebook/instagram/twitter (`DomainAssert.link()`). El front valida solo pagina_web como URL.
- Los endpoints nested `/empresas/:id/prospectos` y `/empresas/:id/clientes` NO EXISTEN en el back. El back no tiene `get-by-id` para empresa tampoco.
- `Empresa` en el back también tiene reglas de transición de estado idénticas a `Contacto`.

---

### 2.3 Contactos (= Prospectos + Clientes del front)

**Back** (`/api/contactos`):
- `POST /create` body: `{ empresaId*: UUID, nombre*: String(1-150), correo: String(email,max150), estadoRelacion*: PROSPECTO|ACTIVO|INACTIVO, responsableId: UUID, creadoPor: UUID, telefono: String(max50), cargo: String(max100), comoNosConocio: String(max200) }`
- `GET /get-all` response: `[{ id, empresaId, nombre, correo, estadoRelacion, responsableId, creadoPor, telefono, cargo, comoNosConocio, creadoEn, actualizadoEn }]`
- `GET /get-by-id?id=`
- `PUT /edit?id=` body: `{ nombre*, correo, estadoRelacion*, responsableId, telefono, cargo, comoNosConocio }` (sin empresaId ni creadoPor en edit)
- `DELETE /delete?id=`

**Reglas de dominio del back (en Contacto.cambiarEstadoRelacion)**:
- ACTIVO → PROSPECTO: PROHIBIDO
- INACTIVO → PROSPECTO: PROHIBIDO
- ANY → INACTIVO: PROHIBIDO si tiene tratos activos
- Mismas reglas en Empresa (EmpresaStateTransitionException)

**Front — Prospecto** (`/api/v1/prospectos`):
- Types.ts: `{ id, empresa_id, responsable_id, creado_por, nombre_contacto, correo_contacto, telefono_contacto, cargo_contacto, como_nos_conocio: ComoNosConocio|null, estado_posible_cliente: 'frio'|'tibio'|'caliente'|'convertido', notas: string|null, creado_en, actualizado_en }`
- Schema: no tiene `estadoRelacion`, tiene `estado_posible_cliente` que es un enum propio del front
- Endpoint de conversión: `POST /prospectos/:id/convertir` → NO EXISTE en el back

**Front — Cliente** (`/api/v1/clientes`):
- Types.ts: `{ id, empresa_id, responsable_id, creado_por, nombre_contacto, correo_contacto, telefono_contacto, cargo_contacto, como_nos_conocio, notas, prospecto_origen_id: string|null, creado_en, actualizado_en }`

**Divergencias graves (no solo de nombres)**:
- El back tiene UNA entidad `Contacto` con `estadoRelacion: PROSPECTO|ACTIVO|INACTIVO`.
- El front tiene DOS recursos separados: `prospectos` (con `estado_posible_cliente`) y `clientes` (con `prospecto_origen_id`).
- El campo `estado_posible_cliente: 'frio'|'tibio'|'caliente'|'convertido'` NO EXISTE en el back en ninguna forma.
- El campo `notas` en el front (para prospectos y clientes) NO EXISTE en el back's `Contacto`.
- El campo `nombre_contacto` (front) vs `nombre` (back).
- `como_nos_conocio` en el back es `String(max200)` libre; en el front es enum `'referido'|'redes_sociales'|'busqueda'|'evento'|'otro'`.
- El endpoint `POST /prospectos/:id/convertir` NO EXISTE en el back — la conversión se haría via `PUT /contactos/edit?id=` cambiando `estadoRelacion` de PROSPECTO a ACTIVO.
- El back NO expone `notas` en Contacto (solo Empresa tiene notas en el request DTO de empresa).

---

### 2.4 Tratos

**Back** (`/api/tratos`):
- `POST /create` body: `{ contactoId*: UUID, responsableId*: UUID, nombre*: String(1-200), valorEstimado: BigDecimal, probabilidad: Integer(0-100), fechaCierreEsperada: LocalDate, tipoContrato*: SERVICIO|LICENCIA|SUSCRIPCION|PERMANENTE|OTRO }`
- `GET /get-all` response: `[{ id, contactoId, responsableId, nombre, valorEstimado, probabilidad, fechaCierreEsperada, tipoContrato, motivoPerdida, creadoEn, actualizadoEn }]`
- `GET /get-by-id?id=`
- `PUT /edit?id=` body: `{ responsableId*, nombre*, valorEstimado, probabilidad, fechaCierreEsperada, tipoContrato* }` (sin contactoId en edit — el trato no cambia de contacto)
- `DELETE /delete?id=`

**Dominio back — Trato NO tiene**:
- Campo `estado` (abierto/ganado/perdido) — AUSENTE
- Campos `prospecto_id`, `cliente_id` — reemplazados por `contactoId` (uno solo)
- Endpoints `ganar` / `perder`
- `tipoContrato` enum back: `SERVICIO|LICENCIA|SUSCRIPCION|PERMANENTE|OTRO`

**Front** (`/api/v1/tratos`):
- Types.ts: `{ id, prospecto_id: string|null, cliente_id: string|null, responsable_id, nombre, valor_estimado, probabilidad, fecha_cierre_esperada, tipo_contrato: 'precio_fijo'|'tiempo_materiales'|'retainer'|null, estado: 'abierto'|'ganado'|'perdido', motivo_perdida, creado_en, actualizado_en }`
- Schema: tiene XOR `cliente_id`/`prospecto_id` + `asociacion` toggle
- Hooks dedicados: `useGanarTrato` (`PATCH /tratos/:id/ganar`), `usePerderTrato` (`PATCH /tratos/:id/perder`)

**Divergencias**:
- `estado` (front) no existe en el back — el Kanban de tratos actual (`abierto|ganado|perdido`) no tiene respaldo en el back.
- `prospecto_id` + `cliente_id` (XOR, front) vs `contactoId` único (back).
- `tipo_contrato` enum front (`precio_fijo|tiempo_materiales|retainer`) es DISTINTO al del back (`SERVICIO|LICENCIA|SUSCRIPCION|PERMANENTE|OTRO`).
- `tipoContrato` es obligatorio (`@NotNull`) en el back; en el front es `nullable`.
- `valorEstimado` en el back es `BigDecimal`; en el front es `number`.
- Fechas: `LocalDate` (back) vs `string ISO` (front) para `fechaCierreEsperada`.
- `motivoPerdida` en el back existe pero no tiene semántica de `estado=perdido` asociada.
- El back NO tiene los endpoints `ganar`, `perder`, ni filtros por `estado`.
- El front filtra por `estado`, `responsable_id`, `cliente_id`, `prospecto_id` vía query params — NINGUNO existe en el back.

---

### 2.5 Tareas

**Back** (`/api/tareas`):
- `POST /create` body: `{ tratoId*: UUID, responsableId*: UUID, titulo*: String(1-200), descripcion, tipo*: GENERAL|SEGUIMIENTO|NEGOCIACION|CIERRE, prioridad*: BAJA|MEDIA|ALTA|URGENTE, fechaLimite*: LocalDateTime }`
- `GET /get-all` response: `[{ id, tratoId, responsableId, titulo, descripcion, tipo, prioridad, fechaLimite, fechaCompletada, creadoEn, actualizadoEn }]`
- `GET /get-by-id?id=`
- `PUT /edit?id=` body: `{ responsableId*, titulo*, descripcion, tipo*, prioridad*, fechaLimite* }`
- `DELETE /delete?id=`

**Front** (`/api/v1/tareas`):
- Types.ts: `{ id, trato_id, responsable_id, titulo, descripcion, tipo: 'llamada'|'reunion'|'email'|'demo'|'seguimiento', estado: 'pendiente'|'en_progreso'|'completada', prioridad: 1|2|3, fecha_limite, fecha_completada, creado_en, actualizado_en }`
- Hook `useCompletarTarea` → `PATCH /tareas/:id/completar`
- Mock handler: `POST /tratos/:id/tareas` (endpoint nested) y filtros `trato_id`, `responsable_id`, `estado`, `prioridad`, `vencimiento`

**Divergencias**:
- `tipo` enum front (`llamada|reunion|email|demo|seguimiento`) es DISTINTO al back (`GENERAL|SEGUIMIENTO|NEGOCIACION|CIERRE`).
- `prioridad` en el front es `number` (1|2|3); en el back es enum `BAJA|MEDIA|ALTA|URGENTE`.
- `estado` en el front (`pendiente|en_progreso|completada`) NO EXISTE en el back — la Tarea del back no tiene estado.
- El endpoint `PATCH /tareas/:id/completar` NO EXISTE en el back. La completación se haría via `PUT /tareas/edit?id=` con `fechaCompletada` seteada.
- El endpoint nested `POST /tratos/:id/tareas` NO EXISTE en el back — el back crea tareas via `POST /tareas/create` con `tratoId` en el body.
- Filtros del front (`trato_id`, `estado`, etc.) no existen en el back.
- `fechaLimite` es `LocalDateTime` en el back (con hora), `string|null` en el front (solo fecha).

---

### 2.6 Tableros, Columnas, Fichas

**Back — Tablero** (`/api/tableros`):
- `POST /create` body: `{ nombre*, descripcion, tipoTablero: TipoTablero }` (crea con 4 columnas por defecto)
- `GET /get-all` response: `[{ id, nombre, descripcion, tipoTablero, columnas: ColumnaTableroDto[], creadoEn }]`
- `GET /get-by-id?id=`
- `PUT /edit?id=`
- `DELETE /delete?id=`
- `POST /agregar-columna?id=tableroId` body: `AgregarColumnaRequest`
- `DELETE /eliminar-columna?id=tableroId&columnaId=` — FALLA 409 si hay fichas
- `POST /asignar-columna?id=tableroId&columnaId=` body: `AsignarColumnaRequest`
- `PUT /reordenar-columnas?id=tableroId` body: `ReordenarColumnasRequest`

**Back — Columna** (`/api/columnas`):
- CRUD completo: create, get-all, get-by-id, edit, delete
- Response: `{ id, nombre (columnanombre en domain), color, tipoTablero, tipoColumna }`

**Back — Ficha** (`/api/fichas`):
- CRUD: create, get-all, get-by-id, edit, delete
- Response: `{ id, columnaId, tipoFicha: TRATO|TAREA, tratoId, tareaId, responsableId, creadoPor, creadoEn, actualizadoEn }`
- Create: `{ columnaId*, tipoFicha*, tratoId, tareaId, responsableId*, creadoPor* }`

**Front — Tablero** (`/api/v1/tableros`):
- Types.ts: `{ id, nombre, descripcion, tipo_ficha: 'trato'|'tarea', creado_en }` — el back usa `tipoTablero` (TipoTablero enum), no `tipo_ficha`
- Mock: tablero embebe columnas con `tablero_id`, `posicion`, `limite_wip`, `estado_vinculado` — el back no usa esos campos

**Front — Columna**:
- Types.ts: `{ id, tablero_id, nombre, color, posicion, limite_wip, estado_vinculado }` — muy distinto del back
- El back's `Columna` es un catálogo (`tipoTablero`, `tipoColumna`); `ColumnaTablero` es la relación

**Front — Ficha**:
- Types.ts front: `{ id, columna_id, responsable_id, creado_por }` — incompleto vs back (`tipoFicha`, `tratoId`, `tareaId` ausentes en el tipo del front)

**Divergencias**:
- El modelo de tablero/columna del back es un catálogo + relación (ColumnaTablero); el del front es tablero-propio con posición embedded.
- `tipo_ficha` (front) vs `tipoTablero` (back).
- `limite_wip`, `estado_vinculado`, `posicion` del front no existen en el back (son propiedades del modelo del front).
- Los endpoints del tablero para columnas son totalmente distintos: el back usa `agregar-columna`, `eliminar-columna`, `asignar-columna`, `reordenar-columnas` vía `/api/tableros/`; el front usa `/tableros/:id/columnas` y `/columnas/:id`.

---

### 2.7 Roles

**Back** (`/api/roles`):
- CRUD completo (create, get-all, get-by-id, edit, delete)
- Entidad: `Rol` con `id`, probablemente `nombre`

**Front**: NO consume roles. No hay feature `roles` en el front.

---

### 2.8 SuperUsuarios

**Back** (`/api/superusuarios`):
- CRUD completo (create, get-all, get-by-id, edit, delete)

**Front**: NO consume superusuarios. No hay feature `superusuarios` en el front.

---

## 3. Validación del fraseo en 4 frentes

### Change A — Estilo RPC + centralizar paths en `src/api/endpoints.ts`

**Estado**: CONFIRMADO. Aplica a TODOS los recursos.

**Alcance más detallado de lo esperado**:
- No es solo cambiar `/recurso` → `/recurso/get-all`. Implica:
  1. Cambiar prefijo: `/api/v1/` → `/api/`
  2. Cambiar todos los paths a estilo RPC
  3. Cambiar métodos: `PATCH` → `PUT` para todas las ediciones
  4. Cambiar ids de path params a query params
  5. Centralizar en `src/api/endpoints.ts`
  6. Actualizar `apiClient` para soportar `PUT` (hoy solo soporta `GET|POST|PATCH|DELETE`)

**Impacto adicional no contemplado**: El `apiClient` actual no tiene método `put`. Hay que agregarlo.

**Orden**: debe ir PRIMERO — es infraestructura que todos los otros changes dependen.

---

### Change B — Trato: `estado` + contacto único

**Estado**: CONFIRMADO pero más amplio de lo planteado.

El plan original decía "eliminar estado/ganar/perder, prospecto_id+cliente_id → contactoId único, mantener motivoPerdida". Verificado:
- `estado` NO existe en el back — correcto, eliminar.
- `ganar`/`perder` NO existen en el back — correcto, eliminar.
- `contactoId` (back) reemplaza `prospecto_id` + `cliente_id` — correcto.
- `motivoPerdida` SÍ existe en el back — correcto, mantener.
- `tipoContrato` en el back es `SERVICIO|LICENCIA|SUSCRIPCION|PERMANENTE|OTRO` — el front tiene `precio_fijo|tiempo_materiales|retainer`. **Este es un cambio de enum no contemplado en el plan original.**
- `tipoContrato` es OBLIGATORIO en el back (`@NotNull`) pero nullable en el front — cambio adicional.

**Consecuencia crítica**: el Kanban de tratos (`tratos-kanban`, spec ya escrita y archivada) es una feature BASADA en `estado` del trato. Si se elimina `estado`, el Kanban de tratos tal como está especificado DEJA DE TENER SENTIDO. Necesita rediseño.

**Orden**: después de A, antes de C (porque C usa `contactoId` que se define aquí).

---

### Change C — Contacto unificado

**Estado**: CONFIRMADO, y más complejo de lo anticipado.

Lo que hay que eliminar/adaptar del front:
- Feature `prospectos/` completa (CRUD, hooks, schemas, páginas, mocks, tests)
- Feature `clientes/` completa
- `prospecto-conversion` (el endpoint no existe en el back)
- `EstadoPosibleCliente` enum (frio/tibio/caliente/convertido) — NO existe en el back
- `notas` en prospectos/clientes — NO existe en el back's Contacto

Lo que hay que crear en el front:
- Feature `contactos/` con `estadoRelacion: PROSPECTO|ACTIVO|INACTIVO`
- UI para respetar las reglas de transición (no volver a PROSPECTO; no INACTIVO con tratos activos)
- `como_nos_conocio` pasa de enum a string libre (max 200 chars)

**Pregunta abierta 1**: El front modeló `estado_posible_cliente` (frio/tibio/caliente) como subclasificación dentro del estado PROSPECTO. El back NO tiene eso. ¿Se descarta completamente esa clasificación, o el usuario quiere que se implemente como un campo adicional en el front que el back ignore?

**Orden**: después de B (porque los Tratos ya usan `contactoId`).

---

### Change D — Features del front sin respaldo en el back

**Estado**: CONFIRMADO. Listado de features a revisar:

| Feature front | ¿Existe en back? | Alternativa |
|---------------|-----------------|-------------|
| `etiquetas` (Etiqueta, handler, fixture) | NO | Sin alternativa. Eliminar o dejar como feature local del front. |
| `comentarios` (Comentario, handler, fixture) | NO | Sin alternativa. Eliminar o dejar como feature local del front. |
| `GET /empresas/:id/prospectos` | NO | Reemplazar por `GET /contactos/get-all` + filtrar por `empresaId` client-side (back no filtra). |
| `GET /empresas/:id/clientes` | NO | Idem — filtrado client-side. |
| `GET /tratos/:id/tareas` | NO | Reemplazar por `GET /tareas/get-all` + filtrar por `tratoId` client-side. |
| `GET /prospectos/:id/tratos` | NO | Reemplazar por `GET /tratos/get-all` + filtrar por `contactoId`. |
| `PATCH /tratos/:id/ganar` | NO | Se elimina (ver Change B). |
| `PATCH /tratos/:id/perder` | NO | Se elimina (ver Change B). |
| `PATCH /tareas/:id/completar` | NO | `PUT /tareas/edit?id=` con `fechaCompletada` seteada. |
| `PATCH /usuarios/:id/desactivar` | NO | `PUT /usuarios/edit?id=` con `activo: false`. |
| `POST /prospectos/:id/convertir` | NO | `PUT /contactos/edit?id=` con `estadoRelacion: ACTIVO`. |
| Filtros server-side (estado, trato_id, etc.) | NO | Todos los filtros deben ser client-side. El back no filtra. |
| Kanban de tratos (basado en estado) | NO | Ver nota abajo. |
| `estado` de Tarea | NO | `fechaCompletada` = indicador de completada. Pendiente/en_progreso no existen. |
| `tipo` de Tarea (llamada/reunion/email/demo/seguimiento) | NO | Back tiene `GENERAL|SEGUIMIENTO|NEGOCIACION|CIERRE`. Enum distinto. |

**Nota crítica sobre el Kanban de tratos**: el Kanban de tratos en la spec actual depende de `estado: abierto|ganado|perdido`. El back no tiene ese campo. Hay dos opciones:
  - A) Rediseñar el Kanban para usar `tipoContrato` como eje de columnas (SERVICIO/LICENCIA/etc.).
  - B) Eliminar el Kanban de tratos hasta que el back agregue `estado`.
  - C) El estado del trato se gestiona localmente en el front (no sincronizado con el back).
  Esta es una **decisión de negocio que debe tomar el usuario**.

---

## 4. Impacto en specs openspec existentes

| Spec | Impacto | Razón |
|------|---------|-------|
| `prospectos-management` | **INVALIDA** | Entera basada en entidad `Prospecto` (frio/tibio/caliente) que no existe en el back. Debe reescribirse para `Contacto` con `estadoRelacion=PROSPECTO`. |
| `prospecto-conversion` | **INVALIDA** | El endpoint `POST /prospectos/:id/convertir` no existe. La conversión es `PUT /contactos/edit` con `estadoRelacion`. Toda la spec debe reescribirse. |
| `clientes-management` | **INVALIDA** | Entera basada en entidad `Cliente` que no existe en el back. Debe reescribirse como filtro de `Contacto` con `estadoRelacion=ACTIVO`. |
| `tratos-management` | **MODIFICA SUSTANCIALMENTE** | Debe eliminar `estado`, `ganar`, `perder`, `prospecto_id`/`cliente_id` (→ `contactoId`), cambiar enum `tipo_contrato`, cambiar rutas a RPC. El CRUD puede conservarse en esencia. |
| `tratos-kanban` | **INVALIDA** | Completamente basada en `estado: abierto|ganado|perdido` que no existe en el back. El Kanban tal como está especificado no tiene base. |
| `tareas-management` | **MODIFICA SUSTANCIALMENTE** | Debe cambiar enum `tipo` (llamada→GENERAL/etc.), enum `prioridad` (1/2/3→BAJA/etc.), eliminar `estado`, cambiar `completar` a edit, cambiar rutas a RPC. |

---

## 5. Riesgos y preguntas abiertas para el usuario

### Riesgos

**R1 — El Kanban de tratos queda sin fundamento.**
Es el feature más elaborado del front (ADRs 055-061, spec archivada). Si `estado` no existe en el back, el Kanban no tiene eje. Decisión de negocio pendiente.

**R2 — Todos los filtros actuales son fake (client-side o mock-only).**
El back no tiene ningún endpoint con filtros. Todos los filtros del front (por estado, responsable, empresa, vencimiento, etc.) deberán ser client-side sobre listas completas. Impacto de performance a medida que los datos crezcan.

**R3 — Enums incompatibles requieren decisión de mapeo.**
`tipo_contrato` del front (`precio_fijo|tiempo_materiales|retainer`) vs back (`SERVICIO|LICENCIA|SUSCRIPCION|PERMANENTE|OTRO`): son tres conjuntos completamente distintos. Se necesita decidir cuál prevalece o si se mapean.

**R4 — `tipo` y `prioridad` de Tarea también son enums incompatibles.**
`tipo` front (`llamada|reunion|email|demo|seguimiento`) vs back (`GENERAL|SEGUIMIENTO|NEGOCIACION|CIERRE`). `prioridad` front (1/2/3) vs back (`BAJA|MEDIA|ALTA|URGENTE`).

**R5 — El submodelo de Tablero/Columna/Ficha es un mundo aparte.**
El modelo de tablero del back (catálogo de columnas + ColumnaTablero) es fundamentalmente distinto al del front. Este recurso podría tratarse en un Change separado o pospuesto.

**R6 — `notas` en Prospecto/Cliente.**
El front tiene `notas` en prospectos y clientes. El back's `Contacto` NO tiene `notas`. ¿Se descarta la funcionalidad?

**R7 — `estado_posible_cliente` (frio/tibio/caliente).**
Es una subclasificación dentro de PROSPECTO que el back no tiene. ¿Se descarta o se pide al back que agregue un campo?

### Preguntas abiertas para el usuario (decisiones de negocio)

**P1** ¿El Kanban de tratos se rediseña (eje distinto a `estado`), se elimina, o se pospone hasta que el back agregue `estado`?

**P2** ¿El enum `tipo_contrato` del front se reemplaza por el del back (`SERVICIO|LICENCIA|SUSCRIPCION|PERMANENTE|OTRO`), o el back lo cambia para alinearse al front?

**P3** ¿Los enums de `tipo` y `prioridad` de Tarea se reemplazan por los del back, o el back los cambia?

**P4** ¿La clasificación `frio|tibio|caliente` dentro de PROSPECTO se descarta completamente, o se implementa como dato adicional (front-only)?

**P5** ¿Las `notas` de prospectos/clientes se descartan (no existen en Contacto del back)?

**P6** El modelo de Tablero/Columna/Ficha es un cambio complejo. ¿Va en el mismo proyecto de reconciliación o es un Change independiente posterior?

**P7** El back expone `/api/roles` y `/api/superusuarios`. ¿El front necesita consumirlos en algún momento? ¿O son internos del back?

---

## 6. Orden de dependencia recomendado para los 4 changes

```
A (estilo RPC + endpoints.ts)
    ↓
B (Trato: contactoId, sin estado, tipoContrato fix)
    ↓
C (Contacto unificado: eliminar prospectos/clientes)
    ↓
D (limpieza features sin respaldo)
```

**Justificación**:
- A es infraestructura: todos los otros changes emiten llamadas HTTP — tienen que estar sobre el formato correcto primero.
- B depende de A y sienta las bases de `contactoId` que C necesita (el Trato referencia a un Contacto).
- C depende de B (los tratos ya deben estar adaptados antes de refactorizar el modelo de contacto).
- D es limpieza y puede hacerse en paralelo con partes de C, pero es más seguro después de C cuando el dominio ya está estabilizado.

**Nota sobre D**: cambiar los enums de `tipo_contrato`, `tipo` de tarea, y `prioridad` pueden hacerse como parte de B y C respectivamente, o como Change D. Recomiendo hacerlos inline en B y C para no dejar código inconsistente entre changes.
