# tratos-management Specification

**Capability**: tratos-management
**Change**: trato-modelo-unificado (Change 3)
**Status**: active
**Last updated**: 2026-05-28

## Purpose

Provee la gestión completa de Tratos en el CRM Pipely con modelo unificado basado en `contactoId` (elimina polimorfismo XOR cliente/prospecto). Listado plano sin kanban, detalle con tabs, CRUD sin estado (ciclo de vida pospuesto a Change 4), centralización de endpoints RPC. El modelo se alinea con el contrato del back: camelCase plano, sin campo `estado`, sin endpoints de ciclo de vida.

## Requirements

---

### Requirement: Listado de tratos

El sistema MUST mostrar `/tratos` con una tabla que consume `GET /api/tratos` con cache TanStack Query bajo la key `['tratos']`. Columnas: `nombre`, valor estimado, tipo de contrato (badge), contacto vinculado (resuelto client-side), responsable, fecha de cierre esperada. El nombre MUST ser clickeable y navegar a `/tratos/:id`. La tabla es la única vista de `/tratos` (sin toggle kanban/tabla).

#### Scenario: Tabla poblada con datos fixture [integration test]

- GIVEN `GET /api/tratos` devuelve un array no vacío
- WHEN el usuario navega a `/tratos`
- THEN se renderiza una fila por trato con columnas: nombre, valor estimado, tipo de contrato, contacto, responsable, fecha cierre esperada
- AND ninguna columna muestra estado

#### Scenario: Nombre clickeable navega al detalle [integration test]

- GIVEN la tabla muestra un trato con `nombre: "Demo CTO"` e id `d1111111`
- WHEN el usuario hace clic en "Demo CTO"
- THEN el router navega a `/tratos/d1111111`

#### Scenario: Error de servidor muestra botón reintentar [integration test]

- GIVEN `GET /api/tratos` responde 500
- THEN se muestra mensaje de error con botón "Reintentar"
- AND no se renderiza la tabla

---

### Requirement: Filtros del listado

El sistema MUST ofrecer búsqueda client-side por `nombre` (case-insensitive) como único filtro. Los filtros server-side por estado, cliente_id, prospecto_id y responsable_id MUST NOT existir. El endpoint se invoca sin query params.

#### Scenario: Búsqueda por nombre filtra client-side [integration test]

- GIVEN la tabla muestra tratos "Demo CTO", "Migración ERP", "Renovación SLA"
- WHEN el usuario escribe "demo" en el input de búsqueda
- THEN solo aparece la fila "Demo CTO"

#### Scenario: Tabla carga sin query params [hook test]

- WHEN se monta `useTratos()`
- THEN se invoca `GET /api/tratos` sin query params adicionales
- AND la queryKey es `['tratos']`

---

### Requirement: Hook paramétrico useTratos

El sistema MUST exponer `useTratos()` en `src/features/tratos/hooks/useTratos.ts` con queryKey `['tratos']`. El hook MUST consumir `GET /api/tratos` sin filtros de servidor. El hook `useTratosByCliente` MUST ser eliminado.

#### Scenario: useTratos invoca endpoint RPC base [hook test]

- WHEN se monta `useTratos()`
- THEN se invoca `GET /api/tratos`
- AND la queryKey es `['tratos']`

#### Scenario: useTratosByCliente no existe post-migración [unit test]

- WHEN se intenta importar `useTratosByCliente` desde `@/features/clientes/hooks/useTratosByCliente`
- THEN la importación falla (módulo eliminado)

---

### Requirement: Crear trato

El sistema MUST permitir crear un trato nuevo vía `TratoCreateDialog` con form validado por Zod. Submit llama `POST /api/tratos`. El form MUST presentar un único Select "Contacto" (`contactoId`, requerido) que combina prospectos y clientes de la entidad unificada Contacto. El form MUST incluir Select de responsable (`responsableId`, requerido), Select de `tipoContrato` con opciones `SERVICIO|LICENCIA|SUSCRIPCION|PERMANENTE|OTRO`. El form MUST NOT incluir campo `estado` ni toggle XOR prospecto/cliente.

#### Scenario: Creación exitosa con contacto [integration test]

- GIVEN el usuario hace clic en "Nuevo trato"
- WHEN selecciona contacto `ct-1111`, ingresa `nombre: "Demo CTO"`, selecciona responsable, y envía
- THEN se invoca `POST /api/tratos` con `contactoId: 'ct-1111'` y sin campo `estado`
- AND la query `['tratos']` se invalida
- AND se muestra toast de éxito

#### Scenario: Opciones de tipoContrato son del enum del back [component test]

- WHEN se abre el TratoCreateDialog y se inspecciona el Select de tipoContrato
- THEN las opciones disponibles son exactamente: SERVICIO, LICENCIA, SUSCRIPCION, PERMANENTE, OTRO

#### Scenario: Validación bloquea submit sin contacto [component test]

- GIVEN el usuario no selecciona ningún contacto
- WHEN intenta enviar el form
- THEN se muestra error inline en el campo contactoId
- AND no se llama al backend

#### Scenario: Error 422 mapea field errors [integration test]

- WHEN el backend responde 422 con `details: [{ field: "nombre", message: "ya existe" }]`
- THEN el form mapea el error con `setError` en `nombre`
- AND el Dialog permanece abierto

---

### Requirement: Editar trato

El sistema MUST permitir editar un trato existente vía `TratoEditDialog` con form prefilled. Submit llama `PUT /api/tratos?id={id}`. El form MUST mostrar un único Select de Contacto (`contactoId`) prefilled. El form MUST NOT mostrar toggle XOR ni campo `estado`.

#### Scenario: Edición exitosa de nombre [integration test]

- GIVEN el usuario está en `/tratos/d1111111` y hace clic en "Editar"
- WHEN cambia `nombre` a "Demo CTO v2" y envía
- THEN se invoca `PUT /api/tratos?id=d1111111`, recibe 200
- AND las queries `['tratos']` y `['tratos', 'd1111111']` se invalidan

#### Scenario: Form prefilled con datos actuales [component test]

- GIVEN un trato tiene `nombre: "Demo CTO"`, `valorEstimado: 50000`, `contactoId: "ct-1111"`
- WHEN se abre el TratoEditDialog
- THEN `nombre` muestra "Demo CTO", `valorEstimado` muestra 50000, Select Contacto muestra "ct-1111"
- AND no existe toggle XOR ni campo de estado

---

### Requirement: Eliminar trato

El sistema MUST permitir eliminar un trato tras confirmación en `AlertDialog`. Submit llama `DELETE /api/tratos?id={id}`. Si la respuesta es 200/204, el sistema MUST redirigir a `/tratos`.

#### Scenario: Eliminación exitosa redirige a lista [integration test]

- GIVEN el usuario está en `/tratos/d1111111` y hace clic en "Eliminar"
- WHEN confirma y el backend responde 200
- THEN el router navega a `/tratos`
- AND se muestra toast "Trato eliminado"
- AND la query `['tratos']` se invalida

#### Scenario: Cancelar cierra dialog sin acción [component test]

- WHEN el usuario hace clic en "Cancelar" en el AlertDialog
- THEN se cierra el dialog
- AND no se invoca `DELETE`

---

### Requirement: Detalle del trato

El sistema MUST mostrar `/tratos/:id` consumiendo `GET /api/tratos?id={id}`. El layout MUST mostrar un header con nombre del trato y acciones "Editar" y "Eliminar" únicamente. La tab "Información" MUST mostrar: nombre, contacto resuelto (nombre del Contacto), responsable resuelto (nombre del usuario), tipoContrato, motivoPerdida (siempre visible si no es null), valorEstimado, probabilidad, fechaCierreEsperada. El header MUST NOT mostrar badge de estado ni acciones ganar/perder/reabrir. El layout MUST conservar las tabs "Información" y "Tareas" y el badge de pendientes con su comportamiento actual (funcionalidad de tareas, fuera de alcance de este change).

#### Scenario: Detalle con id válido muestra tabs [integration test]

- GIVEN existe el trato `d1111111` con `contactoId: "ct-1111"`
- WHEN el usuario navega a `/tratos/d1111111`
- THEN se renderiza el header con el nombre del trato
- AND se muestran las tabs "Información" y "Tareas"
- AND la tab "Información" está activa por defecto

#### Scenario: Tab Información muestra contacto y responsable resueltos [integration test]

- GIVEN el trato tiene `contactoId: "ct-1111"` y `responsableId: "u-abc"`
- WHEN el usuario está en la tab "Información"
- THEN se muestra el nombre del contacto (resuelto client-side)
- AND se muestra el nombre del responsable (resuelto client-side)
- AND no hay badge de estado ni acciones ganar/perder/reabrir

#### Scenario: motivoPerdida visible cuando no es null [component test]

- GIVEN un trato tiene `motivoPerdida: "precio fuera de presupuesto"`
- WHEN se renderiza la tab Información
- THEN se muestra el campo motivoPerdida con ese texto

#### Scenario: motivoPerdida oculto cuando es null [component test]

- GIVEN un trato tiene `motivoPerdida: null`
- WHEN se renderiza la tab Información
- THEN el campo motivoPerdida NO se muestra (o muestra "—")

#### Scenario: 404 redirige a lista [integration test]

- WHEN `GET /api/tratos?id=inexistente` responde 404
- THEN se muestra toast "Este trato no existe"
- AND el router navega a `/tratos`

---

### Requirement: Centralización de endpoints de tratos

El sistema MUST centralizar las URLs de tratos en `endpoints.tratos` dentro de `src/api/endpoints.ts`. Todos los hooks MUST referenciar `endpoints.tratos` en lugar de URLs hardcodeadas. Las URLs MUST seguir el contrato RPC del back: base `/api`, rutas `/tratos`, `/tratos?id=`, etc.

#### Scenario: endpoints.tratos existe y es referenciado por hooks [unit test]

- WHEN se importa `endpoints` desde `src/api/endpoints.ts`
- THEN `endpoints.tratos` existe y contiene las rutas del contrato RPC
- AND ningún hook de tratos contiene URLs hardcodeadas

---

### Requirement: Invalidación de cache tras mutations

El sistema MUST invalidar las query keys afectadas tras cada mutación exitosa de CRUD básico.

| Mutation | Keys a invalidar |
|---|---|
| Crear trato | `['tratos']` |
| Editar trato | `['tratos']`, `['tratos', id]` |
| Eliminar | `['tratos']` |

#### Scenario: Crear trato invalida la lista [hook test]

- GIVEN `useCreateTrato` ejecuta `POST /api/tratos` con éxito
- WHEN la mutación se resuelve
- THEN `queryClient.invalidateQueries({ queryKey: ['tratos'] })` se invoca

#### Scenario: Editar trato invalida lista e individual [hook test]

- GIVEN `useEditTrato` ejecuta `PUT /api/tratos?id=d1111111` con éxito
- WHEN la mutación se resuelve
- THEN se invalidan `['tratos']` y `['tratos', 'd1111111']`

---

## API Contract Reference

| Método | Path | Descripción |
|---|---|---|
| GET | `/api/tratos` | Lista tratos; sin query params |
| POST | `/api/tratos` | Crea un trato nuevo con `contactoId` (sin `estado`) |
| GET | `/api/tratos?id={id}` | Obtiene un trato por id |
| PUT | `/api/tratos?id={id}` | Edita campos del trato (sin `estado`) |
| DELETE | `/api/tratos?id={id}` | Elimina un trato (200/204) |

Errores normalizados con `{ status, error, message, details? }`.

## Out of Scope

- CRUD de Tareas
- Tab Tareas en detalle de trato (fuera de alcance de este change)
- Kanban / ciclo de vida (pospuesto a Change 4)
- @dnd-kit y drag-and-drop
- Cambio de estado inline
- Modal de motivo_perdida
- Filtros server-side
- Estadísticas, pipeline analytics, conversion rates
- Soft delete, audit trail
