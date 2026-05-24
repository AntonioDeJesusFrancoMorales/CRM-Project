# Delta for prospectos-management

**Change**: tratos-management (Change 6a)
**Target spec**: `openspec/specs/prospectos-management/spec.md`

## MODIFIED Requirements

### Requirement: Detalle del prospecto

El sistema MUST mostrar la página `/prospectos/:id` (`ProspectoDetailPage`) con dos tabs: **Información** y **Tratos**. Incluye un header con nombre del contacto y acciones consolidadas (Convertir a cliente, Editar, Eliminar, Select de estado in-place).

Si el endpoint `GET /api/v1/prospectos/:id` responde 404, el sistema MUST mostrar mensaje "Prospecto no encontrado", botón "Volver a Prospectos" y ejecutar un redirect automático a `/prospectos`.

**Cross-links cuando el prospecto está convertido**: cuando `prospecto.estado_posible_cliente === 'convertido'`, el header del detalle MUST mostrar un link "Ver cliente convertido" que navega a `/clientes/:id` (resolviendo el cliente con `prospecto_origen_id === prospecto.id`). Adicionalmente, la tab "Tratos" del prospecto convertido MUST incluir un mensaje informativo con link "Ver tratos del cliente" que navega a `/clientes/:id` con la tab Tratos preseleccionada (vía query param `?tab=tratos` o equivalente), reconociendo que post-conversión los nuevos tratos viven asociados al cliente, no al prospecto histórico.

(Previously: el detalle del prospecto convertido no exponía ningún link al cliente resultante ni a sus tratos — UX deferida desde Change 5.)

#### Scenario: Detalle con id válido muestra tab Información [integration test]

- GIVEN existe el prospecto con id `b1111111` (`Carlos Méndez`)
- WHEN el usuario navega a `/prospectos/b1111111`
- THEN se muestra el nombre en el header
- AND la tab "Información" muestra todos los campos (`empresa_id` como link a `/empresas/:id`, responsable, correo, teléfono, cargo, como_nos_conocio, notas — nulls como "—")

#### Scenario: Detalle con id inexistente redirige [integration test]

- WHEN el endpoint `/prospectos/:id` responde 404
- THEN se muestra toast "Prospecto no encontrado"
- AND se ejecuta redirect automático a `/prospectos`

#### Scenario: Tab Información muestra badge "Convertido" cuando aplica [component test]

- GIVEN el prospecto tiene `estado_posible_cliente === 'convertido'`
- WHEN se renderiza el header del detalle
- THEN se muestra un badge "Convertido" visible junto al nombre

#### Scenario: Detalle de prospecto convertido muestra link al cliente [integration test]

- GIVEN un prospecto `b1111111` tiene `estado_posible_cliente === 'convertido'`
- AND existe un cliente `c2222222` con `prospecto_origen_id === 'b1111111'`
- WHEN el usuario navega a `/prospectos/b1111111`
- THEN el header del detalle muestra un link "Ver cliente convertido"
- AND al hacer clic navega a `/clientes/c2222222`

#### Scenario: Detalle de prospecto NO convertido no muestra el link [component test]

- GIVEN el prospecto tiene `estado_posible_cliente` en `'frio' | 'tibio' | 'caliente'`
- WHEN se renderiza el header
- THEN NO existe ningún link "Ver cliente convertido"

#### Scenario: Tab Tratos de prospecto convertido linkea a tratos del cliente [integration test]

- GIVEN un prospecto convertido con cliente resultante `c2222222`
- WHEN el usuario activa la tab "Tratos"
- THEN se muestra la lista de tratos históricos del prospecto (consumida vía `GET /tratos?prospecto_id=:id`)
- AND se muestra un mensaje informativo con link "Ver tratos del cliente"
- AND al hacer clic navega a `/clientes/c2222222` con la tab Tratos activa
