# usuarios-management Specification

## Purpose

Provee la gestión completa de usuarios en el CRM Pipely: lista con búsqueda y filtro por rol, creación, edición, eliminación, desactivación y reactivación. La vista es exclusiva para administradores y aplica un bloqueo parcial para que el admin en sesión no comprometa su propia cuenta.

## Requirements

### Requirement 1: Acceso admin-only

El sistema MUST restringir la ruta `/usuarios` a usuarios con `rol_sistema === 'admin'`. Un usuario sin sesión MUST ser redirigido a `/login`; un usuario autenticado sin rol admin MUST ser redirigido a `/`.

#### Scenario 1.1: Admin autenticado accede

- GIVEN el usuario autenticado tiene `rol_sistema: 'admin'`
- WHEN navega a `/usuarios`
- THEN se renderiza la página de lista de usuarios

#### Scenario 1.2: Usuario común es redirigido al inicio

- GIVEN el usuario autenticado tiene `rol_sistema: 'usuario'`
- WHEN navega a `/usuarios`
- THEN es redirigido a `/`

#### Scenario 1.3: Sin sesión redirige a login

- GIVEN no hay sesión activa
- WHEN se intenta acceder a `/usuarios`
- THEN es redirigido a `/login`

---

### Requirement 2: Listado de usuarios

El sistema MUST mostrar la lista de usuarios en `/usuarios` consumiendo `GET /api/v1/usuarios` con cache TanStack Query bajo la key `['usuarios']`. La tabla MUST mostrar: Nombre, Correo, Rol sistema, Rol empresa, Estado (activo/inactivo), Fecha de creación (relativa), y columna Acciones.

#### Scenario 2.1: Listado con datos

- GIVEN el admin navega a `/usuarios`
- WHEN el endpoint responde con un array de N usuarios
- THEN se muestran N filas con los datos formateados
- AND cada fila tiene un menú de acciones (Editar, Eliminar, Desactivar/Reactivar según estado)

#### Scenario 2.2: Listado vacío

- GIVEN el endpoint devuelve `[]`
- WHEN la página termina de cargar
- THEN se muestra un empty state con texto "No hay usuarios todavía" y botón "Crear primer usuario"

#### Scenario 2.3: Error de servidor en listado

- GIVEN el endpoint responde 500
- WHEN la query falla
- THEN se muestra un mensaje de error con botón "Reintentar"
- AND no se muestra la tabla

---

### Requirement 3: Búsqueda client-side por nombre y correo

El sistema MUST filtrar la lista localmente por coincidencia de texto (case-insensitive, ignora acentos) en los campos `nombre` y `correo` mientras el admin escribe en un input de búsqueda.

#### Scenario 3.1: Búsqueda por nombre filtra

- GIVEN la lista muestra 2 usuarios
- WHEN el admin escribe "antonio" en el input de búsqueda
- THEN solo se muestran usuarios cuyo `nombre` contiene "antonio" (case-insensitive)

#### Scenario 3.2: Búsqueda por correo filtra

- GIVEN la lista muestra 2 usuarios
- WHEN el admin escribe "admin@crm" en el input de búsqueda
- THEN solo se muestra el usuario con ese correo

#### Scenario 3.3: Búsqueda vacía muestra todos

- WHEN el admin borra el texto del input
- THEN se muestran todos los usuarios sin filtro

#### Scenario 3.4: Búsqueda insensible a mayúsculas y acentos

- WHEN el admin escribe "MARIA" o "María"
- THEN se muestran los mismos resultados independientemente del case o acento

---

### Requirement 4: Filtro por rol_sistema

El sistema MUST ofrecer un selector de filtro con opciones `admin`, `usuario`, y `todos`. El filtro MUST combinarse con la búsqueda por texto usando lógica AND.

#### Scenario 4.1: Filtro "admin" muestra solo admins

- WHEN el admin selecciona "admin" en el selector de filtro
- THEN solo se muestran usuarios con `rol_sistema: 'admin'`

#### Scenario 4.2: Filtro "usuario" muestra solo usuarios estándar

- WHEN el admin selecciona "usuario" en el selector de filtro
- THEN solo se muestran usuarios con `rol_sistema: 'usuario'`

#### Scenario 4.3: Filtro "todos" no aplica filtro de rol

- WHEN el admin selecciona "todos" en el selector de filtro
- THEN se muestran usuarios de ambos roles (sujeto a la búsqueda por texto activa)

#### Scenario 4.4: Búsqueda y filtro de rol se combinan con AND

- GIVEN el filtro está en "admin" y la búsqueda en "antonio"
- WHEN se evalúa la lista
- THEN solo se muestran usuarios con `rol_sistema: 'admin'` cuyo nombre o correo contenga "antonio"

---

### Requirement 5: Crear usuario

El sistema MUST permitir crear un usuario nuevo vía un Dialog modal con formulario validado por Zod. Submit llama `POST /api/v1/usuarios`.

**Validaciones**:
- `nombre`: requerido, máx. 150 caracteres
- `correo`: requerido, formato email, máx. 200 caracteres
- `rol_sistema`: requerido, enum `admin | usuario`
- `rol_empresa`: opcional, máx. 100 caracteres

#### Scenario 5.1: Creación exitosa

- GIVEN el admin hace clic en "Nuevo usuario"
- WHEN ingresa datos válidos y envía el formulario
- THEN el sistema invoca `POST /usuarios`, recibe 201
- AND el Dialog se cierra
- AND la query `['usuarios']` se invalida
- AND se muestra un toast de éxito

#### Scenario 5.2: Validación client-side muestra errores inline

- WHEN el admin envía el form sin nombre ni correo
- THEN se muestran mensajes de error inline bajo cada campo
- AND no se llama al backend

#### Scenario 5.3: Error 422 del backend muestra details

- WHEN el backend responde 422 con `details: [{field: "correo", message: "ya existe"}]`
- THEN el formulario mapea cada error con `setError` en el campo correspondiente
- AND el Dialog permanece abierto

---

### Requirement 6: Editar usuario

El sistema MUST permitir editar un usuario existente reutilizando `UsuarioForm` en modo `edit`. Submit llama `PATCH /api/v1/usuarios/:id`. Todas las validaciones son opcionales en edición (esquema `.partial()`). Los valores iniciales se cargan desde la fila seleccionada.

#### Scenario 6.1: Edición exitosa

- GIVEN el admin hace clic en "Editar" en una fila
- WHEN cambia el nombre y envía
- THEN el sistema invoca `PATCH /usuarios/:id`, recibe 200
- AND invalida `['usuarios']`
- AND se muestra toast de éxito

#### Scenario 6.2: Campo rol_sistema deshabilitado en la cuenta propia

- GIVEN el admin en sesión abre el Dialog de edición sobre su propia fila
- WHEN se renderiza el formulario
- THEN el campo `rol_sistema` está deshabilitado
- AND el resto de los campos (nombre, correo, rol_empresa) están habilitados

#### Scenario 6.3: Error 422 en edición muestra details

- WHEN el backend responde 422 con details
- THEN el formulario mapea los errores con `setError` y permanece abierto

---

### Requirement 7: Eliminar usuario

El sistema MUST permitir eliminar un usuario tras confirmación explícita en un `AlertDialog`. Submit llama `DELETE /api/v1/usuarios/:id`.

#### Scenario 7.1: Eliminación exitosa

- GIVEN el admin hace clic en "Eliminar" en una fila
- WHEN aparece el AlertDialog y confirma
- THEN el sistema invoca `DELETE /usuarios/:id`, recibe 204
- AND la fila desaparece de la tabla
- AND se muestra toast "Usuario eliminado"

#### Scenario 7.2: Cancelar cierra el dialog sin acción

- GIVEN el AlertDialog de confirmación está abierto
- WHEN el admin hace clic en "Cancelar"
- THEN el dialog se cierra
- AND no se invoca el endpoint

#### Scenario 7.3: 404 al eliminar muestra error

- WHEN el backend responde 404
- THEN se muestra toast de error
- AND la lista se invalida para reflejar el estado real

---

### Requirement 8: Desactivar usuario

El sistema MUST permitir desactivar un usuario vía `PATCH /api/v1/usuarios/:id/desactivar` con confirmación en `AlertDialog`. El botón de desactivación MUST ser visible únicamente cuando `activo === true`.

#### Scenario 8.1: Desactivación exitosa

- GIVEN el usuario tiene `activo: true`
- WHEN el admin confirma la desactivación
- THEN el sistema invoca `PATCH /usuarios/:id/desactivar`, recibe 200
- AND la lista se invalida y la fila refleja `activo: false`

#### Scenario 8.2: 404 al desactivar muestra error

- WHEN el backend responde 404
- THEN se muestra toast de error

#### Scenario 8.3: Botón solo visible cuando activo es true

- GIVEN el usuario tiene `activo: false`
- WHEN se renderiza el menú de acciones de esa fila
- THEN la acción "Desactivar" no está visible (o está reemplazada por "Reactivar")

---

### Requirement 9: Reactivar usuario

El sistema MUST permitir reactivar un usuario enviando `PATCH /api/v1/usuarios/:id` con `{ activo: true }` reutilizando `useUpdateUsuario`. El botón de reactivación MUST ser visible únicamente cuando `activo === false`.

#### Scenario 9.1: Reactivación exitosa

- GIVEN el usuario tiene `activo: false`
- WHEN el admin hace clic en "Reactivar"
- THEN el sistema invoca `PATCH /usuarios/:id` con `{ activo: true }`, recibe 200
- AND la lista se invalida y la fila refleja `activo: true`

#### Scenario 9.2: Botón solo visible cuando activo es false

- GIVEN el usuario tiene `activo: true`
- WHEN se renderiza el menú de acciones de esa fila
- THEN la acción "Reactivar" no está visible

---

### Requirement 10: Bloqueo parcial de la cuenta propia

El admin en sesión MUST NOT poder cambiar su `rol_sistema`, desactivarse a sí mismo ni eliminarse. SÍ DEBE poder editar su propio `nombre`, `correo` y `rol_empresa`. Las acciones bloqueadas MUST mostrarse deshabilitadas con un `Tooltip` explicativo.

**Identificación**: comparar `usuario.id` del `authStore` con el `id` de la fila.

#### Scenario 10.1: Acciones críticas deshabilitadas en la fila propia

- GIVEN el admin en sesión visualiza su propia fila en la tabla
- WHEN se despliega el menú de acciones de esa fila
- THEN las acciones "Cambiar rol", "Desactivar" y "Eliminar" están deshabilitadas

#### Scenario 10.2: Tooltip explicativo al hover sobre acción bloqueada

- GIVEN el menú de acciones de la fila propia está desplegado
- WHEN el admin hace hover sobre una acción deshabilitada
- THEN aparece un Tooltip con el texto "No puedes realizar esta acción sobre tu propia cuenta"

#### Scenario 10.3: Campo rol_sistema deshabilitado en edición propia

- GIVEN el admin abre el Dialog de edición sobre su propia fila
- WHEN se renderiza `UsuarioForm` en modo `edit`
- THEN el campo `rol_sistema` está deshabilitado
- AND nombre, correo y rol_empresa son editables

#### Scenario 10.4: Edición de nombre y correo propios funciona

- GIVEN el admin edita su propia fila cambiando solo el nombre
- WHEN envía el formulario
- THEN el sistema invoca `PATCH /usuarios/:id` con el nombre actualizado
- AND recibe 200 y la lista refleja el cambio

---

### Requirement 11: Indicadores visuales de rol y estado

El sistema MUST mostrar un `Badge` con color distintivo para `rol_sistema` y un indicador de estado activo/inactivo en la tabla.

**Colores sugeridos** (implementación en Apply):
- `rol_sistema: 'admin'` → badge variante destructive o primary
- `rol_sistema: 'usuario'` → badge variante secondary
- `activo: true` → badge verde
- `activo: false` → badge gris o rojo

#### Scenario 11.1: Badge de rol muestra color según rol_sistema

- GIVEN la tabla muestra una fila con `rol_sistema: 'admin'`
- WHEN se renderiza el Badge de rol
- THEN tiene un color visualmente diferente al Badge de un usuario con `rol_sistema: 'usuario'`

#### Scenario 11.2: Badge de estado refleja campo activo

- GIVEN la tabla tiene un usuario con `activo: false`
- WHEN se renderiza su fila
- THEN el Badge de estado muestra "Inactivo" con color gris o rojo
- AND un usuario con `activo: true` muestra "Activo" con color verde

---

## API Contract Reference

| Método | Path | Descripción |
|--------|------|-------------|
| GET | `/api/v1/usuarios` | Lista todos los usuarios |
| POST | `/api/v1/usuarios` | Crea un usuario nuevo |
| PATCH | `/api/v1/usuarios/:id` | Edita datos del usuario (incluyendo `{ activo: true }` para reactivar) |
| DELETE | `/api/v1/usuarios/:id` | Elimina un usuario |
| PATCH | `/api/v1/usuarios/:id/desactivar` | Desactiva un usuario (endpoint dedicado) |

**Cuerpo POST/PATCH**: `{ nombre?, correo?, rol_sistema?, rol_empresa?, activo? }`.
Errores normalizados: `{ status, error, message, details? }`.

**Asimetría intencional**: desactivar usa endpoint dedicado; reactivar usa PATCH genérico. No hay endpoint `PATCH /usuarios/:id/activar`.

## Out of Scope

- Página de detalle de usuario (no hay subrelaciones en este Change)
- Cambio de contraseña (diferido al backend real)
- Filtro por estado `activo` en la lista (YAGNI)
- Paginación / ordenamiento server-side
- Crear usuarios con contraseña (mock no lo persiste)
- Cambios al modelo `Usuario` en `src/api/types.ts`
- Cambios a `RoleGuard`, `authStore`, o cualquier otra feature
