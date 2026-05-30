# usuarios-management Specification

**Capability**: usuarios-management
**Change**: usuarios-contrato-rpc (Change 7)
**Status**: implemented
**Fecha**: 2026-05-30

---

## Contexto

La spec de `usuarios-management` consolida dos capabilities del Change 7 (`usuarios-rpc` + `roles-lookup`) en una única capability canónica que sigue el patrón `{dominio}-management` del repositorio.

Cambios estructurales implementados:

- `Usuario` alineado 100% a `UsuarioResponse` del back: `id, nombre, correo, rolId, creadoEn, activo (READ-ONLY), keycloakId`.
- `UsuarioSesion` independiente (NO derivado de `Usuario`) para el authStore: conserva `rol_sistema`/`rol_empresa` para el `RoleGuard`.
- `Rol` alineado a `RolResponse`: `id, nombre, descripcion, activo`.
- Rutas RPC en `endpoints.ts`: `endpoints.usuarios.{getAll, getById, create, edit, delete}` y `endpoints.roles.getAll`.
- Métodos HTTP: GET (listado/detalle), POST (create), PUT (edit — no PATCH), DELETE. ID como query param en edit/delete/get-by-id.
- `activo` es campo READ-ONLY en el back (lo gestiona Keycloak): no hay acción de desactivar/reactivar en el front.
- `useDesactivarUsuario` eliminado del codebase (endpoint inexistente en el back).
- Feature `roles` vive dentro de `src/features/usuarios/` (D4 del design: `roles` no es feature propio — solo lectura auxiliar de `usuarios`).
- Handlers MSW reescritos con rutas RPC; fixtures usan `UsuarioMock = Usuario & { password, rol_sistema, rol_empresa }` para aislar los campos de auth del tipo canónico `Usuario`.
- `src/api/endpoints.ts` es la única fuente de verdad de rutas; hooks, handlers MSW y tests la importan.

---

## Requirements

---

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

### Requirement: endpoints.ts expone la ruta de roles

El sistema MUST centralizar la ruta HTTP de roles en `src/api/endpoints.ts`. El objeto `endpoints.roles` MUST exponer al menos `getAll(): string`. Las rutas de create/edit/delete de roles MUST NOT ser consumidas desde el front en este change.

#### Scenario: endpoints.roles.getAll retorna la ruta correcta [unit test]

- WHEN se importa `endpoints.roles`
- THEN `endpoints.roles.getAll()` retorna `/roles/get-all`
- AND `endpoints.roles` NO tiene metodos `create`, `edit` ni `delete` expuestos (o si existen, no se consumen en el feature usuarios)

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

### Requirement: Tipo Rol alineado a RolResponse del back

El sistema MUST definir en `src/api/types.ts` el tipo `Rol` con los campos de `RolResponse`: `id: string`, `nombre: string`, `descripcion: string | null`, `activo: boolean`. MUST NOT usar un tipo reducido con solo `id` y `nombre`.

#### Scenario: Tipo Rol tiene exactamente los campos de RolResponse [unit test]

- GIVEN el tipo `Rol` en `src/api/types.ts`
- THEN tiene propiedades: `id`, `nombre`, `descripcion`, `activo`

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

### Requirement: useRoles consume GET /roles/get-all

El sistema MUST implementar el hook `useRoles` en `src/features/usuarios/hooks/useRoles.ts` que consume `GET /api/roles/get-all` via `endpoints.roles.getAll()`. La queryKey MUST ser `['roles']`. La respuesta se tipifica como `Rol[]`. El hook MUST ser reutilizable por otros features que necesiten la lista de roles.

#### Scenario: useRoles invoca GET /roles/get-all [hook test]

- WHEN se monta `useRoles()`
- THEN se invoca `GET /api/roles/get-all`
- AND la queryKey es `['roles']`
- AND la respuesta se tipifica como `Rol[]`

#### Scenario: Error al cargar roles no bloquea el form [integration test]

- GIVEN el handler de roles responde 500
- WHEN se abre el dialog de crear/editar usuario
- THEN el select de roles muestra un estado de error o placeholder
- AND el rest del form es interactuable

---

### Requirement: Form de usuario muestra select de roles reales

El sistema MUST renderizar un `<select>` (o componente Select) en `UsuarioForm` poblado con los roles retornados por `useRoles()`. Cada opcion MUST mostrar `rol.nombre` como label y usar `rol.id` como valor. Mientras los roles cargan, el select MUST mostrar un estado de carga.

#### Scenario: Select de roles se popula con datos reales [integration test]

- GIVEN `useRoles()` retorna `[{ id: 'rol-admin-uuid', nombre: 'Administrador', ... }, { id: 'rol-user-uuid', nombre: 'Usuario', ... }]`
- WHEN se renderiza `UsuarioForm` en modo create
- THEN el select muestra las opciones "Administrador" y "Usuario"
- AND al seleccionar "Administrador", el valor del campo `rolId` es `'rol-admin-uuid'`

#### Scenario: Select muestra estado de carga mientras useRoles esta pendiente [component test]

- GIVEN `useRoles()` esta en estado `isLoading: true`
- WHEN se renderiza el form
- THEN el select de roles esta deshabilitado o muestra "Cargando roles..."

#### Scenario: Form en modo edit prefilled muestra el rol actual seleccionado [component test]

- GIVEN el usuario a editar tiene `rolId: 'rol-admin-uuid'` y `useRoles` retorna la lista
- WHEN se abre el dialog de edicion
- THEN el select de roles muestra "Administrador" como opcion seleccionada

---

### Requirement: Tabla de usuarios muestra nombre del rol resolviendo rolId

El sistema MUST mostrar el nombre del rol en la tabla de usuarios resolviendo `usuario.rolId` contra la lista retornada por `useRoles()` via la funcion pura `resolveRolNombre` en `src/features/usuarios/lib/rolLookup.ts`. Mientras los roles no carguen, la celda MUST mostrar `rolId` o un placeholder. Si el `rolId` no se encuentra en la lista, MUST mostrar `rolId` como fallback.

#### Scenario: Tabla muestra nombre del rol cuando roles estan cargados [integration test]

- GIVEN `useRoles()` retorna roles con `{ id: 'rol-admin-uuid', nombre: 'Administrador' }`
- AND la lista de usuarios tiene un usuario con `rolId: 'rol-admin-uuid'`
- WHEN se renderiza la tabla
- THEN la columna de rol muestra "Administrador", no el UUID

#### Scenario: Tabla muestra rolId como fallback si roles no cargaron [integration test]

- GIVEN `useRoles()` esta en estado pending
- WHEN se renderiza la tabla
- THEN la celda de rol muestra el `rolId` o un placeholder (no queda en blanco sin informacion)

#### Scenario: rolId sin match muestra fallback [component test]

- GIVEN la lista de roles NO contiene un rol con `id: 'rol-unknown-uuid'`
- AND un usuario tiene `rolId: 'rol-unknown-uuid'`
- WHEN se renderiza la fila
- THEN la celda muestra `'rol-unknown-uuid'` como texto de fallback

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

El sistema MUST enviar `PUT /api/usuarios/edit?id={uuid}` via `endpoints.usuarios.edit(id)` para editar. El body MUST seguir `EditUsuarioRequest`: `nombre`, `correo`, `rolId` (opcional, preserva existente si null), `keycloakId` (opcional). MUST NOT enviar `activo` ni `initialPassword` en el body de edicion. El hook se llama `useEditUsuario`.

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

### Requirement: Fixture y handler de roles para MSW

El sistema MUST proveer una fixture `src/mocks/fixtures/roles.ts` con al menos 2 roles mock (con campos `id`, `nombre`, `descripcion`, `activo`) y un handler MSW `src/mocks/handlers/roles.ts` que intercepte `GET /api/roles/get-all` y retorne la fixture.

#### Scenario: Handler GET /api/roles/get-all retorna lista de roles [hook test]

- GIVEN el handler MSW en `GET /api/roles/get-all`
- WHEN `useRoles()` ejecuta la query
- THEN la respuesta es un array de roles con campos `id`, `nombre`, `descripcion`, `activo`
- AND la lista tiene al menos 2 items

#### Scenario: Los UUIDs de roles en la fixture coinciden con los rolId del fixture de usuarios [unit test]

- GIVEN el fixture `roles.ts` y el fixture `usuarios.ts`
- THEN los `rolId` de los usuarios mock corresponden a `id` existentes en la fixture de roles
- AND el lookup `rolId → nombre` produce resultados validos (no fallback) para todos los usuarios mock

---

### Requirement: Login mock no se rompe tras introducir UsuarioSesion

El sistema MUST preservar el funcionamiento del handler MSW de auth (`POST /api/auth/login`) tras el cambio de tipos. El fixture `src/mocks/fixtures/usuarios.ts` MUST usar el tipo `UsuarioMock` que extiende los campos de `Usuario` con los campos de auth: `password`, `rol_sistema`, `rol_empresa`. `LoginResponse` MUST usar el tipo `UsuarioSesion` (no `Usuario`). El authStore MUST seguir retornando `rol_sistema` para el `RoleGuard`.

#### Scenario: Login mock retorna UsuarioSesion con rol_sistema [integration test]

- GIVEN el handler MSW de `POST /api/auth/login` esta activo
- WHEN se envia `{ email: 'admin@crm.com', password: 'admin123' }`
- THEN el handler retorna `{ token: '...', usuario: { id, nombre, correo, rol_sistema, rol_empresa } }`
- AND el campo `rol_sistema` esta presente en la respuesta

#### Scenario: authStore usa UsuarioSesion con rol_sistema [unit test]

- GIVEN el authStore tiene un usuario de sesion cargado
- WHEN `useAuthStore` retorna el usuario
- THEN el objeto tiene la propiedad `rol_sistema`
- AND el `RoleGuard` puede leer `rol_sistema` para decidir acceso

#### Scenario: Fixture de usuarios tiene UsuarioMock con rolId y campos de auth [unit test]

- GIVEN el fixture `src/mocks/fixtures/usuarios.ts`
- THEN los usuarios mock tienen campos: `id`, `nombre`, `correo`, `rolId`, `creadoEn`, `activo`, `keycloakId`, `password`, `rol_sistema`, `rol_empresa`
- AND los campos `password`, `rol_sistema`, `rol_empresa` son parte del tipo `UsuarioMock`, no del tipo `Usuario`

---

## API Contract Reference (back real — verificado)

| Metodo | Path | Descripcion |
|--------|------|-------------|
| GET | `/api/usuarios/get-all` | Lista todos los usuarios |
| GET | `/api/usuarios/get-by-id?id={uuid}` | Obtiene usuario por id |
| POST | `/api/usuarios/create` | Crea usuario; `rolId` + `initialPassword` requeridos |
| PUT | `/api/usuarios/edit?id={uuid}` | Edita usuario; id como query param; sin `activo` |
| DELETE | `/api/usuarios/delete?id={uuid}` | Elimina (204); id como query param |
| GET | `/api/roles/get-all` | Lista todos los roles activos e inactivos |

**Payload create** (`CreateUsuarioRequest`): `nombre` (@NotBlank max 100), `correo` (@NotBlank @Email max 120), `rolId` (@NotNull UUID), `initialPassword` (@NotBlank), `keycloakId?`.
**Payload edit** (`EditUsuarioRequest`): `nombre`, `correo`, `rolId?`, `keycloakId?`. Sin `activo`, sin `initialPassword`.
**Response** (`UsuarioResponse`): `id: UUID`, `nombre`, `correo`, `rolId: UUID`, `creadoEn: LocalDateTime`, `activo: boolean` (READ-ONLY), `keycloakId?: string`.
**Response** (`RolResponse`): `id: UUID`, `nombre: string`, `descripcion: string | null`, `activo: boolean`.

Errores normalizados: `{ status, error, message, details? }`.

---

## Tipos TypeScript (src/api/types.ts)

```ts
export interface Usuario {              // == UsuarioResponse del back
  id: string;
  nombre: string;
  correo: string;
  rolId: string;
  creadoEn: string;
  activo: boolean;                      // READ-ONLY (D1)
  keycloakId: string | null;
}

export interface UsuarioSesion {        // SOLO para auth; independiente de Usuario
  id: string;
  nombre: string;
  correo: string;
  rol_sistema: RolSistema;
  rol_empresa: string | null;
}

export interface Rol {                  // == RolResponse del back
  id: string;
  nombre: string;
  descripcion: string | null;
  activo: boolean;
}

export interface LoginResponse {
  token: string;
  usuario: UsuarioSesion;
}
```

`authStore.ts`: `export type AuthUser = UsuarioSesion;`

---

## Out of Scope

- Desactivar/reactivar usuario (D1: el back no expone endpoint para cambiar `activo`; lo gestiona Keycloak).
- CRUD de roles desde la UI (solo se consume `get-all`).
- Auth/login (ver `UsuarioSesion` y fixture `UsuarioMock`).
- Paginacion, ordenamiento server-side.
- Cambio de password desde la UI (diferido al back real).
- CRUD de roles (create, edit, delete): diferido a un change futuro.
- Filtro de usuarios por rol en la tabla (puede implementarse client-side, no es requisito de este change).
- Permisos granulares por rol.
