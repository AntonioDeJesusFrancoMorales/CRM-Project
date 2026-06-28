# Exploration: tratos-advanced-filters-presets

## Context

El CRM ya tiene mejoras frontend-only recientes: búsqueda global client-side y `Resumen 360` en Contacto/Empresa. El siguiente cuello de botella operativo está en los listados: encontrar subconjuntos útiles sin pedir cambios al backend.

Este cambio apunta primero a `Tratos`, porque es el núcleo comercial del CRM y hoy su listado plano solo permite búsqueda por nombre.

## Current State Verified

### Tratos

- `src/features/tratos/pages/TratosListPage.tsx`
  - Tabs `Lista/Kanban` con `useTabSync`.
  - Tab default: `kanban`.
  - Tab `lista`: búsqueda por nombre y `TratosTable`.
  - Carga datos con:
    - `useTratos()`
    - `useContactos()`
    - `useUsuarios()`
  - KPIs se calculan sobre todos los tratos.
- `src/features/tratos/components/TratosTable.tsx`
  - Filtra internamente por `searchTerm` solo contra `trato.nombre`.
  - Resuelve contacto/responsable por maps client-side.
  - Muestra columnas: nombre, valor estimado, tipo contrato, contacto, responsable, cierre esperado.
- `src/api/types.ts`
  - `Trato` tiene campos suficientes para filtros client-side:
    - `estado`
    - `tipoContrato`
    - `responsableId`
    - `contactoId`
    - `valorEstimado`
    - `probabilidad`
    - `fechaCierreEsperada`

### Tareas as Reference Pattern

- `src/features/tareas/pages/TareasListPage.tsx`
  - Ya implementa múltiples filtros client-side sobre el array completo.
  - Usa `Select` existentes.
  - Los filtros NO envían query params al backend.
  - Tiene tests que verifican ausencia de query params/refetches por filtros.
  - No tiene presets guardables.

### UI Available

- Componentes disponibles:
  - `Input`
  - `Select`
  - `Button`
  - `DropdownMenu`
  - `Badge`
  - `Tabs`
- No se verificó componente `Checkbox`/`Popover`; evitar depender de UI inexistente.

### Persistence Patterns

- Ya existe uso de `localStorage` para:
  - tema (`crm-theme`)
  - estado client-only de tareas (`tarea-estado-${id}`)
  - canal de WhatsApp
- El patrón tolera que `localStorage` pueda fallar en entornos no browser.

## Problem

En `Tratos`, el usuario no puede contestar preguntas comerciales básicas desde la lista sin inspección manual:

- ¿Qué tratos abiertos tengo?
- ¿Qué tratos grandes están cerca del cierre?
- ¿Qué tratos tiene un responsable?
- ¿Qué oportunidades de tipo licencia/suscripción están activas?
- ¿Qué vista uso todos los días y quiero recuperar rápido?

Sin filtros y presets, el CRM se siente como una tabla cruda, no como herramienta de gestión.

## Candidate Scopes

### Option A — Implementar filtros y presets en todos los listados ahora

Pros:
- Cobertura amplia inmediata.

Cons:
- Mucho cambio transversal.
- Riesgo alto de duplicación y regresiones.
- Contactos tiene tabs por estado, Empresas tiene tabla propia, Tareas ya tiene filtros: cada uno requiere adaptación.

### Option B — Implementar patrón reusable + primera integración en Tratos

Pros:
- Alto valor comercial.
- Cambio chico y verificable.
- Permite extraer un contrato de filtros/presets antes de replicar.
- Evita tocar demasiadas pantallas.

Cons:
- Contactos/Empresas/Tareas quedan para iteraciones posteriores.

### Option C — Solo filtros en Tratos, sin presets

Pros:
- Más simple.

Cons:
- Menos diferencial CRM.
- El usuario debe reconstruir vistas frecuentes cada vez.

## Decision

Elegir Option B: implementar filtros avanzados y presets locales primero en `Tratos`, con lógica reusable para presets.

## Proposed First Iteration Filters

Para `TratosListPage`:

- Búsqueda textual por nombre.
- Estado: todos / abierto / ganado / perdido.
- Tipo de contrato: todos / servicio / licencia / suscripción / permanente / otro.
- Responsable.
- Contacto.
- Valor estimado mínimo.
- Valor estimado máximo.
- Cierre esperado:
  - todas
  - vencidas
  - próximos 7 días
  - próximos 30 días
  - sin fecha

## Presets

Presets guardados en `localStorage` con una key específica de pantalla, por ejemplo:

```txt
crm:list-presets:tratos
```

Cada preset guarda:

- `id`
- `name`
- `filters`
- `createdAt`

No se sincroniza con backend ni entre dispositivos.

## Risks / Gotchas

- `TratosTable` hoy filtra internamente por búsqueda; conviene mover el filtrado completo a la page o dejar la tabla como render puro para evitar doble lógica.
- Si los KPIs se calculan sobre todos los tratos, debe quedar claro que son métricas globales, no del resultado filtrado. Alternativa: agregar contador de resultados filtrados.
- `localStorage` puede fallar; presets deben degradar sin romper la pantalla.
- Valores numéricos de inputs deben manejar `''` como `undefined`, no como `0`.
- `fechaCierreEsperada` puede ser `null`.

## Verification Strategy

- Tests unitarios para lógica pura de filtrado de tratos.
- Tests unitarios para lectura/escritura defensiva de presets.
- Tests de integración en `TratosListPage`:
  - filtros aplican client-side.
  - filtros no disparan query params/refetch al backend.
  - guardar preset persiste en localStorage.
  - aplicar preset restaura filtros y resultados.
- `pnpm type-check`.
- No ejecutar build.
