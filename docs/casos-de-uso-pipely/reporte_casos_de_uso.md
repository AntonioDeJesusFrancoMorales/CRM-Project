# Casos de uso principales de Pipely

Archivos: [PlantUML editable](casos_de_uso_pipely.puml), [PNG](casos_de_uso_pipely.png) y [SVG](casos_de_uso_pipely.svg).

## A. Texto para Resultados

La Figura X muestra las principales acciones que una persona puede realizar mediante la interfaz de Pipely. Reúne el acceso a la cuenta, la consulta del resumen comercial, la gestión de empresas, contactos, tratos, tareas y agenda, así como la organización de tableros y la configuración del sistema. Las funciones aparecen dentro del límite de Pipely y se relacionan con un único actor, denominado Persona usuaria. Esta vista permite reconocer el alcance funcional del frontend sin detallar cada botón; las acciones disponibles para cada cuenta dependen de sus permisos.

## B. Título de figura sugerido

Figura X<br>
Casos de uso principales de Pipely (octubre de 2026)

## C. Actores

| Actor | Qué representa | Evidencia en el código |
| --- | --- | --- |
| Persona usuaria | Persona que interactúa con Pipely. Agrupa a quienes utilizan sus funciones con los permisos asignados a su cuenta; no significa que toda cuenta pueda realizar todas las acciones. | `src/features/auth/components/LoginForm.tsx:5-10`, acceso; `src/features/permissions/lib/resolver.ts:16-27`, resolución de usuario, rol y permisos; `src/features/roles/components/PermissionMatrix.tsx`, configuración de capacidades. |

Se utilizó un solo actor para presentar una vista general, sin nombres personales ni separación por roles. Las asociaciones representan funciones posibles del sistema, no acceso universal. No se dibujó generalización de actores ni se añadió Keycloak, pues no eran necesarios para explicar esta vista funcional.

## D. Casos de uso y evidencia

Todas las rutas de evidencia son relativas al repositorio frontend. Las páginas se contrastaron con sus formularios, manejadores y solicitudes; la presencia de una ruta por sí sola no se tomó como prueba de una acción.

| ID | Caso de uso | Actor principal | Objetivo o resultado para el usuario | Evidencia en el código |
| --- | --- | --- | --- | --- |
| UC01 | Iniciar y cerrar sesión | Persona usuaria | Acceder a su cuenta o finalizar la sesión. | `src/features/auth/components/LoginForm.tsx:5-10`; `src/components/layout/Topbar.tsx:112-119`; `src/features/auth/hooks/useLogout.ts:8-14`. |
| UC02 | Consultar el resumen comercial | Persona usuaria | Revisar indicadores y próximos asuntos con la información habilitada para su cuenta. | `src/features/dashboard/pages/DashboardPage.tsx:60-96`; `src/routes/router.tsx:54-56`. |
| UC03 | Gestionar empresas | Persona usuaria | Consultar, registrar, actualizar o eliminar empresas, según permisos. | `src/features/empresas/components/EmpresaFormDialog.tsx:40-65,90-128`, `handleSubmit`; `src/features/empresas/hooks/useDeleteEmpresa.ts:8-17`; `src/routes/router.tsx:58-62`. |
| UC04 | Gestionar contactos | Persona usuaria | Registrar y consultar contactos, editar datos, cambiar su estado de relación o eliminarlos, según permisos. | `src/features/contactos/components/ContactoFormDialog.tsx:40-63,87-122`; `src/features/contactos/pages/ContactoDetailPage.tsx:121-126,162-175,287-307`, uso de `useCambiarEstadoContacto`. |
| UC05 | Registrar un trato | Persona usuaria | Registrar una oportunidad vinculada con un contacto y un responsable. | `src/features/tratos/components/TratoCreateDialog.tsx:56-87`, `handleSubmit`; `src/features/tratos/hooks/useCreateTrato.ts:31-37,52-70`; `src/features/tratos/components/TratoForm.tsx:75-110`. |
| UC06 | Dar seguimiento a un trato | Persona usuaria | Consultar y editar oportunidades, registrar notas, vincular tareas y marcarlas como ganadas o perdidas, según permisos. | `src/features/tratos/pages/TratoDetailPage.tsx:80-94,116-133,223-268,319-348`; `src/features/tratos/components/TratoNotasTab.tsx:24-43`; `src/features/tratos/components/TratoTareasTab.tsx:22-50,71-86`. |
| UC07 | Gestionar tareas | Persona usuaria | Registrar, consultar, editar o eliminar actividades según permisos. | `src/features/tareas/pages/TareasListPage.tsx:95-100,226-231,486-498,543-578`; `src/features/tareas/components/TareaCreateDialog.tsx:53-69`; `src/features/tareas/components/TareaEditDialog.tsx:48-68`; `src/features/tareas/components/TareasTable.tsx`, uso de `useDeleteTarea`. |
| UC08 | Organizar la agenda | Persona usuaria | Consultar eventos y crear, editar o eliminar actividades de agenda según permisos. | `src/features/agenda/components/AgendaCreateDialog.tsx:25-58,65-81`; `src/features/agenda/components/AgendaEditDialog.tsx:31-60,77-91`; `src/features/agenda/pages/AgendaListPage.tsx:69-75,123-131,204-249`. |
| UC09 | Organizar tableros y columnas | Persona usuaria | Crear, editar y eliminar tableros y organizar sus columnas mediante las acciones permitidas. | `src/features/kanban/pages/KanbanListPage.tsx:94-102,125-129,185-249`; `src/features/kanban/components/KanbanBoard.tsx:95-115,159-163,291-301`; `src/features/kanban/components/KanbanColumn.tsx:225-231,378-419,504-512`. |
| UC10 | Mover fichas entre columnas | Persona usuaria | Cambiar la ubicación de una ficha para reflejar su seguimiento visual. | `src/features/kanban/components/KanbanBoard.tsx:60-76,144-157,217-233`, `buildDragEndHandler` y `moveFicha`; `src/features/kanban/hooks/useMoverFicha.ts:25-80`. |
| UC11 | Gestionar usuarios y asignar roles | Persona usuaria | Administrar cuentas y asignarles un rol del CRM, con los permisos requeridos. | `src/features/usuarios/pages/UsuariosListPage.tsx:31-47,58-63,124-165`; `src/features/usuarios/components/UsuarioFormDialog.tsx:45-53,101-115`; `src/features/usuarios/components/UsuarioDeleteDialog.tsx:53-69,100-122`. |
| UC12 | Configurar roles y permisos | Persona usuaria | Crear, editar o eliminar roles y configurar sus acciones, con los permisos requeridos. | `src/features/roles/components/RolFormDialog.tsx:184-202,234-253`; `src/features/roles/pages/RolesListPage.tsx:154-203`; `src/features/roles/components/PermissionMatrix.tsx:248-283,311-363`. |
| UC13 | Administrar etiquetas | Persona usuaria | Consultar, crear, editar o eliminar etiquetas, según permisos. | `src/features/etiquetas/pages/EtiquetasListPage.tsx:42-81,102-126,180-221`; `src/features/etiquetas/components/EtiquetaFormDialog.tsx:150-176,286-312`; `src/features/etiquetas/components/EtiquetaDeleteDialog.tsx:27-54`. |
| UC14 | Solicitar cambio de contraseña | Persona usuaria | Solicitar el procedimiento de cambio de contraseña de su propia cuenta. | `src/features/roles/pages/RolesListPage.tsx:46-57,169`, tarjeta tras comprobar lectura de roles; `src/features/usuarios/components/CambiarPasswordCard.tsx:17-40`; `src/features/usuarios/hooks/useRequestPasswordChange.ts:11-23`. |

## E. Fichas descriptivas

### Registro de una oportunidad

| Campo | Descripción |
| --- | --- |
| ID y nombre | UC05 — Registrar un trato. |
| Actor principal | Persona usuaria. |
| Precondición | Sesión disponible, permiso de creación de tratos y datos de selección necesarios cargados. |
| Flujo principal resumido | Abre «Nuevo trato», completa los campos y solicita guardar. El formulario valida los datos y envía la solicitud. Ante el éxito, confirma el registro y se cierra. |
| Alternativa o error relevante | Los campos inválidos impiden iniciar la creación. Los errores de campo recibidos se muestran junto a los campos; otros errores pueden mostrarse como notificación. |
| Resultado | La interfaz confirma el registro cuando la solicitud termina correctamente. |

### Movimiento en el tablero

| Campo | Descripción |
| --- | --- |
| ID y nombre | UC10 — Mover fichas entre columnas. |
| Actor principal | Persona usuaria. |
| Precondición | Tablero y ficha disponibles, permisos `FICHA:ACTUALIZAR` y `COLUMNA:LEER`, sin otro movimiento iniciado desde esa instancia del tablero. |
| Flujo principal resumido | Arrastra la ficha a otra columna. El tablero comprueba destino, permisos y bloqueo, actualiza su ubicación local y envía el movimiento. Ante el éxito, solicita actualizar las fichas y confirma. |
| Alternativa o error relevante | Sin destino, ficha no encontrada o misma columna, no se envía el movimiento. Ante un error se intentan recuperar los datos anteriores; un error HTTP 422 no muestra notificación. |
| Resultado | Se representa el movimiento, se solicita sincronizar las fichas tras el éxito y se libera el bloqueo al finalizar, suponiendo que el tablero permanece montado. |

### Configuración de acceso

| Campo | Descripción |
| --- | --- |
| ID y nombre | UC12 — Configurar roles y permisos. |
| Actor principal | Persona usuaria. |
| Precondición | Sesión y permisos para consultar y crear o editar roles, según la acción elegida. |
| Flujo principal resumido | Abre la sección de roles, elige crear o editar, completa los datos, configura acciones y alcances y solicita guardar. |
| Alternativa o error relevante | La interfaz condiciona creación, edición y eliminación a sus permisos; una restricción visual no prueba una restricción equivalente en el servidor. |
| Resultado | Se solicita registrar la configuración. No se afirma que todos los alcances se apliquen correctamente en el servidor. |

## F. Verificación y límites

### Versión y evidencia

- Frontend `CRM-Project`, rama **`main`**, commit **`43049a8c5b9bff03c2e553475ba7ff057268211e`**. Los archivos de la tabla respaldan cada objetivo.
- Se consultaron además `src/routes/router.tsx`, `src/components/layout/Sidebar.tsx`, el resolvedor de permisos y `src/mocks/fixtures/roles.ts`. Los roles de prueba corroboran diferencias de acceso, pero no se dibujan como actores separados en esta versión.
- La revisión funcional fue **estática**. No se inició la aplicación ni se probaron los 14 objetivos en una sesión real. Los flujos frontend no acreditan despliegue, autorización del servidor, persistencia ni entrega de correos.
- No se consultó el backend AR-CRM para este diagrama. No se afirman discrepancias comprobadas entre repositorios porque esa comparación no se realizó.
- No se modificó código de aplicación. Los diagramas de secuencia anteriores se conservaron.

### Decisiones de modelado

- Se conservaron **14 casos de uso**, con un único actor **Persona usuaria** fuera del rectángulo **Pipely**. Cada función aparece una sola vez dentro del sistema, con una asociación simple al actor.
- La vista resume las capacidades del producto; no es una matriz de acceso. Tener una asociación con «Gestionar» no significa que toda cuenta pueda consultar, crear, actualizar y eliminar. Cada operación conserva sus comprobaciones de permisos.
- No se muestran nombres personales, roles separados ni códigos UC en las etiquetas. Los IDs permanecen en el reporte y como alias internos para trazabilidad.
- No se usaron `include`, `extend` ni generalización. Iniciar sesión se trata como una condición habitual de acceso, no como un caso incluido desde cada operación. Los enlaces invisibles del editable solo controlan la distribución.
- Los permisos y alcances del frontend no demuestran autorización ni filtrado de registros en el servidor. El Ejecutivo Comercial de prueba no elimina registros de negocio ni mueve fichas, aunque se incluya dentro del actor general.
- En tratos se comprobaron las acciones de ganar o perder; no una edición libre de estados. El menú de estado de tareas mueve la ficha de columna; no se afirmó un cambio de estado de negocio independiente.
- No puede eliminarse cualquier columna: el código protege las predeterminadas y las que contienen fichas. El diálogo de usuarios también bloquea eliminar la propia cuenta.
- Solicitar cambio de contraseña no equivale a editarla directamente en Pipely ni demuestra entrega del correo. La tarjeta aparece en la página de roles, tras comprobar lectura de `ROL`.

### Fuera del diagrama

- Se excluyeron inteligencia artificial, WhatsApp, detalles internos del backend y almacenamiento.
- No se obtuvo evidencia suficiente en las superficies consultadas para representar invitaciones de usuarios, edición general del perfil propio, administración de superusuarios o cambio directo de contraseña dentro de Pipely.
- Prospectos y clientes no se dibujaron como módulos independientes: `src/routes/router.tsx:70-75` redirige esas rutas a Contactos.
- La exportación CSV observada en `DashboardPage.tsx:110-135` quedó agrupada en la consulta del resumen. Búsquedas, filtros, detalles y confirmaciones se integraron en sus objetivos de gestión.
- La asignación de etiquetas a fichas no se descompuso en otro caso; UC13 representa la administración del catálogo.

### Comprobación de los artefactos

Se comprobó la sintaxis PlantUML: un actor, 14 óvalos únicos y 14 asociaciones simples, además de la correspondencia con las 14 filas de evidencia. Se revisó la imagen completa y se confirmó que la fuente incrustada del PNG y del SVG coincide con el `.puml`, normalizando solo los saltos de línea.

Las imágenes se generaron con PlantUML 1.2025.10 y renderizado a 220 dpi; el PNG mide **2023 × 1088 píxeles**. Para Word o Google Docs, utilizar A4 horizontal, conservar la proporción de la imagen y colocar el título como texto fuera de ella. El SVG conserva la versión vectorial. No corresponde una prueba RED de aplicación: esta modificación solo cambia documentación y diagramas.
