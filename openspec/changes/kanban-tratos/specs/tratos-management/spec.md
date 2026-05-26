# Delta for tratos-management

**Change**: kanban-tratos (Change 7)
**Modifies**: openspec/specs/tratos-management/spec.md

---

## ADDED Requirements

### Requirement: Toggle vista Kanban / Tabla en /tratos (ADR-056)

`TratosListPage` MUST renderizar la vista kanban (`KanbanBoard`) como vista por defecto cuando no hay query params en la URL. Cuando el parámetro `?vista=tabla` está presente, MUST renderizar `TratosTable`. El toggle MUST ser bidireccional y gestionado por `useTabSync(['kanban', 'tabla'], 'kanban', 'vista')` (ADR-057). Al seleccionar la vista kanban (fallback), la URL MUST quedar limpia (sin `?vista`). Al seleccionar la vista tabla, la URL MUST mostrar `?vista=tabla`.

#### Scenario: /tratos sin query param muestra kanban [integration test]

- GIVEN el usuario navega a `/tratos` (sin query params)
- WHEN se renderiza `TratosListPage`
- THEN se muestra `KanbanBoard`
- AND no se muestra `TratosTable`

#### Scenario: /tratos?vista=tabla muestra la tabla [integration test]

- GIVEN el usuario navega a `/tratos?vista=tabla`
- WHEN se renderiza `TratosListPage`
- THEN se muestra `TratosTable`
- AND no se muestra `KanbanBoard`

#### Scenario: Toggle a tabla agrega ?vista=tabla a la URL [integration test]

- GIVEN el usuario está en `/tratos` viendo el kanban
- WHEN selecciona la vista "Tabla"
- THEN la URL cambia a `/tratos?vista=tabla`
- AND se renderiza `TratosTable`

#### Scenario: Toggle a kanban desde tabla limpia la URL [integration test]

- GIVEN el usuario está en `/tratos?vista=tabla`
- WHEN selecciona la vista "Kanban"
- THEN la URL cambia a `/tratos` (sin query param `?vista`)
- AND se renderiza `KanbanBoard`

---

### Requirement: Extensión backward-compatible de useTabSync con paramKey (ADR-057)

El hook `useTabSync` MUST aceptar un tercer argumento opcional `paramKey: string` con valor por defecto `'tab'`. Cuando `paramKey` se omite, el hook MUST comportarse exactamente igual que antes (parámetro URL `?tab=`). Cuando se pasa `paramKey='vista'`, MUST usar `?vista=` como parámetro URL. Los callers existentes (`TratoDetailPage`, `ClienteDetailPage`) NO MUST ser modificados y MUST seguir funcionando con `?tab=`.

**Firma extendida**:
```
useTabSync(
  allowed: readonly string[],
  fallback: string,
  paramKey?: string  // default: 'tab'
): readonly [string, (next: string) => void]
```

#### Scenario: Sin paramKey usa ?tab= (backward compat) [unit test]

- GIVEN `useTabSync(['info', 'tratos'], 'info')` sin tercer argumento
- WHEN el usuario cambia al tab 'tratos'
- THEN la URL refleja `?tab=tratos` (no `?vista=` ni otro param)

#### Scenario: Con paramKey='vista' usa ?vista= [unit test]

- GIVEN `useTabSync(['kanban', 'tabla'], 'kanban', 'vista')`
- WHEN el usuario cambia al valor 'tabla'
- THEN la URL refleja `?vista=tabla`

#### Scenario: Con paramKey='vista' lee ?vista= correctamente [unit test]

- GIVEN la URL es `/tratos?vista=tabla`
- WHEN se monta `useTabSync(['kanban', 'tabla'], 'kanban', 'vista')`
- THEN el valor activo es `'tabla'`

#### Scenario: Con paramKey='vista' y fallback, la URL queda limpia [unit test]

- GIVEN el usuario está en `/tratos?vista=tabla`
- WHEN cambia al valor `'kanban'` (fallback)
- THEN la URL queda limpia (sin `?vista`)

#### Scenario: Tests existentes de useTabSync no se rompen [regression test]

- GIVEN los tests existentes usan `useTabSync(allowed, fallback)` sin paramKey
- WHEN se ejecuta `pnpm test:run`
- THEN todos los tests previos de `useTabSync` siguen en verde

---

## MODIFIED Requirements

### Requirement: Listado de tratos

El sistema MUST mostrar `/tratos` con una tabla que consume `GET /api/v1/tratos` con cache TanStack Query bajo la key `['tratos', { filters }]`. Columnas: `nombre`, estado (badge), valor estimado, tipo de contrato, cliente/prospecto vinculado, fecha de cierre esperada. El nombre MUST ser clickeable y navegar a `/tratos/:id` (homologación con tablas de empresas/prospectos/clientes).

La tabla MUST ser accesible vía el toggle de vista (`?vista=tabla`). La vista por defecto de `/tratos` es el kanban (sin query param); la tabla es la vista secundaria.
(Previously: `/tratos` renderizaba directamente la tabla sin toggle de vista; era la única vista disponible.)

#### Scenario: Tabla poblada con datos fixture [integration test]

- GIVEN `GET /tratos` devuelve un array no vacío
- WHEN el usuario navega a `/tratos?vista=tabla`
- THEN se renderiza una fila por trato con todas las columnas

#### Scenario: Nombre clickeable navega al detalle [integration test]

- GIVEN la tabla muestra un trato con `nombre: "Demo CTO"` e id `d1111111`
- WHEN el usuario hace clic en "Demo CTO"
- THEN el router navega a `/tratos/d1111111`

#### Scenario: Error de servidor muestra botón reintentar [integration test]

- GIVEN `GET /tratos` responde 500
- THEN se muestra mensaje de error con botón "Reintentar"
- AND no se renderiza la tabla

