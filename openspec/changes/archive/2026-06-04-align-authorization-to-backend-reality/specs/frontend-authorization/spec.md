# Delta: frontend-authorization (align-authorization-to-backend-reality)

## ADDED Requirements

### Requirement: El front no gatea rutas por rol de negocio

El sistema MUST NOT bloquear rutas ni ocultar navegación en base a un "rol" o a la presencia
de `super_usuario_id`, porque el back NO enforza autorización por rol (`/api/**` solo exige
estar autenticado). Toda ruta de la app accesible a un usuario autenticado MUST estar
disponible para cualquier usuario autenticado. El front MUST seguir protegiendo solo la
frontera autenticado/no-autenticado (`ProtectedRoute`), no roles.

#### Scenario: Usuario autenticado accede a /usuarios y /configuracion [integration test]

- GIVEN un usuario autenticado con `super_usuario_id: null` (no superusuario)
- WHEN navega a `/usuarios` o a `/configuracion`
- THEN ve la página (no es redirigido)

#### Scenario: Sidebar muestra todos los ítems a un autenticado [integration test]

- GIVEN un usuario autenticado con `super_usuario_id: null`
- WHEN se renderiza el `Sidebar`
- THEN ve los ítems "Usuarios" y "Configuración" (sin filtro `adminOnly`)

### Requirement: Manejo coherente y honesto de 401/403

El sistema MUST distinguir 401 (autenticación) de 403 (autorización) en `api/client.ts`.
Ante **401**, MUST intentar refresh del token y, si falla con sesión Keycloak ausente,
desloguear. Ante **403**, MUST mostrar un mensaje honesto de que el servidor rechazó la
operación y MUST NOT desloguear ni atribuirlo a un "rol" del front. El mensaje MUST NOT
prometer ni implicar un control de permisos por rol que el front no posee.

#### Scenario: Respuesta 403 del back [unit test]

- GIVEN una request autenticada que recibe `403` del back
- WHEN `api/client.ts` procesa la respuesta
- THEN propaga un `HttpError` con el mensaje del back (o uno honesto por defecto)
- AND NO dispara logout
- AND NO muestra un mensaje del tipo "no tenés permisos de rol"
