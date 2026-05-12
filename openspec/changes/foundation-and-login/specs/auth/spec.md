# auth Specification

## Purpose

Provee el flujo de autenticación de usuarios contra el backend (real o mock). Cubre login, logout, recuperación del usuario actual, persistencia del token JWT y manejo automático de sesiones expiradas.

## Requirements

### Requirement: Inicio de sesión con email y contraseña

El sistema MUST permitir al usuario autenticarse enviando `POST /api/v1/auth/login` con `{email, password}`. Ante éxito, MUST guardar el token JWT y los datos del usuario, y redirigir a `/empresas`.

#### Scenario: Login exitoso

- GIVEN el usuario está en `/login` sin sesión activa
- WHEN ingresa credenciales válidas y envía el formulario
- THEN el sistema recibe `200 {token, usuario}` desde `POST /auth/login`
- AND persiste el token y el usuario en `authStore`
- AND redirige a `/empresas`

#### Scenario: Credenciales inválidas

- GIVEN el usuario está en `/login`
- WHEN envía credenciales que el backend rechaza con `401 UNAUTHORIZED`
- THEN el sistema muestra un toast "Credenciales inválidas"
- AND el formulario permanece editable
- AND no se persiste ningún token

#### Scenario: Errores de validación del backend

- GIVEN el usuario envía datos que el backend valida con `422 VALIDATION_ERROR` y `details: [{field, message}]`
- WHEN se recibe la respuesta
- THEN el sistema mapea cada `{field, message}` a `setError` en el formulario
- AND no se persiste ningún token

### Requirement: Persistencia del token JWT

El sistema MUST persistir el token y el usuario en `localStorage` mediante `authStore` (Zustand + persist), de modo que recargar la página mantiene la sesión hasta que el token expire o el usuario cierre sesión.

#### Scenario: Token sobrevive a recarga

- GIVEN el usuario está autenticado
- WHEN recarga la página
- THEN `authStore` se rehidrata desde `localStorage`
- AND `GET /auth/me` confirma la sesión
- AND el usuario sigue en la ruta donde estaba

### Requirement: Cierre de sesión

El sistema MUST cerrar la sesión cuando el usuario lo solicita o cuando el backend responde 401. Llama a `POST /api/v1/auth/logout`, limpia `authStore` y redirige a `/login`.

#### Scenario: Logout manual

- GIVEN el usuario está autenticado
- WHEN hace click en "Cerrar sesión" en el menú del topbar
- THEN el sistema invoca `POST /auth/logout` (best-effort, ignora errores)
- AND limpia el token y el usuario de `authStore`
- AND redirige a `/login`

#### Scenario: Logout automático por 401

- GIVEN el usuario tiene un token expirado o inválido
- WHEN cualquier request del cliente HTTP recibe `401 UNAUTHORIZED`
- THEN el sistema limpia `authStore`, redirige a `/login`
- AND muestra toast "Tu sesión expiró, vuelve a iniciar sesión"

### Requirement: Recuperación del usuario autenticado

El sistema MUST exponer un hook `useMe` que llame a `GET /api/v1/auth/me` y devuelva los datos del usuario autenticado, con cache vía TanStack Query.

#### Scenario: Lectura del usuario actual

- GIVEN el usuario está autenticado
- WHEN un componente consume `useMe()`
- THEN el sistema retorna `{id, nombre, correo, rol_sistema, rol_empresa}` desde cache o desde `GET /auth/me`

### Requirement: Rol del sistema tipado

El sistema MUST modelar `rol_sistema` como union literal `'admin' | 'usuario'` en TypeScript, en un archivo único reutilizable.

#### Scenario: Acceso al rol del usuario

- GIVEN el usuario está autenticado
- WHEN un componente consulta `usuario.rol_sistema`
- THEN TypeScript garantiza que el valor es `'admin'` o `'usuario'`

## API Contract Reference

| Método | Path | Uso |
|--------|------|-----|
| POST | `/api/v1/auth/login` | Inicio de sesión |
| POST | `/api/v1/auth/logout` | Cierre de sesión |
| GET | `/api/v1/auth/me` | Datos del usuario actual |

Errores normalizados según contrato: `{status, error, message, details?}`.

## Out of Scope

- `PATCH /api/v1/auth/me/password` (cambio de contraseña — diferido)
- Refresh tokens (no contemplados en el contrato)
- Recuperación de contraseña / "olvidé mi contraseña"
- Login social (Google, etc.)
- 2FA / MFA
