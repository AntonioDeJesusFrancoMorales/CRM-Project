# contactos-management — Delta Spec

**Capability**: contactos-management
**Change**: contacto-unificado (Change 2)
**Base spec**: ninguna (capability nueva — reemplaza prospectos-management y clientes-management)
**Delta tipo**: ADDED (capability unificada)
**Status**: proposed
**Fecha**: 2026-05-28

---

## Contexto del delta

El back AR-CRM modela una sola entidad `Contacto` con `estadoRelacion: PROSPECTO | ACTIVO | INACTIVO`. El front "Pipely" tenía dos features separadas (`prospectos/`, `clientes/`) que llamaban endpoints inexistentes (`/api/v1/prospectos`, `/api/v1/clientes`) y mantenían campos fantasma (`notas`, `estado_posible_cliente`, `prospecto_origen_id`). Este delta crea la capability `contactos-management` alineada al contrato verificado del back y marca como REMOVED las capabilities `prospectos-management` y `clientes-management`.

Cambios estructurales que este delta impone:

- Nueva feature `src/features/contactos/` reemplaza completamente `prospectos/` y `clientes/`.
- Tipo `Contacto` en `src/api/types.ts`: camelCase del back, `estadoRelacion: EstadoRelacion`, `comoNosConocio: string | null` (elimina enum `ComoNosConocio` y tipo `EstadoPosibleCliente`).
- `endpoints.contactos` en `src/api/endpoints.ts`: 5 rutas RPC identicas al patron del Change 1.
- Pagina `/contactos` con tabs por `estadoRelacion`: PROSPECTO / ACTIVO / INACTIVO; segmentacion client-side.
- Validacion de transiciones de estado completamente client-side (bug en `EditContactoService.reconstitute()` en el back — ver R1).
- `useEmpresaContactos`: reemplaza `useEmpresaProspectos` + `useEmpresaClientes`; filtro client-side por `empresaId` sobre `GET /contactos/get-all`.
- MSW reescrito con rutas RPC, PUT en edit, `id` como query param.
- Sidebar y router: "Prospectos" y "Clientes" → "Contactos".

---

## ADDED Requirements

---

### Requirement: endpoints.contactos como fuente unica de verdad de rutas

El sistema MUST centralizar todas las rutas HTTP de contactos en `src/api/endpoints.ts`. El objeto `endpoints.contactos` MUST exponer exactamente: `getAll()`, `getById(id: string)`, `create()`, `edit(id: string)`, `delete(id: string)`. Ninguna ruta de contactos MUST estar hardcodeada fuera de `endpoints.ts`; hooks, handlers MSW y tests MUST importar desde ese modulo.

#### Scenario: endpoints.contactos expone las rutas del back [unit test]

- WHEN se importa `endpoints.contactos`
- THEN `endpoints.contactos.getAll()` retorna `/contactos/get-all`
- AND `endpoints.contactos.getById('c1111111')` retorna `/contactos/get-by-id?id=c1111111`
- AND `endpoints.contactos.create()` retorna `/contactos/create`
- AND `endpoints.contactos.edit('c1111111')` retorna `/contactos/edit?id=c1111111`
- AND `endpoints.contactos.delete('c1111111')` retorna `/contactos/delete?id=c1111111`

#### Scenario: ninguna ruta literal de contactos fuera de endpoints.ts [unit test]

- WHEN se inspeccionan hooks y handlers MSW de contactos
- THEN no existe ningun string literal `/api/prospectos`, `/api/clientes`, `/api/v1/prospectos` ni `/api/v1/clientes` en esos archivos
- AND todas las rutas derivan de `endpoints.contactos`

---

### Requirement: Tipo Contacto alineado al contrato real del back

El sistema MUST definir en `src/api/types.ts` el tipo `Contacto` con los campos exactos de `ContactoResponse` del back (camelCase). MUST eliminar las interfaces `Prospecto` y `Cliente`, el tipo `ComoNosConocio` (enum), y el tipo `EstadoPosibleCliente`. El campo `comoNosConocio` MUST ser `string | null` (String libre, no enum). El campo `estadoRelacion` MUST ser `EstadoRelacion` (ya definido como `'ACTIVO' | 'INACTIVO' | 'PROSPECTO'`). Los campos `notas`, `estado_posible_cliente` y `prospecto_origen_id` MUST NOT existir en el tipo `Contacto`.

#### Scenario: tipo Contacto tiene los campos del back [unit test]

- GIVEN el modulo `src/api/types.ts`
- WHEN TypeScript compila el proyecto
- THEN existe el tipo `Contacto` con campos: `id`, `empresaId`, `nombre`, `correo?`, `estadoRelacion`, `responsableId?`, `creadoPor?`, `telefono?`, `cargo?`, `comoNosConocio?` (string | null), `creadoEn`, `actualizadoEn?`
- AND NO existen los tipos `Prospecto`, `Cliente`, `ComoNosConocio` (enum), `EstadoPosibleCliente`
- AND `Contacto` NO tiene campo `notas`, `estado_posible_cliente`, ni `prospecto_origen_id`

#### Scenario: comoNosConocio acepta string libre [unit test]

- GIVEN el schema Zod de contacto
- WHEN se parsea `{ ..., comoNosConocio: 'Recomendacion de un socio estrategico en LATAM' }`
- THEN `success === true`
- AND cuando se parsea `{ ..., comoNosConocio: 'referido' }`
- THEN `success === true` (cualquier string hasta 200 caracteres es valido)

---

### Requirement: Listado de contactos con ruta RPC

El sistema MUST consumir `GET /api/contactos/get-all` (via `endpoints.contactos.getAll()`) para obtener todos los contactos. La queryKey MUST ser `['contactos']` (plana, sin filtros). La respuesta del back es un array de `ContactoResponse` sin filtros server-side. El hook `useContactos()` MUST tipar la respuesta como `Contacto[]`.

#### Scenario: useContactos invoca GET /contactos/get-all [hook test]

- WHEN se monta `useContactos()`
- THEN se invoca `GET /api/contactos/get-all` sin query params
- AND la queryKey es `['contactos']`
- AND la respuesta se tipifica como `Contacto[]`

#### Scenario: Listado vacio muestra empty state [integration test]

- GIVEN el handler MSW retorna `[]`
- WHEN el usuario navega a `/contactos`
- THEN se muestra "No hay contactos todavia" o equivalente
- AND no se renderiza ninguna tabla

#### Scenario: Error 500 muestra boton reintentar [integration test]

- GIVEN `GET /api/contactos/get-all` responde 500
- WHEN se monta la pagina
- THEN se muestra mensaje de error con boton "Reintentar"
- AND no se renderiza la tabla

---

### Requirement: Detalle de contacto con GET /get-by-id

El sistema MUST consumir `GET /api/contactos/get-by-id?id={uuid}` (via `endpoints.contactos.getById(id)`) para la pagina de detalle `/contactos/:id`. La queryKey MUST ser `['contactos', id]`. Si el back responde 404, MUST mostrar toast de error y redirigir a `/contactos`. Los campos nulos MUST mostrarse como "—".

#### Scenario: useContacto invoca GET /contactos/get-by-id [hook test]

- WHEN se monta `useContacto('c1111111')`
- THEN se invoca `GET /api/contactos/get-by-id?id=c1111111`
- AND la queryKey es `['contactos', 'c1111111']`

#### Scenario: Pagina de detalle muestra campos del back [integration test]

- GIVEN existe contacto `c1111111` con nombre "Carlos Mendez" y `empresaId: 'e1111111'`
- WHEN el usuario navega a `/contactos/c1111111`
- THEN se muestra el nombre en el header
- AND el campo empresa muestra un link a `/empresas/e1111111`
- AND los campos nulos muestran "—"

#### Scenario: 404 redirige a lista [integration test]

- WHEN `GET /api/contactos/get-by-id?id=x` responde 404
- THEN se muestra toast de error
- AND el router navega a `/contactos`

---

### Requirement: Pagina /contactos con tabs por estadoRelacion

El sistema MUST mostrar `/contactos` con tres tabs fijas: "Prospectos" (PROSPECTO), "Activos" (ACTIVO), "Inactivos" (INACTIVO). La segmentacion MUST ser client-side sobre el array completo de `GET /contactos/get-all`. MUST NOT enviar query params de filtro al back. Cada tab muestra solo los contactos con el `estadoRelacion` correspondiente. La tabla en cada tab MUST mostrar: nombre (clickeable → `/contactos/:id`), empresa, responsable, cargo, estadoRelacion como badge.

#### Scenario: Tab PROSPECTO muestra solo prospectos [integration test]

- GIVEN el handler retorna contactos con `estadoRelacion: PROSPECTO`, `ACTIVO`, `INACTIVO`
- WHEN el usuario navega a `/contactos` (tab default: PROSPECTO)
- THEN solo se muestran los contactos con `estadoRelacion: 'PROSPECTO'`
- AND NO se emite nueva peticion HTTP al back

#### Scenario: Tab ACTIVO muestra solo activos [integration test]

- GIVEN la lista tiene contactos de los tres estados
- WHEN el usuario hace clic en la tab "Activos"
- THEN solo se muestran los contactos con `estadoRelacion: 'ACTIVO'`
- AND NO se emite nueva peticion HTTP

#### Scenario: Tab INACTIVO muestra solo inactivos [integration test]

- GIVEN la lista tiene contactos de los tres estados
- WHEN el usuario hace clic en la tab "Inactivos"
- THEN solo se muestran los contactos con `estadoRelacion: 'INACTIVO'`
- AND NO se emite nueva peticion HTTP

#### Scenario: Nombre de contacto clickeable navega al detalle [integration test]

- GIVEN la tab activa muestra un contacto con nombre "Carlos Mendez" e id `c1111111`
- WHEN el usuario hace clic en "Carlos Mendez"
- THEN el router navega a `/contactos/c1111111`

---

### Requirement: Schema Zod de contacto alineado al back

`contactoCreateSchema` MUST validar:
- `empresaId`: UUID string requerido (NotNull en back)
- `nombre`: string min 1 max 150 requerido (NotBlank + Size en back)
- `estadoRelacion`: enum `PROSPECTO | ACTIVO | INACTIVO` requerido (NotNull en back)
- `correo`: string email opcional/nullable (Email + max 150 en back)
- `responsableId`: UUID string opcional/nullable
- `creadoPor`: UUID string opcional/nullable
- `telefono`: string opcional/nullable max 50
- `cargo`: string opcional/nullable max 100
- `comoNosConocio`: string opcional/nullable max 200 (String libre — NO enum)

`contactoUpdateSchema` MUST validar los mismos campos excepto `empresaId` y `creadoPor` (inmutables — no se envian en edit segun `EditContactoRequest`).

#### Scenario: Input valido completo pasa validacion de create [unit test]

- GIVEN `{ empresaId: 'e1111111', nombre: 'Carlos Mendez', estadoRelacion: 'PROSPECTO', correo: 'carlos@example.com', telefono: '1234567890', cargo: 'CEO', comoNosConocio: 'Referido', responsableId: 'u1111111', creadoPor: 'u2222222' }`
- WHEN se ejecuta `contactoCreateSchema.safeParse(input)`
- THEN `success === true`

#### Scenario: empresaId vacio rechaza validacion de create [unit test]

- GIVEN input con `empresaId: ''` y el resto valido
- WHEN se ejecuta `contactoCreateSchema.safeParse(input)`
- THEN `success === false` con error en `empresaId`

#### Scenario: nombre mayor a 150 caracteres rechaza [unit test]

- GIVEN nombre con 151 caracteres
- WHEN se ejecuta `contactoCreateSchema.safeParse(input)`
- THEN `success === false` con error en `nombre`

#### Scenario: estadoRelacion acepta solo valores del back [unit test]

- GIVEN el schema Zod de contacto
- WHEN se parsea `{ ..., estadoRelacion: 'PROSPECTO' }`
- THEN `success === true`
- AND cuando se parsea `{ ..., estadoRelacion: 'frio' }`
- THEN `success === false` con error en `estadoRelacion`

#### Scenario: contactoUpdateSchema no tiene empresaId ni creadoPor [unit test]

- GIVEN `contactoUpdateSchema`
- WHEN se parsea un input que incluye `empresaId: 'e1111111'` y `creadoPor: 'u1'`
- THEN esos campos son ignorados (no son campos del edit)

---

### Requirement: Creacion de contacto con ruta RPC

El sistema MUST enviar `POST /api/contactos/create` (via `endpoints.contactos.create()`) con el body en camelCase segun `CreateContactoRequest`. El `estadoRelacion` inicial al crear un contacto desde la UI de prospectos MUST ser `PROSPECTO` por defecto. Tras crear exitosamente: Dialog se cierra, toast de exito, `queryKey ['contactos']` se invalida.

#### Scenario: Creacion exitosa envia payload camelCase [integration test]

- GIVEN el usuario completa nombre "Carlos Mendez", empresa, `estadoRelacion: 'PROSPECTO'`
- WHEN envia el formulario
- THEN se invoca `POST /api/contactos/create` con body en camelCase
- AND el body incluye `empresaId`, `nombre`, `estadoRelacion` (requeridos)
- AND el body NO contiene `notas`, `estado_posible_cliente`, ni `prospecto_origen_id`
- AND el handler responde 201
- AND el Dialog se cierra y se muestra toast de exito
- AND la queryKey `['contactos']` se invalida

#### Scenario: nombre vacio bloquea submit [component test]

- WHEN el usuario envia el form sin nombre
- THEN se muestra error inline "El nombre es requerido"
- AND no se invoca el backend

#### Scenario: empresaId requerido bloquea submit [component test]

- WHEN el usuario envia el form sin seleccionar empresa
- THEN se muestra error inline en el campo empresa
- AND no se invoca el backend

#### Scenario: Error 422 mapea field errors [integration test]

- WHEN el backend responde 422 con `details: [{ field: "nombre", message: "ya existe" }]`
- THEN el form muestra el error inline en el campo `nombre`
- AND el Dialog permanece abierto

---

### Requirement: Edicion de contacto con PUT y ruta RPC

El sistema MUST enviar `PUT /api/contactos/edit?id={uuid}` (via `endpoints.contactos.edit(id)` + `apiClient.put`) para editar un contacto. MUST NOT usar PATCH ni poner el id en el path. El body MUST seguir `EditContactoRequest` (sin `empresaId` ni `creadoPor`). Los valores iniciales del form se cargan desde `useContacto(id)`.

#### Scenario: Edicion exitosa invoca PUT con id como query param [integration test]

- GIVEN existe contacto `c1111111` con nombre "Carlos Mendez"
- WHEN el usuario cambia nombre a "Carlos M. Ruiz" y envia
- THEN se invoca `PUT /api/contactos/edit?id=c1111111` con `{ nombre: 'Carlos M. Ruiz', estadoRelacion: '...' }`
- AND el metodo HTTP es PUT, no PATCH
- AND NO hay `/contactos/c1111111` en la URL (id no va en el path)
- AND se invalidan `['contactos']` y `['contactos', 'c1111111']`

#### Scenario: Form prefilled carga datos actuales [component test]

- GIVEN contacto `c1111111` tiene `nombre: 'Carlos Mendez'`, `estadoRelacion: 'PROSPECTO'`, `cargo: 'CTO'`
- WHEN se abre el dialog de edicion
- THEN el campo nombre muestra "Carlos Mendez"
- AND el select de estadoRelacion muestra "PROSPECTO"
- AND el campo cargo muestra "CTO"

#### Scenario: Body de edicion no incluye empresaId ni creadoPor [hook test]

- GIVEN `useUpdateContacto` prepara el body de edicion
- WHEN se envia la mutacion
- THEN el body NO contiene el campo `empresaId` ni `creadoPor`

---

### Requirement: Eliminacion de contacto con ruta RPC

El sistema MUST enviar `DELETE /api/contactos/delete?id={uuid}` (via `endpoints.contactos.delete(id)`) tras confirmacion en AlertDialog. El id va como query param, no en el path. Respuesta 204 → remover `['contactos', id]` + invalidar `['contactos']`. Si el back responde 409 (contacto con tratos asociados), MUST mostrar toast informativo indicando que el contacto tiene tratos vinculados y no puede eliminarse.

#### Scenario: Eliminacion exitosa invoca DELETE con id como query param [integration test]

- GIVEN contacto `c1111111` existe en la lista
- WHEN el usuario hace clic en "Eliminar" y confirma
- THEN se invoca `DELETE /api/contactos/delete?id=c1111111`
- AND NO hay `/contactos/c1111111` en el path (id no va en el path)
- AND la fila desaparece de la tabla
- AND se muestra toast "Contacto eliminado"

#### Scenario: 409 muestra toast con razon [integration test]

- GIVEN el backend responde 409 (contacto tiene tratos vinculados)
- WHEN se intenta eliminar
- THEN se muestra toast de error indicando que el contacto tiene tratos asociados
- AND el contacto permanece en el sistema
- AND el AlertDialog se puede cerrar sin eliminar

#### Scenario: Cancelar no invoca DELETE [component test]

- WHEN el usuario hace clic en "Cancelar" en el AlertDialog
- THEN se cierra el dialog
- AND no se invoca `DELETE`

---

### Requirement: Validacion client-side de transiciones de estadoRelacion

El sistema MUST bloquear en UI las transiciones de estadoRelacion que el dominio del back rechazaria. El front es la unica linea de defensa mientras exista el bug de `EditContactoService.reconstitute()` (que bypasea `cambiarEstadoRelacion()` en el back). Las transiciones bloqueadas son:

- **Bloqueo 1**: No se puede cambiar `estadoRelacion` a `PROSPECTO` si el estado actual es `ACTIVO` o `INACTIVO`.
- **Bloqueo 2**: No se puede cambiar `estadoRelacion` a `INACTIVO` si el contacto tiene tratos activos (definicion: `trato.estado === 'abierto'` — conforme al tipo `EstadoTrato` del front).

La UI MUST explicar al usuario por que la opcion esta deshabilitada cuando posiciona el cursor sobre ella.

#### Scenario: Opcion PROSPECTO deshabilitada si estado actual es ACTIVO [component test]

- GIVEN el form de edicion de un contacto con `estadoRelacion: 'ACTIVO'`
- WHEN se inspecciona el select de estadoRelacion
- THEN la opcion `PROSPECTO` esta deshabilitada (disabled)
- AND al hacer hover sobre la opcion se muestra un tooltip o mensaje explicando la restriccion

#### Scenario: Opcion PROSPECTO deshabilitada si estado actual es INACTIVO [component test]

- GIVEN el form de edicion de un contacto con `estadoRelacion: 'INACTIVO'`
- WHEN se inspecciona el select de estadoRelacion
- THEN la opcion `PROSPECTO` esta deshabilitada (disabled)

#### Scenario: Opcion INACTIVO deshabilitada si el contacto tiene tratos abiertos [component test]

- GIVEN el form de edicion de un contacto con tratos donde algun `trato.estado === 'abierto'`
- WHEN se inspecciona el select de estadoRelacion
- THEN la opcion `INACTIVO` esta deshabilitada (disabled)
- AND la UI muestra explicacion de por que no se puede inactivar

#### Scenario: Opcion INACTIVO habilitada si no hay tratos abiertos [component test]

- GIVEN el form de edicion de un contacto sin tratos o cuyos tratos tienen `estado` en `'ganado'` o `'perdido'`
- WHEN se inspecciona el select de estadoRelacion
- THEN la opcion `INACTIVO` esta habilitada

#### Scenario: Cambio de PROSPECTO a ACTIVO es siempre permitido [component test]

- GIVEN el form de edicion de un contacto con `estadoRelacion: 'PROSPECTO'`
- WHEN se inspecciona el select de estadoRelacion
- THEN las opciones `ACTIVO` e `INACTIVO` estan habilitadas
- AND la opcion `PROSPECTO` (estado actual) se puede seleccionar (idempotente)

---

### Requirement: Manejo de error del back cuando se corrija el bug de transicion

Cuando el back corrija `EditContactoService` para llamar `cambiarEstadoRelacion()`, un PUT /edit con transicion invalida retornara un error 4xx con un mensaje descriptivo. El sistema MUST manejar ese caso: si el back retorna un error 4xx al intentar editar el `estadoRelacion`, MUST mostrar el mensaje de error del back al usuario via toast (sonner). El Dialog MUST permanecer abierto para que el usuario corrija la seleccion.

#### Scenario: Error 4xx al editar estadoRelacion muestra mensaje del back [integration test]

- GIVEN el back (en un futuro fix) responde 400 con `{ message: "No se puede volver a Prospecto desde el estado ACTIVO." }` al intentar PUT /edit
- WHEN el usuario intenta guardar la edicion
- THEN se muestra un toast con el texto del campo `message` de la respuesta del back
- AND el Dialog permanece abierto
- AND el usuario puede cambiar la seleccion y reintentar

---

### Requirement: Campo comoNosConocio como combobox con sugerencias

El formulario de contacto MUST incluir un combobox para `comoNosConocio` que combine una lista de sugerencias fijas con entrada de texto libre. Las sugerencias predefinidas MUST ser: Referido, Redes, Web, Evento, Otro. El campo MUST aceptar cualquier texto libre hasta 200 caracteres (maxLength del back). El tipo del campo en el schema es `string | null`. El campo es opcional.

#### Scenario: Combobox acepta sugerencia predefinida [component test]

- GIVEN el form de contacto esta abierto
- WHEN el usuario selecciona "Referido" del combobox
- THEN el campo `comoNosConocio` toma el valor `"Referido"`

#### Scenario: Combobox acepta texto libre [component test]

- GIVEN el form de contacto esta abierto
- WHEN el usuario escribe "Recomendacion en conferencia de tecnologia" en el combobox
- THEN el campo `comoNosConocio` toma ese texto exacto
- AND el schema Zod acepta el valor (string de menos de 200 caracteres)

#### Scenario: Combobox rechaza texto mayor a 200 caracteres [component test]

- GIVEN el usuario escribe 201 caracteres en el combobox de comoNosConocio
- WHEN intenta enviar el formulario
- THEN se muestra error inline indicando el limite de 200 caracteres
- AND no se invoca el backend

#### Scenario: Combobox muestra valor libre preexistente del back [component test]

- GIVEN un contacto tiene `comoNosConocio: 'Feria de startups 2025'` (texto libre no en la lista de sugerencias)
- WHEN se abre el dialog de edicion
- THEN el combobox muestra "Feria de startups 2025" en el campo de texto
- AND no genera ningun error de validacion

---

### Requirement: Conversion PROSPECTO a ACTIVO via PUT /edit

El sistema MUST ofrecer una accion "Convertir a activo" (o "Convertir a cliente") visible en la fila de tabla y en la pagina de detalle de un contacto con `estadoRelacion: 'PROSPECTO'`. Esta accion MUST enviar `PUT /api/contactos/edit?id={uuid}` con `estadoRelacion: 'ACTIVO'` (y todos los demas campos requeridos del `EditContactoRequest`). MUST NOT existir un endpoint separado de conversion. Tras exito, la cache `['contactos']` y `['contactos', id]` se invalidan y el contacto aparece en la tab "Activos".

#### Scenario: Accion "Convertir a activo" ejecuta PUT /edit con estadoRelacion ACTIVO [integration test]

- GIVEN existe un contacto `c1111111` con `estadoRelacion: 'PROSPECTO'`
- WHEN el usuario hace clic en "Convertir a activo" desde la tabla o el detalle
- THEN se invoca `PUT /api/contactos/edit?id=c1111111` con body que incluye `estadoRelacion: 'ACTIVO'`
- AND la URL no contiene un endpoint `/convertir`
- AND las queries `['contactos']` y `['contactos', 'c1111111']` se invalidan
- AND se muestra toast de exito

#### Scenario: Accion "Convertir a activo" no aparece en contactos que no son PROSPECTO [component test]

- GIVEN un contacto con `estadoRelacion: 'ACTIVO'` o `'INACTIVO'`
- WHEN se inspecciona la fila de tabla o el header del detalle
- THEN no existe el boton "Convertir a activo"

---

### Requirement: Contactos de una empresa filtrados client-side

El sistema MUST exponer `useEmpresaContactos(empresaId: string)` que retorna los contactos de esa empresa filtrando client-side sobre el array completo de `useContactos()` (queryKey `['contactos']`). MUST NOT emitir un endpoint `/empresas/:id/contactos` (ese endpoint no existe en el back). Este hook reemplaza `useEmpresaProspectos` y `useEmpresaClientes`. En el detalle de empresa, MUST existir una tab "Contactos" con sub-tabs por `estadoRelacion` (PROSPECTO / ACTIVO / INACTIVO) dentro de esa empresa.

#### Scenario: useEmpresaContactos filtra client-side por empresaId [hook test]

- GIVEN `useContactos()` retorna un array con contactos de `empresaId: 'e1111111'` y `empresaId: 'e2222222'`
- WHEN se monta `useEmpresaContactos('e1111111')`
- THEN retorna solo los contactos con `empresaId === 'e1111111'`
- AND NO se emite ninguna peticion HTTP adicional al back

#### Scenario: Tab Contactos en detalle de empresa muestra sub-tabs por estadoRelacion [integration test]

- GIVEN el usuario esta en `/empresas/e1111111`
- WHEN activa la tab "Contactos"
- THEN se muestran sub-tabs "Prospectos", "Activos", "Inactivos"
- AND cada sub-tab muestra solo los contactos de esa empresa con el estadoRelacion correspondiente

#### Scenario: useEmpresaContactos no emite GET /empresas/:id/contactos [hook test]

- WHEN se monta `useEmpresaContactos('e1111111')`
- THEN NO se emite ningun request a `/empresas/e1111111/contactos` ni similar
- AND la unica peticion es a `GET /api/contactos/get-all` (reutilizada del cache)

---

### Requirement: Routing y sidebar actualizados

El sistema MUST reemplazar las rutas `/prospectos` y `/clientes` en `src/routes/router.tsx` con `/contactos` (lista) y `/contactos/:id` (detalle). El sidebar MUST reemplazar los items "Prospectos" y "Clientes" con un unico item "Contactos" que navega a `/contactos`. SHOULD agregar redirects de `/prospectos` → `/contactos` y de `/clientes` → `/contactos` para no dejar rutas muertas (bookmarks existentes).

#### Scenario: /contactos renderiza ContactosListPage [integration test]

- WHEN el usuario navega a `/contactos`
- THEN se renderiza `ContactosListPage` con tabs por estadoRelacion
- AND NO se muestra ningun placeholder

#### Scenario: /contactos/:id renderiza ContactoDetailPage [integration test]

- GIVEN existe un contacto con id `c1111111`
- WHEN el usuario navega a `/contactos/c1111111`
- THEN se renderiza `ContactoDetailPage` con los datos del contacto

#### Scenario: Sidebar muestra item Contactos sin disabled [component test]

- WHEN se inspecciona el Sidebar
- THEN existe un NavItem "Contactos" que navega a `/contactos`
- AND no existen items "Prospectos" ni "Clientes" como items de primer nivel
- AND el item "Contactos" no tiene atributo `disabled`

---

### Requirement: Invalidacion de cache tras mutations

| Mutation | Keys a invalidar |
|---|---|
| Crear contacto | `invalidate ['contactos']` |
| Editar contacto | `invalidate ['contactos']` + `invalidate ['contactos', id]` |
| Eliminar contacto (204) | `removeQueries ['contactos', id]` + `invalidate ['contactos']` |

#### Scenario: Crear contacto invalida la lista [hook test]

- GIVEN `useCreateContacto` ejecuta `POST /api/contactos/create` con exito (201)
- WHEN la mutacion se resuelve
- THEN `queryClient.invalidateQueries({ queryKey: ['contactos'] })` se invoca

#### Scenario: Editar contacto invalida lista e individual [hook test]

- GIVEN `useUpdateContacto` ejecuta `PUT /api/contactos/edit?id=c1111111` con exito (200)
- WHEN la mutacion se resuelve
- THEN `queryClient.invalidateQueries({ queryKey: ['contactos'] })` se invoca
- AND `queryClient.invalidateQueries({ queryKey: ['contactos', 'c1111111'] })` se invoca

#### Scenario: Eliminar contacto remueve key individual [hook test]

- GIVEN `useDeleteContacto` ejecuta `DELETE /api/contactos/delete?id=c1111111` con exito (204)
- WHEN la mutacion se resuelve
- THEN `queryClient.removeQueries({ queryKey: ['contactos', 'c1111111'] })` se invoca
- AND `queryClient.invalidateQueries({ queryKey: ['contactos'] })` se invoca

---

### Requirement: Handlers MSW fieles al contrato real del back

Los handlers MSW de contactos (`src/mocks/handlers/contactos.ts`) MUST imitar exactamente el contrato del back: rutas RPC (`/api/contactos/get-all`, `/api/contactos/get-by-id?id=`, `/api/contactos/create`, `/api/contactos/edit?id=`, `/api/contactos/delete?id=`), metodo PUT en edit, id como query param en getById/edit/delete, respuesta en camelCase, sin filtrado server-side, guarda 409 en delete si tiene tratos. Las fixtures MUST usar los campos de `ContactoResponse` (camelCase, con `estadoRelacion`, sin `notas` ni `estado_posible_cliente`).

#### Scenario: Handler GET /api/contactos/get-all retorna lista sin filtrar [hook test]

- GIVEN el handler MSW registrado en `GET /api/contactos/get-all`
- WHEN `useContactos()` ejecuta la query
- THEN se intercepta la peticion
- AND la respuesta es un array con todos los items de la fixture sin filtrado
- AND los campos estan en camelCase (`empresaId`, `estadoRelacion`, `comoNosConocio`, etc.)
- AND los items NO tienen campos `notas`, `estado_posible_cliente`, ni `prospecto_origen_id`
- AND la fixture incluye contactos con los tres valores de `estadoRelacion`

#### Scenario: Handler POST /api/contactos/create retorna 201 [hook test]

- GIVEN el handler MSW en `POST /api/contactos/create`
- WHEN `useCreateContacto` envia `{ empresaId: 'e1111111', nombre: 'Nuevo', estadoRelacion: 'PROSPECTO' }`
- THEN el handler responde 201 con el contacto creado incluyendo `id` generado
- AND el body retornado tiene `estadoRelacion: 'PROSPECTO'`

#### Scenario: Handler PUT /api/contactos/edit?id= lee id del query param [hook test]

- GIVEN el handler MSW en `PUT /api/contactos/edit?id=c1111111`
- WHEN `useUpdateContacto` envia PUT con `{ nombre: 'Editado', estadoRelacion: 'ACTIVO' }`
- THEN el handler lee el id del query param `id`
- AND responde 200 con el contacto actualizado

#### Scenario: Handler DELETE /api/contactos/delete?id= responde 204 [hook test]

- GIVEN el handler MSW en `DELETE /api/contactos/delete?id=c1111111`
- AND la fixture del contacto `c1111111` no tiene tratos asociados
- WHEN `useDeleteContacto` envia DELETE
- THEN el handler responde 204

#### Scenario: Handler DELETE responde 409 si contacto tiene tratos [hook test]

- GIVEN el contacto `c1111111` tiene tratos asociados en la fixture
- WHEN `useDeleteContacto` envia DELETE para ese contacto
- THEN el handler responde 409 con `{ message: "No se puede eliminar el contacto porque tiene tratos asociados." }`

---

### Requirement: Eliminacion del Kanban frio/tibio/caliente

El sistema MUST NOT mostrar ninguna vista Kanban de prospectos segmentada por `estado_posible_cliente` (frio/tibio/caliente). Esa UX desaparece porque el campo `estado_posible_cliente` no existe en el back. La segmentacion unificada es por `estadoRelacion` (PROSPECTO/ACTIVO/INACTIVO) via tabs en la tabla.

#### Scenario: No existe ruta con Kanban de prospectos [manual smoke]

- WHEN el usuario navega a `/prospectos`
- THEN el router NO renderiza ninguna vista Kanban de prospectos
- AND el usuario es redirigido o ve la nueva lista unificada en `/contactos`

#### Scenario: No existen columnas Frio/Tibio/Caliente en la app [component test]

- WHEN se renderiza `ContactosListPage`
- THEN NO existen elementos con texto "Frio", "Tibio", "Caliente" como columnas o badges de estado
- AND NO existe ningun componente que dependa del tipo `EstadoPosibleCliente`

---

## API Contract Reference (back real — verificado)

| Metodo | Path | Descripcion |
|---|---|---|
| GET | `/api/contactos/get-all` | Lista todos los contactos; sin filtros server-side |
| GET | `/api/contactos/get-by-id?id={uuid}` | Obtiene contacto por id; id como query param |
| POST | `/api/contactos/create` | Crea contacto; `empresaId`, `nombre`, `estadoRelacion` requeridos |
| PUT | `/api/contactos/edit?id={uuid}` | Edita contacto; id como query param; sin `empresaId` ni `creadoPor` en body |
| DELETE | `/api/contactos/delete?id={uuid}` | Elimina (204) o bloquea (409 si hay tratos); id como query param |

**Payload create** (`CreateContactoRequest`): `empresaId: UUID @NotNull`, `nombre: String @NotBlank @Size(1,150)`, `estadoRelacion: EstadoRelacion @NotNull`, `correo?: String @Email @Size(max=150)`, `responsableId?: UUID`, `creadoPor?: UUID`, `telefono?: String @Size(max=50)`, `cargo?: String @Size(max=100)`, `comoNosConocio?: String @Size(max=200)`.

**Payload edit** (`EditContactoRequest`): mismos campos que create excepto sin `empresaId` (inmutable) ni `creadoPor` (siempre el creador original).

**Response** (`ContactoResponse`): `id: UUID`, `empresaId: UUID`, `nombre: String`, `correo?: String`, `estadoRelacion: EstadoRelacion`, `responsableId?: UUID`, `creadoPor?: UUID`, `telefono?: String`, `cargo?: String`, `comoNosConocio?: String`, `creadoEn: LocalDateTime`, `actualizadoEn?: LocalDateTime`.

**Enum `EstadoRelacion`**: `ACTIVO | INACTIVO | PROSPECTO`

Errores normalizados: `{ status, error, message, details? }`.

---

## Tipo TypeScript (delta a src/api/types.ts)

```ts
// ADDED
export interface Contacto {
  id: string;
  empresaId: string;            // camelCase (vs empresa_id anterior)
  nombre: string;               // camelCase (vs nombre_contacto anterior)
  correo?: string;              // camelCase (vs correo_contacto anterior)
  estadoRelacion: EstadoRelacion; // reemplaza estado_posible_cliente
  responsableId?: string;       // camelCase
  creadoPor?: string;           // camelCase
  telefono?: string;            // camelCase (vs telefono_contacto anterior)
  cargo?: string;               // camelCase (vs cargo_contacto anterior)
  comoNosConocio?: string | null; // String libre (vs enum ComoNosConocio anterior)
  creadoEn: string;
  actualizadoEn?: string;
}

// REMOVED
// export interface Prospecto { ... }
// export interface Cliente { ... }
// export type ComoNosConocio = 'referido' | 'redes_sociales' | 'busqueda' | 'evento' | 'otro';
// export type EstadoPosibleCliente = 'frio' | 'tibio' | 'caliente' | 'convertido';
```

---

## Out of Scope

- Auth y gestion de usuarios.
- Modelo `Trato` (campos `prospecto_id`/`cliente_id` se mantienen hasta el change de tratos acordado).
- Campo `notas` para contactos — no existe en el back; se elimina sin reemplazante.
- Endpoint `POST /contactos/:id/convertir` — no existe en el back; la conversion es PUT /edit.
- Paginacion y ordenamiento server-side.
- Etiquetas, comentarios, historial de cambios.
- Kanban de contactos (ninguno — el campo que lo sustentaba no existe en el back).
