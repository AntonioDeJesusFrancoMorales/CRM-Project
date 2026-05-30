# usuarios-rpc Specification

**Capability**: usuarios-rpc
**Change**: usuarios-contrato-rpc (Change 7)
**Delta tipo**: NEW (no existe spec previa para esta capability; spec legacy usuarios-management en archive queda obsoleta)
**Status**: proposed
**Fecha**: 2026-05-30

---

## Purpose

El feature `usuarios` consume el contrato RPC real de `UsuarioController` (AR-CRM) via `endpoints.ts`. Reemplaza las convenciones REST legacy (`/api/v1/usuarios`, PATCH, path params) por el patron RPC homologado (query params, PUT, rutas `/get-all`, `/create`, `/edit?id=`, `/delete?id=`). El tipo `Usuario` se alinea 100% a `UsuarioResponse`. El campo `activo` es READ-ONLY.

---

## Requirements

### Requirement: endpoints.ts como fuente unica de verdad de rutas de usuarios

El sistema MUST centralizar todas las rutas HTTP de usuarios en `src/api/endpoints.ts`. El objeto `endpoints.usuarios` MUST exponer: `getAll()`, `getById(id: string)`, `create()`, `edit(id: string)`, `delete(id: string)`. Ninguna ruta de usuarios MUST estar hardcodeada fuera de `endpoints.ts`; hooks, handlers MSW y tests MUST importar desde ese modulo.

#### Scenario: endpoints.usuarios expone las rutas RPC del back [unit test]

- WHEN se importa `endpoints.usuarios`
- THEN `endpoints.usuarios.getAll()` retorna `/usuarios/get-all`
- AND `endpoints.usuarios.getById('u1111111')` retorna `/usuarios/get-by-id?id=u1111111`
- AND `endpoints.usuarios.create()` retorna `/usuarios/create`
- AND `endpoints.usuarios.edit('u1111111')` retorna `/usuarios/edit?id=u1111111`
- AND `endpoints.usuarios.delete('u1111111')` retorna `/usuarios/delete?id=u1111111`

#### Scenario: ningun string literal de rutas legacy de usuarios fuera de endpoints.ts [unit test]

- WHEN se inspeccionan hooks y handlers MSW de usuarios
- THEN no existe ningun string literal `/api/v1/usuarios` ni `/usuarios/:id` ni `/usuarios/${id}` ni `/desactivar` en esos archivos
- AND todas las rutas derivan de `endpoints.usuarios`

---

### Requirement: Tipo Usuario alineado a UsuarioResponse del back

El sistema MUST definir en `src/api/types.ts` el tipo `Usuario` con los campos exactos de `UsuarioResponse`: `id: string`, `nombre: string`, `correo: string`, `rolId: string`, `creadoEn: string`, `activo: boolean`, `keycloakId: string | null`. MUST NOT incluir `rol_sistema`, `rol_empresa` ni `creado_en` (snake_case) en el tipo `Usuario`.

El sistema MUST definir un tipo separado `UsuarioSesion` para el authStore con los campos de sesion: `id`, `nombre`, `correo`, `rol_sistema`, `rol_empresa`. `UsuarioSesion` MUST NOT ser el mismo tipo que `Usuario`.

#### Scenario: Tipo Usuario tiene exactamente los campos del back [unit test]

- GIVEN el tipo `Usuario` en `src/api/types.ts`
- THEN tiene propiedades: `id`, `nombre`, `correo`, `rolId`, `creadoEn`, `activo`, `keycloakId`
- AND NO tiene propiedades: `rol_sistema`, `rol_empresa`, `creado_en`

#### Scenario: UsuarioSesion existe y preserva campos de auth [unit test]

- GIVEN el tipo `UsuarioSesion` en `src/api/types.ts`
- THEN tiene propiedades: `id`, `nombre`, `correo`, `rol_sistema`, `rol_empresa`
- AND NO depende del tipo `Usuario`

---

### Requirement: Listado de usuarios con ruta RPC

El sistema MUST consumir `GET /api/usuarios/get-all` via `endpoints.usuarios.getAll()` para obtener el listado. La queryKey MUST ser `['usuarios']`. La respuesta se tipifica como `Usuario[]`. `activo` se muestra como badge READ-ONLY en la tabla; no hay accion de desactivar/reactivar.

#### Scenario: useUsuarios invoca GET /usuarios/get-all [hook test]

- WHEN se monta `useUsuarios()`
- THEN se invoca `GET /api/usuarios/get-all`
- AND la queryKey es `['usuarios']`
- AND la respuesta se tipifica como `Usuario[]`

#### Scenario: Tabla muestra activo como badge read-only [integration test]

- GIVEN el handler retorna un usuario con `activo: false`
- WHEN se renderiza la tabla
- THEN la fila muestra un badge de estado "Inactivo"
- AND NO hay boton ni accion "Desactivar" ni "Reactivar" en el menu de acciones

#### Scenario: Listado vacio muestra empty state [integration test]

- GIVEN el handler retorna `[]`
- THEN se muestra "Aún no hay usuarios registrados." con boton "Crear primer usuario"

#### Scenario: Error 500 muestra boton reintentar [integration test]

- GIVEN el handler responde 500
- THEN se muestra mensaje de error con boton "Reintentar"
- AND no se renderiza la tabla

---

### Requirement: Crear usuario con ruta RPC y rolId

El sistema MUST enviar `POST /api/usuarios/create` con body segun `CreateUsuarioRequest`: `nombre` (@NotBlank max 100), `correo` (@NotBlank @Email max 120), `rolId` (@NotNull UUID), `initialPassword` (@NotBlank). El campo `keycloakId` es OPCIONAL. El schema Zod MUST validar `nombre`, `correo`, `rolId` e `initialPassword` como requeridos. MUST NOT enviar `rol_sistema`, `rol_empresa`, ni `activo`.

#### Scenario: Creacion exitosa envia body con rolId [integration test]

- GIVEN el usuario completa nombre, correo, selecciona un rol e ingresa initialPassword
- WHEN envia el formulario
- THEN se invoca `POST /api/usuarios/create` con `{ nombre, correo, rolId, initialPassword }`
- AND el body NO contiene `rol_sistema`, `rol_empresa` ni `activo`
- AND el handler responde 201
- AND el Dialog se cierra, se muestra toast de exito, y la queryKey `['usuarios']` se invalida

#### Scenario: rolId vacio bloquea submit [component test]

- WHEN el usuario no selecciona un rol e intenta enviar
- THEN se muestra error inline "El rol es requerido"
- AND no se invoca el backend

#### Scenario: initialPassword vacio bloquea submit [component test]

- WHEN el usuario no ingresa initialPassword e intenta enviar
- THEN se muestra error inline "La contrasena inicial es requerida"
- AND no se invoca el backend

#### Scenario: Error 422 mapea field errors [integration test]

- WHEN el backend responde 422 con `details: [{ field: "correo", message: "ya existe" }]`
- THEN el form muestra el error inline en el campo `correo`
- AND el Dialog permanece abierto

---

### Requirement: Editar usuario con PUT y ruta RPC

El sistema MUST enviar `PUT /api/usuarios/edit?id={uuid}` via `endpoints.usuarios.edit(id)` para editar. El body MUST seguir `EditUsuarioRequest`: `nombre`, `correo`, `rolId` (opcional, preserva existente si null), `keycloakId` (opcional). MUST NOT enviar `activo` ni `initialPassword` en el body de edicion. El hook se llama `useEditUsuario` (renombrado de `useUpdateUsuario`).

#### Scenario: Edicion exitosa invoca PUT con id como query param [integration test]

- GIVEN existe usuario `u1111111` con nombre "Carlos"
- WHEN el usuario cambia nombre a "Carlos Lopez" y envia
- THEN se invoca `PUT /api/usuarios/edit?id=u1111111` con `{ nombre: 'Carlos Lopez', correo: '...', rolId: '...' }`
- AND el metodo HTTP es PUT, no PATCH
- AND la URL NO contiene `/usuarios/u1111111` (id no va en el path)
- AND el body NO contiene `activo` ni `initialPassword`
- AND la queryKey `['usuarios']` se invalida

#### Scenario: Form prefilled carga datos actuales [component test]

- GIVEN usuario `u1111111` tiene `nombre: 'Carlos'`, `correo: 'carlos@crm.com'`, `rolId: 'rol-uuid'`
- WHEN se abre el dialog de edicion
- THEN el campo nombre muestra "Carlos"
- AND el campo correo muestra "carlos@crm.com"
- AND el select de rol muestra el nombre del rol correspondiente a `rolId`

#### Scenario: Error 422 en edicion mapea field errors [integration test]

- WHEN el backend responde 422 con `details: [{ field: "correo", message: "ya existe" }]`
- THEN el form muestra el error inline en `correo`
- AND el Dialog permanece abierto

---

### Requirement: Eliminar usuario con ruta RPC

El sistema MUST enviar `DELETE /api/usuarios/delete?id={uuid}` via `endpoints.usuarios.delete(id)` tras confirmacion en AlertDialog. Respuesta 204 → remover `['usuarios', id]` + invalidar `['usuarios']`.

#### Scenario: Eliminacion exitosa invoca DELETE con id como query param [integration test]

- GIVEN usuario `u1111111` existe en la lista
- WHEN el usuario hace clic en "Eliminar" y confirma
- THEN se invoca `DELETE /api/usuarios/delete?id=u1111111`
- AND la URL NO contiene `/usuarios/u1111111` (id no va en el path)
- AND la fila desaparece y se muestra toast "Usuario eliminado"

#### Scenario: Cancelar no invoca DELETE [component test]

- WHEN el usuario hace clic en "Cancelar" en el AlertDialog
- THEN se cierra el dialog y no se invoca `DELETE`

#### Scenario: 404 al eliminar muestra toast [integration test]

- WHEN el backend responde 404
- THEN se muestra toast "El usuario ya fue eliminado"
- AND la lista se invalida

---

### Requirement: useDesactivarUsuario eliminado

El sistema MUST NOT exponer `useDesactivarUsuario` ni ninguna mutacion de desactivar/reactivar. El endpoint `PATCH /usuarios/:id/desactivar` no existe en el back real.

#### Scenario: useDesactivarUsuario no existe en el codebase [unit test]

- WHEN se verifica la existencia del archivo `useDesactivarUsuario.ts`
- THEN el archivo NO existe en `src/features/usuarios/hooks/`
- AND no hay ninguna importacion de `useDesactivarUsuario` en el codebase

---

### Requirement: Handlers MSW fieles al contrato RPC del back

Los handlers MSW de usuarios MUST imitar el contrato real: rutas RPC, PUT en edit, id como query param en edit/delete/get-by-id, response con campos `Usuario` (rolId, creadoEn, keycloakId, activo), sin `/desactivar`. Las fixtures MUST usar el tipo `UsuarioMock` que extiende `Usuario` con campos de auth (`password`, `rol_sistema`, `rol_empresa`) solo para el mock de auth.

#### Scenario: Handler GET /api/usuarios/get-all retorna lista con campos del back [hook test]

- GIVEN el handler MSW en `GET /api/usuarios/get-all`
- WHEN `useUsuarios()` ejecuta la query
- THEN la respuesta es un array con campos `rolId`, `creadoEn`, `activo`, `keycloakId`
- AND los campos NO incluyen `rol_sistema` ni `rol_empresa` ni `creado_en`

#### Scenario: Handler POST /api/usuarios/create retorna 201 [hook test]

- GIVEN el handler MSW en `POST /api/usuarios/create`
- WHEN `useCreateUsuario` envia `{ nombre, correo, rolId, initialPassword }`
- THEN el handler responde 201 con el usuario creado (sin incluir `initialPassword` en la response)

#### Scenario: Handler PUT /api/usuarios/edit?id= retorna usuario actualizado [hook test]

- GIVEN el handler MSW en `PUT /api/usuarios/edit?id=u1111111`
- WHEN `useEditUsuario` envia PUT con nuevo nombre
- THEN el handler lee el id del query param y responde 200 con el usuario actualizado

#### Scenario: Handler DELETE /api/usuarios/delete?id= responde 204 [hook test]

- GIVEN el handler MSW en `DELETE /api/usuarios/delete?id=u1111111`
- WHEN `useDeleteUsuario` envia DELETE
- THEN el handler responde 204

---

## API Contract Reference (back real — verificado)

| Metodo | Path | Descripcion |
|--------|------|-------------|
| GET | `/api/usuarios/get-all` | Lista todos los usuarios |
| GET | `/api/usuarios/get-by-id?id={uuid}` | Obtiene usuario por id |
| POST | `/api/usuarios/create` | Crea usuario; `rolId` + `initialPassword` requeridos |
| PUT | `/api/usuarios/edit?id={uuid}` | Edita usuario; id como query param; sin `activo` |
| DELETE | `/api/usuarios/delete?id={uuid}` | Elimina (204); id como query param |

**Payload create** (`CreateUsuarioRequest`): `nombre` (@NotBlank max 100), `correo` (@NotBlank @Email max 120), `rolId` (@NotNull UUID), `initialPassword` (@NotBlank), `keycloakId?`.
**Payload edit** (`EditUsuarioRequest`): `nombre`, `correo`, `rolId?`, `keycloakId?`. Sin `activo`, sin `initialPassword`.
**Response** (`UsuarioResponse`): `id: UUID`, `nombre`, `correo`, `rolId: UUID`, `creadoEn: LocalDateTime`, `activo: boolean` (READ-ONLY), `keycloakId?: string`.

Errores normalizados: `{ status, error, message, details? }`.

---

## Out of Scope

- Desactivar/reactivar usuario (D1: el back no expone endpoint para cambiar `activo`).
- CRUD de roles desde la UI (solo se consume `get-all`; ver capability `roles-lookup`).
- Auth/login (ver `UsuarioSesion` y capability `roles-lookup` para el fixture).
- Paginacion, ordenamiento server-side.
- Cambio de password desde la UI (diferido al back real).
