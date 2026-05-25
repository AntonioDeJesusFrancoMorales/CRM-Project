# tareas-management Specification

**Capability**: tareas-management
**Change**: tareas-management (Change 6b)
**Status**: proposed

## Purpose

Provee la gestión completa de Tareas en el CRM Pipely: listado global filtrable en `/tareas`, CRUD vía diálogos, cambio de estado inline (Iniciar/Completar/Reabrir) sin modal, detalle en `TareaDetailPage`, y vista "Mis tareas" en el sidebar filtrada por el usuario autenticado. `trato_id` es no-nullable: toda tarea pertenece a un trato. Sucesor de Change 6a; cierra el ciclo comercial de Tarea como entidad de primer nivel.

## Requirements

---

### Requirement: Sidebar "Mis tareas"

El sidebar MUST agregar un NavItem "Mis tareas" con icono `ClipboardList` que navega a `/tareas?responsable_id={usuario.id}` (precargando el filtro de responsable con el id del usuario autenticado, obtenido de `useAuthStore`). El item MUST NOT tener `disabled` ni badge "Próximamente".

#### Scenario: NavItem navega a /tareas con filtro de responsable [integration test]

- GIVEN el usuario autenticado tiene `id: '22222222'`
- WHEN hace clic en "Mis tareas" del sidebar
- THEN el router navega a `/tareas` con `responsable_id=22222222` en los filtros activos
- AND la tabla muestra solo tareas de ese responsable

#### Scenario: Item sin disabled [component test]

- WHEN se inspecciona el NavItem "Mis tareas"
- THEN no tiene atributo `disabled` ni overlay de deshabilitado

---

### Requirement: Routing de páginas de tareas

El sistema MUST wirear `/tareas` (lista) y `/tareas/:id` (detalle) en `src/routes/router.tsx`. NO MUST existir `/tareas/nuevo` (create es Dialog).

#### Scenario: /tareas renderiza TareasListPage [integration test]

- WHEN el usuario navega a `/tareas`
- THEN se renderiza `TareasListPage` con la tabla de tareas

#### Scenario: /tareas/:id renderiza TareaDetailPage [integration test]

- GIVEN existe una tarea con id `t1111111`
- WHEN el usuario navega a `/tareas/t1111111`
- THEN se renderiza `TareaDetailPage` con los datos de esa tarea

---

### Requirement: Listado de tareas con filtros

El sistema MUST mostrar `/tareas` con una tabla que consume `GET /api/v1/tareas`. Columnas: título (clickeable → `/tareas/:id`), estado (badge), prioridad (badge), responsable, trato vinculado, fecha límite. MUST ofrecer:
- Filtros server-side (en queryKey): `estado`, `prioridad` (1/2/3), `responsable_id`, `vencimiento` (`vencidas` | `proximas`), `trato_id`.
- Búsqueda client-side por `titulo` (case-insensitive, estado local de página, NO en queryKey).

#### Scenario: Tabla poblada con fixture [integration test]

- GIVEN `GET /tareas` devuelve un array no vacío
- WHEN el usuario navega a `/tareas`
- THEN se renderiza una fila por tarea con todas las columnas
- AND el título de cada fila es un link

#### Scenario: Título clickeable navega al detalle [integration test]

- GIVEN la tabla muestra una tarea con `titulo: "Llamar al CTO"` e `id: 't1111111'`
- WHEN el usuario hace clic en "Llamar al CTO"
- THEN el router navega a `/tareas/t1111111`

#### Scenario: Filtro estado pasa query param [hook test]

- GIVEN el filtro `estado` está seteado a `'en_progreso'`
- WHEN el hook ejecuta la query
- THEN se invoca `GET /tareas?estado=en_progreso`
- AND la queryKey es `['tareas', { estado: 'en_progreso' }]`

#### Scenario: Filtro prioridad pasa query param [hook test]

- GIVEN el filtro `prioridad` está seteado a `1`
- WHEN el hook ejecuta
- THEN se invoca `GET /tareas?prioridad=1`

#### Scenario: Filtro responsable_id pasa query param [hook test]

- GIVEN el filtro `responsable_id` está seteado a `'22222222'`
- WHEN el hook ejecuta
- THEN se invoca `GET /tareas?responsable_id=22222222`

#### Scenario: Filtro vencimiento=vencidas excluye completadas [hook test]

- GIVEN hoy mock = 2026-05-24 y filtro `vencimiento: 'vencidas'`
- WHEN el handler procesa
- THEN devuelve tareas con `fecha_limite < '2026-05-24'` y `estado !== 'completada'`
- AND NO devuelve tareas completadas aunque tengan fecha_limite pasada

#### Scenario: Filtro vencimiento=proximas cubre ventana de 7 días [hook test]

- GIVEN hoy mock = 2026-05-24 y filtro `vencimiento: 'proximas'`
- WHEN el handler procesa
- THEN devuelve tareas con `fecha_limite >= '2026-05-24'` y `fecha_limite <= '2026-05-31'` y `estado !== 'completada'`
- AND NO devuelve una tarea con `fecha_limite: '2026-06-20'`

#### Scenario: Filtro vencimiento=todas no aplica filtro adicional [hook test]

- GIVEN el Select vencimiento está en `'todas'` (default)
- WHEN el hook ejecuta
- THEN se invoca `GET /tareas` sin parámetro `vencimiento`

#### Scenario: Filtros server-side combinados [hook test]

- GIVEN filtros `{ trato_id: 'd1111111', estado: 'pendiente' }`
- WHEN el hook ejecuta
- THEN se invoca `GET /tareas?trato_id=d1111111&estado=pendiente`

#### Scenario: Búsqueda por titulo filtra client-side [integration test]

- GIVEN la tabla muestra tareas "Llamar al CTO", "Enviar propuesta", "Demo producto"
- WHEN el usuario escribe "demo" en el input de búsqueda
- THEN solo aparece la fila "Demo producto"
- AND las demás filas quedan ocultas

#### Scenario: Error de servidor muestra botón reintentar [integration test]

- GIVEN `GET /tareas` responde 500
- THEN se muestra mensaje de error con botón "Reintentar"
- AND no se renderiza la tabla

---

### Requirement: Hook paramétrico useTareas

El sistema MUST exponer `useTareas(filters?: UseTareasFilters)` con queryKey `tareasKeys.list(filters)` (`['tareas', filters ?? {}]`). MUST exponer `tareasKeys.byTrato(tratoId)` como alias de `list({ trato_id: tratoId })` para invalidaciones quirúrgicas del badge.

#### Scenario: useTareas sin filtros invoca endpoint base [hook test]

- WHEN se monta `useTareas()`
- THEN se invoca `GET /tareas` sin query params
- AND la queryKey es `['tareas', {}]`

#### Scenario: useTareas con filtros embebe params [hook test]

- WHEN se monta `useTareas({ responsable_id: '11111111', prioridad: 1 })`
- THEN se invoca `GET /tareas?responsable_id=11111111&prioridad=1`

---

### Requirement: Schema Zod de tarea

`tareaCreateSchema` MUST validar: `trato_id` string min 1 (REQUERIDO), `responsable_id` string min 1, `titulo` string min 1 max 200, `descripcion` nullable/opcional, `tipo` enum (`llamada|reunion|email|demo|seguimiento`), `prioridad` union (1|2|3), `fecha_limite` nullable/opcional. `tareaUpdateSchema` = partial + `estado` y `fecha_completada` opcionales.

#### Scenario: trato_id vacío rechaza validación [unit test]

- GIVEN un input con `trato_id: ''` y el resto válido
- WHEN se ejecuta `tareaCreateSchema.safeParse(input)`
- THEN `success === false`
- AND el error indica que `trato_id` es requerido

#### Scenario: Input completo válido pasa validación [unit test]

- GIVEN `{ trato_id: 'd1111111', responsable_id: '22222222', titulo: 'Llamar al CTO', tipo: 'llamada', prioridad: 2 }`
- WHEN se ejecuta `tareaCreateSchema.safeParse(input)`
- THEN `success === true`

#### Scenario: titulo superior a 200 caracteres rechaza [unit test]

- GIVEN `titulo` con 201 caracteres
- WHEN se ejecuta `tareaCreateSchema.safeParse(input)`
- THEN `success === false` con error en `titulo`

---

### Requirement: Crear tarea con trato requerido

El sistema MUST permitir crear una tarea vía `TareaCreateDialog` con `TareaForm`. El campo `trato_id` MUST comportarse según el contexto:
- Desde tab del trato → Select precargado y bloqueado (`disabled`), `trato_id` resuelto por prop `tratoIdFijo`.
- Desde `/tareas` global → Select REQUERIDO y editable, opciones de `useTratos()`.
Submit llama `POST /api/v1/tratos/:trato_id/tareas` (el `trato_id` va en el path, no en el body).

#### Scenario: Creación exitosa desde listado global [integration test]

- GIVEN el usuario está en `/tareas` y hace clic en "Nueva tarea"
- WHEN selecciona trato `d1111111`, completa título, responsable, tipo, prioridad y envía
- THEN se invoca `POST /tratos/d1111111/tareas`
- AND la queryKey `['tareas']` se invalida (prefix match)
- AND se muestra toast de éxito

#### Scenario: Form desde tab de trato bloquea Select de trato [component test]

- GIVEN `TareaForm` recibe `tratoIdFijo: 'd1111111'`
- WHEN se renderiza el form
- THEN el Select de trato muestra el nombre del trato y está `disabled`
- AND el campo `trato_id` tiene valor `'d1111111'`

#### Scenario: trato_id vacío en contexto global bloquea submit [component test]

- GIVEN `TareaForm` sin `tratoIdFijo` (contexto global)
- WHEN el usuario no selecciona trato e intenta enviar
- THEN se muestra error inline "El trato es requerido"
- AND no se invoca el backend

#### Scenario: Error 422 mapea field errors [integration test]

- WHEN el backend responde 422 con `details: [{ field: "titulo", message: "ya existe" }]`
- THEN el form muestra el error inline en el campo `titulo`
- AND el Dialog permanece abierto

---

### Requirement: Editar tarea

El sistema MUST permitir editar una tarea existente vía `TareaEditDialog` con form prefilled. Submit llama `PATCH /api/v1/tareas/:id`. El estado MUST NOT ser editable desde este form (se cambia vía `TareaEstadoMenu`).

#### Scenario: Edición exitosa de título [integration test]

- GIVEN el usuario está en `/tareas/t1111111` y hace clic en "Editar"
- WHEN cambia el `titulo` a "Llamar al CTO v2" y envía
- THEN se invoca `PATCH /tareas/t1111111` con el nuevo título
- AND las queries `['tareas']` y `['tareas', 't1111111']` se invalidan

#### Scenario: Form prefilled con datos actuales [component test]

- GIVEN una tarea tiene `titulo: "Llamar al CTO"`, `prioridad: 2`, `trato_id: 'd1111111'`
- WHEN se abre el `TareaEditDialog`
- THEN `titulo` muestra "Llamar al CTO", el badge de prioridad muestra "Media"

#### Scenario: Form de edición no expone campo estado [component test]

- WHEN se abre el `TareaEditDialog`
- THEN no existe ningún input para `estado`

---

### Requirement: Eliminar tarea (204)

El sistema MUST permitir eliminar una tarea tras confirmación en `TareaDeleteDialog` (AlertDialog). Submit llama `DELETE /api/v1/tareas/:id`. Respuesta 204 → redirigir a `/tareas` o cerrar dialog según contexto. La query `['tareas']` MUST ser invalidada.

#### Scenario: Eliminación exitosa desde detalle [integration test]

- GIVEN el usuario está en `/tareas/t1111111` y hace clic en "Eliminar"
- WHEN confirma y el backend responde 204
- THEN el router navega a `/tareas`
- AND se muestra toast "Tarea eliminada"
- AND `tareasKeys.detail('t1111111')` se remueve y `tareasKeys.all` se invalida

#### Scenario: Cancelar cierra dialog sin acción [component test]

- WHEN el usuario hace clic en "Cancelar" en el AlertDialog
- THEN se cierra el dialog
- AND no se invoca `DELETE`

---

### Requirement: Cambio de estado inline (TareaEstadoMenu)

El sistema MUST ofrecer `TareaEstadoMenu` (DropdownMenu) con 3 ítems SIEMPRE visibles, disabled según estado actual, sin modal:
- **"Iniciar"**: `PATCH /tareas/:id` con `estado: 'en_progreso'`. `disabled` si `estado !== 'pendiente'`.
- **"Completar"**: `PATCH /tareas/:id/completar` (auto-rellena `fecha_completada` server-side). `disabled` si `estado === 'completada'`.
- **"Reabrir"**: `PATCH /tareas/:id` con `{ estado: 'pendiente', fecha_completada: null }`. `disabled` si `estado !== 'completada'`.
Reutilizado en `TareasTable` y `TareaDetailPage`.

#### Scenario: Estado pendiente habilita solo Iniciar [component test]

- GIVEN una tarea con `estado: 'pendiente'`
- WHEN se inspecciona TareaEstadoMenu
- THEN "Iniciar" está habilitado
- AND "Completar" está habilitado
- AND "Reabrir" está deshabilitado

#### Scenario: Estado en_progreso habilita Completar [component test]

- GIVEN una tarea con `estado: 'en_progreso'`
- WHEN se inspecciona TareaEstadoMenu
- THEN "Iniciar" está deshabilitado
- AND "Completar" está habilitado
- AND "Reabrir" está deshabilitado

#### Scenario: Estado completada habilita solo Reabrir [component test]

- GIVEN una tarea con `estado: 'completada'`
- WHEN se inspecciona TareaEstadoMenu
- THEN "Iniciar" está deshabilitado
- AND "Completar" está deshabilitado
- AND "Reabrir" está habilitado

#### Scenario: Iniciar invoca PATCH con estado en_progreso [integration test]

- GIVEN una tarea `t1111111` con `estado: 'pendiente'`
- WHEN el usuario selecciona "Iniciar"
- THEN se invoca `PATCH /tareas/t1111111` con `{ estado: 'en_progreso' }`
- AND las queries `['tareas']` y `['tareas', 't1111111']` se invalidan

#### Scenario: Completar invoca endpoint /completar y rellena fecha_completada [integration test]

- GIVEN una tarea `t1111111` con `estado: 'en_progreso'`
- WHEN el usuario selecciona "Completar"
- THEN se invoca `PATCH /tareas/t1111111/completar`
- AND la tarea resultante tiene `fecha_completada` con valor no-null
- AND `estado === 'completada'`

#### Scenario: Reabrir limpia fecha_completada [integration test]

- GIVEN una tarea `t1111111` con `estado: 'completada'` y `fecha_completada: '2026-05-20'`
- WHEN el usuario selecciona "Reabrir"
- THEN se invoca `PATCH /tareas/t1111111` con `{ estado: 'pendiente', fecha_completada: null }`
- AND la tarea resultante tiene `estado: 'pendiente'` y `fecha_completada: null`

---

### Requirement: Detalle de tarea (TareaDetailPage)

El sistema MUST mostrar `/tareas/:id` con header (título, badge de estado, badge de prioridad, acciones Editar/Eliminar/TareaEstadoMenu) y campos: título, estado, prioridad, tipo, responsable, trato vinculado (link a `/tratos/:id`), descripción, fecha límite, fecha completada (solo si `estado === 'completada'`), `creado_en`, `actualizado_en`. Campos nulos MUST mostrarse como "—".

Si `GET /tareas/:id` responde 404, el sistema MUST mostrar toast "Esta tarea no existe" y redirigir a `/tareas`.

#### Scenario: Detalle válido muestra todos los campos [integration test]

- GIVEN existe la tarea `t1111111` con `trato_id: 'd1111111'`
- WHEN el usuario navega a `/tareas/t1111111`
- THEN se muestran todos los campos
- AND el trato vinculado aparece como link a `/tratos/d1111111`

#### Scenario: fecha_completada visible solo si estado=completada [component test]

- GIVEN una tarea con `estado: 'pendiente'` y `fecha_completada: null`
- WHEN se renderiza el detalle
- THEN no se muestra el campo `fecha_completada`
- AND cuando la tarea tiene `estado: 'completada'` con `fecha_completada: '2026-05-20'`, ese valor SÍ se muestra

#### Scenario: 404 redirige a lista [integration test]

- WHEN `GET /tareas/:id` responde 404
- THEN se muestra toast "Esta tarea no existe"
- AND el router navega a `/tareas`

---

### Requirement: Invalidación de cache tras mutations

El sistema MUST invalidar las query keys afectadas tras cada mutación exitosa.

| Mutation | Keys a invalidar |
|---|---|
| Crear tarea | `tareasKeys.all` (prefix match cubre lista global + lista del trato + badge) |
| Editar tarea | `tareasKeys.all` + `tareasKeys.detail(id)` |
| Eliminar (204) | `removeQueries(tareasKeys.detail(id))` + `invalidateQueries(tareasKeys.all)` |
| Completar | `tareasKeys.all` + `tareasKeys.detail(id)` |

#### Scenario: Crear tarea invalida la lista [hook test]

- GIVEN `useCreateTarea` ejecuta `POST /tratos/:id/tareas` con éxito
- WHEN la mutación se resuelve
- THEN `queryClient.invalidateQueries({ queryKey: ['tareas'] })` se invoca

#### Scenario: Eliminar tarea remueve key individual [hook test]

- GIVEN `useDeleteTarea` ejecuta `DELETE /tareas/:id` con éxito (204)
- WHEN la mutación se resuelve
- THEN `queryClient.removeQueries({ queryKey: ['tareas', id] })` y `invalidateQueries({ queryKey: ['tareas'] })` se invocan

---

## API Contract Reference

| Método | Path | Descripción |
|---|---|---|
| GET | `/api/v1/tareas` | Lista tareas; soporta `?trato_id=`, `?responsable_id=`, `?estado=`, `?prioridad=`, `?vencimiento=` |
| POST | `/api/v1/tratos/:trato_id/tareas` | Crea tarea; `trato_id` en el path |
| GET | `/api/v1/tareas/:id` | Obtiene tarea por id |
| PATCH | `/api/v1/tareas/:id` | Edita campos de la tarea (no estado directo) |
| DELETE | `/api/v1/tareas/:id` | Elimina (204) |
| PATCH | `/api/v1/tareas/:id/completar` | Transición a `completada`; auto-rellena `fecha_completada` server-side |

Errores normalizados con `{ status, error, message, details? }`.

## Out of Scope

- Notificaciones/recordatorios, recurrencia de tareas.
- Kanban (Change 7).
- Etiquetas/comentarios (Change 8+).
- Tareas sin trato (`trato_id` no-nullable).
- Cambio masivo de estado (bulk).
