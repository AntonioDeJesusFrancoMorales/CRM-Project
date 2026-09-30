# Checklist QA manual — Agenda

Fecha: 2026-09-29
Ambiente: `[ ] MSW` `[x] backend real`

Lista breve para revisar la pestaña **Agenda** desde la implementación actual. Si un comportamiento no está definido o no se puede comprobar desde esta pantalla, anotarlo como **revisar**.

## Datos ficticios seguros

| Uso                         | Valor                                     |
| --------------------------- | ----------------------------------------- |
| Reunión nueva               | `QA reunión agenda 2026-09-29-01`         |
| Llamada nueva               | `QA llamada agenda 2026-09-29-01`         |
| Descripción                 | `Revisión funcional con datos ficticios.` |
| Fecha futura                | `2026-10-15`                              |
| Inicio / fin                | `10:00` / `11:00`                         |
| Ubicación                   | `Sala QA 3`                               |
| Link de videollamada        | `https://meet.example.com/qa-agenda-01`   |
| Trato relacionado           | `Implementación CRM Innovatech`           |
| Tarea relacionada           | `Demo presencial con CTO`                 |
| Evento para editar          | `Kickoff de renovación de contrato`       |
| Evento seguro para eliminar | `Llamada rápida de coordinación`          |

Con MSW, la fixture inicial tiene cuatro eventos entre el 8 y el 10 de junio de 2026. Incluye llamadas, reuniones, eventos con y sin vínculos, y eventos con recordatorio. La cantidad puede cambiar durante la sesión.

## 1. Acceso, carga y listado

- [x] Iniciar sesión y abrir **Agenda** desde el menú lateral.
- [x] Confirmar la URL `/agenda`, el título **Agenda**, el texto descriptivo y los botones **Nuevo evento** y **Recargar agenda**.
- [x] Confirmar que la vista inicial es **Calendario** y que también aparece **Lista**.
- [x] Revisar las tarjetas **Total de eventos**, **Próximos** y **Hoy** contra las fechas visibles.
- [x] Mirar en Network el `GET /api/agendas/get-all-by-user` y confirmar que la respuesta se muestra sin datos de otro usuario cuando se usa el backend real.
- [x] Abrir **Lista** y comprobar que los eventos se agrupan por fecha y se ordenan por hora de inicio.
- [x] Revisar horas, tipo, asunto, ubicación o link y badge del recordatorio cuando corresponda.
- [x] Simular una carga lenta y confirmar que aparece el esqueleto sin saltos importantes.
- [x] Forzar un `500` del listado y probar **Reintentar**.
- [x] Probar una respuesta vacía `[]` y revisar el estado **Aún no hay eventos** con **Nuevo evento**.

observaciones: mueve el cuadro de recarga al lado izquierdo del boono nuevo evento que al parecer esa es la norma que estamos siguiendo.

## 2. Calendario, lista y selección de fecha

- [x] En **Calendario**, revisar el mes actual, los días de la semana y el día seleccionado.
- [x] Usar **Mes anterior**, **Mes siguiente** y **Hoy**.
- [x] Ir a junio de 2026, seleccionar el 8, 9 y 10, y comprobar los eventos del panel lateral.
- [x] Seleccionar un día sin eventos y revisar el mensaje **No hay eventos. Crear uno**.
- [x] Crear un evento desde el botón del día seleccionado y confirmar que la fecha queda precargada.
- [x] Si hay más de tres eventos en un día, revisar que el calendario muestre `+N más` y que el panel lateral permita verlos.
- [x] Alternar varias veces entre **Calendario** y **Lista** sin perder los datos.
- [x] No buscar filtros, buscador ni paginación: no existen en la Agenda actual. Si se necesitan, dejarlo como **revisar**.

## 3. Crear eventos

- [x] Abrir **Nuevo evento** desde el encabezado y desde un día del calendario.
- [x] Confirmar los valores iniciales: tipo **Reunión**, campos vacíos, vínculos en **Ninguno/Ninguna** y recordatorio desactivado.
- [x] Crear una reunión con los datos ficticios, ubicación, fecha, inicio, fin y descripción.
- [x] Revisar el `POST /api/agendas/create`, el cierre del diálogo, el toast y la aparición del evento en la lista o calendario.
- [x] Cambiar a **Llamada** y confirmar que desaparece **Ubicación** y aparece **Link de videollamada**.
- [x] Crear una llamada con `https://meet.example.com/qa-agenda-01` y revisar el enlace **Videollamada** o **Abrir videollamada**.
- [x] Habilitar **Recordatorio por email**, cargar `15` minutos y comprobar que aparece el badge correspondiente. El estado lo informa el backend; no se edita desde el formulario.
- [x] Deshabilitar el recordatorio y confirmar que **Minutos antes** se limpia y queda deshabilitado.
- [x] Cancelar una creación con datos escritos y confirmar que no se envía el `POST`.
- [x] Con una respuesta lenta, hacer doble clic en **Crear evento** y comprobar una sola request, el estado **Guardando...** y el botón deshabilitado.

observaciones: al crear un evento y poner el tiempo de recordatorio, sale unas flechas de arriba y abajo pero no tienen sentido que esten ahi ademas se ven con fondo blanco. Y ademas si se hace clcik muy rapido se siguen guardadno la misma cita varias vecces, checa eso. Ademas el campio nombre acepta espacios vacios, ya habiamos quedado que esas cosas no se podian aunque el mensaje de erro del backend no dejara agregar con nombre vacio.

## 4. Editar y eliminar

- [x] Editar `Kickoff de renovación de contrato` desde **Lista** o desde el panel del calendario.
- [x] Confirmar que el formulario precarga tipo, asunto, fecha, horas, vínculos, ubicación o link y recordatorio.
- [x] Cambiar asunto, descripción, fecha u hora y revisar el `PUT /api/agendas/edit?id=<id>`.
- [x] Guardar y confirmar el toast, el cierre del diálogo y la actualización del evento sin recarga completa.
- [x] Cancelar una edición y volver a abrirla para comprobar que no se guardaron cambios.
- [x] Cambiar entre **Reunión** y **Llamada** y revisar que el campo que deja de aplicar se limpie.
- [x] Abrir **Eliminar** para `Llamada rápida de coordinación`, comprobar el nombre y cancelar sin enviar request.
- [x] Confirmar la eliminación y revisar el `DELETE /api/agendas/delete?id=<id>`, el toast y la desaparición del evento.
- [x] Con una respuesta lenta, probar doble clic en **Eliminar** y revisar que haya una sola request.
- [x] Forzar un `404` o `500` en editar/eliminar y comprobar el mensaje, el estado del diálogo y que la lista no se actualice como si hubiera sido exitoso.

## 5. Asociaciones y navegación

- [x] Abrir el formulario mientras cargan los datos y revisar los selectores **Trato relacionado** y **Tarea relacionada**.
- [x] Confirmar que se cargan opciones desde `GET /api/tratos/get-all` y `GET /api/tareas/get-all`.
- [x] Asociar el evento a `Implementación CRM Innovatech` y `Demo presencial con CTO`; guardar y comprobar que los valores quedan precargados al editar.
- [x] Volver a **Ninguno** o **Ninguna**, guardar y comprobar que el vínculo se limpia.
- [x] Abrir el link de videollamada de prueba y confirmar que se intenta abrir en una pestaña nueva, sin usar datos reales.
- [x] Confirmar que el evento no tiene enlace propio a un detalle ni enlace directo al trato o a la tarea.
- [x] No probar `/agenda/<id>` como flujo de usuario: existe un hook de detalle en el código, pero no hay una ruta o pantalla de detalle conectada desde Agenda. Si se requiere esa navegación, dejarlo como **revisar**.

## 6. Validaciones, errores y estados límite

- [x] Intentar guardar sin **Asunto**, **Fecha** ni **Inicio** y revisar los mensajes inline.
- [x] Probar una hora de fin igual o anterior al inicio; también probar dejarla vacía.
- [x] En **Reunión**, dejar **Ubicación** vacía; en **Llamada**, dejar el link vacío. Confirmar que se valida el campo correspondiente.
- [x] Probar recordatorio habilitado sin minutos, con `0` y con `15`.
- [x] Probar los límites del formulario: asunto 200/201 caracteres, descripción 1000/1001, ubicación 200/201 y link 500/501.
- [Revisar] Probar un asunto compuesto solo por espacios. El schema actual no aplica `trim` al asunto; si permite guardar, dejarlo como **revisar**.
- [Revisar] Probar una fecha pasada. El schema no la bloquea; registrar como **revisar** si el backend o la definición funcional exige impedirla.
- [x] Probar un link que no sea URL solo para registrar el comportamiento; el schema actual no valida el formato, únicamente presencia según el tipo y longitud máxima.
- [x] Forzar un `422` con `details` al crear o editar y revisar el error inline sin cerrar el diálogo.
- [x] Forzar otro error (`400`, `404`, `409` o `500`) y revisar el toast sin perder los datos del formulario.
- [x] Si el backend devuelve `PENDIENTE`, `ENVIADO` o `FALLIDO`, comprobar que el badge se muestre como **Recordatorio pendiente**, **Recordatorio enviado** o **Recordatorio fallido**. El envío real del email queda fuera de esta pantalla.

Observaciones: aunque el backend permita una fecha pasada, haz tu la logica para que no permita poner una reunion y llamada en una cita pasada, tiene que estar alieando a hora de ciudad de mexico. Haz que se valide el link de la llamada como un link valido, que pueda salir de un meet por ejemplo o un zoom, tipo las cosas basicas, permitir que sea un link en general que sea clickeable.

## 7. Responsive, recarga y persistencia

- [x] Revisar la pantalla en escritorio, tablet y móvil; comprobar que el encabezado, KPI, tabs y acciones sigan siendo utilizables.
- [x] En una ventana angosta, confirmar que el calendario no corte los días y que el panel de eventos pase debajo del calendario.
- [x] En **Lista**, comprobar que asunto, ubicación/link y acciones **Editar/Eliminar** sigan accesibles con textos largos.
- [x] Abrir el formulario en una ventana baja y comprobar que el diálogo permite scroll hasta **Cancelar** y **Crear evento/Guardar cambios**.
- [x] Pulsar **Recargar agenda** y revisar el `GET`, el icono animado, el estado accesible **Recargando agenda** y que el botón se deshabilite mientras carga.
- [x] Recargar el navegador completo y confirmar que la agenda vuelve a pedir datos, la vista vuelve a **Calendario** y el calendario vuelve al mes/día actual.
- [x] Con MSW, no tomar la recarga completa como prueba de persistencia: los cambios viven en memoria y pueden volver a la fixture. Confirmar persistencia durable solo con el backend real.

al eliminar una tarea con texto largo el nombre de la tarea se sale del cuadro,

## Observaciones

---
