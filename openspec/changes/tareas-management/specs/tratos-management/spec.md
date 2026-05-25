# Delta for tratos-management

**Change**: tareas-management (Change 6b)
**Target spec**: `openspec/specs/tratos-management/spec.md`

## MODIFIED Requirements

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
