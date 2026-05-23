# clientes-management Specification

**Capability**: clientes-management
**Change**: clientes-management (Change 5)
**Version**: 1.0
**Status**: proposed

## Purpose

Provee la gestión completa de Clientes en el CRM Pipely: listado filtrable con tabla, detalle con tabs (Información | Tratos), creación manual vía diálogo, edición vía diálogo, eliminación con bloqueo 409 si hay tratos vinculados, badge de origen (prospecto/manual), y migración del hook `useClientes` desde la feature `prospectos`. Es el primer Change que convierte Clientes en entidad de primer nivel navegable en el sidebar.

## Requirements

---

### Requirement: Sidebar navegable

El item "Clientes" en el sidebar DEBE mostrar un link funcional navegable a `/clientes`. El atributo `disabled` y el badge "Próximamente" DEBEN ser eliminados.

#### Scenario: Sidebar link navega a /clientes [integration test]

- GIVEN el usuario autenticado está en cualquier ruta de la app
- WHEN hace clic en el item "Clientes" del sidebar
- THEN el router navega a `/clientes`
- AND no se renderiza ningún mensaje de "Próximamente" ni overlay de disabled

#### Scenario: Sidebar link no tiene atributo disabled [component test]

- GIVEN el componente Sidebar está montado
- WHEN se inspecciona el elemento del item "Clientes"
- THEN el elemento NO tiene el atributo `disabled` ni la clase CSS asociada a estado deshabilitado

---

### Requirement: Routing de páginas

El sistema DEBE wirear las rutas `/clientes` (lista) y `/clientes/:id` (detalle) en `router.tsx`. NO DEBE existir una ruta `/clientes/nuevo` (el create es un diálogo). El `ClientesPlaceholder` DEBE ser eliminado de `placeholders.tsx`.

#### Scenario: /clientes renderiza ClientesListPage [integration test]

- GIVEN la app está en estado de autenticación válida
- WHEN el usuario navega a `/clientes`
- THEN se renderiza `ClientesListPage` con la tabla de clientes
- AND NO se muestra ningún placeholder

#### Scenario: /clientes/:id renderiza ClienteDetailPage [integration test]

- GIVEN existe un cliente con id `c1111111`
- WHEN el usuario navega a `/clientes/c1111111`
- THEN se renderiza `ClienteDetailPage` con tabs Información y Tratos

#### Scenario: /clientes/nuevo no existe como ruta [manual smoke]

- WHEN el usuario navega manualmente a `/clientes/nuevo`
- THEN el router trata "nuevo" como un `:id` y la página de detalle intenta cargar ese id (comportamiento de fallback, no ruta separada)

---

### Requirement: Listado de clientes

El sistema DEBE mostrar `/clientes` con una tabla que consume `GET /api/v1/clientes` con cache TanStack Query bajo la key `['clientes']`. Columnas: `nombre_contacto`, empresa vinculada, contacto (correo/teléfono), origen (badge), fecha de creación.

#### Scenario: Tabla poblada con datos fixture [integration test]

- GIVEN el endpoint `GET /clientes` devuelve un array de clientes
- WHEN el usuario navega a `/clientes`
- THEN se renderiza la tabla con una fila por cliente
- AND cada fila muestra nombre, empresa, datos de contacto, badge de origen y fecha

#### Scenario: Nombre clickeable navega al detalle [integration test]

- GIVEN la tabla muestra un cliente con `nombre_contacto: "Ana Torres"`
- WHEN el usuario hace clic en el nombre "Ana Torres"
- THEN el router navega a `/clientes/:id` correspondiente

#### Scenario: Error de servidor muestra botón reintentar [integration test]

- GIVEN el endpoint `GET /clientes` responde 500
- WHEN la query falla
- THEN se muestra un mensaje de error con botón "Reintentar"
- AND no se renderiza la tabla

---

### Requirement: Filtros del listado

El sistema DEBE ofrecer filtros en la parte superior de la tabla: búsqueda por `nombre_contacto` (client-side, case-insensitive), filtro por `empresa_id` (server-side, query param), y filtro por `origen` con opciones todos / prospecto / manual (server-side, query param).

#### Scenario: Búsqueda por nombre filtra en tiempo real [integration test]

- GIVEN la tabla muestra clientes "Ana Torres", "Luis García", "Beatriz López"
- WHEN el usuario escribe "ana" en el input de búsqueda
- THEN solo se muestra la fila de "Ana Torres"

#### Scenario: Filtro por empresa pasa query param al endpoint [hook test]

- GIVEN el filtro de empresa tiene seleccionada la empresa con id `e1111111`
- WHEN el hook ejecuta la query
- THEN se invoca `GET /clientes?empresa_id=e1111111`

#### Scenario: Filtro por origen=prospecto pasa query param [hook test]

- GIVEN el filtro de origen tiene seleccionada la opción "Prospecto"
- WHEN el hook ejecuta la query
- THEN se invoca `GET /clientes?origen=prospecto`

#### Scenario: Limpiar filtros restaura todos los clientes [integration test]

- GIVEN hay filtros activos que reducen la tabla a 1 fila
- WHEN el usuario limpia todos los filtros
- THEN la tabla muestra todos los clientes sin filtrar

---

### Requirement: Crear cliente

El sistema DEBE permitir crear un cliente nuevo vía un Dialog modal (`ClienteCreateDialog`) con formulario validado por Zod. Submit llama `POST /api/v1/clientes`. El botón "Nuevo cliente" DEBE ser visible en la parte superior de la tabla. El campo `prospecto_origen_id` DEBE ser `null` en clientes creados manualmente.

**Campos**: `nombre_contacto` (requerido), `empresa_id` (Select requerido), `responsable_id` (Select requerido), `correo_contacto` (opcional), `telefono_contacto` (opcional), `cargo_contacto` (opcional), `como_nos_conocio` (Select opcional), `notas` (textarea opcional).

#### Scenario: Creación exitosa [integration test]

- GIVEN el usuario hace clic en "Nuevo cliente"
- WHEN ingresa `nombre_contacto: "Pedro Sánchez"`, selecciona empresa y responsable, y envía
- THEN el sistema invoca `POST /clientes`, recibe 201
- AND el Dialog se cierra
- AND la query `['clientes']` se invalida
- AND se muestra un toast de éxito

#### Scenario: Validación nombre requerido [component test]

- WHEN el usuario envía el form sin `nombre_contacto`
- THEN se muestra el error "El nombre del contacto es requerido" inline
- AND no se llama al backend

#### Scenario: prospecto_origen_id es null en cliente manual [hook test]

- GIVEN el usuario crea un cliente vía diálogo manual
- WHEN el hook envía el payload al endpoint
- THEN el body contiene `prospecto_origen_id: null` o el campo está ausente (se interpreta como null en el backend)

#### Scenario: Error 422 mapea field errors [integration test]

- WHEN el backend responde 422 con `details: [{field: "nombre_contacto", message: "ya existe"}]`
- THEN el formulario mapea el error con `setError` en el campo correspondiente
- AND el Dialog permanece abierto

---

### Requirement: Editar cliente

El sistema DEBE permitir editar un cliente existente vía un Dialog modal (`ClienteEditDialog`) con formulario prefilled, validado por Zod. Submit llama `PATCH /api/v1/clientes/:id`. Los valores iniciales se cargan desde el cliente seleccionado (obtenido del cache o de `GET /clientes/:id`).

#### Scenario: Edición exitosa [integration test]

- GIVEN el usuario está en `/clientes/:id` y hace clic en "Editar"
- WHEN cambia `nombre_contacto` a "Pedro M. Sánchez" y envía
- THEN el sistema invoca `PATCH /clientes/:id`, recibe 200
- AND las queries `['clientes']` y `['clientes', id]` se invalidan
- AND el detalle refleja el nuevo nombre

#### Scenario: Form prefilled con datos actuales [component test]

- GIVEN un cliente tiene `nombre_contacto: "Ana Torres"` y `correo_contacto: "ana@example.com"`
- WHEN se abre el Dialog de edición
- THEN el campo `nombre_contacto` muestra "Ana Torres" y `correo_contacto` muestra "ana@example.com"

#### Scenario: Error 422 en edición muestra details [integration test]

- WHEN el backend responde 422 con details en edición
- THEN el formulario mapea los errores y el Dialog permanece abierto

---

### Requirement: Eliminar cliente con validación 409

El sistema DEBE permitir eliminar un cliente tras confirmación explícita en un `AlertDialog` (`ClienteDeleteDialog`). Submit llama `DELETE /api/v1/clientes/:id`. Si el backend responde 409 (cliente con tratos asociados), el sistema DEBE mostrar un mensaje de error con el conteo de tratos y NO eliminar el cliente. Si la respuesta es 204, el sistema DEBE redirigir a `/clientes`.

#### Scenario: Eliminación exitosa redirige a lista [integration test]

- GIVEN el usuario está en `/clientes/:id` y hace clic en "Eliminar"
- WHEN confirma en el AlertDialog y el backend responde 204
- THEN el router navega a `/clientes`
- AND se muestra un toast "Cliente eliminado"

#### Scenario: Cancelar cierra dialog sin acción [component test]

- GIVEN el AlertDialog de confirmación está abierto
- WHEN el usuario hace clic en "Cancelar"
- THEN el dialog se cierra
- AND no se invoca `DELETE /clientes/:id`

#### Scenario: 409 muestra mensaje con conteo de tratos [integration test]

- GIVEN el cliente tiene 3 tratos asociados
- WHEN el usuario confirma eliminar y el backend responde 409
- THEN se muestra un mensaje de error indicando que el cliente tiene tratos asociados y no puede eliminarse
- AND el cliente permanece en el sistema
- AND el AlertDialog puede cerrarse sin eliminar

#### Scenario: 409 con message del backend se muestra en toast [integration test]

- GIVEN el backend responde 409 con `{ message: "tiene 3 tratos asociados" }`
- WHEN el sistema procesa el error
- THEN el toast de error muestra el texto "tiene 3 tratos asociados"

---

### Requirement: Detalle del cliente — header y badge de origen

El sistema DEBE mostrar la página `/clientes/:id` con un header que incluye el `nombre_contacto`, el nombre de la empresa vinculada, las acciones (Editar, Eliminar), y un badge de origen. Si `prospecto_origen_id !== null`, el badge DEBE ser clickeable y navegar a `/prospectos/:prospecto_origen_id`. Si `prospecto_origen_id === null`, DEBE mostrar el texto "Origen: Manual" sin link.

Si `GET /clientes/:id` responde 404, el sistema DEBE mostrar toast de error y redirigir a `/clientes`.

#### Scenario: Badge "Origen: Prospecto convertido" es clickeable [integration test]

- GIVEN un cliente tiene `prospecto_origen_id: "b1111111"`
- WHEN el usuario visualiza la página de detalle
- THEN se muestra un badge/link "Origen: Prospecto convertido"
- AND al hacer clic navega a `/prospectos/b1111111`

#### Scenario: Badge "Origen: Manual" sin link [component test]

- GIVEN un cliente tiene `prospecto_origen_id: null`
- WHEN se renderiza el header del detalle
- THEN se muestra el texto "Origen: Manual"
- AND ese texto NO es un link navegable

#### Scenario: 404 redirige a lista [integration test]

- WHEN `GET /clientes/:id` responde 404
- THEN se muestra un toast de error
- AND el router navega a `/clientes`

---

### Requirement: Tab Información del detalle

El sistema DEBE mostrar la tab "Información" con todos los campos del cliente: `nombre_contacto`, `correo_contacto`, `telefono_contacto`, `cargo_contacto`, `como_nos_conocio`, `notas`, empresa (como link a `/empresas/:id`), responsable (como link o texto), `creado_en`, `actualizado_en`. Los campos nulos DEBEN mostrarse como "—".

#### Scenario: Tab Información muestra todos los campos [integration test]

- GIVEN el cliente tiene todos los campos completos
- WHEN el usuario visualiza la tab "Información"
- THEN se muestran todos los campos con sus valores correspondientes
- AND la empresa aparece como link a `/empresas/:empresa_id`

#### Scenario: Campos nulos muestran "—" [component test]

- GIVEN el cliente tiene `cargo_contacto: null`, `notas: null`, `como_nos_conocio: null`
- WHEN se renderiza la tab "Información"
- THEN esos campos muestran el carácter "—" en lugar de estar vacíos o mostrar "null"

---

### Requirement: Tab Tratos del detalle (read-only)

El sistema DEBE mostrar la tab "Tratos" en `/clientes/:id` con la lista de tratos donde `Trato.cliente_id === cliente.id`, consumiendo `GET /api/v1/clientes/:id/tratos` (o `GET /api/v1/tratos?cliente_id=:id`) con cache bajo la key `['clientes', id, 'tratos']`. El tab DEBE cargarse lazy (solo cuando el usuario lo activa). No DEBE haber botón de crear trato ni links al detalle de trato (Change 6).

#### Scenario: Tab Tratos carga al activar [integration test]

- GIVEN el usuario está en `/clientes/:id` con la tab "Información" activa
- WHEN hace clic en la tab "Tratos"
- THEN el sistema invoca `GET /clientes/:id/tratos` (o equivalente)
- AND se muestra la lista de tratos read-only sin botones de acción

#### Scenario: Tab Tratos sin tratos muestra empty state [integration test]

- GIVEN el cliente no tiene tratos vinculados
- WHEN el usuario activa la tab "Tratos"
- THEN el endpoint devuelve `[]`
- AND se muestra "Sin tratos vinculados"

#### Scenario: Tab Tratos con error muestra mensaje de error [integration test]

- GIVEN el endpoint responde 500
- WHEN el usuario activa la tab "Tratos"
- THEN se muestra un mensaje de error

#### Scenario: Tab NO muestra botón crear trato [component test]

- GIVEN la tab "Tratos" está activa
- WHEN se inspecciona el contenido del tab
- THEN NO existe ningún botón o link para "Crear trato" o "Nuevo trato"

---

### Requirement: Migración del hook useClientes sin regresión

El sistema DEBE mover `src/features/prospectos/hooks/useClientes.ts` a `src/features/clientes/hooks/useClientes.ts` y actualizar el import en `ProspectosListPage.tsx` en el mismo commit atómico. La key de cache `['clientes']` DEBE mantenerse idéntica para no romper la invalidación de `useConvertirProspecto`. El tab Convertidos de `/prospectos` DEBE seguir funcionando tras la migración.

#### Scenario: Tab Convertidos sigue funcionando post-migración [integration test]

- GIVEN se ha migrado `useClientes` a `features/clientes/hooks/`
- WHEN el usuario navega al tab "Convertidos" en `/prospectos`
- THEN los prospectos convertidos se muestran correctamente (mismo comportamiento que antes de la migración)

#### Scenario: useConvertirProspecto invalida ['clientes'] correctamente [hook test]

- GIVEN `useClientes` usa `queryKey: ['clientes']` en su nueva ubicación
- WHEN `useConvertirProspecto` invalida la key `['clientes']` tras una conversión exitosa
- THEN el listado de clientes se refresca automáticamente

#### Scenario: type-check pasa tras el commit de migración [manual smoke]

- GIVEN se ejecuta `pnpm type-check` tras la migración
- THEN exit 0 sin errores de TypeScript en imports de `useClientes`

---

### Requirement: Invalidación de cache tras mutaciones

El sistema DEBE invalidar las query keys afectadas tras cada mutación exitosa.

| Mutación | Keys a invalidar |
|----------|-----------------|
| Crear cliente | `['clientes']` |
| Editar cliente | `['clientes']`, `['clientes', id]` |
| Eliminar cliente (204) | remove `['clientes', id]` + invalidate `['clientes']` |

#### Scenario: Crear cliente invalida la lista [hook test]

- GIVEN `useCreateCliente` ejecuta `POST /clientes` con éxito (201)
- WHEN la mutación se resuelve
- THEN `queryClient.invalidateQueries(['clientes'])` es invocado

#### Scenario: Eliminar cliente remueve la key individual [hook test]

- GIVEN `useDeleteCliente` ejecuta `DELETE /clientes/:id` con éxito (204)
- WHEN la mutación se resuelve
- THEN `queryClient.removeQueries(['clientes', id])` y `invalidateQueries(['clientes'])` son invocados

---

## API Contract Reference

| Método | Path | Descripción |
|--------|------|-------------|
| GET | `/api/v1/clientes` | Lista clientes; soporta `?empresa_id=`, `?origen=` |
| POST | `/api/v1/clientes` | Crea un cliente nuevo (`prospecto_origen_id: null`) |
| GET | `/api/v1/clientes/:id` | Obtiene un cliente por id |
| PATCH | `/api/v1/clientes/:id` | Edita un cliente |
| DELETE | `/api/v1/clientes/:id` | Elimina (204) o bloquea (409 si hay tratos) |
| GET | `/api/v1/clientes/:id/tratos` | Lista tratos del cliente (read-only) |

Errores normalizados con `{ status, error, message, details? }`.

## Out of Scope

- CRUD de Tratos (Change 6)
- Links al detalle de trato desde el tab Tratos (Change 6)
- Tableros / Kanban de clientes (Change 7)
- Tags y comentarios (Change 8)
- Soft delete / campo `activo`
- Cascading delete
- Operaciones bulk / export / import
