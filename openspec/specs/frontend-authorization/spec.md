# frontend-authorization Specification

**Capability**: frontend-authorization
**Change**: align-authorization-to-backend-reality
**Status**: implemented
**Fecha**: 2026-06-04

---

## Contexto

El back AR-CRM solo enforza **autenticación** (`/api/**` → `.authenticated()`); no hay
autorización por rol de negocio (`ActorContext.isSuperUsuario()`/`hasRole()` existen pero no
se invocan; no hay `@PreAuthorize`; ver memoria de proyecto `back-modelo-permisos-real`).

En consecuencia, el front NO debe simular control de acceso por rol: hacerlo da falsa
sensación de seguridad (un guard de UI que la API igual sirve). Esta capability define que
la única frontera que el front protege es **autenticado / no-autenticado**, y que el manejo
de errores de autorización (401/403) es honesto.

El `RoleGuard` (gate por `super_usuario_id`) y el filtro `adminOnly` del Sidebar fueron
**eliminados** en este change.

---

## Requirements

---

### Requirement: El front no gatea rutas por rol de negocio

El sistema MUST NOT bloquear rutas ni ocultar navegación en base a un "rol" o a la presencia
de `super_usuario_id`, porque el back no enforza autorización por rol. Toda ruta accesible a
un usuario autenticado MUST estar disponible para cualquier usuario autenticado. El front MUST
seguir protegiendo solo la frontera autenticado/no-autenticado vía `ProtectedRoute`.

#### Scenario: Usuario autenticado accede a /usuarios y /configuracion [integration test]

- GIVEN un usuario autenticado con `super_usuario_id: null` (no superusuario)
- WHEN navega a `/usuarios` o a `/configuracion`
- THEN ve la página (no es redirigido)

#### Scenario: Sidebar muestra todos los ítems a un autenticado [integration test]

- GIVEN un usuario autenticado con `super_usuario_id: null`
- WHEN se renderiza el `Sidebar`
- THEN ve los ítems "Usuarios" y "Configuración" (sin filtro `adminOnly`)

#### Scenario: Sin sesión, las rutas protegidas redirigen a login [integration test]

- GIVEN no hay usuario autenticado
- WHEN se intenta acceder a una ruta bajo `ProtectedRoute`
- THEN se redirige a `/login`

---

### Requirement: Manejo coherente y honesto de 401/403

El sistema MUST distinguir 401 (autenticación) de 403 (autorización) en `src/api/client.ts`.
Ante **401**, MUST intentar refresh del token y, si falla con sesión Keycloak ausente,
desloguear. Ante **403**, MUST mostrar/propagar un mensaje honesto de que el servidor rechazó
la operación y MUST NOT desloguear ni atribuirlo a un "rol" del front. El cliente MUST
normalizar el body de error del back (`{ error }`) a un `ApiError` con `status` y `message`
reales, para que la UI nunca muestre un mensaje vacío.

#### Scenario: Respuesta 403 del back [unit test]

- GIVEN una request autenticada que recibe `403` del back
- WHEN `api/client.ts` procesa la respuesta
- THEN propaga un `HttpError` con el mensaje del back (o uno honesto por defecto)
- AND NO dispara logout
- AND NO muestra un mensaje del tipo "no tenés permisos de rol"

#### Scenario: Normalización del body de error del back [unit test]

- GIVEN el back responde con body `{ "error": "texto del back" }`
- WHEN `api/client.ts` construye el `ApiError`
- THEN `status` es el HTTP real de la respuesta
- AND `message` es "texto del back" (no `undefined` ni "Request failed with …")

---

## Out of Scope

- Implementar autorización de negocio por rol (es deuda del **back**; cuando exista, será otro change).
- El guard técnico `POST /api/superusuarios/create` (no lo consume el front).
- Cambiar el comportamiento de `ProtectedRoute` (frontera autenticado/no-autenticado, sin cambios).
