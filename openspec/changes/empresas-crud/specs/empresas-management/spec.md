# empresas-management Specification

## Purpose

Provee la gestión completa de empresas en el CRM Pipely: lista, creación, edición, eliminación, detalle, y acceso a las relaciones (prospectos y clientes vinculados a cada empresa). Es la primera feature de dominio del sistema, después del auth.

## Requirements

### Requirement: Listado de empresas

El sistema MUST mostrar la lista de empresas en `/empresas` consumiendo `GET /api/v1/empresas` con cache vía TanStack Query bajo la key `['empresas']`. La tabla debe mostrar: Nombre, Sector, Teléfono, Página web, Fecha de creación (formato relativo), y acciones (Ver / Editar / Eliminar).

#### Scenario: Listado con datos

- GIVEN el usuario autenticado navega a `/empresas`
- WHEN el endpoint responde con un array de N empresas
- THEN se muestran N filas en la tabla con los datos formateados
- AND cada fila tiene acciones "Ver", "Editar", "Eliminar"

#### Scenario: Listado vacío

- GIVEN el endpoint devuelve `[]`
- WHEN la página termina de cargar
- THEN se muestra un empty state con texto "No hay empresas todavía" y botón "Crear primera empresa"

#### Scenario: Error de servidor en listado

- GIVEN el endpoint responde 500
- WHEN la query falla
- THEN se muestra un mensaje de error con botón "Reintentar"
- AND no se muestra la tabla

### Requirement: Búsqueda client-side

El sistema MUST filtrar la lista localmente por coincidencia de texto (case-insensitive) en los campos `nombre` y `sector` mientras el usuario escribe en un input de búsqueda.

#### Scenario: Filtro por nombre

- GIVEN la lista muestra 3 empresas
- WHEN el usuario escribe "innova" en el input de búsqueda
- THEN solo se muestran empresas cuyo `nombre` o `sector` contiene "innova" (case-insensitive)

#### Scenario: Filtro sin resultados

- WHEN el filtro no coincide con ninguna empresa
- THEN se muestra el texto "No hay empresas que coincidan con tu búsqueda"

### Requirement: Creación de empresa

El sistema MUST permitir crear una empresa nueva vía un Dialog modal con formulario validado por Zod. Submit llama `POST /api/v1/empresas`. El campo `nombre` es requerido; los demás son opcionales. Solo `pagina_web` se valida como URL; las redes sociales aceptan handle o URL libre.

#### Scenario: Creación exitosa

- GIVEN el usuario hace click en "Nueva empresa"
- WHEN ingresa `nombre: "ACME Corp"` y envía el formulario
- THEN el sistema invoca `POST /empresas`, recibe 201
- AND el Dialog se cierra
- AND la lista de empresas se invalida e incluye "ACME Corp"
- AND se muestra un toast de éxito

#### Scenario: Error de validación 422

- WHEN el backend responde 422 con `details: [{field: "nombre", message: "..."}]`
- THEN el formulario mapea cada error con `setError` en el campo correspondiente
- AND el Dialog permanece abierto

#### Scenario: Validación client-side: nombre requerido

- WHEN el usuario envía el form sin nombre
- THEN se muestra "El nombre es requerido" inline
- AND no se llama al backend

### Requirement: Edición de empresa

El sistema MUST permitir editar una empresa existente reutilizando el mismo componente de formulario (modo `edit`). Submit llama `PATCH /api/v1/empresas/:id`. Los valores iniciales se cargan desde `useEmpresa(id)`.

#### Scenario: Edición exitosa

- GIVEN existe una empresa con `nombre: "ACME Corp"`
- WHEN el usuario hace click en "Editar", cambia el nombre a "ACME Corporation" y envía
- THEN el sistema invoca `PATCH /empresas/:id`, recibe 200
- AND invalida tanto `['empresas']` como `['empresas', id]`
- AND la fila refleja el nuevo nombre

### Requirement: Eliminación de empresa

El sistema MUST permitir eliminar una empresa tras confirmación explícita en un `AlertDialog`. El mensaje MUST advertir que prospectos y clientes asociados quedarán sin empresa (no cascada).

#### Scenario: Eliminación exitosa

- GIVEN el usuario hace click en "Eliminar" en una fila
- WHEN aparece el AlertDialog y confirma
- THEN el sistema invoca `DELETE /empresas/:id`, recibe 204
- AND la fila desaparece de la tabla
- AND se muestra toast "Empresa eliminada"

#### Scenario: 404 al eliminar (empresa ya borrada por otra sesión)

- WHEN el backend responde 404
- THEN se muestra toast "La empresa ya fue eliminada"
- AND la lista se invalida para reflejar el estado real
- AND el AlertDialog se cierra

### Requirement: Detalle de empresa

El sistema MUST mostrar el detalle en `/empresas/:id` con tres tabs: **Información**, **Prospectos**, **Clientes**. Las tres queries (`useEmpresa`, `useEmpresaProspectos`, `useEmpresaClientes`) se cargan al montar la página vía TanStack Query.

#### Scenario: Detalle con id válido

- GIVEN existe la empresa con id `a1...`
- WHEN el usuario navega a `/empresas/a1...`
- THEN se muestra el nombre y sector en el header
- AND la tab "Información" muestra todos los campos (incluidos los nulos como "—")
- AND las tabs "Prospectos" y "Clientes" muestran las listas filtradas por `empresa_id`

#### Scenario: Detalle con id inexistente

- WHEN el endpoint `/empresas/:id` responde 404
- THEN se muestra mensaje "Empresa no encontrada"
- AND aparece botón "Volver a Empresas"
- AND se ejecuta un redirect automático a `/empresas` tras toast

### Requirement: Invalidación de cache tras mutations

El sistema MUST invalidar las query keys afectadas tras cada mutación exitosa, asegurando que la UI refleje el estado actual sin recargar la página.

| Mutation | Keys a invalidar |
|----------|------------------|
| Crear | `['empresas']` |
| Editar | `['empresas']`, `['empresas', id]` |
| Eliminar | remove `['empresas', id]` + invalidate `['empresas']` |

## API Contract Reference

| Método | Path |
|--------|------|
| GET | `/api/v1/empresas` |
| POST | `/api/v1/empresas` |
| GET | `/api/v1/empresas/:id` |
| PATCH | `/api/v1/empresas/:id` |
| DELETE | `/api/v1/empresas/:id` |
| GET | `/api/v1/empresas/:id/prospectos` |
| GET | `/api/v1/empresas/:id/clientes` |

Cuerpo POST/PATCH: `{ nombre, sector?, telefono?, pagina_web?, facebook?, instagram?, twitter? }`. Errores normalizados con `{ status, error, message, details? }`.

## Out of Scope

- Crear/editar prospectos o clientes desde la vista de empresa (Changes 4 y 5)
- Optimistic updates en mutations
- Paginación / ordenamiento server-side
- Exportar empresas a CSV/Excel
- Logo o imagen corporativa de la empresa
- Historial de cambios o auditoría
- Permisos de edición por rol (todos los usuarios autenticados pueden gestionar empresas en este Change)
