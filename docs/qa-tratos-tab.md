# Checklist QA manual — Tratos

Fecha: 2026-10-01
Ambiente: `[ ] MSW` `[x] backend real`

Lista breve para revisar la pestaña **Tratos** según la implementación actual. `[x]` indica un comportamiento respaldado por código, tests o revisión del flujo; `[Revisar]` queda pendiente o no está definido en esta pantalla. Si se encuentra una diferencia, anotarla en **Observaciones**.

Ruta principal: `/tratos`. Detalle: `/tratos/:id`.

## Datos ficticios seguros

| Uso                            | Valor                                                                    |
| ------------------------------ | ------------------------------------------------------------------------ |
| Trato nuevo                    | `QA trato manual 2026-10-01`                                             |
| Contacto nuevo                 | `Ana` (`c1111111-cccc-1111-cccc-111111111111`)                           |
| Responsable nuevo              | `Antonio Franco`                                                         |
| Tipo, valor y probabilidad     | `Servicio`, `60000` MXN, `60`                                            |
| Cierre esperado nuevo          | `2026-10-31`                                                             |
| Trato abierto con tareas       | `Implementación CRM Innovatech` (`d1111111-dddd-1111-dddd-111111111111`) |
| Trato sin tareas para eliminar | `Consultoría procesos Maya` (`d3333333-dddd-3333-dddd-333333333333`)     |
| Trato perdido                  | `Automatización logística Maya` (`d5555555-dddd-5555-dddd-555555555555`) |
| Tareas relacionadas            | `Demo presencial con CTO` y `Llamada de seguimiento post-demo`           |
| Nota de prueba                 | `Nota QA manual 2026-10-01: seguimiento ficticio.`                       |
| Motivo de pérdida de prueba    | `Presupuesto ficticio insuficiente.`                                     |

Con la fixture inicial hay cinco tratos. `Implementación CRM Innovatech` tiene dos tareas y `Consultoría procesos Maya` no tiene tareas. Las fechas de cierre de la fixture son anteriores a `2026-10-01`, por lo que pueden mostrarse como vencidas.

## 1. Acceso, carga, KPIs y estados iniciales

- [x] Iniciar sesión y abrir **Tratos** desde el menú lateral; confirmar la URL `/tratos`, el título **Tratos** y el texto **Gestiona los tratos comerciales del CRM.**
- [x] Confirmar los botones **Nuevo trato** y **Más acciones**. En **Más acciones**, comprobar **Recargar**.
- [x] Confirmar las pestañas **Kanban** y **Lista**. La vista inicial es **Kanban** cuando la URL no tiene `?tab=lista`.
- [x] En **Lista**, revisar las tarjetas **Total de tratos**, **Valor pipeline**, **Valor ponderado** y **Ticket promedio**. Con la fixture inicial, la base de cálculo es: 5 totales, 4 abiertos, `845000` MXN de pipeline, `704500` MXN ponderados y `211250` MXN de ticket promedio.
- [x] En **Lista**, confirmar las columnas **Nombre**, **Valor estimado**, **Tipo de contrato**, **Contacto**, **Responsable** y **Cierre esperado**; debajo del nombre se muestra estado y probabilidad.
- [x] Simular carga lenta y revisar el esqueleto de tabla. Forzar un `500` en el listado y comprobar **No fue posible cargar los tratos. Intenta de nuevo.**, **Reintentar** y ausencia de la tabla.
- [x] Responder `[]` en el listado y comprobar **Aún no hay tratos** con el botón **Nuevo trato**.
- [x] Aplicar filtros sin coincidencias y comprobar la fila **No hay tratos para los filtros seleccionados**.

Observaciones: el boton recargar sacado de ahi, elimina el boton mas acciones, deja el boton de recargar a la izquirda del de nuevo trato.

## 2. Tabs, búsqueda, filtros, ordenamiento y paginación

- [x] Abrir `/tratos?tab=lista`, comprobar que **Lista** queda activa y que la tabla aparece. Volver a **Kanban** y confirmar que la URL queda sin `?tab`.
- [x] Abrir **Mostrar filtros** y probar la búsqueda **Buscar por nombre...**; debe ser insensible a mayúsculas y buscar solo en `nombre`.
- [x] Probar los filtros **Estado** (`Abierto`, `Ganado`, `Perdido`), **Tipo de contrato** (`Servicio`, `Licencia`, `Suscripción`, `Permanente`, `Otro`), **Responsable**, **Contacto**, **Valor mín.**, **Valor máx.** y **Cierre esperado** (`Vencidas`, `Próximos 7 días`, `Próximos 30 días`, `Sin fecha`).
- [x] Confirmar que solo aparecen responsables activos y que **Limpiar filtros** restablece la lista y la página a la primera.
- [x] Confirmar que los filtros también limitan las fichas mostradas en **Kanban** y que el contador indica **Mostrando N de N tratos**.
- [x] Guardar una vista local con **Guardar vista**, aplicarla desde **Vistas guardadas**, eliminarla y recargar la página. La clave local es `crm:list-presets:tratos`.
- [x] Probar los encabezados ordenables **Nombre**, **Valor estimado** y **Cierre esperado**; comprobar el cambio ascendente/descendente y que el cambio vuelve a la primera página.
- [x] Probar **Filas** con `10`, `25`, `50` y `100`, y los botones **Anterior** y **Siguiente**. El tamaño inicial es `25` y el orden inicial solicitado es `creadoEn` descendente.
- [Revisar] Con más de 25 registros, validar con backend real que `page`, `pageSize`, `sortBy` y `sortDirection` sean respetados. El handler MSW devuelve el array completo e ignora esos parámetros; el front adapta la respuesta y la corta localmente.

observaciones: cuando estas ordenado de orde descendente en el valor estimado, cuando no hay informacion se pone hasta arriba, en dado caso tendria que ponerse hasta el ultimo.

## 3. Crear un trato

- [x] Abrir **Nuevo trato** y confirmar los valores iniciales: **Contacto** vacío y requerido, **Nombre del trato** vacío, **Responsable** vacío y requerido, **Tipo de contrato** en `Servicio`, y **Valor estimado (MXN)**, **Probabilidad (%)** y **Cierre esperado** vacíos.
- [x] Confirmar que el selector de contacto es único, que el responsable solo ofrece usuarios activos y que no existen selector de empresa, toggle Cliente/Prospecto ni campo de estado.
- [x] Crear `QA trato manual 2026-10-01` con los datos seguros, revisar el `POST /api/tratos/create`, el cierre del diálogo, el toast `Trato "QA trato manual 2026-10-01" creado` y la actualización del listado.
- [x] En Network, confirmar que el body contiene `contactoId`, `responsableId`, `nombre`, `tipoContrato`, `valorEstimado`, `probabilidad` y `fechaCierreEsperada`, y que no contiene `estado` ni campos antiguos como `cliente_id`, `prospecto_id` o `asociacion`.
- [x] Dejar campos requeridos vacíos, enviar y comprobar errores inline sin enviar el `POST`. Cancelar una creación con datos escritos y confirmar que no se envía request.
- [x] Simular una respuesta lenta y hacer doble clic en **Crear trato**: debe existir una sola request, aparecer **Guardando...**, deshabilitarse el botón y mantenerse bloqueado el cierre mientras se envía.
- [x] Forzar `422` con `details` y comprobar que el diálogo permanece abierto y los errores se muestran en sus campos. Para otros errores, comprobar el toast y que los datos escritos no se pierdan.

Observaciones: al spamear el boton de crear se crean varias seguidas, no se detiene y deja solo 1, arregla eso, ocn los botones de editar y eliminar tambien. Y el8imina el boton de abrir chat de las tarjetas.

## 4. Editar y eliminar

- [x] Editar un trato desde el menú de acciones de la tabla y desde el detalle. Confirmar que se precargan contacto, nombre, responsable, tipo, valor, probabilidad y cierre esperado.
- [x] Cambiar datos y revisar el `PUT /api/tratos/edit?id=<id>`, el toast `Trato "<nombre>" actualizado`, el cierre del diálogo y la actualización de lista/detalle.
- [x] Confirmar que el body de edición no contiene `contactoId`: el contacto es inmutable según `TratoUpdatePayload`, aunque el selector aparezca precargado en el formulario.
- [Revisar] Si el producto debe permitir cambiar el contacto, registrar la diferencia: la pantalla muestra el selector, pero el submit lo omite del request.
- [x] Cancelar una edición y volver a abrirla para comprobar que no se guardaron cambios. Probar el doble clic durante una respuesta lenta y confirmar una sola request y el estado **Guardando...**.
- [x] Eliminar `Consultoría procesos Maya`, confirmar el nombre en **¿Eliminar trato?**, cancelar una vez y luego confirmar. Revisar `DELETE /api/tratos/delete?id=<id>`, el toast **Trato eliminado**, la desaparición del trato y la navegación a `/tratos` cuando se elimina desde detalle.
- [x] Eliminar `Implementación CRM Innovatech` para comprobar el `409`: debe mostrarse `El trato tiene 2 tareas asociadas`, no debe borrarse el trato ni su ficha y no debe presentarse como éxito.
- [x] Con respuesta lenta, hacer doble clic en **Eliminar** y confirmar una sola request, el estado **Eliminando...** y el botón deshabilitado. Forzar `404` o `500` y comprobar que no se actualiza la lista como si hubiera sido exitoso.

Observaciones: al darle click a editar me abre el detalles del trato y no una pestaña para editar el trato. Al parecer no se puede cambiar el contacto dle trato, revisa en el backend si eso es posible y derivado de hace haz los cambios en la interfaz o en el codigo para que se puede o no cambiar. Al borrar el trato con tareas se elimino el trato sin problema.

## 5. Detalle, pestañas y relaciones

- [x] Abrir `/tratos/d1111111-dddd-1111-dddd-111111111111`, confirmar el título **Implementación CRM Innovatech**, el botón **Volver al listado**, y que **Información** sea la pestaña inicial.
- [x] En **Información**, revisar contacto enlazado `Carlos`, responsable `María González`, tipo, valor, probabilidad, fecha de cierre, fechas de creación/actualización y la navegación del contacto a `/contactos/<contactoId>`.
- [x] En un trato con `estado = PERDIDO`, como `Automatización logística Maya`, comprobar el badge **Perdido** y el campo **Motivo de pérdida** con `Presupuesto insuficiente del cliente`. En un trato abierto, comprobar las acciones **Ganar** y **Perder**; en uno ganado/perdido no aparece **Reabrir**.
- [x] Abrir **Tareas** y comprobar que solo se muestran las tareas del trato: `Demo presencial con CTO` y `Llamada de seguimiento post-demo`. En un trato sin tareas debe aparecer **Sin tareas registradas**.
- [x] Confirmar el contador de pendientes: en `Implementación CRM Innovatech` se muestra `2`; en `Consultoría procesos Maya` el badge no aparece.
- [x] Usar **Crear tarea** desde **Tareas** y confirmar que el trato queda fijo; revisar `POST /api/tareas/create` con `tratoId` igual al id del detalle.
- [x] Abrir **Notas** y comprobar la carga, el estado **Sin notas ni eventos todavía.**, el textarea **Escribe una nota sobre esta oportunidad...** y el botón **Agregar nota**.
- [x] Agregar la nota segura, revisar `POST /api/tratos/notas/create?tratoId=<id>` con `{ "contenido": "..." }`, la limpieza del textarea y la aparición de la nota. Las notas y eventos se ordenan de más recientes a más antiguos.
- [x] Probar `?tab=tareas` y `?tab=notas`, y volver con el botón **Volver al listado**. Forzar un `404` y comprobar **Este trato no existe. Volviendo al listado...**, el toast **Este trato no existe** y la redirección posterior a `/tratos`.
- [Revisar] En errores de carga de Tareas o Notas, comprobar si el mensaje sin acción de reintento es suficiente para el comportamiento esperado; la pantalla actual no expone un botón **Reintentar** en esas pestañas.

Observaciones: los componentes no tienen margen a la izzquierda y se ven pegados a la barra de la izquierda. Eso de contador de pendientes, halzo mas descriptivo, ese 2 asi solo no se entiende.

## 6. Cambio de estado, validaciones y límites

- [x] En un trato abierto, pulsar **Ganar** y revisar `PUT /api/tratos/ganar?id=<id>` con body `{}`, el toast `"<nombre>" marcado como ganado 🎉`, el cambio de badge y la actualización de filtros/Kanban.
- [x] Pulsar **Perder**, confirmar el diálogo **Marcar como perdido**, probar cancelar y luego ingresar un motivo con espacios alrededor. El botón permanece deshabilitado sin motivo no vacío; el request es `PUT /api/tratos/perder?id=<id>` con el motivo recortado.
- [x] Confirmar que el formulario de crear/editar no permite editar el estado directamente y que el estado se filtra como **Abierto**, **Ganado** o **Perdido**.
- [x] Validar campos requeridos: contacto, responsable y nombre. El nombre recorta espacios, rechaza vacío y acepta hasta 200 caracteres; probar 200 y 201.
- [x] Probar tipo de contrato inválido desde una respuesta manipulada, valor estimado negativo/`0`, y probabilidad `-1`, `0`, `100` y `101`. El valor debe ser no negativo y la probabilidad debe quedar entre 0 y 100.
- [x] Dejar valor, probabilidad y cierre esperado vacíos y confirmar que se envían como `null` o no se envían como valores inválidos. El cierre esperado se selecciona como fecha `YYYY-MM-DD` y puede limpiarse.
- [Revisar] El schema no define límite de valor estimado, longitud del motivo de pérdida, formato textual de fecha ni prohibición de fechas pasadas; validar con backend real o definición funcional si deben existir esas reglas.
- [x] Forzar `422` con `details` en crear/editar y comprobar el mapeo inline. Forzar `400`, `404`, `409` o `500` y confirmar el toast correspondiente sin falsear la operación como exitosa.
- [Revisar] Probar doble clic en **Ganar** y **Marcar como perdido** con latencia: esas acciones deshabilitan por `isPending`, pero no usan el mismo lock síncrono explícito de crear, editar y eliminar.

Observaciones: el color del boton de marcar como perdido no tiene un contorno y se vel del mismo color del fondo. No dejes que el usuario pueda poner una fecha antigua, basate en la hora de ciudad de mexico para determinar la hora actual.

## 7. Responsive, recarga y persistencia

- [x] Revisar escritorio, tablet y móvil: encabezado, KPIs, tabs, filtros y acciones deben seguir siendo utilizables. La tabla debe poder desplazarse horizontalmente sin cortar columnas.
- [x] Abrir crear/editar en una ventana baja y comprobar que el diálogo permite llegar a **Cancelar**, **Crear trato** o **Guardar cambios**; el diálogo de edición tiene scroll hasta el 90% de la ventana.
- [x] Usar **Más acciones > Recargar**, confirmar el `GET`, el estado **Recargando...** y el botón deshabilitado mientras se consulta.
- [x] Recargar el navegador completo y confirmar que se vuelven a pedir los datos. La pestaña se conserva solo si está en la URL (`?tab=lista`, `?tab=tareas` o `?tab=notas`); los filtros, paginación y orden local vuelven a sus valores iniciales.
- [x] Confirmar que las vistas guardadas de `localStorage` sobreviven a la recarga y que el listado se vuelve a cargar con el ambiente seleccionado.
- [x] Con MSW, considerar los cambios de tratos, estados y notas como datos en memoria de la sesión; una recarga completa puede devolver la fixture inicial. Con backend real, verificar la persistencia durable y el usuario autenticado.
- [Revisar] Comparar crear un trato en MSW y en backend real: el código del front invalida `fichas` porque el backend real crea automáticamente la ficha TRATO, pero el handler MSW de `POST /api/tratos/create` no agrega una ficha a `fichasFixture`.

---

observaciones: recuerda que el boton de recargar debe tener una animacion, por como esta ahora no se ve si ya la pusiste o no. Al mover una columna esta se regresa a su lugar y luego se hace tp a donde yo lo movi, mejora ese feeling y haz que se mueva en el front primero y cuando confirme el back de movido no se haga tp y si niega el movimiento entonces que se regrese, que el toast salga cuando el backend confirme. En los tres puntos, el apartado de agregar trato no tiene un simbolo, ponle uno para tener una coherencia estetica, cambia el texto renombrar columna a editar columna, y revisa el backend para ver si se puede editar el limite de la tareas porque recuerdo que si se podia pero ya no sale. Y el ocultar columna quitalo y pon eliiminar columna. Cuando no puedas eliminar una columna porque tiene tratos que salga el boton pero que salga desactivado y al pasar el mouse avise que no se puede borrar hasta que no tenga tratos. Cuando se haga click a Agregar trato este debe tener el mismo comportamiento que nuevo trato, porque abre una ventana nada que ver, evidentemente debe estar precargada la opcion de columna con la columna donde se presiono el agregar trato. Cuando se mueve una ficha de lugar se muestra por detras de la columa nueva, tiene que mostrarse por delantes mientras se arrastra.
