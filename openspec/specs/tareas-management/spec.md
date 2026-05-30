# tareas-management Specification

**Capability**: tareas-management
**Change**: contrato-endpoints-rpc (Change 1)
**Status**: implemented
**Fecha**: 2026-05-28

---

## Purpose

Provee la gestión completa de Tareas en el CRM Pipely: listado global filtrable en `/tareas`, CRUD vía diálogos, cambio de estado inline (Iniciar/Completar/Reabrir) en localStorage (no server-side), detalle en `TareaDetailPage`, y vista "Mis tareas" en el sidebar filtrada por el usuario autenticado. Toda tarea está vinculada a un `tratoId` (requerido). La spec reconcilia el contrato REST real del back: rutas RPC, enums del back (no números ni valores antiguos), `estado` client-only en localStorage, sin `estado` en el back.

---

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

### Requirement: Listado de tareas con filtros client-side

El sistema MUST mostrar `/tareas` con una tabla que consume `GET /api/tareas/get-all` (via `endpoints.tareas.getAll()`). La queryKey MUST ser `['tareas']` sin filtros en la key (el backend retorna todo, los filtros se aplican client-side). Columnas: título (clickeable → `/tareas/:id`), estado (badge, client-side desde localStorage), prioridad (badge), responsable, trato vinculado, fecha límite.

El sistema MUST ofrecer filtros **client-side** sobre la lista completa:
- Búsqueda por `titulo` (case-insensitive, estado local de página, NO en queryKey).
- Filtro por `responsable_id` (UUID, derivado de `useTareas()` de forma client-side).
- Filtro por `tratoId` (UUID, client-side).
- Filtro por `tipo` enum (`GENERAL|SEGUIMIENTO|NEGOCIACION|CIERRE`, client-side).
- Filtro por `prioridad` enum (`BAJA|MEDIA|ALTA|URGENTE`, client-side).
- Filtro por `vencimiento` (`vencidas | proximas | todas`, client-side derivado de `fechaLimite`).

MUST NOT enviar query params de filtro al back.

#### Scenario: Tabla poblada con fixture [integration test]

- GIVEN `GET /tareas/get-all` devuelve un array no vacío
- WHEN el usuario navega a `/tareas`
- THEN se renderiza una fila por tarea con todas las columnas
- AND el título de cada fila es un link

#### Scenario: Título clickeable navega al detalle [integration test]

- GIVEN la tabla muestra una tarea con `titulo: "Llamar al CTO"` e `id: 't1111111'`
- WHEN el usuario hace clic en "Llamar al CTO"
- THEN el router navega a `/tareas/t1111111`

#### Scenario: Filtro responsable_id es client-side [integration test]

- GIVEN la tabla tiene tareas con `responsableId: 'u1111111'` y `responsableId: 'u2222222'`
- WHEN el usuario selecciona responsable `u1111111`
- THEN solo se muestran tareas de ese responsable
- AND NO se emite nueva peticion HTTP al back

#### Scenario: Filtro tratoId es client-side [integration test]

- GIVEN la lista tiene tareas con `tratoId: 'd1111111'` y `tratoId: 'd2222222'`
- WHEN el componente aplica filtro `tratoId: 'd1111111'`
- THEN solo se muestran tareas con ese tratoId
- AND NO se emite nueva peticion HTTP al back

#### Scenario: Filtro por prioridad es client-side [integration test]

- GIVEN la lista tiene tareas con `prioridad: 'ALTA'` y `prioridad: 'BAJA'`
- WHEN el usuario selecciona filtro "ALTA"
- THEN solo se muestran tareas con `prioridad: 'ALTA'`
- AND NO se emite nueva peticion HTTP

#### Scenario: Filtro vencidas es client-side [integration test]

- GIVEN hoy mock = 2026-05-27 y la lista tiene tareas con fechaLimite pasada y futura
- WHEN el usuario selecciona filtro "Vencidas"
- THEN solo se muestran tareas con `fechaLimite < '2026-05-27T00:00:00'` y `estado !== 'completada'` (desde localStorage)
- AND NO se emite nueva peticion HTTP

#### Scenario: Filtro vencimiento=proximas cubre ventana de 7 días [integration test]

- GIVEN hoy mock = 2026-05-27 y filtro `vencimiento: 'proximas'`
- WHEN el componente filtra
- THEN devuelve tareas con `fechaLimite >= '2026-05-27T00:00:00'` y `fechaLimite <= '2026-06-03T23:59:59'` y `estado !== 'completada'`

#### Scenario: Búsqueda por titulo filtra client-side [integration test]

- GIVEN la tabla muestra tareas "Llamar al CTO", "Enviar propuesta", "Demo producto"
- WHEN el usuario escribe "demo" en el input de búsqueda
- THEN solo aparece la fila "Demo producto"
- AND las demás filas quedan ocultas
- AND no se emite peticion HTTP

#### Scenario: Error de servidor muestra botón reintentar [integration test]

- GIVEN `GET /api/tareas/get-all` responde 500
- THEN se muestra mensaje de error con botón "Reintentar"
- AND no se renderiza la tabla

---

### Requirement: Hook paramétrico useTareas

El sistema MUST exponer `useTareas()` (sin parámetros obligatorios) que retorna `{ data: Tarea[], isLoading, error }`. La queryKey MUST ser `['tareas']` (plana, sin filtros). El `queryFn` MUST llamar `GET /api/tareas/get-all` sin query params.

El sistema PUEDE exponer `tareasKeys` con:
- `tareasKeys.all = ['tareas']`
- `tareasKeys.list() = ['tareas']`
- `tareasKeys.detail(id) = ['tareas', id]`
- `tareasKeys.byTrato(tratoId) = ['tareas']` (alias para prefix match en invalidaciones)

#### Scenario: useTareas sin parametros invoca endpoint base [hook test]

- WHEN se monta `useTareas()`
- THEN se invoca `GET /api/tareas/get-all` sin query params
- AND la queryKey es `['tareas']`

#### Scenario: tareasKeys.byTrato retorna queryKey para prefix match [hook test]

- GIVEN `tareasKeys.byTrato('d1111111')`
- THEN retorna `['tareas']` para invalidar todas las queries de tareas

---

### Requirement: Enums de tarea alineados al back

El sistema MUST definir en `src/api/types.ts`:
- `TipoTarea = 'GENERAL' | 'SEGUIMIENTO' | 'NEGOCIACION' | 'CIERRE'` (enums del back, no `llamada|reunion|email|demo|seguimiento`)
- `PrioridadTarea = 'BAJA' | 'MEDIA' | 'ALTA' | 'URGENTE'` (enums del back, no `1|2|3` numéricos)

El schema Zod (`tareaCreateSchema`) MUST validar `tipo` contra los 4 valores del back y `prioridad` contra los 4 valores del back. Los valores anteriores MUST NOT aparecer en el schema.

#### Scenario: tipo acepta solo los valores del back [unit test]

- GIVEN el schema Zod de tarea
- WHEN se parsea `{ ..., tipo: 'GENERAL' }`
- THEN `success === true`
- AND cuando se parsea `{ ..., tipo: 'llamada' }`
- THEN `success === false` con error en `tipo`

#### Scenario: prioridad acepta solo los valores del back [unit test]

- GIVEN el schema Zod de tarea
- WHEN se parsea `{ ..., prioridad: 'ALTA' }`
- THEN `success === true`
- AND cuando se parsea `{ ..., prioridad: 2 }` (numero)
- THEN `success === false` con error en `prioridad`

---

### Requirement: fechaLimite es obligatorio y se envia como LocalDateTime

El schema Zod MUST marcar `fechaLimite` como **requerido** (no nullable, no opcional). El valor MUST enviarse al back como ISO 8601 datetime con componente de hora (ej. `"2026-05-30T00:00:00"`). Si el input del form es un date picker (sin hora), el sistema MUST concatenar `T00:00:00` antes de enviar. El form MUST mostrar error inline si `fechaLimite` no esta completo al intentar enviar.

#### Scenario: fechaLimite vacio bloquea submit [component test]

- GIVEN el usuario completa todos los campos excepto `fechaLimite`
- WHEN intenta enviar el form
- THEN se muestra error inline "La fecha limite es requerida"
- AND no se invoca el backend

#### Scenario: fechaLimite se envia con hora [hook test]

- GIVEN el usuario selecciona fecha `2026-06-15`
- WHEN `useCreateTarea` envia el body
- THEN el campo `fechaLimite` en el body tiene valor `"2026-06-15T00:00:00"` o formato equivalente ISO datetime

#### Scenario: schema Zod rechaza fechaLimite nulo [unit test]

- GIVEN `{ tratoId: 't1', responsableId: 'u1', titulo: 'X', tipo: 'GENERAL', prioridad: 'BAJA', fechaLimite: null }`
- WHEN se ejecuta `tareaCreateSchema.safeParse(input)`
- THEN `success === false` con error en `fechaLimite`

---

### Requirement: Schema Zod de tarea alineado al back

`tareaCreateSchema` MUST validar:
- `tratoId` UUID string requerido
- `responsableId` UUID string requerido
- `titulo` string min 1 max 200 requerido
- `descripcion` string opcional/nullable
- `tipo` enum `GENERAL|SEGUIMIENTO|NEGOCIACION|CIERRE` requerido
- `prioridad` enum `BAJA|MEDIA|ALTA|URGENTE` requerido
- `fechaLimite` datetime string requerido

`tareaUpdateSchema` MUST validar los mismos campos excepto `tratoId` (no se envia en edit segun `EditTareaRequest`). MUST NOT incluir campo `estado` en ninguno de los dos schemas (no existe en el back).

#### Scenario: Input valido completo pasa validacion [unit test]

- GIVEN `{ tratoId: 'd1111111', responsableId: 'u2222222', titulo: 'Llamar al CTO', tipo: 'SEGUIMIENTO', prioridad: 'ALTA', fechaLimite: '2026-06-15T00:00:00' }`
- WHEN se ejecuta `tareaCreateSchema.safeParse(input)`
- THEN `success === true`

#### Scenario: tratoId vacio rechaza validacion [unit test]

- GIVEN input con `tratoId: ''` y el resto valido
- WHEN se ejecuta `tareaCreateSchema.safeParse(input)`
- THEN `success === false` con error en `tratoId`

#### Scenario: titulo mayor a 200 caracteres rechaza [unit test]

- GIVEN titulo con 201 caracteres
- WHEN se ejecuta `tareaCreateSchema.safeParse(input)`
- THEN `success === false` con error en `titulo`

#### Scenario: tareaUpdateSchema no tiene campo tratoId [unit test]

- GIVEN `tareaUpdateSchema`
- WHEN se parsea un input que incluye `tratoId: 'd1111111'`
- THEN el campo `tratoId` es ignorado (no es un campo del edit)

---

### Requirement: Crear tarea con ruta RPC y tratoId en el body

El sistema MUST enviar `POST /api/tareas/create` (via `endpoints.tareas.create()`) con `tratoId` en el **body** (no en el path). MUST NOT invocar `/tratos/:id/tareas` (ese endpoint no existe en el back). El body MUST incluir todos los campos requeridos de `CreateTareaRequest`.

El campo `trato_id` en el form MUST comportarse según el contexto:
- Desde tab del trato → Select precargado y bloqueado (`disabled`), `tratoId` resuelto por prop `tratoIdFijo`.
- Desde `/tareas` global → Select REQUERIDO y editable, opciones de `useTratos()`.

#### Scenario: Creacion exitosa desde listado global [integration test]

- GIVEN el usuario está en `/tareas` y hace clic en "Nueva tarea"
- WHEN selecciona trato `d1111111`, completa título, responsable, tipo, prioridad, fechaLimite y envía
- THEN se invoca `POST /api/tareas/create` con body `{ tratoId: 'd1111111', ..., tipo: 'GENERAL', prioridad: 'ALTA', fechaLimite: '2026-06-15T00:00:00' }`
- AND la URL NO contiene `/tratos/d1111111/tareas`
- AND la queryKey `['tareas']` se invalida
- AND se muestra toast de éxito

#### Scenario: Form desde tab de trato bloquea Select de trato [component test]

- GIVEN `TareaForm` recibe `tratoIdFijo: 'd1111111'`
- WHEN se renderiza el form
- THEN el Select de trato muestra el nombre del trato y está `disabled`
- AND el campo `tratoId` tiene valor `'d1111111'`

#### Scenario: tratoId vacio en contexto global bloquea submit [component test]

- GIVEN `TareaForm` sin `tratoIdFijo` (contexto global)
- WHEN el usuario no selecciona trato e intenta enviar
- THEN se muestra error inline "El trato es requerido"
- AND no se invoca el backend

---

### Requirement: Editar tarea con PUT y ruta RPC

El sistema MUST enviar `PUT /api/tareas/edit?id={uuid}` (via `endpoints.tareas.edit(id)` + `apiClient.put`) para editar una tarea. MUST NOT usar PATCH. El id va como query param, no en el path. El body MUST seguir `EditTareaRequest` (sin `tratoId`, con `responsableId`, `titulo`, `descripcion?`, `tipo`, `prioridad`, `fechaLimite`). MUST NOT incluir campo `estado` en el body (no existe en el back).

El estado MUST NOT ser editable desde el form de edición (se cambia vía `TareaEstadoMenu` en localStorage).

#### Scenario: Edicion exitosa invoca PUT con id como query param [integration test]

- GIVEN existe tarea `t1111111` con titulo "Llamar al CTO"
- WHEN el usuario cambia titulo a "Llamar al CTO v2" y envia
- THEN se invoca `PUT /api/tareas/edit?id=t1111111` con el nuevo titulo
- AND el metodo HTTP es PUT, no PATCH
- AND la URL no contiene `/tareas/t1111111` (id no va en el path)
- AND las queryKeys `['tareas']` y `['tareas', 't1111111']` se invalidan

#### Scenario: Body de edicion no incluye campo estado [hook test]

- GIVEN `useUpdateTarea` prepara el body de edicion
- WHEN se envia la mutacion
- THEN el body NO contiene el campo `estado`

#### Scenario: Form de edicion no expone campo estado [component test]

- WHEN se abre el dialog de edicion de tarea
- THEN no existe ningun input, select ni radio para `estado`

#### Scenario: Form prefilled carga datos actuales [component test]

- GIVEN una tarea tiene `titulo: 'Llamar al CTO'`, `prioridad: 'ALTA'`, `tipo: 'SEGUIMIENTO'`
- WHEN se abre el dialog de edicion
- THEN el campo titulo muestra "Llamar al CTO"
- AND el select de prioridad muestra "ALTA"
- AND el select de tipo muestra "SEGUIMIENTO"

---

### Requirement: Eliminar tarea con ruta RPC

El sistema MUST enviar `DELETE /api/tareas/delete?id={uuid}` (via `endpoints.tareas.delete(id)`) tras confirmacion en AlertDialog. Respuesta 204 → remover `['tareas', id]` + invalidar `['tareas']`. El localStorage MUST limpiarse: `clearTareaEstado(id)`.

#### Scenario: Eliminacion exitosa invoca DELETE con id como query param [integration test]

- GIVEN tarea `t1111111` existe en la lista
- WHEN el usuario confirma eliminacion
- THEN se invoca `DELETE /api/tareas/delete?id=t1111111`
- AND la URL no contiene `/tareas/t1111111` (id no va en el path)
- AND se muestra toast "Tarea eliminada"

#### Scenario: Cancelar no invoca DELETE [component test]

- WHEN el usuario hace clic en "Cancelar" en el AlertDialog
- THEN se cierra el dialog
- AND no se invoca `DELETE`

---

### Requirement: Detalle de tarea con ruta RPC

El sistema MUST consumir `GET /api/tareas/get-by-id?id={uuid}` (via `endpoints.tareas.getById(id)`) para la pagina de detalle. La queryKey MUST ser `['tareas', id]`. Si el back responde 404, mostrar toast "Esta tarea no existe" y redirigir a `/tareas`. Los campos mostrados son los de `TareaResponse` (sin `estado`); `fechaCompletada` se muestra solo si tiene valor.

El estado local (desde localStorage) DEBE mostrarse también.

#### Scenario: Detalle valido muestra los campos del back [integration test]

- GIVEN existe tarea `t1111111` con `tratoId: 'd1111111'`
- WHEN el usuario navega a `/tareas/t1111111`
- THEN se invoca `GET /api/tareas/get-by-id?id=t1111111`
- AND se muestran: titulo, tipo, prioridad, responsable, trato vinculado (link a `/tratos/d1111111`), fechaLimite, creadoEn, actualizadoEn
- AND campos nulos se muestran como "—"

#### Scenario: fechaCompletada visible solo si tiene valor [component test]

- GIVEN una tarea con `fechaCompletada: null`
- WHEN se renderiza el detalle
- THEN no se muestra el campo `fechaCompletada`
- AND cuando la tarea tiene `fechaCompletada: '2026-05-20T10:00:00'`, ese valor SI se muestra

#### Scenario: 404 redirige a lista [integration test]

- WHEN `GET /api/tareas/get-by-id?id=x` responde 404
- THEN se muestra toast "Esta tarea no existe"
- AND el router navega a `/tareas`

---

### Requirement: Estado de tarea es client-only en localStorage

El back NO tiene campo `estado` en `Tarea`. El front PUEDE mantener el estado de presentacion (`pendiente | en_progreso | completada`) de cada tarea en **localStorage**, persistido por `id` de tarea bajo clave `tarea-estado-${id}`. Este estado MUST NOT enviarse al back en ninguna operacion create/edit. El estado en localStorage MUST sobrevivir recargas de pagina. Cuando una tarea es eliminada del back, el front MUST limpiar su entrada en localStorage.

#### Scenario: Estado de tarea persiste tras recarga [integration test]

- GIVEN la tarea `t1111111` tiene estado `'en_progreso'` guardado en localStorage bajo la clave `tarea-estado-t1111111`
- WHEN el usuario recarga la pagina
- THEN el badge/UI de estado sigue mostrando `en_progreso`
- AND no se emitio ninguna peticion al back para obtener el estado

#### Scenario: Estado no se envia al back en create [hook test]

- WHEN `useCreateTarea` envia `POST /api/tareas/create`
- THEN el body NO contiene el campo `estado`

#### Scenario: Estado no se envia al back en edit [hook test]

- WHEN `useUpdateTarea` envia `PUT /api/tareas/edit?id=t1111111`
- THEN el body NO contiene el campo `estado`

#### Scenario: Cambiar estado actualiza localStorage sin peticion HTTP [integration test]

- GIVEN la tarea `t1111111` tiene estado `'pendiente'` en localStorage
- WHEN el usuario selecciona "Iniciar" en el menu de estado (`TareaEstadoMenu`)
- THEN localStorage actualiza la clave `tarea-estado-t1111111` a `'en_progreso'`
- AND NO se emite ninguna peticion HTTP al back

#### Scenario: Eliminar tarea limpia su entrada en localStorage [integration test]

- GIVEN localStorage tiene `tarea-estado-t1111111 = 'en_progreso'`
- WHEN `useDeleteTarea` elimina la tarea `t1111111` con exito
- THEN localStorage ya no tiene la clave `tarea-estado-t1111111`

---

### Requirement: Cambio de estado inline (TareaEstadoMenu)

El sistema MUST ofrecer `TareaEstadoMenu` (DropdownMenu) con 3 ítems SIEMPRE visibles, disabled según estado actual (del localStorage), sin modal:
- **"Iniciar"**: actualiza localStorage a `'en_progreso'`. `disabled` si `estado !== 'pendiente'`.
- **"Completar"**: actualiza localStorage a `'completada'`. `disabled` si `estado === 'completada'`.
- **"Reabrir"**: actualiza localStorage a `'pendiente'`. `disabled` si `estado !== 'completada'`.

Reutilizado en `TareasTable` y `TareaDetailPage`.

#### Scenario: Estado pendiente habilita Iniciar y Completar [component test]

- GIVEN una tarea con `estado: 'pendiente'` en localStorage
- WHEN se inspecciona TareaEstadoMenu
- THEN "Iniciar" está habilitado
- AND "Completar" está habilitado
- AND "Reabrir" está deshabilitado

#### Scenario: Estado en_progreso habilita Completar [component test]

- GIVEN una tarea con `estado: 'en_progreso'` en localStorage
- WHEN se inspecciona TareaEstadoMenu
- THEN "Iniciar" está deshabilitado
- AND "Completar" está habilitado
- AND "Reabrir" está deshabilitado

#### Scenario: Estado completada habilita solo Reabrir [component test]

- GIVEN una tarea con `estado: 'completada'` en localStorage
- WHEN se inspecciona TareaEstadoMenu
- THEN "Iniciar" está deshabilitado
- AND "Completar" está deshabilitado
- AND "Reabrir" está habilitado

#### Scenario: Iniciar actualiza localStorage [integration test]

- GIVEN una tarea `t1111111` con `estado: 'pendiente'`
- WHEN el usuario selecciona "Iniciar"
- THEN localStorage `tarea-estado-t1111111` se actualiza a `'en_progreso'`
- AND NO se emite peticion HTTP al back

#### Scenario: Completar actualiza localStorage [integration test]

- GIVEN una tarea `t1111111` con `estado: 'en_progreso'`
- WHEN el usuario selecciona "Completar"
- THEN localStorage `tarea-estado-t1111111` se actualiza a `'completada'`

#### Scenario: Reabrir limpia completada [integration test]

- GIVEN una tarea `t1111111` con `estado: 'completada'`
- WHEN el usuario selecciona "Reabrir"
- THEN localStorage `tarea-estado-t1111111` se actualiza a `'pendiente'`

---

### Requirement: Invalidacion de cache tras mutations

| Mutation | Keys a invalidar |
|---|---|
| Crear tarea | `invalidate ['tareas']` |
| Editar tarea | `invalidate ['tareas']` + `invalidate ['tareas', id]` |
| Eliminar tarea | `removeQueries ['tareas', id]` + `invalidate ['tareas']` + limpiar localStorage |

#### Scenario: Crear tarea invalida la lista [hook test]

- GIVEN `useCreateTarea` ejecuta `POST /api/tareas/create` con exito (201)
- WHEN la mutacion se resuelve
- THEN `queryClient.invalidateQueries({ queryKey: ['tareas'] })` se invoca

#### Scenario: Eliminar tarea remueve key individual [hook test]

- GIVEN `useDeleteTarea` ejecuta `DELETE /api/tareas/delete?id=t1111111` con exito (204)
- WHEN la mutacion se resuelve
- THEN `queryClient.removeQueries({ queryKey: ['tareas', 't1111111'] })` se invoca
- AND `queryClient.invalidateQueries({ queryKey: ['tareas'] })` se invoca

---

### Requirement: Handlers MSW fieles al contrato real del back

Los handlers MSW de tareas (`src/mocks/handlers/tareas.ts`) MUST imitar exactamente el contrato del back: rutas RPC, metodo PUT en edit, id como query param en getById/edit/delete, `tratoId` en el body de create, sin `estado` en la response, `fechaLimite` en formato datetime, enums `TipoTarea`/`PrioridadTarea` del back, sin filtrado server-side. Las fixtures MUST usar los campos de `TareaResponse` (camelCase, sin `estado`).

#### Scenario: Handler GET /api/tareas/get-all retorna lista sin filtrar [hook test]

- GIVEN el handler MSW en `GET /api/tareas/get-all`
- WHEN `useTareas()` ejecuta la query
- THEN se intercepta la peticion
- AND la respuesta es un array con todos los items de la fixture sin filtrado
- AND los items NO tienen campo `estado`
- AND `fechaLimite` tiene formato datetime (ej. `'2026-06-15T00:00:00'`)
- AND `tipo` tiene valor del enum del back (ej. `'GENERAL'`)
- AND `prioridad` tiene valor del enum del back (ej. `'ALTA'`)

#### Scenario: Handler GET /api/tareas/get-by-id?id= retorna tarea por id [hook test]

- GIVEN el handler MSW en `GET /api/tareas/get-by-id?id=t1111111`
- WHEN `useTarea('t1111111')` ejecuta la query
- THEN el handler retorna la tarea correspondiente
- AND la respuesta NO tiene campo `estado`

#### Scenario: Handler POST /api/tareas/create lee tratoId del body [hook test]

- GIVEN el handler MSW en `POST /api/tareas/create`
- WHEN `useCreateTarea` envia `{ tratoId: 'd1111111', ..., tipo: 'CIERRE', prioridad: 'URGENTE', fechaLimite: '2026-06-15T00:00:00' }`
- THEN el handler lee `tratoId` del body (no del path)
- AND responde 201 con la tarea creada (sin campo `estado`)

#### Scenario: Handler PUT /api/tareas/edit?id= actualiza la tarea [hook test]

- GIVEN el handler MSW en `PUT /api/tareas/edit?id=t1111111`
- WHEN `useUpdateTarea` envia PUT con nuevo titulo
- THEN el handler lee el id del query param
- AND responde 200 con la tarea actualizada (sin campo `estado`)

#### Scenario: Handler DELETE /api/tareas/delete?id= responde 204 [hook test]

- GIVEN el handler MSW en `DELETE /api/tareas/delete?id=t1111111`
- WHEN `useDeleteTarea` envia DELETE
- THEN el handler responde 204

---

## API Contract Reference (back real — verificado)

| Metodo | Path | Descripcion |
|---|---|---|
| GET | `/api/tareas/get-all` | Lista todas las tareas; sin filtros server-side |
| GET | `/api/tareas/get-by-id?id={uuid}` | Obtiene tarea por id; id como query param |
| POST | `/api/tareas/create` | Crea tarea; `tratoId` en el body |
| PUT | `/api/tareas/edit?id={uuid}` | Edita tarea; id como query param; sin tratoId en edit |
| DELETE | `/api/tareas/delete?id={uuid}` | Elimina (204); id como query param |

**Payload create** (`CreateTareaRequest`): `tratoId: UUID @NotNull`, `responsableId: UUID @NotNull`, `titulo: String @NotBlank max 200`, `descripcion?: String`, `tipo: TipoTarea @NotNull`, `prioridad: PrioridadTarea @NotNull`, `fechaLimite: LocalDateTime @NotNull`.

**Payload edit** (`EditTareaRequest`): sin `tratoId`; mismos campos: `responsableId`, `titulo`, `descripcion?`, `tipo`, `prioridad`, `fechaLimite`.

**Response** (`TareaResponse`): `id: UUID`, `tratoId: UUID`, `responsableId: UUID`, `titulo: String`, `descripcion?: String`, `tipo: TipoTarea`, `prioridad: PrioridadTarea`, `fechaLimite: LocalDateTime`, `fechaCompletada?: LocalDateTime`, `creadoEn: LocalDateTime`, `actualizadoEn: LocalDateTime`. **Sin campo `estado`.**

**Enum `TipoTarea`**: `GENERAL | SEGUIMIENTO | NEGOCIACION | CIERRE`
**Enum `PrioridadTarea`**: `BAJA | MEDIA | ALTA | URGENTE`

Errores normalizados: `{ status, error, message, details? }`.

---

## Tipo TypeScript actualizado

```ts
// src/api/types.ts — Tarea
export type TipoTarea = 'GENERAL' | 'SEGUIMIENTO' | 'NEGOCIACION' | 'CIERRE';
export type PrioridadTarea = 'BAJA' | 'MEDIA' | 'ALTA' | 'URGENTE';

// Estado de tarea: SOLO CLIENT-SIDE (no existe en el back)
export type EstadoTareaLocal = 'pendiente' | 'en_progreso' | 'completada';

export interface Tarea {
  id: string;
  tratoId: string;         // camelCase
  responsableId: string;   // camelCase
  titulo: string;
  descripcion?: string;
  tipo: TipoTarea;         // enum del back
  prioridad: PrioridadTarea; // enum del back
  fechaLimite: string;     // LocalDateTime ISO; REQUERIDO
  fechaCompletada?: string; // LocalDateTime ISO; null si no completada
  creadoEn: string;
  actualizadoEn: string;
  // estado: EstadoTareaLocal — NO esta en Tarea; se guarda por separado en localStorage
}

// Helpers para leer/escribir estado local
// localStorage key: `tarea-estado-${id}`
// Funciones: getTareaEstado(id), setTareaEstado(id, estado), clearTareaEstado(id)
```

---

## Out of Scope

- Notificaciones/recordatorios, recurrencia de tareas.
- Kanban de tareas.
- Etiquetas/comentarios.
- Sincronizacion del estado client-only con el back (posible en change futuro si el back agrega el campo).
- Cambio masivo de estado (bulk).
