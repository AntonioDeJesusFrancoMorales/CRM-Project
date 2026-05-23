# prospectos-management Specification

**Capability**: prospectos-management
**Change**: prospectos-crud
**Status**: draft

## Purpose

Provee la gestión completa de prospectos en el CRM Pipely: vista Kanban por estado (`frio` / `tibio` / `caliente`), creación, edición, eliminación, cambio de estado in-place, y página de detalle con tabs Información y Tratos. Es el primer Change que usa layout Kanban en lugar de tabla densa, representando visualmente el pipeline comercial.

La capability incluye también la estructura de routing (`/prospectos` y `/prospectos/:id`), los filtros del top-bar y el reemplazo del placeholder existente. La conversión a cliente y el tab Convertidos se especifican en la capability `prospecto-conversion`.

## Requirements

### Requirement: Listado Kanban de prospectos activos

El sistema MUST mostrar `/prospectos` con un Kanban de 3 columnas fijas — `Frío`, `Tibio`, `Caliente` — consumiendo `GET /api/v1/prospectos` con cache TanStack Query bajo la key `['prospectos']`. Solo se muestran prospectos cuyo `estado_posible_cliente !== 'convertido'`. Cada card muestra: nombre del contacto, empresa vinculada, responsable, y un Select inline de estado.

#### Scenario: Kanban poblado con datos fixture

- GIVEN el usuario autenticado navega a `/prospectos`
- WHEN el endpoint responde con un array de prospectos con estados `frio`, `tibio`, `caliente`
- THEN se renderiza el Kanban con 3 columnas y cada prospecto aparece en la columna correspondiente a su `estado_posible_cliente`
- AND los prospectos con `estado_posible_cliente === 'convertido'` NO aparecen en ninguna columna activa

#### Scenario: Columna sin prospectos muestra estado vacío

- GIVEN el endpoint devuelve prospectos pero ninguno tiene `estado_posible_cliente === 'frio'`
- WHEN se renderiza la columna "Frío"
- THEN la columna muestra un mensaje vacío (ej: "Sin prospectos en este estado")

#### Scenario: Error de servidor en listado

- GIVEN el endpoint responde 500
- WHEN la query falla
- THEN se muestra un mensaje de error con botón "Reintentar"
- AND no se renderiza ninguna columna del Kanban

---

### Requirement: Filtros top-bar

El sistema MUST ofrecer una barra de filtros en la parte superior del Kanban con tres controles:
1. Input de búsqueda por `nombre_contacto` (filtrado **client-side**, case-insensitive sobre los datos ya cargados).
2. Select de responsable (pasa `responsable_id` como query param al endpoint — filtrado **server-side**).
3. Toggle "Solo míos" que prefiltra `responsable_id = useAuthStore.usuario.id` (también server-side).

El filtro por `estado_posible_cliente` MUST NOT existir en el top-bar (eliminado — el Kanban ya agrupa visualmente por estado).

#### Scenario: Búsqueda por nombre_contacto filtra cards en tiempo real

- GIVEN el Kanban muestra 3 prospectos: "Carlos Méndez", "Lucía Pérez", "Roberto Sánchez"
- WHEN el usuario escribe "carlo" en el input de búsqueda
- THEN solo se muestra la card de "Carlos Méndez" en su columna
- AND las demás columnas quedan vacías o con el estado vacío correspondiente

#### Scenario: Toggle "Solo míos" prefiltra por responsable del usuario en sesión

- GIVEN el usuario autenticado tiene `id: '11111111'`
- WHEN activa el toggle "Solo míos"
- THEN el hook invoca `GET /prospectos?responsable_id=11111111`
- AND solo se muestran prospectos asignados al usuario en sesión

#### Scenario: Select de responsable pasa param al endpoint

- GIVEN el top-bar tiene el Select de responsable
- WHEN el usuario selecciona un responsable con id `22222222`
- THEN el hook invoca `GET /prospectos?responsable_id=22222222`
- AND el Kanban muestra solo los prospectos de ese responsable

#### Scenario: Limpiar búsqueda restaura todas las cards

- GIVEN hay texto en el input de búsqueda que filtra las cards
- WHEN el usuario borra el texto
- THEN se muestran todas las cards sin filtro de nombre

---

### Requirement: Crear prospecto

El sistema MUST permitir crear un prospecto nuevo vía un Dialog modal (`ProspectoFormDialog` en modo `create`) con formulario validado por Zod. Submit llama `POST /api/v1/prospectos`. El botón "Nuevo prospecto" MUST estar visible en la parte superior del Kanban.

**Campos del formulario**: `nombre_contacto` (requerido), `empresa_id` (Select requerido, cargado con `useEmpresas()`), `responsable_id` (Select requerido, cargado con `useUsuarios()`), `correo_contacto` (opcional), `telefono_contacto` (opcional), `cargo_contacto` (opcional), `como_nos_conocio` (Select opcional), `estado_posible_cliente` (Select, default `frio`), `notas` (textarea opcional).

#### Scenario: Creación exitosa

- GIVEN el usuario hace clic en "Nuevo prospecto"
- WHEN ingresa `nombre_contacto: "Pedro Gómez"`, selecciona empresa y responsable, y envía
- THEN el sistema invoca `POST /prospectos`, recibe 201
- AND el Dialog se cierra
- AND la query `['prospectos']` se invalida
- AND la nueva card aparece en la columna correspondiente al estado seleccionado
- AND se muestra un toast de éxito

#### Scenario: Validación client-side nombre requerido

- WHEN el usuario envía el form sin `nombre_contacto`
- THEN se muestra "El nombre del contacto es requerido" inline
- AND no se llama al backend

#### Scenario: Error 422 del backend mapea field errors

- WHEN el backend responde 422 con `details: [{field: "nombre_contacto", message: "ya existe"}]`
- THEN el formulario mapea cada error con `setError` en el campo correspondiente
- AND el Dialog permanece abierto

---

### Requirement: Editar prospecto

El sistema MUST permitir editar un prospecto existente reutilizando `ProspectoFormDialog` en modo `edit`. Submit llama `PATCH /api/v1/prospectos/:id`. Los valores iniciales se cargan desde el prospecto seleccionado.

**Edición post-conversión**: cuando `prospecto.estado_posible_cliente === 'convertido'`, el form MUST renderizar TODOS los campos en estado `disabled` a excepción del campo `notas`, que MUST permanecer editable.

#### Scenario: Edición exitosa de prospecto activo

- GIVEN existe un prospecto con `nombre_contacto: "Carlos Méndez"` y `estado: 'caliente'`
- WHEN el usuario hace clic en "Editar", cambia el nombre a "Carlos M. Ruiz" y envía
- THEN el sistema invoca `PATCH /prospectos/:id`, recibe 200
- AND la query `['prospectos']` y `['prospectos', id]` se invalidan
- AND la card refleja el nuevo nombre

#### Scenario: Form en modo post-conversión deshabilita todos los campos salvo notas

- GIVEN un prospecto tiene `estado_posible_cliente === 'convertido'`
- WHEN el usuario abre el Dialog de edición de ese prospecto
- THEN todos los campos del form están en estado `disabled` (`nombre_contacto`, `empresa_id`, `responsable_id`, `correo_contacto`, `telefono_contacto`, `cargo_contacto`, `como_nos_conocio`, `estado_posible_cliente`)
- AND únicamente el campo `notas` está habilitado y editable

#### Scenario: Guardar notas de un prospecto convertido

- GIVEN un prospecto convertido tiene `notas: null`
- WHEN el usuario escribe "Referido por cliente VIP" en el campo notas y guarda
- THEN el sistema invoca `PATCH /prospectos/:id` con `{ notas: "Referido por cliente VIP" }`
- AND recibe 200 y el detalle refleja las notas actualizadas

#### Scenario: Error 422 en edición muestra details

- WHEN el backend responde 422 con details en edición
- THEN el formulario mapea los errores con `setError` y el Dialog permanece abierto

---

### Requirement: Eliminar prospecto

El sistema MUST permitir eliminar un prospecto tras confirmación explícita en un `AlertDialog` (`ProspectoDeleteDialog`). Submit llama `DELETE /api/v1/prospectos/:id`.

#### Scenario: Eliminación exitosa

- GIVEN el usuario abre el menú de acciones de una card
- WHEN hace clic en "Eliminar", aparece el AlertDialog y confirma
- THEN el sistema invoca `DELETE /prospectos/:id`, recibe 204
- AND la card desaparece del Kanban
- AND se muestra toast "Prospecto eliminado"

#### Scenario: Cancelar cierra el dialog sin acción

- GIVEN el AlertDialog de confirmación está abierto
- WHEN el usuario hace clic en "Cancelar"
- THEN el dialog se cierra
- AND no se invoca el endpoint

#### Scenario: 404 al eliminar muestra error y refresca lista

- WHEN el backend responde 404 al eliminar
- THEN se muestra toast de error
- AND la query `['prospectos']` se invalida para reflejar el estado real

---

### Requirement: Cambio de estado in-place

El sistema MUST ofrecer en cada card del Kanban un `Select` inline con las opciones `frio`, `tibio`, `caliente` (y `convertido` como opción de solo lectura cuando aplica). Al cambiar el valor, el sistema invoca `PATCH /api/v1/prospectos/:id` con el nuevo `estado_posible_cliente` y la card se mueve a la columna correspondiente al finalizar la invalidación.

#### Scenario: Select inline mueve card a la columna correcta

- GIVEN existe una card de "Lucía Pérez" en la columna "Tibio"
- WHEN el usuario selecciona "Caliente" en el Select inline de esa card
- THEN el sistema invoca `PATCH /prospectos/:id` con `{ estado_posible_cliente: 'caliente' }`, recibe 200
- AND la query `['prospectos']` se invalida
- AND la card aparece en la columna "Caliente" y desaparece de "Tibio"

#### Scenario: Card convertida muestra estado deshabilitado en Select

- GIVEN un prospecto tiene `estado_posible_cliente === 'convertido'`
- WHEN se renderiza el Select inline de su card (si aparece en la vista Activos)
- THEN el Select está deshabilitado o el estado 'convertido' se muestra como label sin opción de cambio

#### Scenario: Error de red en PATCH de estado muestra toast y no mueve la card

- GIVEN el usuario cambia el estado de una card
- WHEN el endpoint responde 500
- THEN se muestra un toast de error
- AND la card permanece en su columna original

---

### Requirement: Detalle del prospecto

El sistema MUST mostrar la página `/prospectos/:id` (`ProspectoDetailPage`) con dos tabs: **Información** y **Tratos**. Incluye un header con nombre del contacto y acciones consolidadas (Convertir a cliente, Editar, Eliminar, Select de estado in-place).

Si el endpoint `GET /api/v1/prospectos/:id` responde 404, el sistema MUST mostrar mensaje "Prospecto no encontrado", botón "Volver a Prospectos" y ejecutar un redirect automático a `/prospectos`.

#### Scenario: Detalle con id válido muestra tab Información

- GIVEN existe el prospecto con id `b1111111` (`Carlos Méndez`)
- WHEN el usuario navega a `/prospectos/b1111111`
- THEN se muestra el nombre en el header
- AND la tab "Información" muestra todos los campos (`empresa_id` como link a `/empresas/:id`, responsable, correo, teléfono, cargo, como_nos_conocio, notas — nulls como "—")

#### Scenario: Detalle con id inexistente redirige

- WHEN el endpoint `/prospectos/:id` responde 404
- THEN se muestra toast "Prospecto no encontrado"
- AND se ejecuta redirect automático a `/prospectos`

#### Scenario: Tab Información muestra badge "Convertido" cuando aplica

- GIVEN el prospecto tiene `estado_posible_cliente === 'convertido'`
- WHEN se renderiza el header del detalle
- THEN se muestra un badge "Convertido" visible junto al nombre

---

### Requirement: Tab Tratos del detalle (read-only)

El sistema MUST mostrar la lista de tratos del prospecto en la tab "Tratos" de `/prospectos/:id`, consumiendo `GET /api/v1/prospectos/:id/tratos` con cache bajo la key `['prospectos', id, 'tratos']`. El tab se carga **lazy** (solo cuando el usuario activa la tab — comportamiento default de `TabsContent`). El contenido es **read-only** en este Change; no hay acciones de CRUD de tratos.

#### Scenario: Tab Tratos carga al activar

- GIVEN el usuario está en `/prospectos/b1111111` con la tab "Información" activa
- WHEN hace clic en la tab "Tratos"
- THEN el sistema invoca `GET /prospectos/b1111111/tratos`
- AND se muestra la lista de tratos vinculados (read-only, sin botones de acción)

#### Scenario: Tab Tratos sin tratos muestra empty state

- GIVEN el prospecto no tiene tratos vinculados
- WHEN el usuario activa la tab "Tratos"
- THEN el endpoint devuelve `[]`
- AND se muestra un mensaje "Sin tratos vinculados"

#### Scenario: Tab Tratos con error muestra mensaje de error

- GIVEN el endpoint `GET /prospectos/:id/tratos` responde 500
- WHEN el usuario activa la tab
- THEN se muestra un mensaje de error

---

### Requirement: Routing y wiring

El sistema MUST reemplazar `ProspectosPlaceholder` en `src/routes/router.tsx` por `ProspectosListPage` y agregar la ruta anidada `/prospectos/:id` apuntando a `ProspectoDetailPage`. El export de `ProspectosPlaceholder` en `src/routes/placeholders.tsx` MUST ser eliminado. El link de sidebar a `/prospectos` ya está habilitado y no requiere cambios.

#### Scenario: /prospectos renderiza ProspectosListPage

- GIVEN la app está en estado de autenticación válida
- WHEN el usuario navega a `/prospectos`
- THEN se renderiza `ProspectosListPage` (Kanban con top-bar)
- AND NO se muestra ningún placeholder

#### Scenario: /prospectos/:id renderiza ProspectoDetailPage

- GIVEN existe un prospecto con id `b1111111`
- WHEN el usuario navega a `/prospectos/b1111111`
- THEN se renderiza `ProspectoDetailPage` con tabs Información y Tratos

#### Scenario: ProspectosPlaceholder no existe en el build

- WHEN se ejecuta `pnpm type-check`
- THEN no hay referencias huérfanas a `ProspectosPlaceholder` en el código

---

### Requirement: Invalidación de cache tras mutations

El sistema MUST invalidar las query keys afectadas tras cada mutación exitosa.

| Mutation | Keys a invalidar |
|----------|-----------------|
| Crear | `['prospectos']` |
| Editar | `['prospectos']`, `['prospectos', id]` |
| Eliminar | remove `['prospectos', id]` + invalidate `['prospectos']` |
| Cambiar estado | `['prospectos']`, `['prospectos', id]` |

---

## API Contract Reference

| Método | Path | Descripción |
|--------|------|-------------|
| GET | `/api/v1/prospectos` | Lista prospectos; soporta `?responsable_id=`, `?estado_posible_cliente=`, `?empresa_id=` |
| POST | `/api/v1/prospectos` | Crea un prospecto nuevo |
| GET | `/api/v1/prospectos/:id` | Obtiene un prospecto por id |
| PATCH | `/api/v1/prospectos/:id` | Edita un prospecto |
| DELETE | `/api/v1/prospectos/:id` | Elimina un prospecto |
| GET | `/api/v1/prospectos/:id/tratos` | Lista tratos del prospecto (read-only) |

Cuerpo POST/PATCH: `{ nombre_contacto, empresa_id, responsable_id, correo_contacto?, telefono_contacto?, cargo_contacto?, como_nos_conocio?, estado_posible_cliente?, notas? }`. Errores normalizados con `{ status, error, message, details? }`.

## Out of Scope

- CRUD de tratos (otro Change — aquí solo se consume read-only)
- Drag-and-drop entre columnas (Select inline es la decisión final)
- Paginación o virtualización del Kanban (YAGNI con fixtures actuales)
- Bulk actions, Export CSV
- Filtro top-bar por `estado_posible_cliente` (eliminado definitivamente)
- Optimistic updates en mutations
- Dark mode, responsive mobile
- Cambios a `useAuthStore`, `RoleGuard`, Login, Empresas (más allá del fix bloqueante de `EmpresaProspectosTab.tsx`)
- Conversión a cliente, tab Convertidos y contrato extendido (ver `prospecto-conversion`)
