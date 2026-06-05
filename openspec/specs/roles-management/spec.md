# roles-management Specification

**Capability**: roles-management
**Change**: roles-management-crud (Change 9)
**Status**: implemented
**Fecha**: 2026-06-04

---

## Contexto

La spec de `roles-management` cubre el CRUD completo de roles de dominio del CRM y el area de **Configuracion** admin-only introducidos en el Change 9.

Cambios estructurales implementados:

- `endpoints.roles` ampliado con `getById`, `create`, `edit`, `delete` (ademas del `getAll` del Change 7).
- `useRoles` centralizado en `src/features/roles/hooks/useRoles.ts` con factory `rolesKeys`. Migrado desde `src/features/usuarios/hooks/useRoles.ts` (eliminado). La factory garantiza `rolesKeys.list() === ['roles']` compartida, evitando cache doble entre la pantalla de Configuracion y el selector de roles del `UsuarioFormDialog`.
- CRUD completo: `useCreateRol`, `useEditRol`, `useDeleteRol` + components `RolesTable`, `RolFormDialog`, `RolDeleteDialog`, `RolesListPage`.
- `RolDeleteDialog` diferencia 409 (rol con usuarios asignados) de errores genericos: toast sin cerrar en 409.
- Handler MSW con store mutable que soporta CRUD completo + regla 409 simulada.
- Sidebar: item "Configuracion" (Settings) con `adminOnly: true`, ruta `/configuracion`.
- Router: ruta `/configuracion` bajo `RoleGuard role="admin"`.
- `activo` es campo display-only en la tabla (el back no expone endpoint de toggle para roles).
- El back no gatea `/api/roles/**` por rol (deuda conocida); el gate admin-only es responsabilidad del front via `RoleGuard`.

---

## Requirements

---

### Requirement: endpoints.ts como fuente unica de verdad de rutas de roles

El sistema MUST centralizar todas las rutas HTTP de roles en `src/api/endpoints.ts`. El objeto `endpoints.roles` MUST exponer: `getAll()`, `getById(id: string)`, `create()`, `edit(id: string)`, `delete(id: string)`. Ninguna ruta de roles MUST estar hardcodeada fuera de `endpoints.ts`.

#### Scenario: endpoints.roles expone las rutas RPC del back [unit test]

- WHEN se importa `endpoints.roles`
- THEN `endpoints.roles.getAll()` retorna `/roles/get-all`
- AND `endpoints.roles.getById('r1')` retorna `/roles/get-by-id?id=r1`
- AND `endpoints.roles.create()` retorna `/roles/create`
- AND `endpoints.roles.edit('r1')` retorna `/roles/edit?id=r1`
- AND `endpoints.roles.delete('r1')` retorna `/roles/delete?id=r1`

---

### Requirement: useRoles centralizado con factory rolesKeys

El sistema MUST implementar `useRoles` en `src/features/roles/hooks/useRoles.ts` con factory `rolesKeys`. Este hook MUST ser el unico `useRoles` del codebase. `src/features/usuarios/hooks/useRoles.ts` MUST NOT existir.

El factory MUST exponer: `rolesKeys.all`, `rolesKeys.list()` (retorna `['roles']`), `rolesKeys.detail(id: string)` (retorna `['roles', id]`).

#### Scenario: useRoles invoca GET /roles/get-all con queryKey ['roles'] [hook test]

- WHEN se monta `useRoles()`
- THEN se invoca `GET /api/roles/get-all`
- AND la queryKey es `['roles']`
- AND la respuesta se tipifica como `Rol[]`

#### Scenario: un solo useRoles en el codebase [unit test]

- WHEN se verifica la existencia del archivo `src/features/usuarios/hooks/useRoles.ts`
- THEN el archivo NO existe
- AND `src/features/roles/hooks/useRoles.ts` existe y exporta `useRoles` y `rolesKeys`

---

### Requirement: Crear rol via POST /api/roles/create

El sistema MUST enviar `POST /api/roles/create` con body `{ nombre (req, min1, max80), descripcion? }`. El back responde 201 con `RolResponse`. El hook `useCreateRol` MUST invalidar `rolesKeys.list()` en onSuccess. El schema Zod MUST validar `nombre` como requerido y `descripcion` como opcional.

#### Scenario: Creacion exitosa agrega rol a la lista [integration test]

- GIVEN el usuario completa nombre e intenta crear
- WHEN envia el formulario con datos validos
- THEN se invoca `POST /api/roles/create`
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

- GIVEN existe un rol con un id conocido
- WHEN el usuario modifica el nombre y envia
- THEN se invoca `PUT /api/roles/edit?id={id}` con el nombre actualizado
- AND el metodo HTTP es PUT (no PATCH)
- AND la lista de roles se invalida

#### Scenario: Form prefilled muestra datos actuales [component test]

- GIVEN un rol con nombre "Administrador" y descripcion "Acceso total"
- WHEN se abre el dialog de edicion
- THEN el campo nombre muestra "Administrador"
- AND el campo descripcion muestra "Acceso total"

---

### Requirement: Eliminar rol via DELETE /api/roles/delete?id=

El sistema MUST enviar `DELETE /api/roles/delete?id={uuid}` tras confirmacion en AlertDialog. Respuesta 204 → invalida `rolesKeys.list()` + muestra toast "Rol eliminado". Si el back responde 409 Conflict → muestra toast "Este rol tiene usuarios asignados y no puede eliminarse" y NO cierra el dialog.

#### Scenario: Eliminacion exitosa remueve el rol de la lista [integration test]

- GIVEN existe un rol sin usuarios asignados
- WHEN el usuario confirma la eliminacion
- THEN se invoca `DELETE /api/roles/delete?id=`
- AND la lista de roles se refresca sin el rol eliminado
- AND se muestra toast "Rol eliminado"

#### Scenario: 409 muestra mensaje y no cierra el dialog [integration test]

- GIVEN el rol tiene usuarios asignados
- WHEN el usuario confirma la eliminacion
- THEN el back responde 409 Conflict
- AND el dialog de confirmacion permanece abierto
- AND se muestra toast "Este rol tiene usuarios asignados y no puede eliminarse"

#### Scenario: Cancelar no invoca DELETE [component test]

- WHEN el usuario hace clic en "Cancelar" en el AlertDialog
- THEN se cierra el dialog y no se invoca `DELETE`

---

### Requirement: activo es display-only, sin toggle

El sistema MUST mostrar el campo `activo` de `Rol` como badge informativo en la tabla. MUST NOT exponer ninguna accion para cambiar `activo`. El back no provee endpoint de toggle para roles.

#### Scenario: Badge activo es read-only en la tabla [component test]

- GIVEN roles con distintos valores de `activo`
- WHEN se renderiza la tabla de roles
- THEN se muestran badges de estado correspondientes
- AND NO existe boton ni menu de accion para cambiar `activo`

---

### Requirement: Area de Configuracion admin-only en Sidebar y router

El sistema MUST mostrar el item "Configuracion" (icono Settings) en el `Sidebar` exclusivamente para usuarios con `rol_sistema === 'admin'`. La ruta `/configuracion` MUST estar protegida con `RoleGuard role="admin"`.

#### Scenario: Admin ve "Configuracion" en el sidebar [integration test]

- GIVEN un usuario con `rol_sistema: 'admin'` esta autenticado
- WHEN se renderiza el Sidebar
- THEN aparece el item "Configuracion" en la lista de navegacion
- AND al navegar a `/configuracion` se renderiza `RolesListPage`

#### Scenario: Usuario normal no ve "Configuracion" en el sidebar [integration test]

- GIVEN un usuario con `rol_sistema` distinto de `'admin'` esta autenticado
- WHEN se renderiza el Sidebar
- THEN el item "Configuracion" NO aparece en la lista de navegacion

#### Scenario: RoleGuard protege /configuracion [integration test]

- GIVEN un usuario no-admin intenta acceder directamente a `/configuracion`
- WHEN el router evalua la ruta
- THEN `RoleGuard` redirige al usuario
- AND `RolesListPage` NO se renderiza

---

### Requirement: Handler MSW con store mutable para tests de CRUD

El sistema MUST proveer un handler MSW en `src/mocks/handlers/roles.ts` con store en memoria que soporte el ciclo completo create/edit/delete. El store MUST resetearse entre tests. El handler MUST simular la regla 409 cuando el rol a eliminar esta referenciado en el fixture de usuarios.

#### Scenario: CRUD completo en el store del handler [hook test]

- GIVEN el handler MSW de roles con store inicial
- WHEN se ejecutan POST /create, PUT /edit?id=, DELETE /delete?id= en secuencia
- THEN cada operacion retorna el status correcto (201, 200, 204)
- AND GET /get-all refleja el estado actualizado del store

#### Scenario: Handler 409 si rol tiene usuarios asignados [hook test]

- GIVEN el rol a eliminar tiene su id en el fixture de usuarios mock
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

Autorizacion: cualquier JWT valido acepta el back (deuda back). Gate admin-only es responsabilidad del front.

---

## Tipos TypeScript

```ts
// Ya definido en src/api/types.ts (Change 7)
export interface Rol {
  id: string;
  nombre: string;
  descripcion: string | null;
  activo: boolean;
}

// Schemas Zod — src/features/roles/schemas/rol.schema.ts
const rolCreateSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido').max(80, 'Maximo 80 caracteres'),
  descripcion: z.string().max(80).optional().or(z.literal('')),
})
const rolUpdateSchema = rolCreateSchema.partial()
export type RolCreateInput = z.infer<typeof rolCreateSchema>
export type RolUpdateInput = z.infer<typeof rolUpdateSchema>
```

---

## Out of Scope

- Toggle de `activo` (no hay endpoint en el back para roles).
- Gate de autorizacion en el back para `/api/roles/**` (deuda back — el back deberia usar `@PreAuthorize("hasRole('ADMIN')")`).
- Gestion de roles de Keycloak (entidades separadas de los roles de dominio del CRM).
- Asignacion de roles a usuarios (ya existe via `UsuarioFormDialog`).
- Filtro/busqueda de roles en la tabla.
- Paginacion server-side de roles.
- Roles inactivos: se muestran todos los que retorne el back sin filtrar por `activo`.
