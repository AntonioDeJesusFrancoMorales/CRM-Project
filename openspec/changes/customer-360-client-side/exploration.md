# Exploration: customer-360-client-side

Fecha: 2026-06-27

## Problema

Pipely ya tiene detalle de Contacto y Empresa, pero la información relacionada está fragmentada. Un CRM estándar necesita una vista de contexto rápido: qué contacto/empresa es, qué oportunidades tiene, qué tareas están pendientes y qué volumen comercial representa.

El backend aún no expone un timeline 360 real. Por eso este change implementa una **vista 360 compuesta frontend-only**, derivada de entidades existentes.

## Estado actual verificado

### Contacto

Archivo: `src/features/contactos/pages/ContactoDetailPage.tsx`

Tabs actuales:

- `Info`
- `Tratos`

Datos disponibles:

- `useContacto(id)` para detalle.
- `useTratos()` para listar todos los tratos y filtrar por `contactoId`.

Limitación:

- No muestra tareas asociadas a los tratos del contacto.
- No muestra empresa vinculada.
- No muestra resumen comercial.

### Empresa

Archivo: `src/features/empresas/pages/EmpresaDetailPage.tsx`

Tabs actuales:

- `Información`
- `Contactos`

Datos disponibles:

- `useEmpresa(id)` para detalle.
- `useEmpresaContactos(empresaId)` / `useContactos()` para contactos de la empresa.
- `useTratos()` permite filtrar tratos cuyos contactos pertenezcan a la empresa.
- `useTareas()` permite filtrar tareas cuyos tratos pertenezcan a esos contactos.

Limitación:

- No muestra tratos a nivel empresa.
- No muestra tareas relacionadas.
- No muestra valor pipeline/resumen de estado.

## Datos y relaciones disponibles

```txt
Empresa 1 ── N Contacto
Contacto 1 ── N Trato
Trato 1 ── N Tarea
```

Relaciones por campo:

- `Contacto.empresaId`
- `Trato.contactoId`
- `Tarea.tratoId`

## UX recomendada

Agregar un tab inicial `Resumen 360` en ambas páginas:

### Contacto 360

- KPIs:
  - cantidad de tratos
  - tratos abiertos
  - valor total/pipeline abierto
  - tareas pendientes
- Card de empresa vinculada.
- Lista breve de tratos relacionados con link a detalle.
- Lista breve de tareas relacionadas con link a detalle.
- Empty states claros.

### Empresa 360

- KPIs:
  - contactos
  - tratos
  - pipeline abierto
  - tareas pendientes
- Lista breve de contactos con link a detalle.
- Lista breve de tratos relacionados con link a detalle.
- Lista breve de tareas relacionadas con link a detalle.
- Empty states claros.

## Decisiones

- Primera versión frontend-only.
- No crear timeline persistido.
- No agregar endpoints.
- No mutar datos.
- Usar cards/listas simples antes que tablas pesadas.
- Límite visual de 5 elementos por lista para no saturar el detalle.

## Riesgos

- Cálculos client-side no escalan a datasets grandes. Aceptable para esta etapa.
- Varias queries pueden cargar en paralelo. Mitigar con skeletons/empty states simples.
- Duplicar lógica entre Contacto y Empresa. Mitigar creando utilidades puras en `lib/customer360.ts`.

## Archivos probables

Crear:

- `src/features/customer-360/lib/customer360.ts`
- `src/features/customer-360/components/Contacto360Tab.tsx`
- `src/features/customer-360/components/Empresa360Tab.tsx`
- `src/features/customer-360/__tests__/customer360.test.ts`

Modificar:

- `src/features/contactos/pages/ContactoDetailPage.tsx`
- `src/features/contactos/__tests__/ContactoDetailPage.test.tsx`
- `src/features/empresas/pages/EmpresaDetailPage.tsx`
- `src/features/empresas/__tests__/EmpresaDetailPage.test.tsx`
