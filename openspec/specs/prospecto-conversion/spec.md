# prospecto-conversion Specification

**Capability**: prospecto-conversion
**Change**: prospectos-crud
**Status**: draft

## Purpose

Provee el flujo completo de conversión de un prospecto en cliente dentro del CRM Pipely: extensión del contrato de tipos (`EstadoPosibleCliente` suma `'convertido'`; `Cliente` suma `prospecto_origen_id`), acción de conversión con trazabilidad de origen, badge de estado post-conversión, y visualización de convertidos con agrupación temporal (este mes / anteriores).

Se separa de `prospectos-management` porque tiene reglas propias con implicaciones cross-feature: modifica el contrato compartido de `src/api/types.ts`, requiere un cambio atómico en `EmpresaProspectosTab.tsx` (Change 2), y su lógica de edición restringida post-conversión es una regla de negocio independiente.

## Requirements

### Requirement: Extensión del contrato de tipos

El sistema MUST extender `EstadoPosibleCliente` en `src/api/types.ts` agregando el valor `'convertido'`: `'frio' | 'tibio' | 'caliente' | 'convertido'`. El sistema MUST agregar el campo `prospecto_origen_id: string | null` a la interface `Cliente`.

Estos cambios MUST realizarse en un único commit atómico junto con:
- La actualización de los `Record<EstadoPosibleCliente, string>` en `EmpresaProspectosTab.tsx` (líneas 17-27).
- La modificación del handler `POST /prospectos/:id/convertir` en `src/mocks/handlers/prospectos.ts`.
- La adición de `prospecto_origen_id: null` a los 2 clientes existentes en `src/mocks/fixtures/clientes.ts`.

#### Scenario: Type-check pasa tras el commit atómico

- GIVEN se modifica `EstadoPosibleCliente` para incluir `'convertido'` en `types.ts`
- WHEN se actualiza `EmpresaProspectosTab.tsx` con la entrada `convertido` en los records en el mismo commit
- THEN `pnpm type-check` termina con exit 0
- AND no hay errores de TypeScript en el build

#### Scenario: EmpresaProspectosTab muestra badge para estado convertido

- GIVEN existe un prospecto con `estado_posible_cliente === 'convertido'` vinculado a una empresa
- WHEN se renderiza el tab "Prospectos" de `EmpresaDetailPage`
- THEN el badge de estado muestra "Convertido" con el color/clase correspondiente
- AND no se lanza ningún error de TypeScript en el record exhaustivo

---

### Requirement: Acción de convertir a cliente

El sistema MUST ofrecer un botón "Convertir a cliente" tanto en la card del Kanban como en las acciones de `ProspectoDetailPage`. Al confirmar en un `AlertDialog` (`ConvertirProspectoDialog`), el sistema invoca `POST /api/v1/prospectos/:id/convertir`.

El handler MUST:
1. Mutar `prospecto.estado_posible_cliente = 'convertido'` y `prospecto.actualizado_en = nowIso()`.
2. Crear un `Cliente` nuevo con `prospecto_origen_id = prospecto.id` y `creado_en = nowIso()`.

El botón "Convertir a cliente" MUST estar oculto cuando `prospecto.estado_posible_cliente === 'convertido'`.

#### Scenario: Conversión exitosa muta prospecto y crea cliente

- GIVEN existe un prospecto con `id: 'b1111111'` y `estado: 'caliente'`
- WHEN el usuario confirma la conversión en el AlertDialog
- THEN el sistema invoca `POST /prospectos/b1111111/convertir`, recibe 201
- AND `useConvertirProspecto` invalida las queries `['prospectos']` y `['clientes']`
- AND el prospecto ya no aparece en las columnas activas del Kanban
- AND se muestra un toast de éxito

#### Scenario: Botón Convertir oculto cuando estado es convertido

- GIVEN un prospecto tiene `estado_posible_cliente === 'convertido'`
- WHEN se renderiza la card del Kanban o las acciones del detalle
- THEN el botón "Convertir a cliente" NO está visible en la UI

#### Scenario: Cancelar AlertDialog no invoca el endpoint

- GIVEN el AlertDialog de conversión está abierto
- WHEN el usuario hace clic en "Cancelar"
- THEN el dialog se cierra
- AND `POST /prospectos/:id/convertir` NO es invocado

#### Scenario: Error de red en conversión muestra toast de error

- GIVEN el endpoint `POST /prospectos/:id/convertir` responde 500
- WHEN el usuario confirma la conversión
- THEN se muestra un toast de error
- AND el prospecto mantiene su estado anterior

---

### Requirement: Tab Convertidos

El sistema MUST mostrar un tab "Convertidos" en `ProspectosListPage` al mismo nivel que el tab implícito "Activos" (Kanban). El tab MUST presentar dos secciones:

1. **"Convertidos este mes"** (sección default visible): prospectos con `estado === 'convertido'` cuyo cliente relacionado tiene `creado_en` dentro del mes calendario actual. La relación se resuelve haciendo join entre `prospectos` filtrados por `estado === 'convertido'` y `clientes` filtrados por `prospecto_origen_id`.
2. **"Ver convertidos anteriores"** (colapsable con `Collapsible` de shadcn): prospectos convertidos cuyo cliente fue creado en un mes anterior al actual.

#### Scenario: Tab Convertidos muestra sección "Este mes" con timestamp correcto

- GIVEN existe un prospecto con `estado: 'convertido'` cuyo cliente tiene `creado_en` dentro del mes actual
- WHEN el usuario hace clic en el tab "Convertidos"
- THEN el prospecto aparece en la sección "Convertidos este mes"
- AND el timestamp de conversión es el `creado_en` del cliente relacionado (campo `prospecto_origen_id`)

#### Scenario: Convertidos anteriores están en Collapsible

- GIVEN existe un prospecto convertido cuyo cliente fue creado en un mes anterior
- WHEN el usuario hace clic en el tab "Convertidos"
- THEN ese prospecto NO aparece en "Convertidos este mes"
- AND aparece al expandir el `Collapsible` "Ver convertidos anteriores"

#### Scenario: Tab Convertidos sin convertidos este mes muestra empty state

- GIVEN no hay prospectos convertidos con cliente creado en el mes actual
- WHEN el usuario navega al tab "Convertidos"
- THEN la sección "Convertidos este mes" muestra un mensaje vacío (ej: "Sin conversiones este mes")
- AND el Collapsible "Ver convertidos anteriores" sigue disponible si hay histórico

#### Scenario: Tab Convertidos sin ningún convertido muestra empty state global

- GIVEN no hay ningún prospecto con `estado === 'convertido'`
- WHEN el usuario navega al tab "Convertidos"
- THEN se muestra un empty state (ej: "Aún no hay prospectos convertidos")

---

## API Contract Reference

| Método | Path | Descripción |
|--------|------|-------------|
| POST | `/api/v1/prospectos/:id/convertir` | Muta prospecto a 'convertido' y crea Cliente con `prospecto_origen_id` |
| GET | `/api/v1/prospectos` | Con filtrado client-side por `estado === 'convertido'` para el tab Convertidos |
| GET | `/api/v1/clientes` | Con join por `prospecto_origen_id` para calcular timestamp de conversión |

**Contrato del handler POST /convertir**:
- Entrada: path param `:id`
- Efecto: `prospecto.estado_posible_cliente = 'convertido'`, `prospecto.actualizado_en = nowIso()`, nuevo `Cliente` con `prospecto_origen_id = prospecto.id`, `creado_en = nowIso()`
- Respuesta: 201 con el cliente creado

## Out of Scope

- Endpoint `PATCH /prospectos/:id/restaurar` (un convertido no se "des-convierte")
- Validación server-side de edición post-conversión (el bloqueo es exclusivamente client-side)
- Estadísticas de conversión (tasa, promedio, funnel) — YAGNI
- Notificaciones o eventos al convertir un prospecto
