# Avances del CRM y guía de exposición

**Período:** desde el 22 de septiembre de 2026, inclusive.
**Último cambio local revisado:** 16 de octubre de 2026, commit `3c9e283` de `main`.
**Duración sugerida de la presentación:** 12 a 15 minutos.

Este documento agrupa los avances funcionales encontrados en el historial local, sin repetir merges ni sincronizaciones de ramas. La revisión confirma cambios en el repositorio, no que todos estén desplegados en el VPS. No se accedió al VPS ni se verificó su versión.

## 1. Lista de cambios

| Fecha | Área | Cambios principales |
| --- | --- | --- |
| 22 sep. | Empresas y Contactos | Rediseño de la pestaña de contactos, formularios de empresa, detalle, información y pestañas relacionadas. Renovación del listado, filtros y tabla de empresas. |
| 24 sep. | Inicio / Dashboard | Nuevo resumen ejecutivo: pipeline abierto y ponderado, ganado del mes y conversión. Paneles de cartera comercial, próximas acciones, cierres próximos, alertas y salud del CRM. |
| 27 sep. | Empresas | Normalización de campos, mejor manejo de duplicados y errores de validación, protección de envíos y actualización de datos después de guardar. Ajustes en tabla y detalle. |
| 28 sep. | Operación general | Mejoras para crear, editar y eliminar en Contactos, Empresas, Agenda, Bots, Etiquetas, Roles, Usuarios, Kanban, Tareas y Tratos. Refuerzo de validaciones, confirmaciones y mensajes de resultado. |
| 29 sep. | Agenda | Validación de eventos y horarios de Ciudad de México. Prevención de creación duplicada de eventos. |
| 1–2 oct. | Estabilidad | Refuerzo de formularios y manejo compartido de datos. Correcciones en interacciones y columnas Kanban, tareas y tratos; prevención de envíos duplicados en tratos. |
| 8 oct. | Tableros | Incorporación de creación, edición y eliminación de tableros; navegación base y actualización visual. Corrección del envío de un campo booleano al crear. |
| 8 oct. | Asistente | Chat global dentro del CRM y conexión autenticada con el servicio del agente. Actualización visual del widget. |
| 10 oct. | Roles y permisos | Modelo de permisos y matriz por rol. Aplicación de controles de visibilidad y acciones en navegación, búsqueda, dashboard y módulos del CRM. |
| 11 oct. | Interfaz administrativa | Renovación visual de Usuarios, Configuración, Roles y Etiquetas: listados, formularios y diálogos. Selector de tableros por nombre para permisos. La Agenda permanece visible aunque no tenga eventos. |
| 15 oct. | Demostración y tareas | Normalización de usuarios, roles y relaciones en los datos de demostración. Indicador explícito del alcance del listado de tareas y cantidad de resultados. |
| 16 oct. | Ajustes finales | Mejoras del botón del asistente y campo de escritura autoajustable. Actualización de Agenda tras crear desde formulario o después de una respuesta exitosa del asistente. Barra superior con nombre del usuario. |

### Referencias representativas del historial

| Cambio | Commits |
| --- | --- |
| Dashboard ejecutivo | `726df55`, `db9f0db` |
| Administración de tableros | `e1346ff` |
| Transporte autenticado y chat global | `28f5574`, `306e6e8` |
| Matriz de permisos | `bffb57f` |
| Selector de tableros por nombre | `366f772` |
| Datos de demostración y alcance de tareas | `fd251fd` |
| Actualización de Agenda | `1644e48` |
| Ajustes del asistente | `3c5a055` |
| Nombre de usuario en barra superior | `3c9e283` |

## 2. Guía de exposición

**Orden recomendado:** Inicio → Empresas → Contactos → Tratos → Tableros → Mis tareas → Agenda → Usuarios/Configuración → Asistente.

El hilo conductor es presentar primero el beneficio y después la pantalla que lo demuestra. No es necesario enumerar commits durante la exposición.

### Apertura — 30 segundos

**Qué decir:**

> Desde el 22 de septiembre trabajamos en cuatro frentes: mejorar la experiencia visual, facilitar el seguimiento comercial, reducir errores en la operación y ampliar las herramientas de administración y asistencia.

### 1. Inicio: visión general del negocio — 2 minutos

**En pantalla:**

1. Abrir Inicio.
2. Señalar pipeline abierto, pipeline ponderado, ganado del mes y conversión.
3. Mostrar próximas acciones y cartera comercial.

**Qué decir:**

> La pantalla inicial concentra los indicadores comerciales y las próximas acciones. El objetivo es identificar rápidamente qué oportunidades tenemos y qué requiere seguimiento.

**Precaución:** las cifras reflejan los datos disponibles. Si se utiliza información de demostración, no presentarlas como resultados reales del negocio.

### 2. Empresas y Contactos: información más accesible — 2 minutos

**En pantalla:**

1. Entrar a Empresas.
2. Mostrar el listado y desplegar los filtros.
3. Abrir una empresa con información y registros relacionados.
4. Mostrar brevemente Contactos.

**Qué decir:**

> Renovamos la consulta de empresas y contactos para que sea más fácil encontrar registros y revisar su información. También reforzamos los formularios y el manejo de errores al guardar.

**Demostración segura:** abrir un formulario y cancelarlo permite explicar el avance sin modificar información real.

### 3. Tratos y Tableros: seguimiento comercial — 2 minutos

**En pantalla:**

1. Mostrar Tratos.
2. Entrar a Tableros y abrir uno preparado.
3. Mostrar las opciones de administración disponibles para el usuario.

**Qué decir:**

> Además del seguimiento visual, incorporamos la administración de tableros: creación, edición y eliminación. También corregimos interacciones y acciones para hacer más consistente la operación.

**Precaución:** mover únicamente fichas de demostración. No presentar el movimiento de columna como equivalente automático a marcar un trato como ganado o perdido.

### 4. Mis tareas y Agenda: seguimiento diario — 2 minutos

**En pantalla:**

1. Abrir Mis tareas.
2. Mostrar el filtro de responsable y el mensaje de alcance con el conteo.
3. Pasar a Agenda.
4. Solo si el entorno está preparado para ello, crear un evento de prueba y verificar que aparezca sin recargar manualmente.

**Qué decir:**

> Ahora el listado deja explícito si estamos viendo todas las tareas o las de un responsable. En Agenda reforzamos la validación de horarios, evitamos envíos duplicados y corregimos la actualización después de crear eventos.

### 5. Usuarios, Roles y Configuración — 2 minutos

**En pantalla:**

1. Abrir Usuarios.
2. Entrar a Configuración y abrir Roles.
3. Mostrar la matriz de permisos y la selección de tableros por nombre.
4. Mostrar brevemente Etiquetas.

**Qué decir:**

> Se renovó la administración de usuarios, roles y etiquetas. La configuración de roles permite expresar qué recursos y acciones corresponden a cada perfil, incluyendo tableros específicos.

**Precaución:** explicar los controles implementados en la interfaz. Esta revisión no verifica la autorización del backend; no presentar la visibilidad de botones como prueba de seguridad de la API.

### 6. Asistente integrado — 1 a 2 minutos

**En pantalla:**

1. Abrir el chat desde una pantalla del CRM.
2. Mostrar el campo de escritura y una interacción previamente ensayada.

**Qué decir:**

> Integramos un asistente accesible desde el CRM, conectado mediante la sesión autenticada. También mejoramos su presentación y la actualización de Agenda después de las interacciones exitosas.

**Precaución:** no improvisar una solicitud que no se haya probado en el VPS. La integración del chat no demuestra que cualquier operación esté soportada.

### Cierre — 30 segundos

> El avance no fue solamente visual: mejoramos la consulta de información, la administración de tableros y perfiles, y la consistencia de formularios y actualizaciones. Esto deja una base más clara para el seguimiento comercial y la operación diaria.

## 3. Preparación antes de compartir pantalla

- [ ] Confirmar que el VPS tenga los cambios que se van a presentar.
- [ ] Preparar una empresa, un contacto, un trato y un tablero de demostración relacionados.
- [ ] Revisar los permisos de la cuenta que se utilizará en la exposición.
- [ ] Ensayar el asistente y la creación de eventos.
- [ ] Ocultar contraseñas, tokens, terminales y datos sensibles.
- [ ] No eliminar registros ni cambiar permisos reales durante la exposición.
- [ ] Si algo falla, explicar el resultado observado y no presentarlo como validado.

## 4. Alcance de la revisión

- Se consultaron el historial local de Git, cambios seleccionados y código de las pantallas relevantes.
- No se accedió al VPS ni se comprobó su versión desplegada.
- No se ejecutaron pruebas funcionales durante la preparación de esta guía.
- Los datos normalizados de demostración corresponden al código y sus fixtures; no prueban una actualización de datos en producción.
