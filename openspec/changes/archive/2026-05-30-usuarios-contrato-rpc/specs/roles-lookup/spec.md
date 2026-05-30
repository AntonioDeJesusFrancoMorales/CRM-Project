# roles-lookup Specification

**Capability**: roles-lookup
**Change**: usuarios-contrato-rpc (Change 7)
**Delta tipo**: NEW (no existe spec previa para esta capability)
**Status**: proposed
**Fecha**: 2026-05-30

---

## Purpose

El front consume `GET /api/roles/get-all` para obtener la lista de roles del back. Los roles se usan para: (1) poblar el `<select>` de roles en el form de crear/editar usuario, y (2) resolver `rolId → nombre` en la tabla de usuarios. El tipo `Rol` se alinea a `RolResponse` del back.

---

## Requirements

### Requirement: endpoints.ts expone la ruta de roles

El sistema MUST centralizar la ruta HTTP de roles en `src/api/endpoints.ts`. El objeto `endpoints.roles` MUST exponer al menos `getAll(): string`. Las rutas de create/edit/delete de roles MUST NOT ser consumidas desde el front en este change.

#### Scenario: endpoints.roles.getAll retorna la ruta correcta [unit test]

- WHEN se importa `endpoints.roles`
- THEN `endpoints.roles.getAll()` retorna `/roles/get-all`
- AND `endpoints.roles` NO tiene metodos `create`, `edit` ni `delete` expuestos (o si existen, no se consumen en el feature usuarios)

---

### Requirement: Tipo Rol alineado a RolResponse del back

El sistema MUST definir en `src/api/types.ts` el tipo `Rol` con los campos de `RolResponse`: `id: string`, `nombre: string`, `descripcion: string | null`, `activo: boolean`. MUST NOT usar un tipo reducido con solo `id` y `nombre`.

#### Scenario: Tipo Rol tiene exactamente los campos de RolResponse [unit test]

- GIVEN el tipo `Rol` en `src/api/types.ts`
- THEN tiene propiedades: `id`, `nombre`, `descripcion`, `activo`

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

El sistema MUST mostrar el nombre del rol en la tabla de usuarios resolviendo `usuario.rolId` contra la lista retornada por `useRoles()`. Mientras los roles no carguen, la celda MUST mostrar `rolId` o un placeholder. Si el `rolId` no se encuentra en la lista, MUST mostrar `rolId` como fallback.

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

## API Contract Reference (back real — verificado)

| Metodo | Path | Descripcion |
|--------|------|-------------|
| GET | `/api/roles/get-all` | Lista todos los roles activos e inactivos |

**Response** (`RolResponse`): `id: UUID`, `nombre: string`, `descripcion: string | null`, `activo: boolean`.

Endpoints de create/edit/delete de roles: fuera de alcance de este change.

---

## Out of Scope

- CRUD de roles (create, edit, delete): diferido a un change futuro.
- Filtro de usuarios por rol en la tabla (puede implementarse client-side con `useRoles`, pero no es requisito de este change).
- Permisos granulares por rol.
- Roles inactivos: se consume el endpoint sin filtrar por `activo`; la UI muestra todos los que retorne el back.
