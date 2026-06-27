# Proposal: customer-360-client-side

## Intent

Agregar una vista `Resumen 360` frontend-only en los detalles de Contacto y Empresa para mostrar contexto comercial compuesto con datos ya existentes: relaciones, tratos, tareas y KPIs básicos.

Esto acerca Pipely a una experiencia CRM real sin depender todavía de un endpoint backend de timeline/actividad.

## Scope

### In Scope

- Nuevo tab `Resumen 360` en `ContactoDetailPage`.
- Nuevo tab `Resumen 360` en `EmpresaDetailPage`.
- KPIs derivados client-side.
- Relaciones navegables:
  - Contacto → Empresa.
  - Contacto → Tratos.
  - Contacto → Tareas de sus tratos.
  - Empresa → Contactos.
  - Empresa → Tratos de sus contactos.
  - Empresa → Tareas de esos tratos.
- Empty states claros.
- Tests de lógica pura de derivación.
- Tests de integración básicos en páginas de detalle.

### Out of Scope

- Timeline persistido en backend.
- Actividades reales tipo llamada/email/WhatsApp unificadas.
- Crear tareas/tratos desde la vista 360.
- Filtros avanzados dentro del tab.
- Server-side aggregation.
- Cambios en contrato API.

## Capabilities

### New Capabilities

- `customer-360`: vista compuesta de relaciones y KPIs por contacto/empresa.

### Modified Capabilities

- `contactos-management`: detalle de contacto agrega tab `Resumen 360`.
- `empresas-management`: detalle de empresa agrega tab `Resumen 360`.

## Approach

1. Crear utilidades puras para derivar:
   - tratos por contacto
   - tareas por tratos
   - contactos por empresa
   - tratos por empresa
   - tareas por empresa
   - KPIs básicos
2. Crear `Contacto360Tab` y `Empresa360Tab` como componentes presentacionales/contenedores ligeros.
3. Integrar tabs en páginas de detalle.
4. Agregar tests de utilidades y tests básicos de render en páginas.

## Affected Areas

| Area | Impact | Description |
| --- | --- | --- |
| `src/features/customer-360/` | New | Lib, componentes y tests de vista 360. |
| `ContactoDetailPage.tsx` | Modified | Agrega tab `Resumen 360`. |
| `EmpresaDetailPage.tsx` | Modified | Agrega tab `Resumen 360`. |
| Tests de detalle | Modified | Aseguran presencia y render básico del tab. |

## Risks

| Risk | Likelihood | Mitigation |
| --- | --- | --- |
| Confundir vista compuesta con timeline real | Media | Nombrar/documentar como Resumen 360, no Timeline. |
| Queries múltiples en detalle | Media | Reutilizar hooks existentes y mostrar estados simples. |
| UI saturada | Media | Limitar listas a 5 elementos. |
| Cálculos repetidos | Baja | Centralizar en lib pura. |

## Rollback Plan

- Eliminar `src/features/customer-360/`.
- Quitar tabs 360 de `ContactoDetailPage` y `EmpresaDetailPage`.
- Revertir tests asociados.

## Dependencies

- Hooks existentes: `useEmpresas`, `useContactos`, `useTratos`, `useTareas`.
- Componentes UI existentes: `Card`, `Badge`, `Button`, `Skeleton`, `Tabs`.

## Success Criteria

- [ ] Contacto muestra tab `Resumen 360` por defecto.
- [ ] Contacto 360 muestra empresa vinculada si existe.
- [ ] Contacto 360 muestra tratos y tareas derivadas.
- [ ] Empresa muestra tab `Resumen 360` por defecto.
- [ ] Empresa 360 muestra contactos, tratos y tareas derivadas.
- [ ] KPIs derivados son consistentes con fixtures.
- [ ] Tests focales pasan.
- [ ] `pnpm type-check` pasa.
- [ ] No se ejecuta build.
