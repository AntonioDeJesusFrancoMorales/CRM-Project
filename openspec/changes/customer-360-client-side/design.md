# Design: customer-360-client-side

## Overview

Se agrega una feature nueva `customer-360` con lógica pura y dos componentes:

```txt
src/features/customer-360/
├── lib/customer360.ts
├── components/Contacto360Tab.tsx
├── components/Empresa360Tab.tsx
└── __tests__/customer360.test.ts
```

La feature no crea datos ni endpoints. Solo compone relaciones existentes.

## Data derivation

Relaciones:

```txt
Empresa.id === Contacto.empresaId
Contacto.id === Trato.contactoId
Trato.id === Tarea.tratoId
```

Funciones puras propuestas:

```ts
getTratosByContacto(contactoId, tratos)
getTareasByTratos(tratos, tareas)
getContactosByEmpresa(empresaId, contactos)
getTratosByEmpresa(contactosEmpresa, tratos)
getCustomer360Kpis(tratos, tareas, contactos?)
```

KPIs:

- contactos: opcional para empresa.
- tratos: total.
- tratosAbiertos: `estado === 'ABIERTO'`.
- pipelineAbierto: suma de `valorEstimado ?? 0` solo abiertos.
- tareasPendientes: `fechaCompletada === null`.

## UI

### Contacto360Tab

Props:

```ts
interface Contacto360TabProps {
  contacto: Contacto;
}
```

Hooks internos:

- `useEmpresas()` para resolver empresa vinculada.
- `useTratos()` para tratos del contacto.
- `useTareas()` para tareas de esos tratos.

Secciones:

- KPI cards.
- Empresa vinculada.
- Tratos relacionados.
- Tareas relacionadas.

### Empresa360Tab

Props:

```ts
interface Empresa360TabProps {
  empresa: Empresa;
}
```

Hooks internos:

- `useContactos()`.
- `useTratos()`.
- `useTareas()`.

Secciones:

- KPI cards.
- Contactos relacionados.
- Tratos relacionados.
- Tareas relacionadas.

## Routing

Links:

- Empresa: `/empresas/:id`
- Contacto: `/contactos/:id`
- Trato: `/tratos/:id`
- Tarea: `/tareas/:id`

## Loading/error policy

- Si los hooks secundarios están cargando, mostrar textos/skeletons livianos dentro del tab.
- Si fallan, mostrar warning no bloqueante.
- La página principal ya maneja loading/error del recurso principal.

## Integration

### ContactoDetailPage

- Cambiar `Tabs defaultValue="info"` a `defaultValue="resumen"`.
- Agregar trigger `Resumen 360` antes de `Info`.
- Agregar `TabsContent value="resumen"` con `Contacto360Tab contacto={contacto}`.

### EmpresaDetailPage

- Cambiar `Tabs defaultValue="info"` a `defaultValue="resumen"`.
- Agregar trigger `Resumen 360` antes de `Información`.
- Agregar `TabsContent value="resumen"` con `Empresa360Tab empresa={empresa}`.

## Testing

Unit:

- Derivación contacto → tratos → tareas.
- Derivación empresa → contactos → tratos → tareas.
- KPIs con valores null y estados.

Integration:

- ContactoDetailPage muestra tab `Resumen 360` y datos relacionados del fixture.
- EmpresaDetailPage muestra tab `Resumen 360` y datos relacionados del fixture.
