# roles-management Specification (Delta)

**Capability**: roles-management
**Change**: roles-management-crud (Change 9)
**Delta tipo**: NEW (no existe spec previa para esta capability)
**Status**: implemented
**Fecha**: 2026-06-04

---

## Purpose

El CRM expone un area de **Configuracion** exclusiva para administradores donde el superusuario puede hacer CRUD completo de los roles de dominio del CRM. Los roles de dominio son entidades separadas de los roles de Keycloak; representan el nivel de acceso de un usuario dentro del CRM (por ejemplo: Administrador, Comercial).

---

## ADDED Requirements

### Requirement: endpoints.ts expone el CRUD completo de roles

El sistema MUST centralizar todas las rutas HTTP de roles en `src/api/endpoints.ts`. El objeto `endpoints.roles` MUST exponer: `getAll()`, `getById(id: string)`, `create()`, `edit(id: string)`, `delete(id: string)`. Ninguna ruta de roles MUST estar hardcodeada fuera de `endpoints.ts`.

#### Scenario: endpoints.roles expone las rutas RPC del back [unit test]

- WHEN se importa `endpoints.roles`
- THEN `endpoints.roles.getAll()` retorna `/roles/get-all`
- AND `endpoints.roles.getById('r1')` retorna `/roles/get-by-id?id=r1`
- AND `endpoints.roles.create()` retorna `/roles/create`
- AND `endpoints.roles.edit('r1')` retorna `/roles/edit?id=r1`
- AND `endpoints.roles.delete('r1')` retorna `/roles/delete?id=r1`

---

### Requirement: useRoles centralizado en features/roles con factory rolesKeys

El sistema MUST implementar `useRoles` en `src/features/roles/hooks/useRoles.ts` con un factory `rolesKeys` que provee `rolesKeys.list() === ['roles']` como queryKey compartida. Este hook MUST ser el unico `useRoles` del codebase; `src/features/usuarios/hooks/useRoles.ts` MUST NOT existir.

El factory MUST exponer: `rolesKeys.all`, `rolesKeys.list()`, `rolesKeys.detail(id: string)`.

#### Scenario: useRoles invoca GET /roles/get-all con queryKey ['roles'] [hook test]

- WHEN se monta `useRoles()`
- THEN se invoca `GET /api/roles/get-all`
- AND la queryKey es `['roles']`
- AND la respuesta se tipifica como `Rol[]`

#### Scenario: invalidar rolesKeys.list() refresca el selector de UsuarioFormDialog [integration test]

- GIVEN `useCreateRol` crea un nuevo rol exitosamente
- WHEN se invalida `rolesKeys.list()`
- THEN el componente que monta `useRoles()` en `UsuarioFormDialog` re-fetch y muestra el nuevo rol en el select

---

### Requirement: Crear rol via POST /api/roles/create

El sistema MUST enviar `POST /api/roles/create` con body `{ nombre (req, max80), descripcion? }`. El back responde 201 con `RolResponse`. El hook `useCreateRol` MUST invalidar `rolesKeys.list()` en onSuccess. El schema Zod MUST validar `nombre` como requerido (min1, max80) y `descripcion` como opcional.

#### Scenario: Creacion exitosa agrega rol a la lista [integration test]

- GIVEN el usuario completa nombre "Comercial" y deja descripcion en blanco
- WHEN envia el formulario
- THEN se invoca `POST /api/roles/create` con `{ nombre: 'Comercial', descripcion: '' }`
- AND el handler responde 201
- AND el Dialog se cierra, se muestra toast de exito, y la lista de roles se invalida

#### Scenario: nombre vacio bloquea submit [component test]

- WHEN el usuario deja nombre vacio e intenta enviar
- THEN se muestra error inline "El nombre es requerido"
- AND no se invoca el backend

#### Scenario: nombre de mas de 80 caracteres bloquea submit [component test]

- WHEN el usuario ingresa un nombre de 81 caracteres
- THEN se muestra error inline "Maximo 80 caracteres"
- AND no se invoca el backend

---

### Requirement: Editar rol via PUT /api/roles/edit?id=

El sistema MUST enviar `PUT /api/roles/edit?id={uuid}` con body `{ nombre?, descripcion? }`. El hook `useEditRol` MUST invalidar `rolesKeys.list()` y remover `rolesKeys.detail(id)` en onSuccess. El form MUST prefillarse con los datos actuales del rol.

#### Scenario: Edicion exitosa actualiza la lista [integration test]

- GIVEN existe un rol "Administrador" con id "r-admin-uuid"
- WHEN el usuario cambia el nombre a "Super Administrador" y envia
- THEN se invoca `PUT /api/roles/edit?id=r-admin-uuid` con el nombre actualizado
- AND el metodo HTTP es PUT (no PATCH)
- AND la lista de roles se invalida y muestra el nombre actualizado

#### Scenario: Form prefilled muestra datos actuales [component test]

- GIVEN un rol con nombre "Administrador" y descripcion "Acceso total"
- WHEN se abre el dialog de edicion
- THEN el campo nombre muestra "Administrador"
- AND el campo descripcion muestra "Acceso total"

---

### Requirement: Eliminar rol via DELETE /api/roles/delete?id=

El sistema MUST enviar `DELETE /api/roles/delete?id={uuid}` tras confirmacion en AlertDialog. Respuesta 204 → invalida `rolesKeys.list()` y muestra toast "Rol eliminado". Si el back responde 409 Conflict (rol con usuarios asignados) → muestra toast "Este rol tiene usuarios asignados y no puede eliminarse" y NO cierra el dialog. El hook `useDeleteRol` MUST distinguir el 409 de errores genericos.

#### Scenario: Eliminacion exitosa remueve el rol de la lista [integration test]

- GIVEN existe un rol "Visitante" sin usuarios asignados
- WHEN el usuario hace clic en "Eliminar" y confirma
- THEN se invoca `DELETE /api/roles/delete?id=` del rol
- AND la lista de roles se refresca sin "Visitante"
- AND se muestra toast "Rol eliminado"

#### Scenario: 409 muestra mensaje y no cierra el dialog [integration test]

- GIVEN el rol "Administrador" tiene usuarios asignados
- WHEN el usuario intenta eliminar "Administrador" y confirma
- THEN el back responde 409 Conflict
- AND el dialog de confirmacion permanece abierto
- AND se muestra toast "Este rol tiene usuarios asignados y no puede eliminarse"

#### Scenario: Cancelar no invoca DELETE [component test]

- WHEN el usuario hace clic en "Cancelar" en el AlertDialog
- THEN se cierra el dialog y no se invoca `DELETE`

---

### Requirement: activo es display-only, sin toggle

El sistema MUST mostrar el campo `activo` de `Rol` como badge informativo en la tabla. MUST NOT exponer ninguna accion para cambiar `activo` desde la UI. El back no provee endpoint de toggle para roles.

#### Scenario: Badge activo es read-only en la tabla [component test]

- GIVEN un rol con `activo: true` y otro con `activo: false`
- WHEN se renderiza la tabla de roles
- THEN se muestran badges de estado correspondientes
- AND NO existe boton ni menu de accion para cambiar `activo`

---

### Requirement: Area de Configuracion admin-only en Sidebar

El sistema MUST mostrar el ítem "Configuracion" (icono Settings) en el `Sidebar` exclusivamente para usuarios con `rol_sistema === 'admin'`. Usuarios con otros roles MUST NOT ver el ítem. La ruta `/configuracion` MUST estar protegida con `RoleGuard role="admin"`.

#### Scenario: Admin ve "Configuracion" en el sidebar [integration test]

- GIVEN un usuario con `rol_sistema: 'admin'` esta autenticado
- WHEN se renderiza el Sidebar
- THEN aparece el ítem "Configuracion" con icono Settings en la lista de navegacion
- AND al hacer clic navega a `/configuracion`

#### Scenario: Usuario normal no ve "Configuracion" en el sidebar [integration test]

- GIVEN un usuario con `rol_sistema: 'user'` (o cualquier rol no-admin) esta autenticado
- WHEN se renderiza el Sidebar
- THEN el ítem "Configuracion" NO aparece en la lista de navegacion

#### Scenario: Acceso directo a /configuracion redirige a usuario normal [integration test]

- GIVEN un usuario con `rol_sistema: 'user'` intenta acceder a `/configuracion` directamente
- WHEN el router evalua la ruta
- THEN `RoleGuard` redirige al usuario (al home o a /acceso-denegado)
- AND la pagina de configuracion NO se renderiza

---

### Requirement: Handler MSW con store mutable para tests de CRUD

El sistema MUST proveer un handler MSW en `src/mocks/handlers/roles.ts` que soporte el ciclo completo create/edit/delete con un store en memoria. El store MUST resetearse entre tests. El handler MUST simular la regla 409: si el `rolId` a eliminar esta referenciado en el fixture de usuarios mock, responde 409.

#### Scenario: Handler POST /api/roles/create agrega al store y responde 201 [hook test]

- GIVEN el handler MSW de roles esta activo con el store inicial
- WHEN se envia POST `/api/roles/create` con `{ nombre: 'Nuevo Rol' }`
- THEN el handler responde 201 con el rol creado (id generado)
- AND el nuevo rol aparece en el GET /get-all siguiente

#### Scenario: Handler DELETE /api/roles/delete?id= responde 409 si rol tiene usuarios [hook test]

- GIVEN el rol a eliminar tiene su id referenciado en el fixture de usuarios mock
- WHEN se envia DELETE `/api/roles/delete?id={id-con-usuarios}`
- THEN el handler responde 409 Conflict

---

## API Contract Reference (back real — verificado)

| Metodo | Path | Descripcion |
|--------|------|-------------|
| POST | `/api/roles/create` | Crea rol; nombre req max80, descripcion opt → 201 RolResponse |
| GET | `/api/roles/get-all` | Lista todos los roles → 200 RolResponse[] |
| GET | `/api/roles/get-by-id?id={uuid}` | Obtiene rol por id → 200 RolResponse |
| PUT | `/api/roles/edit?id={uuid}` | Edita rol; nombre opt max80, descripcion opt → 200 RolResponse |
| DELETE | `/api/roles/delete?id={uuid}` | Elimina rol → 204; si tiene usuarios asignados → 409 Conflict |

**Response** (`RolResponse`): `id: UUID`, `nombre: string`, `descripcion: string | null`, `activo: boolean`.

Autorizacion: cualquier JWT valido. Gate admin-only es responsabilidad del front (deuda back conocida).

---

## Out of Scope

- Toggle de `activo` (no hay endpoint en el back).
- Gate de autorizacion en el back para `/api/roles/**` (deuda back).
- Gestion de roles de Keycloak (entidades separadas).
- Asignacion de roles a usuarios (ya existe via `UsuarioFormDialog`).
- Filtro/busqueda de roles en la tabla.
- Paginacion server-side de roles.
