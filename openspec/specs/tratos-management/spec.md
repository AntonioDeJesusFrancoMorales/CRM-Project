# tratos-management Specification

**Capability**: tratos-management
**Change**: tratos-management (Change 6a)
**Status**: proposed

## Purpose

Provee la gestión completa de Tratos en el CRM Pipely: listado filtrable, detalle, CRUD vía diálogos, cambio de estado inline (`abierto → ganado | perdido`) con modal obligatorio para `motivo_perdida`, polimorfismo `cliente_id | prospecto_id` (XOR), y migración del hook `useTratosByCliente` desde `features/clientes/` hacia un hook paramétrico `useTratos`. Es el Change que convierte `Trato` en entidad de primer nivel navegable, paso previo al Kanban (Change 7).

## Requirements

---

### Requirement: Sidebar navegable

El item "Tratos" en el sidebar MUST mostrar un link funcional navegable a `/tratos`. Los atributos `disabled` y `badge: 'Próximamente'` MUST ser eliminados de `src/components/layout/Sidebar.tsx` (patrón recurrente #155).

#### Scenario: Sidebar link navega a /tratos [integration test]

- GIVEN el usuario autenticado está en cualquier ruta de la app
- WHEN hace clic en el item "Tratos" del sidebar
- THEN el router navega a `/tratos`
- AND no se muestra "Próximamente" ni overlay de disabled

#### Scenario: Sidebar item sin disabled [component test]

- WHEN se inspecciona el item "Tratos" del Sidebar
- THEN no tiene atributo `disabled` ni clase CSS de estado deshabilitado

---

### Requirement: Routing de páginas

El sistema MUST wirear `/tratos` (lista) y `/tratos/:id` (detalle) en `src/routes/router.tsx`. El `TratosPlaceholder` MUST ser eliminado de `placeholders.tsx`. NO MUST existir `/tratos/nuevo` (create es Dialog).

#### Scenario: /tratos renderiza TratosListPage [integration test]

- WHEN el usuario navega a `/tratos`
- THEN se renderiza `TratosListPage`
- AND no se muestra placeholder

#### Scenario: /tratos/:id renderiza TratoDetailPage [integration test]

- GIVEN existe un trato con id `d1111111`
- WHEN el usuario navega a `/tratos/d1111111`
- THEN se renderiza `TratoDetailPage` con datos del trato

---

### Requirement: Listado de tratos

El sistema MUST mostrar `/tratos` con una tabla que consume `GET /api/v1/tratos` con cache TanStack Query bajo la key `['tratos', { filters }]`. Columnas: `nombre`, estado (badge), valor estimado, tipo de contrato, cliente/prospecto vinculado, fecha de cierre esperada. El nombre MUST ser clickeable y navegar a `/tratos/:id` (homologación con tablas de empresas/prospectos/clientes).

#### Scenario: Tabla poblada con datos fixture [integration test]

- GIVEN `GET /tratos` devuelve un array no vacío
- WHEN el usuario navega a `/tratos`
- THEN se renderiza una fila por trato con todas las columnas

#### Scenario: Nombre clickeable navega al detalle [integration test]

- GIVEN la tabla muestra un trato con `nombre: "Demo CTO"` e id `d1111111`
- WHEN el usuario hace clic en "Demo CTO"
- THEN el router navega a `/tratos/d1111111`

#### Scenario: Error de servidor muestra botón reintentar [integration test]

- GIVEN `GET /tratos` responde 500
- THEN se muestra mensaje de error con botón "Reintentar"
- AND no se renderiza la tabla

---

### Requirement: Filtros del listado

El sistema MUST ofrecer filtros server-side en la parte superior: `estado` (todos/abierto/ganado/perdido), `cliente_id` (Select con clientes), `prospecto_id` (Select con prospectos), `responsable_id` (Select con usuarios activos). MUST ofrecer búsqueda client-side por `nombre` (case-insensitive). Los filtros server-side MUST embeberse en la queryKey para refetch automático.

#### Scenario: Filtro por estado pasa query param [hook test]

- GIVEN el filtro estado está seteado a `'ganado'`
- WHEN el hook ejecuta la query
- THEN se invoca `GET /tratos?estado=ganado`
- AND la queryKey es `['tratos', { estado: 'ganado' }]`

#### Scenario: Búsqueda por nombre filtra client-side [integration test]

- GIVEN la tabla muestra tratos "Demo CTO", "Migración ERP", "Renovación SLA"
- WHEN el usuario escribe "demo" en el input
- THEN solo aparece la fila "Demo CTO"

#### Scenario: Filtros server-side combinados [hook test]

- GIVEN filtros `{ estado: 'abierto', cliente_id: 'c1111111' }`
- WHEN el hook ejecuta
- THEN se invoca `GET /tratos?estado=abierto&cliente_id=c1111111`

---

### Requirement: Hook paramétrico useTratos

El sistema MUST exponer `useTratos(filters?: { cliente_id?, prospecto_id?, estado?, responsable_id? })` en `src/features/tratos/hooks/useTratos.ts` con queryKey `['tratos', filters ?? {}]`. El hook MUST consumir `GET /api/v1/tratos` con los filtros embebidos como query params. El hook `useTratosByCliente` (en `features/clientes/hooks/`) MUST ser eliminado en el mismo commit que actualiza su único consumidor `ClienteTratosTab`.

#### Scenario: useTratos sin filtros invoca endpoint base [hook test]

- WHEN se monta `useTratos()`
- THEN se invoca `GET /tratos` sin query params
- AND la queryKey es `['tratos', {}]`

#### Scenario: useTratos({ cliente_id }) reemplaza useTratosByCliente [hook test]

- WHEN se monta `useTratos({ cliente_id: 'c1111111' })`
- THEN se invoca `GET /tratos?cliente_id=c1111111`
- AND la queryKey es `['tratos', { cliente_id: 'c1111111' }]`

#### Scenario: useTratosByCliente no existe post-migración [unit test]

- WHEN se intenta importar `useTratosByCliente` desde `@/features/clientes/hooks/useTratosByCliente`
- THEN la importación falla (módulo eliminado)
- AND `clientesKeys.tratos` no existe en `useClientes.ts`

---

### Requirement: Crear trato con polimorfismo XOR

El sistema MUST permitir crear un trato nuevo vía `TratoCreateDialog` con form validado por Zod. Submit llama `POST /api/v1/tratos` con `estado: 'abierto'` por defecto. El form MUST presentar un toggle "Asociar a:" con opciones "Cliente" | "Prospecto" que controla cuál Select aparece. La validación Zod MUST garantizar **exactamente uno** de `cliente_id` o `prospecto_id` (XOR: nunca ambos, nunca ninguno).

**Campos**: toggle asociación (requerido), `cliente_id` XOR `prospecto_id` (Select dependiente del toggle, requerido), `nombre` (requerido), `responsable_id` (Select requerido), `valor_estimado` (number opcional), `probabilidad` (number 0-100 opcional), `fecha_cierre_esperada` (date opcional), `tipo_contrato` (Select opcional: `precio_fijo` / `tiempo_materiales` / `retainer`).

#### Scenario: Creación exitosa con cliente [integration test]

- GIVEN el usuario hace clic en "Nuevo trato"
- WHEN selecciona toggle "Cliente", elige cliente `c1111111`, ingresa `nombre: "Demo CTO"`, responsable, y envía
- THEN se invoca `POST /tratos` con `cliente_id: 'c1111111'`, `prospecto_id: null`
- AND la query `['tratos']` se invalida (prefix match)
- AND se muestra toast de éxito

#### Scenario: Creación exitosa con prospecto [integration test]

- WHEN el usuario selecciona toggle "Prospecto", elige prospecto `b1111111`, completa y envía
- THEN se invoca `POST /tratos` con `prospecto_id: 'b1111111'`, `cliente_id: null`

#### Scenario: Validación XOR — ambos vacíos rechaza submit [component test]

- GIVEN el usuario no selecciona ningún cliente ni prospecto
- WHEN intenta enviar el form
- THEN se muestra error inline "Debe seleccionar un cliente o un prospecto"
- AND no se llama al backend

#### Scenario: Validación XOR — ambos llenos rechaza submit [unit test]

- GIVEN se construye un input con `cliente_id` y `prospecto_id` ambos no-vacíos
- WHEN se ejecuta `tratoCreateSchema.safeParse(input)`
- THEN `success === false`
- AND el error indica violación XOR

#### Scenario: Error 422 mapea field errors [integration test]

- WHEN el backend responde 422 con `details: [{ field: "nombre", message: "ya existe" }]`
- THEN el form mapea el error con `setError` en `nombre`
- AND el Dialog permanece abierto

---

### Requirement: Editar trato

El sistema MUST permitir editar un trato existente vía `TratoEditDialog` con form prefilled. Submit llama `PATCH /api/v1/tratos/:id`. El toggle asociación MUST permanecer editable (permitir mover un trato de prospecto a cliente o viceversa). El estado MUST NOT ser editable desde este form (se cambia vía DropdownMenu o botones del detalle).

#### Scenario: Edición exitosa de nombre [integration test]

- GIVEN el usuario está en `/tratos/d1111111` y hace clic en "Editar"
- WHEN cambia `nombre` a "Demo CTO v2" y envía
- THEN se invoca `PATCH /tratos/d1111111`, recibe 200
- AND las queries `['tratos']` y `['tratos', 'd1111111']` se invalidan

#### Scenario: Form prefilled con datos actuales [component test]

- GIVEN un trato tiene `nombre: "Demo CTO"`, `valor_estimado: 50000`, `cliente_id: "c1111111"`
- WHEN se abre el TratoEditDialog
- THEN `nombre` muestra "Demo CTO", `valor_estimado` muestra 50000, toggle en "Cliente", Select cliente con "c1111111"

#### Scenario: Form de edición no muestra campo estado [component test]

- WHEN se abre el TratoEditDialog
- THEN no existe ningún input para `estado`
- AND el cambio de estado se realiza fuera del form

---

### Requirement: Eliminar trato con validación 409

El sistema MUST permitir eliminar un trato tras confirmación explícita en un `AlertDialog` (`TratoDeleteDialog`). Submit llama `DELETE /api/v1/tratos/:id`. Si el backend responde 409 (trato con tareas asociadas), el sistema MUST mostrar mensaje de error con el conteo de tareas y NO eliminar el trato. Si la respuesta es 204, el sistema MUST redirigir a `/tratos`.

#### Scenario: Eliminación exitosa redirige a lista [integration test]

- GIVEN el usuario está en `/tratos/:id` y hace clic en "Eliminar"
- WHEN confirma y el backend responde 204
- THEN el router navega a `/tratos`
- AND se muestra toast "Trato eliminado"
- AND la query `['tratos', id]` se remueve y `['tratos']` se invalida

#### Scenario: 409 muestra mensaje con conteo de tareas [integration test]

- GIVEN el trato tiene 2 tareas asociadas
- WHEN el usuario confirma y el backend responde 409 con `{ message: "tiene 2 tareas asociadas" }`
- THEN se muestra toast de error con ese texto
- AND el trato permanece en el sistema
- AND el AlertDialog se cierra

#### Scenario: Cancelar cierra dialog sin acción [component test]

- WHEN el usuario hace clic en "Cancelar" en el AlertDialog
- THEN se cierra el dialog
- AND no se invoca `DELETE`

---

### Requirement: Detalle del trato

El sistema MUST mostrar `/tratos/:id` con layout TABBED: un header superior y dos tabs ("Información" y "Tareas") controladas por `useTabSync(['info','tareas'],'info')`.

**Header** (dos zonas):
- Izquierda: botón volver + `<h1>{trato.nombre}</h1>` + `TratoEstadoBadge` + badge de tareas pendientes (count derivado de `useTareas({ trato_id, estado: 'pendiente' })`; si count > 0, muestra el número).
- Derecha: las 5 acciones existentes (Marcar como ganado, Marcar como perdido…, Reabrir, Editar, Eliminar) PERMANECEN en el header.

**Tab "Información"** (`TratoInfoTab`): los campos actuales del detalle (nombre, estado, valor estimado, probabilidad, fecha cierre esperada, tipo de contrato, cliente/prospecto vinculado, responsable, `motivo_perdida`, `creado_en`, `actualizado_en`). Campos nulos MUST mostrarse como "—".

**Tab "Tareas"** (`TratoTareasTab`): tabla de tareas del trato (`useTareas({ trato_id })`) + botón "Crear tarea" que abre `TareaCreateDialog` con `tratoIdFijo={trato.id}` (Select de trato precargado y bloqueado).

El badge de pendientes MUST derivarse del MISMO query que alimenta el tab Tareas (sin tercera query). El query MUST montarse a nivel de `TratoDetailPage`, no dentro del `TabsContent`.

Si `GET /tratos/:id` responde 404, el sistema MUST mostrar toast "Este trato no existe" y redirigir a `/tratos`.

(Previously: `TratoDetailPage` tenía layout plano sin tabs; los campos se mostraban directamente en la página; no existían el tab "Tareas" ni el badge de pendientes.)

#### Scenario: Detalle con id válido muestra tabs [integration test]

- GIVEN existe el trato `d1111111` con `cliente_id: "c1111111"`
- WHEN el usuario navega a `/tratos/d1111111`
- THEN se renderiza el header con el nombre del trato
- AND se muestran las tabs "Información" y "Tareas"
- AND la tab "Información" está activa por defecto

#### Scenario: Tab Información muestra campos del trato [integration test]

- GIVEN el usuario está en `/tratos/d1111111` con la tab "Información" activa
- THEN se muestran todos los campos (nombre, estado, valor estimado, cliente vinculado como link a `/clientes/c1111111`, etc.)

#### Scenario: motivo_perdida visible solo si estado=perdido [component test]

- GIVEN un trato tiene `estado: 'abierto'` y `motivo_perdida: null`
- WHEN se renderiza la tab Información
- THEN no se muestra el campo `motivo_perdida`
- AND cuando el trato tiene `estado: 'perdido'` con `motivo_perdida: "precio fuera de presupuesto"`, ese texto SÍ se muestra

#### Scenario: Header muestra las 5 acciones de estado [component test]

- GIVEN el usuario está en `/tratos/d1111111` con `estado: 'abierto'`
- WHEN se renderiza el header
- THEN están visibles las acciones "Marcar como ganado", "Marcar como perdido…", Editar, Eliminar
- AND "Reabrir" está deshabilitado (estado es 'abierto')

#### Scenario: Badge de pendientes muestra count cuando hay tareas [integration test]

- GIVEN el trato `d1111111` tiene 2 tareas con `estado: 'pendiente'`
- WHEN el usuario navega a `/tratos/d1111111`
- THEN el header muestra el badge con el número "2"
- AND no se realiza una tercera query adicional (el badge usa el mismo query del tab Tareas)

#### Scenario: Badge de pendientes no visible cuando count es cero [component test]

- GIVEN el trato `d2222222` no tiene tareas con `estado: 'pendiente'`
- WHEN se renderiza el header
- THEN el badge de pendientes NO está visible (o muestra "0" en su ausencia)

#### Scenario: Tab Tareas muestra tabla de tareas del trato [integration test]

- GIVEN el trato `d1111111` tiene 3 tareas asociadas
- WHEN el usuario hace clic en la tab "Tareas"
- THEN se renderiza la tabla con las 3 tareas
- AND está visible el botón "Crear tarea"

#### Scenario: Crear tarea desde tab del trato bloquea Select de trato [integration test]

- GIVEN el usuario está en la tab "Tareas" del trato `d1111111`
- WHEN hace clic en "Crear tarea" y se abre el dialog
- THEN el Select de trato muestra el nombre del trato `d1111111` y está `disabled`
- AND al enviar el form se invoca `POST /tratos/d1111111/tareas`

#### Scenario: Tab activo persiste en URL via useTabSync [integration test]

- GIVEN el usuario navega a `/tratos/d1111111` y hace clic en la tab "Tareas"
- THEN la URL refleja `?tab=tareas`
- AND al recargar la página la tab "Tareas" sigue activa

#### Scenario: 404 redirige a lista [integration test]

- WHEN `GET /tratos/:id` responde 404
- THEN se muestra toast "Este trato no existe"
- AND el router navega a `/tratos`

---

### Requirement: Cambio de estado inline

El sistema MUST ofrecer cambio de estado del trato desde dos ubicaciones:
1. **Tabla** (`TratosListPage`): un DropdownMenu por fila con ítems "Marcar como ganado", "Marcar como perdido…", "Reabrir" (visible solo si `estado !== 'abierto'`). Ítems incompatibles con el estado actual MUST estar deshabilitados.
2. **Detalle** (`TratoDetailPage`): botones equivalentes en el header.

Marcar como ganado MUST invocar `PATCH /api/v1/tratos/:id/ganar`. Reabrir MUST invocar `PATCH /api/v1/tratos/:id` con `{ estado: 'abierto', motivo_perdida: null }`. Marcar como perdido NEVER invoca el endpoint directamente — siempre abre `TratoPerderDialog` (ver siguiente requirement).

#### Scenario: DropdownMenu en fila ofrece acciones por estado [component test]

- GIVEN un trato tiene `estado: 'abierto'`
- WHEN se abre el DropdownMenu de la fila
- THEN ítem "Marcar como ganado" está habilitado
- AND ítem "Marcar como perdido…" está habilitado
- AND ítem "Reabrir" NO está visible (o está deshabilitado)

#### Scenario: Marcar como ganado invoca /ganar [integration test]

- GIVEN un trato `d1111111` con `estado: 'abierto'`
- WHEN el usuario selecciona "Marcar como ganado"
- THEN se invoca `PATCH /tratos/d1111111/ganar`
- AND las queries `['tratos']` y `['tratos', 'd1111111']` se invalidan
- AND el badge de estado refleja "Ganado"

#### Scenario: Reabrir trato perdido limpia motivo_perdida [integration test]

- GIVEN un trato con `estado: 'perdido'` y `motivo_perdida: "..."`
- WHEN el usuario selecciona "Reabrir"
- THEN se invoca `PATCH /tratos/:id` con `{ estado: 'abierto', motivo_perdida: null }`

---

### Requirement: Modal obligatorio motivo_perdida

El sistema MUST abrir `TratoPerderDialog` cuando el usuario intente marcar un trato como `perdido` (desde tabla o detalle). El modal MUST contener un textarea `motivo_perdida` validado por Zod como string requerido (no-vacío, mínimo 1 caracter, máximo 2000). Submit MUST invocar `PATCH /api/v1/tratos/:id/perder` con `{ motivo_perdida }`. Cancelar MUST cerrar el modal sin cambios.

El endpoint `PATCH /perder` MUST devolver 422 si `motivo_perdida` falta o es vacío, mapeado a inline error en el textarea.

#### Scenario: Marcar perdido abre el modal [integration test]

- GIVEN el usuario hace clic en "Marcar como perdido…" en cualquier ubicación
- THEN se abre `TratoPerderDialog` con textarea vacío
- AND no se invoca el endpoint hasta el submit del modal

#### Scenario: Submit con motivo válido marca como perdido [integration test]

- GIVEN el modal está abierto para el trato `d1111111`
- WHEN el usuario ingresa "precio fuera de presupuesto" y envía
- THEN se invoca `PATCH /tratos/d1111111/perder` con `{ motivo_perdida: "precio fuera de presupuesto" }`
- AND las queries `['tratos']` y `['tratos', 'd1111111']` se invalidan
- AND el modal se cierra y el badge refleja "Perdido"

#### Scenario: Submit con motivo vacío bloquea acción [component test]

- WHEN el usuario intenta enviar el modal sin completar el textarea
- THEN se muestra error inline "El motivo de pérdida es requerido"
- AND no se invoca el endpoint

#### Scenario: Cancelar cierra sin cambios [component test]

- WHEN el usuario hace clic en "Cancelar"
- THEN el modal se cierra
- AND el estado del trato NO cambia

---

### Requirement: Invalidación de cache tras mutations

El sistema MUST invalidar las query keys afectadas tras cada mutación exitosa.

| Mutation | Keys a invalidar |
|---|---|
| Crear trato | `['tratos']` (prefix match cubre todos los filtros) |
| Editar trato | `['tratos']`, `['tratos', id]` |
| Eliminar (204) | remove `['tratos', id]` + invalidate `['tratos']` |
| Ganar | `['tratos']`, `['tratos', id]` |
| Perder | `['tratos']`, `['tratos', id]` |

#### Scenario: Crear trato invalida la lista [hook test]

- GIVEN `useCreateTrato` ejecuta `POST /tratos` con éxito (201)
- WHEN la mutación se resuelve
- THEN `queryClient.invalidateQueries({ queryKey: ['tratos'] })` se invoca

#### Scenario: Eliminar trato remueve key individual [hook test]

- GIVEN `useDeleteTrato` ejecuta `DELETE /tratos/:id` con éxito (204)
- WHEN la mutación se resuelve
- THEN `queryClient.removeQueries({ queryKey: ['tratos', id] })` y `invalidateQueries({ queryKey: ['tratos'] })` se invocan

---

## API Contract Reference

| Método | Path | Descripción |
|---|---|---|
| GET | `/api/v1/tratos` | Lista tratos; soporta `?estado=`, `?cliente_id=`, `?prospecto_id=`, `?responsable_id=` |
| POST | `/api/v1/tratos` | Crea un trato nuevo (XOR `cliente_id` / `prospecto_id`); estado inicial `'abierto'` |
| GET | `/api/v1/tratos/:id` | Obtiene un trato por id |
| PATCH | `/api/v1/tratos/:id` | Edita campos del trato (no estado) |
| DELETE | `/api/v1/tratos/:id` | Elimina (204) o bloquea (409 si hay tareas) |
| PATCH | `/api/v1/tratos/:id/ganar` | Transición a estado 'ganado' |
| PATCH | `/api/v1/tratos/:id/perder` | Transición a 'perdido' con `motivo_perdida` requerido (422 si falta) |

Errores normalizados con `{ status, error, message, details? }`.

## Out of Scope

- CRUD de Tareas (Change 6b)
- Tab Tareas en detalle de trato (Change 6b)
- Kanban / dnd-kit (Change 7)
- Componente shadcn Command/Combobox (diferido)
- Edición del estado desde el form (siempre vía DropdownMenu o botones)
- Cambio masivo de estado (bulk)
- Estadísticas, pipeline analytics, conversion rates
- Soft delete, audit trail
