# Roadmap de funcionalidades faltantes del CRM Pipely

Fecha de auditoría: 2026-06-27
Proyecto: `CRM-Project` / Pipely frontend
Base de comparación: Salesforce, HubSpot, Zoho CRM y Pipedrive.

## Resumen ejecutivo

Pipely ya tiene un núcleo funcional importante: empresas, contactos, tratos, tareas, agenda, tableros Kanban, usuarios, roles, etiquetas, dashboard, WhatsApp inbox/canales/grupos/plantillas/bots y métricas CSAT.

La brecha principal no está en "hacer más CRUD", sino en convertir datos aislados en una operación comercial completa:

1. Vista 360 del cliente.
2. Tareas con estado persistido en backend.
3. Búsqueda global.
4. Filtros avanzados y vistas guardadas.
5. Automatizaciones.
6. Permisos reales en backend.
7. Reporting/forecasting avanzado.
8. Integraciones email/calendario.
9. Deduplicación, adjuntos, auditoría y campos personalizados.

> Importante: varias funcionalidades pueden tener una primera versión frontend-only para mejorar UX, pero la verdad de negocio debe vivir en backend. Si no, es solo maquillaje.

---

## Estado actual verificado en el frontend

Archivos revisados:

- `src/routes/router.tsx`
- `src/components/layout/Sidebar.tsx`
- `src/api/endpoints.ts`
- `src/api/types.ts`
- `src/features/dashboard/pages/DashboardPage.tsx`
- `src/features/contactos/components/ContactosImportExport.tsx`
- `src/features/tratos/components/TratoNotasTab.tsx`
- `src/features/tareas/hooks/useTareaEstado.ts`

### Módulos existentes

| Área | Estado |
| --- | --- |
| Dashboard / Inicio | Existe. KPIs client-side: pipeline, ponderado, oportunidades, ticket promedio, ganados, conversión, clientes, prospectos, tareas urgentes, CSAT y ranking de agentes. |
| Empresas | CRUD y detalle. |
| Contactos | CRUD, estados `PROSPECTO`, `ACTIVO`, `INACTIVO`, import/export CSV client-side. |
| Tratos | CRUD, valor, probabilidad, fecha cierre, tipo contrato, estado `ABIERTO`, `GANADO`, `PERDIDO`, ganar/perder con motivo. |
| Notas de trato | Timeline básico de notas/eventos por trato. |
| Tareas | CRUD, tipo, prioridad, fecha límite. El estado visual sigue siendo `localStorage`, no backend. |
| Agenda | Eventos/reuniones/llamadas. |
| Kanban | Tableros, columnas, fichas, mover fichas, etiquetas. |
| WhatsApp | Inbox, canales, grupos, plantillas, bots, asignación/cierre/reapertura, CSAT. |
| Usuarios / roles | CRUD. Los roles no parecen aplicar autorización real en backend. |
| Etiquetas | CRUD para etiquetas de tratos/tareas. |
| Exportaciones | Contactos CSV y tratos CSV desde dashboard. |

---

## Faltantes priorizados

## P0 — Core CRM

### 1. Estado de tareas persistido

Hoy `useTareaEstado.ts` guarda el estado en `localStorage`. Eso no sincroniza entre usuarios, dispositivos ni sesiones reales.

| Trabajo | Backend | Frontend |
| --- | --- | --- |
| Agregar campo `estado` o explotar correctamente `fechaCompletada` | Sí | Sí |
| Endpoint para cambiar estado | Sí | Sí |
| Reemplazar `localStorage` por API | No | Sí |
| Filtros por estado | Ideal | Sí |

Versión frontend-only posible:

- Mejorar filtros/badges actuales usando `localStorage`.
- Mostrar aviso técnico en documentación: no es persistencia real.

Recomendación: no invertir demasiado frontend acá hasta que backend exponga estado real.

---

### 2. Vista 360 / timeline por contacto y empresa

Un CRM serio necesita ver toda la historia del cliente en un lugar: notas, llamadas, reuniones, WhatsApps, tareas, tratos, cambios de estado, emails, archivos y eventos automáticos.

| Trabajo | Backend | Frontend |
| --- | --- | --- |
| Modelo `Actividad` / `TimelineEvent` | Sí | No |
| Relación con empresa/contacto/trato/tarea | Sí | No |
| Endpoints por contacto/empresa | Sí | Sí |
| UI timeline | No | Sí |
| Registrar eventos automáticos | Sí | Parcial |

Versión frontend-only posible:

- En `ContactoDetailPage` y `EmpresaDetailPage`, componer una vista 360 client-side usando datos existentes:
  - contacto
  - empresa
  - tratos filtrados por contacto
  - tareas relacionadas a esos tratos
  - agenda relacionada si hay vínculo disponible
  - conversaciones WhatsApp si hay contacto/teléfono compatible
- Mostrar esto como "Actividad relacionada" aunque no sea un timeline persistido único.

Recomendación: buen primer candidato frontend, porque aporta mucho valor sin romper contrato.

---

### 3. Búsqueda global

Buscar entidades desde un solo lugar: empresas, contactos, tratos, tareas, conversaciones.

| Trabajo | Backend | Frontend |
| --- | --- | --- |
| Endpoint `/search?q=` | Sí | No |
| Indexación server-side | Sí | No |
| Command palette / buscador global | No | Sí |
| Resultados agrupados por entidad | No | Sí |

Versión frontend-only posible:

- Cargar datasets existentes con TanStack Query.
- Buscar client-side sobre empresas, contactos, tratos y tareas.
- UI tipo command palette en topbar.
- Navegación directa a detalle.

Tradeoff: sirve con volúmenes chicos/medios. Para miles de registros debe pasar a backend.

---

### 4. Filtros avanzados y vistas guardadas

Listas útiles para operación diaria: mis tratos abiertos, tareas vencidas, contactos sin responsable, oportunidades de alto valor, etc.

| Trabajo | Backend | Frontend |
| --- | --- | --- |
| Filtros server-side | Sí | Sí |
| Vistas guardadas por usuario | Sí | Sí |
| UI de filtros combinables | No | Sí |

Versión frontend-only posible:

- Filtros client-side en listados actuales.
- Persistir filtros en URL o `localStorage`.
- Presets locales: "Mis tareas", "Tratos abiertos", "Alta prioridad", "Vencidas".

Tradeoff: no escala perfecto, pero mejora mucho la UX actual.

---

## P1 — Equipo y operación

### 5. Automatizaciones / workflows

Ejemplos:

- Crear tarea de seguimiento al crear trato.
- Alertar si una conversación queda sin responder.
- Registrar evento al ganar/perder trato.
- Asignar responsable automáticamente.

| Trabajo | Backend | Frontend |
| --- | --- | --- |
| Motor de reglas | Sí | No |
| Jobs/scheduler | Sí | No |
| UI para configurar reglas | No | Sí |
| Notificaciones derivadas | Sí | Sí |

Versión frontend-only posible:

- Automatizaciones asistidas, no automáticas:
  - después de crear trato, sugerir crear tarea.
  - si tarea está vencida, resaltarla.
  - si trato no tiene próxima tarea, mostrar warning.

Tradeoff: útil como UX, pero no reemplaza workflows backend.

---

### 6. Permisos reales por rol

El frontend ya documenta que ocultar rutas sin autorización backend sería falsa seguridad.

| Trabajo | Backend | Frontend |
| --- | --- | --- |
| RBAC real en endpoints | Sí | No |
| Permisos por acción/recurso | Sí | No |
| Ocultar/deshabilitar acciones según permisos | No | Sí |
| Pantalla de matriz de permisos | Sí | Sí |

Versión frontend-only posible:

- Ninguna versión segura.
- Solo se puede mejorar UX si backend entrega permisos.

Recomendación: no implementarlo solo en front. Sería falsa seguridad.

---

### 7. Reporting avanzado y forecasting

Dashboard actual existe, pero faltan reportes configurables y análisis comercial profundo.

Ideas:

- conversión por etapa
- forecast mensual
- motivos de pérdida
- performance por vendedor
- aging de oportunidades
- embudo por fuente
- tareas vencidas por responsable

| Trabajo | Backend | Frontend |
| --- | --- | --- |
| Endpoints agregados/reporting | Sí | No |
| Cálculos server-side confiables | Sí | No |
| Gráficos, filtros, export | No | Sí |

Versión frontend-only posible:

- Nuevas tarjetas y tablas calculadas client-side desde `get-all`.
- Export CSV de reportes.
- Filtros de fecha/responsable.

Tradeoff: rápido para residencia/demo; para producción conviene backend.

---

### 8. Integración email + calendario

Estándar en CRMs modernos: enviar email, registrar conversaciones, usar templates, sync de calendario, meeting scheduler.

| Trabajo | Backend | Frontend |
| --- | --- | --- |
| OAuth Google/Microsoft | Sí | Sí |
| Envío/recepción email | Sí | Sí |
| Templates | Sí | Sí |
| Calendar sync | Sí | Sí |
| UI composer/calendar | No | Sí |

Versión frontend-only posible:

- Links `mailto:` desde contacto.
- Plantillas copiables.
- Botón "agendar" que precargue agenda interna.

Tradeoff: útil, pero no hay tracking ni sync real.

---

## P2 — Calidad, escala y personalización

### 9. Deduplicación de contactos/empresas

Hoy la importación CSV omite duplicados por teléfono en frontend. Falta dedupe robusto.

| Trabajo | Backend | Frontend |
| --- | --- | --- |
| Reglas flexibles de unicidad | Sí | No |
| Endpoint detectar duplicados | Sí | Sí |
| UI merge contactos/empresas | Sí | Sí |

Versión frontend-only posible:

- Detector local de duplicados en contactos cargados.
- Pantalla "Posibles duplicados".

---

### 10. Adjuntos y documentos

Contratos, PDFs, presupuestos, imágenes, audios.

| Trabajo | Backend | Frontend |
| --- | --- | --- |
| Storage de archivos | Sí | No |
| Relación archivo-entidad | Sí | No |
| Upload/download/delete | Sí | Sí |
| UI documentos por trato/contacto | No | Sí |

Versión frontend-only posible:

- No recomendable salvo mock/demo. Los archivos deben persistir en backend/storage.

---

### 11. Campos personalizados

Permite adaptar el CRM a distintos negocios.

| Trabajo | Backend | Frontend |
| --- | --- | --- |
| Modelo de campos custom | Sí | No |
| Validaciones dinámicas | Sí | Sí |
| Render dinámico de formularios | No | Sí |
| Filtros por custom fields | Sí | Sí |

Versión frontend-only posible:

- No recomendable para datos reales. Sin backend, los campos no persisten de forma confiable.

---

### 12. Auditoría

Quién cambió qué, cuándo y desde dónde.

| Trabajo | Backend | Frontend |
| --- | --- | --- |
| Audit log | Sí | No |
| Captura automática de cambios | Sí | No |
| Vista historial | No | Sí |

Versión frontend-only posible:

- Ninguna confiable. La auditoría debe ser backend.

---

## P3 — Diferenciadores

### 13. Mobile / PWA

| Trabajo | Backend | Frontend |
| --- | --- | --- |
| API compatible | Parcial | No |
| PWA offline/notificaciones | No | Sí |
| App mobile real | Parcial | Sí |

Versión frontend-only posible:

- Mejorar responsive.
- PWA básica.
- Shortcuts móviles.

---

### 14. IA / asistente

Casos útiles:

- resumir contacto/trato
- sugerir próximo paso
- detectar trato en riesgo
- redactar respuesta WhatsApp/email
- búsqueda en lenguaje natural

| Trabajo | Backend | Frontend |
| --- | --- | --- |
| Integración LLM | Sí | Sí |
| Prompting con datos CRM | Sí | No |
| UI asistente | No | Sí |

Recomendación: no empezar por IA. Primero datos sólidos.

---

## Qué se puede hacer ahora solo en frontend

Orden recomendado:

1. **Búsqueda global client-side**
   - Mucho valor inmediato.
   - No requiere backend nuevo.
   - Escala aceptablemente para volumen bajo/medio.

2. **Vista 360 compuesta en Contacto/Empresa**
   - Mostrar tratos, tareas, agenda y conversaciones relacionadas usando datos existentes.
   - No es timeline real, pero acerca el producto a un CRM serio.

3. **Filtros avanzados client-side + presets locales**
   - Mejora la operación diaria.
   - Puede persistirse en URL/localStorage.

4. **Mejoras de reporting client-side**
   - Agregar reportes sobre datos existentes.
   - Bueno para demo/residencia.

5. **Sugerencias de acción asistidas**
   - "Este trato no tiene tarea próxima".
   - "Esta tarea está vencida".
   - "Este contacto no tiene responsable".

6. **Detector local de duplicados**
   - Útil antes de importar o limpiar base actual.

7. **Accesos rápidos email/agenda**
   - `mailto:` desde contactos.
   - Crear evento de agenda prellenado desde contacto/trato.

## Qué NO conviene hacer solo en frontend

- Permisos por rol como seguridad.
- Auditoría.
- Adjuntos/documentos reales.
- Campos personalizados reales.
- Automatizaciones reales.
- Estado de tarea definitivo.
- Integración email/calendario real.

Esas funciones necesitan backend. Si se hacen solo en front, sirven como demo o UX auxiliar, pero no como sistema confiable.

---

## Roadmap frontend-only sugerido

### Lote FE-1: Búsqueda global

- Agregar input/command palette en Topbar.
- Buscar en empresas, contactos, tratos, tareas.
- Agrupar resultados por entidad.
- Navegar al detalle.
- Atajo opcional `Ctrl/Cmd + K`.

### Lote FE-2: Vista 360 compuesta

- En contacto: mostrar empresa, tratos, tareas derivadas, agenda relacionada y WhatsApp por teléfono si aplica.
- En empresa: mostrar contactos, tratos por contactos, tareas y actividad resumida.
- Componentizar como `CustomerActivityPanel` o similar.

### Lote FE-3: Filtros y presets

- Filtros por responsable, estado, prioridad, fecha, etiqueta.
- Presets locales.
- Persistencia en query params.

### Lote FE-4: Reporting extendido

- Reporte de tareas vencidas por responsable.
- Reporte de motivos de pérdida.
- Aging de tratos abiertos.
- Export CSV de reportes.

### Lote FE-5: Asistencias operativas

- Warnings accionables.
- CTA para crear tarea desde trato/contacto.
- CTA para agendar llamada desde contacto/trato.
