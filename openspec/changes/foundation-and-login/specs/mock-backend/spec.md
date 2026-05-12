# mock-backend Specification

## Purpose

Provee una capa de Mock Service Worker (MSW v2) que intercepta todas las llamadas al contrato API mientras el backend real no exista. Permite que el frontend desarrolle y pruebe los Changes 1–8 en paralelo al equipo de backend, respetando el contrato.

## Requirements

### Requirement: Activación condicionada por variable de entorno

El sistema MUST iniciar el worker de MSW SOLO cuando `import.meta.env.VITE_ENABLE_MSW === 'true'`. Cuando es `false` o ausente, MUST NOT registrar el worker y los requests pasan al backend real.

#### Scenario: MSW habilitado en dev

- GIVEN `.env.development` define `VITE_ENABLE_MSW=true`
- WHEN la app arranca
- THEN MSW registra el service worker
- AND todas las llamadas a `/api/v1/*` son interceptadas

#### Scenario: MSW deshabilitado en producción

- GIVEN no existe `VITE_ENABLE_MSW` o vale `false`
- WHEN la app arranca
- THEN MSW NO se registra
- AND las llamadas a `/api/v1/*` van al backend real

### Requirement: Handlers funcionales para autenticación

El sistema MUST implementar handlers MSW completamente funcionales para `POST /auth/login`, `POST /auth/logout` y `GET /auth/me`, respetando el contrato.

#### Scenario: Login con credenciales mock válidas

- GIVEN existen las credenciales mock `admin@crm.test / Admin123!` y `vendedor@crm.test / Vendedor123!`
- WHEN se envía `POST /auth/login` con una de ellas
- THEN MSW responde `200 {token, usuario}` con el `rol_sistema` correspondiente

#### Scenario: Login con credenciales mock inválidas

- WHEN se envía `POST /auth/login` con email/password que no coinciden con ningún mock
- THEN MSW responde `401 {status: 401, error: "UNAUTHORIZED", message: "Credenciales inválidas"}`

#### Scenario: Login con campos faltantes

- WHEN se envía `POST /auth/login` sin email o sin password
- THEN MSW responde `422 {status: 422, error: "VALIDATION_ERROR", message: "Datos invalidos", details: [...]}`

#### Scenario: GET /auth/me con token válido

- GIVEN el header `Authorization: Bearer <token>` se envió en login previo
- WHEN se solicita `GET /auth/me`
- THEN MSW responde `200 {usuario}`

#### Scenario: Request sin token a endpoint protegido

- GIVEN no hay header `Authorization`
- WHEN se solicita cualquier endpoint protegido (por ejemplo `GET /auth/me`)
- THEN MSW responde `401 UNAUTHORIZED`

### Requirement: Handlers stub para los demás dominios

El sistema MUST proveer handlers stub para los 9 dominios restantes del contrato (usuarios, empresas, prospectos, clientes, tratos, tareas, tableros/columnas/fichas, etiquetas, comentarios). Los stubs MUST devolver datos fixture razonables en GET (arrays con 3–5 items) y aceptar mutaciones POST/PATCH/DELETE manipulando los arrays in-memory.

#### Scenario: GET /empresas devuelve fixtures

- GIVEN MSW está habilitado y existen fixtures de empresas
- WHEN se solicita `GET /empresas`
- THEN MSW responde `200` con un array de 3–5 empresas fixture

#### Scenario: POST /empresas persiste durante la sesión

- WHEN se envía `POST /empresas` con un body válido
- THEN MSW asigna un `id` UUID, agrega la nueva empresa al array in-memory
- AND responde `201` con el objeto creado
- AND un `GET /empresas` posterior incluye la nueva empresa

#### Scenario: Recarga limpia mutaciones

- GIVEN se crearon empresas durante la sesión
- WHEN el usuario recarga la página
- THEN los arrays in-memory se reinicializan a sus fixtures originales

### Requirement: Errores en formato del contrato

Todos los handlers MUST devolver errores con la forma `{status, error, message, details?}` exigida por el contrato.

#### Scenario: Recurso no encontrado

- WHEN se solicita un recurso por id inexistente (por ejemplo `GET /empresas/<uuid-inexistente>`)
- THEN MSW responde `404 {status: 404, error: "NOT_FOUND", message: "Recurso no encontrado"}`

### Requirement: Latencia simulada

El sistema SHOULD aplicar un delay artificial de 200–400ms en todos los handlers vía un helper `withDelay`, para simular condiciones de red realistas y permitir que la UI muestre estados de loading.

#### Scenario: Delay aplicado por defecto

- WHEN se invoca cualquier handler
- THEN la respuesta se devuelve después de 200–400ms

## API Contract Reference

Cubre todos los endpoints del contrato (`Desktop/contratos_api_crm (1).pdf`):

| Sección | Endpoints | Implementación en Change 1 |
|---------|-----------|---------------------------|
| 1. Autenticación | login, logout, me | **Funcional** |
| 1. Autenticación | password change | Stub que devuelve 501 |
| 2–9. Resto | ~50 endpoints | Stub con fixtures in-memory |

## Out of Scope

- Persistencia entre recargas (in-memory, se pierde al recargar — diseño intencional)
- Errores aleatorios (futuro: helper `withRandomError(rate)`)
- Validaciones server-side completas (los Changes posteriores las refinan)
- Latencia configurable por endpoint (default global suficiente)
