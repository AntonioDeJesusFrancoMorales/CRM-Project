# Delta for clientes-management

**Change**: tratos-management (Change 6a)
**Target spec**: `openspec/specs/clientes-management/spec.md`

## MODIFIED Requirements

### Requirement: Tab Tratos del detalle

El sistema MUST mostrar la tab "Tratos" en `/clientes/:id` con la lista de tratos donde `Trato.cliente_id === cliente.id`, consumiendo `GET /api/v1/tratos?cliente_id=:id` con cache bajo la key `['tratos', { cliente_id: id }]` (vía el hook paramétrico `useTratos`). El tab MUST cargarse lazy (solo cuando el usuario lo activa).

El tab MUST incluir:
1. **Botón "Crear trato"** visible en el header del tab. Al hacer clic, abre `TratoCreateDialog` con el form prefilled: toggle "Asociar a:" en "Cliente" y `cliente_id` preseleccionado con el cliente actual.
2. **Link al detalle** en cada fila: el `nombre` del trato MUST ser clickeable y navegar a `/tratos/:id` (homologación con tablas de clientes/prospectos/empresas).

(Previously: tab read-only sin botón crear trato ni links al detalle — bloqueado a Change 6.)

#### Scenario: Tab Tratos carga al activar [integration test]

- GIVEN el usuario está en `/clientes/:id` con la tab "Información" activa
- WHEN hace clic en la tab "Tratos"
- THEN el sistema invoca `GET /tratos?cliente_id=:id`
- AND se muestra la lista de tratos vinculados

#### Scenario: Tab Tratos sin tratos muestra empty state [integration test]

- GIVEN el cliente no tiene tratos vinculados
- WHEN el usuario activa la tab "Tratos"
- THEN el endpoint devuelve `[]`
- AND se muestra "Sin tratos vinculados"
- AND el botón "Crear trato" sigue visible y habilitado

#### Scenario: Tab Tratos con error muestra mensaje de error [integration test]

- GIVEN el endpoint responde 500
- WHEN el usuario activa la tab
- THEN se muestra un mensaje de error

#### Scenario: Botón "Crear trato" abre dialog con cliente preseleccionado [integration test]

- GIVEN el usuario está en `/clientes/c1111111` con la tab "Tratos" activa
- WHEN hace clic en "Crear trato"
- THEN se abre `TratoCreateDialog`
- AND el toggle "Asociar a:" está en "Cliente"
- AND el Select de cliente muestra `c1111111` preseleccionado

#### Scenario: Nombre de trato en la fila navega al detalle [integration test]

- GIVEN la tab "Tratos" muestra un trato con `nombre: "Demo CTO"` e id `d1111111`
- WHEN el usuario hace clic en "Demo CTO"
- THEN el router navega a `/tratos/d1111111`

#### Scenario: Creación exitosa desde el tab invalida queries [integration test]

- GIVEN el usuario crea un trato desde el tab del cliente `c1111111`
- WHEN el backend responde 201
- THEN la query `['tratos', { cliente_id: 'c1111111' }]` se invalida (prefix match con `['tratos']`)
- AND el nuevo trato aparece en la tabla del tab sin reload manual
