# tareas-management — Delta Spec

**Capability**: tareas-management
**Change**: contrato-endpoints-rpc (Change 1)
**Base spec**: openspec/specs/tareas-management/spec.md (archivada de Change 6b)
**Delta tipo**: MODIFICA (rutas RPC, enums del back, sin estado en el back, fechaLimite obligatorio, estado client-only en localStorage, filtros client-side, MSW fiel al back)
**Status**: proposed
**Fecha**: 2026-05-27

---

## Contexto del delta

La spec base de `tareas-management` fue escrita contra un contrato REST inexistente. Este delta la reconcilia con el contrato **real** del back AR-CRM verificado en `TareaController.java`, `CreateTareaRequest.java`, `EditTareaRequest.java` y `TareaResponse.java`.

Cambios estructurales que este delta impone:
1. **Rutas RPC**: `GET /tareas/get-all`, `GET /tareas/get-by-id?id=`, `POST /tareas/create`, `PUT /tareas/edit?id=`, `DELETE /tareas/delete?id=`. El `tratoId` va en el **body** de create (no en el path). No existe `/tratos/:id/tareas`.
2. **Metodo PUT en edicion** (el back usa `@PutMapping`); eliminar uso de PATCH para tareas.
3. **Enums del back**: `tipo` = `GENERAL|SEGUIMIENTO|NEGOCIACION|CIERRE` (reemplaza `llamada|reunion|email|demo|seguimiento`); `prioridad` = `BAJA|MEDIA|ALTA|URGENTE` (reemplaza numericos `1|2|3`).
4. **Sin `estado` en el back**: el tipo `Tarea` del back NO tiene campo `estado`. `fechaCompletada: LocalDateTime | null` es el unico indicador de completion.
5. **`estado` de tarea = client-only en localStorage**: el front PUEDE mantener `estado` (`pendiente | en_progreso | completada`) como capa de presentacion local, persistida en localStorage por id de tarea, sin enviarlo al back en create/edit.
6. **`fechaLimite` obligatorio con hora**: es `LocalDateTime @NotNull` en create Y edit. El front DEBE enviarlo como ISO datetime (ej. `2026-05-30T00:00:00`); el campo no puede ser nulo.
7. **`tratoId` y `responsableId` son UUID requeridos** en create; `tratoId` no va en edit.
8. **Filtros 100% client-side**: el back no filtra; `useTareas` recibe la lista completa y la pagina filtra localmente.
9. **Sin endpoint `completar`**: no existe `PATCH /tareas/:id/completar`. Completar una tarea se hace actualizando el estado client-only en localStorage.
10. **MSW reescrito** para imitar el contrato real.

---

## Requirements

---

### Requirement: endpoints.ts como fuente unica de verdad de rutas de tareas

El sistema MUST centralizar todas las rutas HTTP de tareas en `src/api/endpoints.ts`. El objeto `endpoints.tareas` MUST exponer: `getAll()`, `getById(id: string)`, `create()`, `edit(id: string)`, `delete(id: string)`. Ninguna ruta de tareas MUST estar hardcodeada fuera de `endpoints.ts`; hooks, handlers MSW y tests MUST importar desde ese modulo.

#### Scenario: endpoints.tareas expone las rutas RPC del back [unit test]

- WHEN se importa `endpoints.tareas`
- THEN `endpoints.tareas.getAll()` retorna `/tareas/get-all`
- AND `endpoints.tareas.getById('t1111111')` retorna `/tareas/get-by-id?id=t1111111`
- AND `endpoints.tareas.create()` retorna `/tareas/create`
- AND `endpoints.tareas.edit('t1111111')` retorna `/tareas/edit?id=t1111111`
- AND `endpoints.tareas.delete('t1111111')` retorna `/tareas/delete?id=t1111111`

#### Scenario: ninguna ruta literal de tareas fuera de endpoints.ts [unit test]

- WHEN se inspeccionan hooks y handlers MSW de tareas
- THEN no existe ningun string literal `/api/v1/tareas` ni `/tratos/${trato_id}/tareas` ni `/tareas/:id` en esos archivos
- AND todas las rutas derivan de `endpoints.tareas`

---

### Requirement: Enums de tarea alineados al back

El sistema MUST definir en `src/api/types.ts`:
- `TipoTarea = 'GENERAL' | 'SEGUIMIENTO' | 'NEGOCIACION' | 'CIERRE'`
- `PrioridadTarea = 'BAJA' | 'MEDIA' | 'ALTA' | 'URGENTE'`

El schema Zod (`tareaCreateSchema`) MUST validar `tipo` contra los 4 valores del back y `prioridad` contra los 4 valores del back. Los valores anteriores (`llamada|reunion|email|demo|seguimiento` y `1|2|3`) MUST NOT aparecer en el schema ni en los tipos.

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

#### Scenario: los valores de prioridad se muestran como labels en la UI [component test]

- GIVEN una tarea con `prioridad: 'URGENTE'`
- WHEN se renderiza el badge de prioridad
- THEN muestra el texto "URGENTE" (o su etiqueta en espanol si la UI hace mapeo)

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
- AND NO es `"2026-06-15"` (date-only, lo cual rechazaria el back)

#### Scenario: schema Zod rechaza fechaLimite nulo [unit test]

- GIVEN `{ tratoId: 't1', responsableId: 'u1', titulo: 'X', tipo: 'GENERAL', prioridad: 'BAJA', fechaLimite: null }`
- WHEN se ejecuta `tareaCreateSchema.safeParse(input)`
- THEN `success === false` con error en `fechaLimite`

---

### Requirement: Schema Zod de tarea alineado al back

`tareaCreateSchema` MUST validar: `tratoId` UUID string requerido, `responsableId` UUID string requerido, `titulo` string min 1 max 200 requerido, `descripcion` string opcional/nullable, `tipo` enum `GENERAL|SEGUIMIENTO|NEGOCIACION|CIERRE` requerido, `prioridad` enum `BAJA|MEDIA|ALTA|URGENTE` requerido, `fechaLimite` datetime string requerido.

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
- THEN el campo `tratoId` es ignorado o el schema no lo valida (no es un campo del edit)

---

### Requirement: Listado de tareas con ruta RPC y filtros client-side

El sistema MUST consumir `GET /api/tareas/get-all` (via `endpoints.tareas.getAll()`) para obtener todas las tareas. MUST NOT enviar query params de filtro al back. Los filtros (`responsableId`, `tratoId`, `tipo`, `prioridad`, `vencimiento`) MUST aplicarse client-side sobre el array completo. La queryKey MUST ser `['tareas']` (sin filtros en la key, ya que la lista completa siempre se obtiene). La columna `titulo` MUST ser clickeable y navegar a `/tareas/:id`.

#### Scenario: useTareas invoca GET /tareas/get-all sin query params [hook test]

- WHEN se monta `useTareas()`
- THEN se invoca `GET /api/tareas/get-all`
- AND la URL no tiene query params de filtro
- AND la queryKey es `['tareas']`

#### Scenario: Filtro por tratoId es client-side [integration test]

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
- THEN solo se muestran tareas con `fechaLimite < '2026-05-27T00:00:00'`
- AND NO se emite nueva peticion HTTP

#### Scenario: Busqueda por titulo es client-side [integration test]

- GIVEN la tabla muestra tareas "Llamar al CTO", "Enviar propuesta", "Demo producto"
- WHEN el usuario escribe "demo" en el input de busqueda
- THEN solo aparece la fila "Demo producto"
- AND NO se emite nueva peticion HTTP

#### Scenario: Titulo clickeable navega al detalle [integration test]

- GIVEN la tabla muestra una tarea con `titulo: "Llamar al CTO"` e `id: 't1111111'`
- WHEN el usuario hace clic en "Llamar al CTO"
- THEN el router navega a `/tareas/t1111111`

#### Scenario: Error 500 muestra boton reintentar [integration test]

- GIVEN el handler responde 500
- THEN se muestra mensaje de error con boton "Reintentar"
- AND no se renderiza la tabla

---

### Requirement: Crear tarea con ruta RPC y tratoId en el body

El sistema MUST enviar `POST /api/tareas/create` con `tratoId` en el **body** (no en el path). MUST NOT invocar `/tratos/:id/tareas` (ese endpoint no existe en el back). El body MUST incluir todos los campos requeridos de `CreateTareaRequest`.

#### Scenario: Creacion exitosa envia tratoId en el body [integration test]

- GIVEN el usuario selecciona trato `d1111111`, completa titulo, tipo `GENERAL`, prioridad `ALTA`, fechaLimite `2026-06-15T00:00:00`, responsableId `u2222222`
- WHEN envia el formulario
- THEN se invoca `POST /api/tareas/create` con body `{ tratoId: 'd1111111', responsableId: 'u2222222', titulo: '...', tipo: 'GENERAL', prioridad: 'ALTA', fechaLimite: '2026-06-15T00:00:00' }`
- AND la URL NO contiene `/tratos/d1111111/tareas`
- AND el handler responde 201
- AND la queryKey `['tareas']` se invalida
- AND se muestra toast de exito

#### Scenario: Form desde tab de trato bloquea Select de trato [component test]

- GIVEN `TareaForm` recibe `tratoIdFijo: 'd1111111'`
- WHEN se renderiza el form
- THEN el campo de trato muestra el nombre del trato y esta `disabled`
- AND el body que se envia incluye `tratoId: 'd1111111'`

#### Scenario: tratoId vacio en contexto global bloquea submit [component test]

- GIVEN `TareaForm` sin `tratoIdFijo`
- WHEN el usuario no selecciona trato e intenta enviar
- THEN se muestra error inline "El trato es requerido"
- AND no se invoca el backend

#### Scenario: Error 422 mapea field errors [integration test]

- WHEN el backend responde 422 con `details: [{ field: "titulo", message: "ya existe" }]`
- THEN el form muestra el error inline en el campo `titulo`
- AND el Dialog permanece abierto

---

### Requirement: Editar tarea con PUT y ruta RPC

El sistema MUST enviar `PUT /api/tareas/edit?id={uuid}` (via `endpoints.tareas.edit(id)` + `apiClient.put`) para editar una tarea. MUST NOT usar PATCH. El id va como query param, no en el path. El body MUST seguir `EditTareaRequest` (sin `tratoId`, con `responsableId`, `titulo`, `descripcion?`, `tipo`, `prioridad`, `fechaLimite`). MUST NOT incluir campo `estado` en el body (no existe en el back).

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
- AND si el form tenia `estado` en algun estado interno, ese valor NO se serializa al back

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

El sistema MUST enviar `DELETE /api/tareas/delete?id={uuid}` (via `endpoints.tareas.delete(id)`) tras confirmacion en AlertDialog. Respuesta 204 → remover `['tareas', id]` + invalidar `['tareas']`.

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

El back NO tiene campo `estado` en `Tarea`. El front PUEDE mantener el estado de presentacion (`pendiente | en_progreso | completada`) de cada tarea en **localStorage**, persistido por `id` de tarea. Este estado MUST NOT enviarse al back en ninguna operacion create/edit. El estado en localStorage MUST sobrevivir recargas de pagina. Cuando una tarea es eliminada del back, el front MUST limpiar su entrada en localStorage.

#### Scenario: Estado de tarea persiste tras recarga [integration test]

- GIVEN la tarea `t1111111` tiene estado `'en_progreso'` guardado en localStorage bajo la clave `tarea-estado-t1111111`
- WHEN el usuario recarga la pagina
- THEN el badge/UI de estado sigue mostrando `en_progreso`
- AND no se emitio ninguna peticion al back para obtener el estado

#### Scenario: Estado no se envia al back en create [hook test]

- GIVEN el usuario ha seleccionado estado `'en_progreso'` en la UI (si aplica)
- WHEN `useCreateTarea` envia `POST /api/tareas/create`
- THEN el body NO contiene el campo `estado`

#### Scenario: Estado no se envia al back en edit [hook test]

- GIVEN la tarea tiene estado client-only `'en_progreso'` en localStorage
- WHEN `useUpdateTarea` envia `PUT /api/tareas/edit?id=t1111111`
- THEN el body NO contiene el campo `estado`

#### Scenario: Cambiar estado actualiza localStorage sin peticion HTTP [integration test]

- GIVEN la tarea `t1111111` tiene estado `'pendiente'`
- WHEN el usuario selecciona "Iniciar" en el menu de estado
- THEN localStorage actualiza la clave `tarea-estado-t1111111` a `'en_progreso'`
- AND NO se emite ninguna peticion HTTP al back

#### Scenario: Eliminar tarea limpia su entrada en localStorage [integration test]

- GIVEN localStorage tiene `tarea-estado-t1111111 = 'en_progreso'`
- WHEN `useDeleteTarea` elimina la tarea `t1111111` con exito
- THEN localStorage ya no tiene la clave `tarea-estado-t1111111`

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

#### Scenario: Handler GET /api/tareas/get-by-id?id= retorna tarea por id [hook test]

- GIVEN el handler MSW en `GET /api/tareas/get-by-id?id=t1111111`
- WHEN `useTarea('t1111111')` ejecuta la query
- THEN el handler retorna la tarea correspondiente
- AND la respuesta NO tiene campo `estado`

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
// src/api/types.ts — Tarea (delta)
export type TipoTarea = 'GENERAL' | 'SEGUIMIENTO' | 'NEGOCIACION' | 'CIERRE';
export type PrioridadTarea = 'BAJA' | 'MEDIA' | 'ALTA' | 'URGENTE';

// Estado de tarea: SOLO CLIENT-SIDE (no existe en el back)
export type EstadoTareaLocal = 'pendiente' | 'en_progreso' | 'completada';

export interface Tarea {
  id: string;
  tratoId: string;         // camelCase (antes: trato_id)
  responsableId: string;   // camelCase
  titulo: string;
  descripcion?: string;
  tipo: TipoTarea;         // enum del back (antes: 'llamada'|'reunion'|...)
  prioridad: PrioridadTarea; // enum del back (antes: 1|2|3)
  fechaLimite: string;     // LocalDateTime ISO; REQUERIDO (antes: nullable)
  fechaCompletada?: string; // LocalDateTime ISO; null si no completada
  creadoEn: string;
  actualizadoEn: string;
  // estado: EstadoTareaLocal — NO esta en Tarea; se guarda por separado en localStorage
}

// Helper para leer/escribir estado local
// localStorage key: `tarea-estado-${id}`
```

---

## Out of Scope (este delta)

- Endpoint `completar` (`PATCH /tareas/:id/completar`) — no existe en el back.
- Campo `estado` en el tipo `Tarea` del back — no existe.
- Notificaciones/recordatorios, recurrencia.
- Kanban de tareas.
- Etiquetas/comentarios.
- Sincronizacion del estado client-only con el back (posible en un change futuro si el back agrega el campo).
- Paginas de perfil del responsable o del trato desde la vista de tarea.
- Cambio masivo de estado (bulk).
