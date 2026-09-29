# Checklist QA manual — Contactos

Fecha: 2026-09-28
Alcance: listado `/contactos`, detalle `/contactos/:id`, creación, edición, cambio de estado, eliminación, filtros, paginación, vistas guardadas e importación/exportación CSV.

Esta lista sale de la implementación y los tests actuales. No intenta definir comportamientos que no estén claros. Cuando dice **revisar**, conviene anotar lo que pasa y decidir después si es un bug o una definición pendiente.

## Camino rápido

1. Iniciar sesión y abrir **Contactos** desde el menú lateral.
2. Probar primero el listado, los tres estados y el detalle.
3. Después probar crear, editar, cambiar estado, eliminar e importar/exportar.
4. Registrar siempre si se está usando **MSW/mock** o el backend real.

## Preparación

### TC-00 — Preparar el ambiente

- [x] Iniciar sesión con un usuario válido.
- [x] Abrir **Contactos** desde el menú lateral.
- [x] Confirmar la URL `/contactos`.
- [x] Anotar navegador, tamaño de ventana y si se usa MSW o backend real.
- [x] Si se revisan requests, guardar método, ruta, status y body.
- [x] Usar solamente los datos ficticios de esta lista y un sufijo propio si se repite la prueba.

**Qué probé:**

---

**Qué vi:**

---

**Está bien / corregir:** `[ ] Está bien` `[ ] Corregir` `[ ] Revisar`

## Datos ficticios sugeridos

| Uso                                         | Valor                                  |
| ------------------------------------------- | -------------------------------------- |
| Nombre nuevo                                | `QA Contacto 2026-09-28-01`            |
| Correo                                      | `qa.contacto.20260928@example.com`     |
| Teléfono                                    | `+52 55 5555 0128`                     |
| Cargo                                       | `Responsable de compras QA`            |
| Empresa                                     | `Innovatech Solutions`                 |
| Cómo nos conoció                            | `Referido` o `Contacto de prueba 2026` |
| Contacto para editar                        | `Martín`                               |
| Contacto seguro para eliminar               | `Valeria`                              |
| Contacto con relación para probar conflicto | `Carlos`                               |
| Contacto con tratos y tareas                | `Ana`                                  |
| ID de Martín                                | `c0222222-cccc-0002-cccc-000000000002` |
| ID de Ana                                   | `c1111111-cccc-1111-cccc-111111111111` |
| ID de Valeria                               | `c0555555-cccc-0005-cccc-000000000005` |
| ID de Carlos                                | `b1111111-bbbb-1111-bbbb-111111111111` |
| ID inexistente                              | `id-inexistente`                       |

Con el fixture inicial de MSW se esperan **8 contactos**: **2 Prospectos**, **4 Activos** y **2 Inactivos**. Si se crean o eliminan registros durante la sesión, estos números cambian.

## Checklist del listado

### TC-01 — Entrar al listado y revisar los tabs

1. Abrir `/contactos`.
2. Confirmar el título **Contactos**, el texto descriptivo y el botón **Nuevo contacto**.
3. Revisar los tabs **Prospecto**, **Activo** e **Inactivo**.
4. Cambiar de tab y volver a `/contactos`.
5. Probar también `/prospectos` y `/clientes`.
6. Probar `/prospectos/<id>` y `/clientes/<id>` con un ID existente.

**Esperado según el código actual:**

- El tab inicial es **Prospecto**.
- Los conteos iniciales son 2, 4 y 2, respectivamente.
- `/prospectos` redirige a `/contactos?tab=PROSPECTO` y `/clientes` a `/contactos?tab=ACTIVO`.
- `/prospectos/<id>` y `/clientes/<id>` redirigen a `/contactos` sin conservar el ID.
- Al cambiar de tab se reinicia la página a la primera.
- El tab elegido se sincroniza con `?tab=`; para Prospecto el parámetro se limpia.

Observaciones: el bootn de recargar tiene una pequeña animacion cuando se esta recargando la pagina, eso lo hicimos ayer en la pestaña empresas pero aqui no parece haber, hazlo que sea global, para donde este ese boton debe tener ese mimsmo comportamiento. Otra cosa, en la tabla cuando sale la barra deslizante este se ve como la que tiene el navegador por defecto pero debería ser la propia de nuestro diseño, si no existe crea uno basado en los colores que ya hay. Otra cosa, cuando se pueda deslizar la tabla, si el puintero esta dentro de la tabla la rueda del mouse haz que se pueda usar para moverse de forma horizontal, solo si el puntero esta dentro de la tabla, eso hazlo un comportamiento global con las tablas como estas.

### TC-02 — Ver KPIs, filas y datos vacíos

1. Revisar las tarjetas **Total de contactos**, **Activos** y **Prospectos**.
2. Comparar los conteos con los tres tabs.
3. Cambiar a cada estado y confirmar que no aparecen contactos de otro estado.
4. Revisar una fila con datos completos, por ejemplo Martín o Ana.
5. Revisar una fila con campos vacíos, por ejemplo Lucía.

**Esperado según el código actual:**

- La tabla muestra las columnas **Contacto**, **Empresa**, **Cargo**, **Correo**, **Estado**, **Responsable**, **¿Cómo nos conoció?**, **Creado** y acciones.
- Los campos nulos se ven como `—`; el resumen de la fila usa `Sin correo` y `Sin teléfono`.
- Los estados se muestran como **Prospecto**, **Activo** o **Inactivo**.
- En un tab sin resultados aparece **No hay contactos que coincidan con los filtros** y un botón **Nuevo contacto**.

**Qué probé:**

---

**Qué vi:**

---

**Está bien / corregir:** `[ ] Está bien` `[ ] Corregir` `[ ] Revisar`

### TC-03 — Abrir detalle y menú de acciones desde una fila

1. Hacer clic en el nombre de un contacto.
2. Volver al listado.
3. Abrir el menú de acciones de la misma fila.
4. Probar **Editar** y después **Eliminar**, sin confirmar todavía la eliminación.

**Esperado según el código actual:**

- El nombre enlaza a `/contactos/<id>`.
- El botón de acciones tiene un nombre accesible como `Acciones para Martín`.
- El menú ofrece **Editar** y **Eliminar**.
- En pantallas pequeñas, revisar especialmente si la tabla se puede usar sin cortar acciones ni columnas; el código fija un ancho mínimo de 980 px, así que el resultado responsive queda por revisar.

**Qué probé:**

---

**Qué vi:**

---

**Está bien / corregir:** `[ ] Está bien` `[ ] Corregir` `[ ] Revisar`

### TC-04 — Buscar y aplicar filtros

1. Seleccionar **Mostrar filtros**.
2. Buscar por `Martín`, por `martin.gutierrez@example.com`, por `Gerente` y por una parte del teléfono.
3. Probar **Empresa**, **Responsable** y **Cómo nos conoció** por separado y combinados.
4. Pulsar **Limpiar filtros**.
5. Mirar Network para confirmar si cambiar filtros genera otro `GET` de contactos.

**Esperado según el código actual:**

- La búsqueda es local, no distingue mayúsculas y minúsculas y revisa nombre, correo, teléfono y cargo.
- Empresa, responsable y origen se combinan como filtros locales.
- En Responsable solo aparecen usuarios activos; los orígenes salen de los datos cargados.
- Cambiar filtros reinicia la página.
- El test actual verifica que el filtro por empresa no hace otro request y que el contador puede mostrar `Mostrando 1 de 8 contactos`.
- El filtro se aplica sobre los elementos de la página cargada, no necesariamente sobre toda la base si el backend devuelve páginas. Si esto cambia el resultado esperado, anotar **revisar**.

**Qué probé:**

---

**Qué vi:**

---

**Está bien / corregir:** `[ ] Está bien` `[ ] Corregir` `[ ] Revisar`

### TC-05 — Guardar, aplicar y borrar una vista

1. Abrir filtros y buscar `gerente`.
2. Seleccionar **Guardar vista**.
3. Intentar guardar con el nombre vacío y luego con `Gerentes QA`.
4. Limpiar filtros y aplicar la vista desde **Vistas guardadas**.
5. Borrar la vista desde el chip o desde el selector.
6. Recargar la página y comprobar qué queda guardado.

**Esperado según el código actual:**

- Una vista sin nombre no se puede guardar.
- Las vistas se guardan en `localStorage` con la clave `crm:list-presets:contactos`.
- Guardar muestra `Vista guardada` y borrar muestra `Vista eliminada`.
- Un `localStorage` con JSON corrupto no rompe la página; se carga como lista vacía.
- La persistencia de las vistas es local del navegador, no del backend.

**Qué probé:**

---

**Qué vi:**

---

**Está bien / corregir:** `[ ] Está bien` `[ ] Corregir` `[ ] Revisar`

### TC-06 — Ordenar y paginar

1. Revisar el paginador: filas por página, página actual, **Anterior** y **Siguiente**.
2. Cambiar filas a 10, 25, 50 y 100.
3. Crear o importar suficientes contactos para pasar de una página.
4. Probar **Siguiente**, **Anterior** y cambiar de tab después de estar en una página avanzada.
5. Hacer clic en **Contacto**, **Correo** y **Creado** para cambiar el orden.
6. Revisar las requests enviadas al backend.

**Esperado según el código actual:**

- El tamaño inicial es 25 y las opciones son 10, 25, 50 y 100.
- Cambiar tamaño, ordenar, cambiar filtros o cambiar tab vuelve a la página 1.
- Se envían `page`, `pageSize`, `sortBy` y `sortDirection` en el request de la lista paginada.
- El mock devuelve el array completo e ignora esos parámetros; el frontend lo corta para paginar, pero no tiene un ordenamiento local explícito. Si al ordenar no cambia el orden con MSW, dejarlo como **revisar**, no asumir que el backend real se comporta igual.
- Con filtros y paginación, revisar especialmente si el contador y la lista representan la misma cantidad.

**Qué probé:**

---

**Qué vi:**

---

**Está bien / corregir:** `[ ] Está bien` `[ ] Corregir` `[ ] Revisar`

## Crear y validar

### TC-07 — Crear un contacto completo

1. Pulsar **Nuevo contacto**.
2. Completar nombre, correo, teléfono, cargo, empresa y **Cómo nos conoció**.
3. Revisar el selector de Estado.
4. Guardar una sola vez.
5. Revisar la request y el listado después de cerrar el diálogo.

**Esperado según el código actual:**

- El diálogo se llama **Nuevo contacto**.
- **Nombre** y **Empresa** son obligatorios.
- En creación, Estado inicia en **Prospecto** y el selector está deshabilitado.
- **Cómo nos conoció** ofrece sugerencias `Referido`, `Redes`, `Web`, `Evento` y `Otro`, pero también acepta texto libre.
- Se envía `POST /api/contactos/create`; el mock responde 201, genera un ID y agrega el contacto en memoria.
- Si sale bien, aparece un toast `Contacto "..." creado`, se cierra el diálogo y se invalida la lista.
- No hay campo visible de apellido ni de responsable.

Observaciones: aqui tenemos el mismo problema de que si se pulsa varias vecces se envian variables request, esto lo solucionamos en empresas, asi que aplica la misma resolucion aqui, y en genereal ponlo para todos los botones de este estilo de crear, editar o eliminar. Solo se deberian dispara una vez esas request.

### TC-08 — Validar campos del formulario

Probar cada caso por separado y confirmar si el diálogo queda abierto y si se evita la request.

- [x] Nombre vacío.
- [?] Nombre compuesto solo por espacios.
- [x] Correo sin formato de correo.
- [x] Teléfono con menos de 7 caracteres permitidos, letras y más de 20 caracteres.
- [x] Empresa sin seleccionar.
- [x] `Cómo nos conoció` con 201 caracteres.
- [x] Nombre y cargo con 150 y 151 caracteres.
- [x] Campos opcionales vacíos.

**Esperado según el código actual:**

- Nombre vacío: `El nombre es requerido`.
- Correo inválido: `Correo inválido`.
- Teléfono inválido: `Teléfono inválido`.
- El schema limita nombre y cargo a 150 caracteres y `Cómo nos conoció` a 200.
- Los campos opcionales vacíos se transforman a `null` al validar.
- El schema actual usa `min(1)` sin `trim` para `nombre`: un nombre de solo espacios puede pasar la validación del frontend. Probarlo y dejarlo como **revisar** aunque el mock de edición rechace ese valor con `nombre is required`.
- Para el texto exacto del error de Empresa y para los límites en la UI, usar **revisar** si no se muestra un mensaje claro.

Observaciones: nuevamente aqui si pones espacios lo toma como si pusieras algo, pero el backend real regresa el name is required, el programa no deberia dejar que mandes solo espacios y el error del backend tambien deberia estar o mostrarse en español al usuario. Esto es algo que pasaba en empresas tambien, lo solucionamos ayerm, aplica los cambios a todos los formularios en general, para que ya no pase en un futuro en algun formulario.

### TC-09 — Cancelar creación y comprobar el reinicio

1. Abrir **Nuevo contacto**.
2. Escribir varios valores sin guardar.
3. Pulsar **Cancelar** o cerrar el diálogo.
4. Abrir **Nuevo contacto** otra vez.

**Esperado según el código actual:**

- Cancelar no debe enviar `POST`.
- Al volver a abrir creación, el formulario debería partir de nombre vacío, campos opcionales vacíos, Empresa sin seleccionar y Estado Prospecto. Si queda algún valor anterior, dejarlo como **revisar**.
- Mientras se guarda, el botón dice **Guardando...** y se deshabilita; revisar con una respuesta lenta si un doble clic produce una sola request.

**Qué probé:**

---

**Qué vi:**

---

**Está bien / corregir:** `[ ] Está bien` `[ ] Corregir` `[ ] Revisar`

## Editar, cambiar estado y eliminar

### TC-10 — Editar un contacto existente

1. Abrir las acciones de Martín y seleccionar **Editar**.
2. Confirmar que los valores actuales están cargados.
3. Intentar cambiar la Empresa.
4. Cambiar nombre, correo, teléfono, cargo, origen o estado y guardar.
5. Revisar el body de la request y volver a abrir el detalle.
6. Repetir cancelando antes de guardar.

**Esperado según el código actual:**

- El diálogo se llama **Editar contacto** y muestra el nombre actual.
- La Empresa aparece cargada y deshabilitada con el texto `La empresa vinculada no puede modificarse.`
- Se envía `PUT /api/contactos/edit?id=<id>`; no se usa PATCH.
- El body de edición no incluye `empresaId` ni `creadoPor`.
- Con éxito aparece `Contacto "..." actualizado`, se cierra el diálogo y se invalidan lista y detalle.
- Cancelar no debe guardar cambios. Confirmar el resultado al reabrir; si no conserva el valor persistido, dejarlo como **revisar**.

**Qué probé:**

---

**Qué vi:**

---

**Está bien / corregir:** `[ ] Está bien` `[ ] Corregir` `[ ] Revisar`

### TC-11 — Cambiar el estado desde el detalle

1. Abrir el detalle de Ana y entrar a **Info**.
2. Abrir el selector de Estado de relación.
3. Probar las transiciones disponibles y guardar una transición válida.
4. Repetir con un contacto Activo o Inactivo para intentar volver a Prospecto.

**Esperado según el código actual:**

- Desde el detalle, pasar de **Activo** o **Inactivo** a **Prospecto** aparece deshabilitado y tiene la razón `No se puede retrogradar un contacto a Prospecto`.
- En el selector del detalle, las transiciones distintas de volver a Prospecto están habilitadas, incluso pasar a Inactivo cuando el contacto tiene tratos. El código no bloquea esa opción; comparar el resultado con el backend real y con el formulario de edición y dejar cualquier diferencia como **revisar**.
- Se envía `PUT /api/contactos/cambiar-estado?id=<id>` con body `{ "nuevoEstado": "..." }`.
- Durante la request el selector queda deshabilitado; con éxito aparece `Estado de "..." actualizado`.
- Comparar este selector con el Estado del diálogo de edición: el formulario de edición expone las tres opciones sin el mismo bloqueo. Si permite una transición que el detalle bloquea, dejar la diferencia como **revisar**.

observaciones: es cierto, al editar si puedes poner como prospecto a un cliente activo o inactivo, pero en detalles no, agrega esa logica tambien al editar un campo.

### TC-12 — Eliminar con confirmación, éxito y conflicto

1. Abrir **Eliminar** para Valeria.
2. Revisar el nombre y cancelar.
3. Repetir y confirmar **Eliminar**.
4. Volver a probar con Carlos, que tiene tratos relacionados.
5. Si es posible, hacer la prueba con una respuesta lenta para ver el estado del botón.

**Esperado según el código actual:**

- La confirmación dice **¿Eliminar contacto?**, muestra el nombre y avisa que la acción no se puede deshacer.
- Cancelar no envía `DELETE`.
- Para Valeria, el mock responde 204, aparece `Contacto eliminado`, se actualiza la lista y el contacto desaparece.
- Para contactos que no están Inactivos aparece además un aviso sobre posibles tratos activos.
- Para Carlos, el mock responde 409 con `El contacto tiene tratos activos`; el diálogo debe permanecer abierto y la lista no debe invalidarse por ese error.
- Durante la eliminación, los botones cambian/deshabilitan su estado (`Eliminando...`).
- El mock comprueba si el contacto aparece en cualquier trato de `tratosFixture`; no asumir que está comprobando únicamente tratos con estado abierto en el backend real.

Observaciones: al momento de eliminar un contacto con tratos, el mensaje emergente que me sale arriba a la derecha, tiene el id del trato en vez del nombre, checca eso.

## Carga, vacío y errores

### TC-13 — Estados de carga, vacío y error del listado

1. Abrir el listado con una respuesta lenta.
2. Probar un `GET /api/contactos/get-all` que responda 500.
3. Pulsar **Reintentar**.
4. Probar una respuesta `[]`.
5. En un tab válido, aplicar un filtro que no devuelva filas.

**Esperado según el código actual:**

- Mientras cargan los contactos se muestra un esqueleto de tabla.
- En error se ocultan los KPIs y aparece `No fue posible cargar los contactos. Intenta de nuevo.` con **Reintentar**.
- **Reintentar** vuelve a pedir la lista.
- Con lista vacía o filtro sin coincidencias aparece el estado vacío con opción **Nuevo contacto**.
- Con lista vacía el paginador muestra `Página 0 de 0`; revisar solamente si esta presentación visual se considera correcta.

**Qué probé:**

---

**Qué vi:**

---

**Está bien / corregir:** `[ ] Está bien` `[ ] Corregir` `[ ] Revisar`

### TC-14 — Errores de mutaciones y respuestas 422

1. Forzar 422 al crear o editar con `details`, por ejemplo `field: "nombre"`.
2. Forzar 400, 404, 409 y 500 en crear, editar, cambiar estado o eliminar.
3. Confirmar si el formulario se mantiene abierto y dónde aparece el mensaje.

**Esperado según el código actual:**

- Un 422 con detalles se intenta mostrar como error inline en el formulario y no debería cerrar el diálogo.
- Otros errores de crear/editar se muestran con toast y el diálogo no debería cerrarse.
- Los errores de eliminar y cambiar estado se muestran con toast usando el mensaje normalizado de la API.
- Los mensajes dependen del campo que devuelva el backend; si el campo no coincide con los nombres del formulario o aparece en inglés, dejarlo como **revisar**.
- El mock de edición devuelve 400 en algunos payloads incompletos y usa mensajes en inglés (`nombre is required`, `estadoRelacion is required`); comprobar cómo queda traducido en la interfaz.

**Qué probé:**

---

**Qué vi:**

---

**Está bien / corregir:** `[ ] Está bien` `[ ] Corregir` `[ ] Revisar`

### TC-15 — Recargar, doble clic y nombres repetidos

1. Hacer clic en **Recargar contactos** y revisar Network.
2. Con una respuesta lenta, hacer doble clic en **Crear contacto** y en **Guardar cambios**.
3. Intentar crear un contacto con el mismo nombre que Martín, cambiando solamente el correo.

**Esperado según el código actual:**

- Recargar dispara una recarga de la página paginada y de la lista completa.
- El botón de recarga no recibe un estado visible de `isFetching` en este componente; si se necesita una señal visual, marcar **revisar**.
- No hay una guardia frontend explícita para nombres duplicados. Si el backend tampoco lo bloquea, se pueden crear nombres repetidos; registrar el resultado sin asumir que debe resolverse solo en esta pantalla.
- El formulario deshabilita el botón cuando React marca la mutación como pendiente, pero no hay un bloqueo síncrono explícito. Si dos clics rápidos crean dos registros, marcarlo como **corregir**.

Observaciones: lo de los nombre duplicadfo tambien cambialo como lo hicimos ayer en empresa

## Detalle y relaciones

### TC-16 — Detalle, Info y navegación de regreso

1. Abrir el detalle de Martín, Ana y un contacto con campos nulos.
2. Revisar el encabezado, las iniciales, el estado, cargo y empresa.
3. Entrar a **Info**.
4. Probar **Volver a contactos**, el botón **Editar** y el botón **Eliminar**.

**Esperado según el código actual:**

- La ruta es `/contactos/<id>`.
- El detalle tiene las pestañas **Resumen 360**, **Info** y **Tratos**.
- Info muestra Nombre, Correo, Teléfono, Cargo, Empresa, Responsable, Cómo nos conoció, Creado, Actualizado y Estado de relación.
- Los campos nulos se muestran como `—` y las fechas usan formato de español de México.
- El encabezado muestra las iniciales del nombre y el estado como badge.
- **Volver a contactos** lleva a `/contactos`.

**Qué probé:**

---

**Qué vi:**

---

**Está bien / corregir:** `[ ] Está bien` `[ ] Corregir` `[ ] Revisar`

### TC-17 — Detalle inexistente y error del detalle

1. Abrir `/contactos/id-inexistente`.
2. Esperar la redirección.
3. Forzar un 500 en `GET /api/contactos/get-by-id` y repetir.

**Esperado según el código actual:**

- Para un 404 aparece `Este contacto no existe. Volviendo al listado...`, un toast `Contacto no encontrado` y se vuelve a `/contactos` aproximadamente 1.5 segundos después.
- Para un error distinto de 404 aparece `No fue posible cargar el contacto.` y el botón **Volver al listado**.
- Un error 500 no debe tratarse como contacto inexistente.

**Qué probé:**

---

**Qué vi:**

---

**Está bien / corregir:** `[ ] Está bien` `[ ] Corregir` `[ ] Revisar`

### TC-18 — Resumen 360 y pestaña Tratos

1. Abrir el detalle de Ana y revisar **Resumen 360**.
2. Revisar Empresa vinculada, Tratos relacionados y Tareas relacionadas.
3. Entrar a **Tratos**.
4. Probar un contacto sin tratos, como Martín.
5. Hacer clic en un trato relacionado.

**Esperado según el código actual:**

- Ana aparece vinculada a `Innovatech Solutions`, tiene tratos relacionados y tareas derivadas de esos tratos.
- Resumen 360 muestra KPIs de tratos, pipeline abierto, tareas pendientes y tareas totales.
- Las listas de Resumen 360 muestran como máximo cinco elementos por relación.
- En Tratos, cada trato muestra nombre y tipo de contrato, y el nombre lleva a `/tratos/<id>`.
- Sin tratos aparece `No hay tratos relacionados` en la pestaña Tratos y `Este contacto no tiene tratos.` en Resumen 360.
- Si falla una consulta relacionada, Resumen 360 muestra un aviso ámbar con la información disponible; confirmar qué ocurre específicamente en la pestaña Tratos y marcar **revisar** si parece un vacío normal.

**Qué probé:**

---

**Qué vi:**

---

**Está bien / corregir:** `[ ] Está bien` `[ ] Corregir` `[ ] Revisar`

### TC-19 — Contactos vistos desde una Empresa

1. Abrir una empresa, por ejemplo `Innovatech Solutions`.
2. Entrar a la pestaña **Contactos**.
3. Confirmar que aparecen sus contactos y que no aparecen contactos de otra empresa.
4. Probar los enlaces de correo, teléfono y nombre.
5. Revisar una empresa sin contactos.

**Esperado según el código actual:**

- La pestaña filtra los contactos en el cliente por `empresaId`; no usa un endpoint separado de empresa.
- Innovatech muestra Lucía, Sofía y Ana; no muestra Martín.
- La tabla muestra Contacto, Cargo, Correo, Teléfono y Estado.
- Correo usa `mailto:`, teléfono usa `tel:` y el nombre lleva al detalle de Contacto.
- Una empresa sin contactos muestra `Esta empresa no tiene contactos vinculados`.
- Si falla la carga aparece `No fue posible cargar los contactos.` y **Reintentar**.

**Qué probé:**

---

**Qué vi:**

---

**Está bien / corregir:** `[ ] Está bien` `[ ] Corregir` `[ ] Revisar`

## Datos largos e importación/exportación

### TC-20 — Nombres, correos y otros datos largos

1. Crear o cargar un contacto con nombre de 150 caracteres.
2. Probar un nombre de 151 caracteres, un correo largo, un cargo largo y un origen de 200 caracteres.
3. Revisar el listado, el menú de acciones y el detalle.
4. Repetir en una ventana angosta.

**Esperado según el código actual:**

- El schema permite hasta 150 caracteres para nombre y cargo y hasta 200 para Cómo nos conoció; el siguiente valor debería mostrar error al guardar.
- La tabla usa un ancho mínimo de 980 px, pero no hay una regla específica de truncado para el nombre del contacto.
- El encabezado del detalle no tiene la misma regla explícita de corte de palabras que el detalle de Empresa.
- Verificar si hay desborde, scroll inesperado o acciones inaccesibles. El resultado visual de nombres y datos largos queda como **revisar** si no está definido por diseño.

**Qué probé:**

---

**Qué vi:**

---

**Está bien / corregir:** `[ ] Está bien` `[ ] Corregir` `[ ] Revisar`

### TC-21 — Exportar contactos a CSV

1. Desde el listado con datos, pulsar **Exportar CSV**.
2. Abrir el archivo descargado.
3. Revisar encabezados, valores nulos, comillas y caracteres con acento.
4. Cambiar de tab o aplicar filtros y repetir.
5. Probar con una lista vacía.

**Esperado según el código actual:**

- El archivo se llama `contactos-AAAA-MM-DD.csv` y contiene BOM UTF-8.
- Los encabezados son `Nombre,Telefono,Correo,Cargo,Estado`.
- Los encabezados no llevan comillas. Las filas de datos sí llevan sus valores entre comillas y las comillas internas se escapan.
- El botón está deshabilitado cuando la lista completa cargada está vacía.
- El componente recibe todos los contactos de `useContactos()`, no solamente las filas visibles del tab o del filtro. Si se espera exportar solo la vista actual, marcar **revisar**.
- No hay tests específicos de exportación; registrar el resultado manual.

**Qué probé:**

---

**Qué vi:**

---

**Está bien / corregir:** `[ ] Está bien` `[ ] Corregir` `[ ] Revisar`

### TC-22 — Importar CSV

1. Pulsar **Importar CSV**.
2. Elegir una Empresa destino.
3. Probar un CSV con comas y otro con punto y coma.
4. Probar con encabezados `Nombre,Telefono,Correo`, con alias `Email` y con filas sin encabezado.
5. Incluir un teléfono ya existente y el mismo teléfono dos veces en el archivo.
6. Probar una fila con nombre pero sin teléfono y otra con teléfono pero sin nombre.
7. Confirmar la importación y revisar el resumen.

**Esperado según el código actual:**

- El diálogo explica que acepta Nombre, Teléfono y Correo y permite pegar el contenido en un textarea.
- Sin empresa o sin filas nuevas, **Importar** queda deshabilitado.
- Los teléfonos se comparan solo por sus dígitos; los duplicados existentes o repetidos dentro del CSV se omiten.
- Las filas nuevas se crean una por una con `POST /api/contactos/create`, empresa elegida y estado Prospecto.
- En un CSV sin encabezado, el parser usa las columnas 0, 1 y 2 como nombre, teléfono y correo. Si la primera fila de datos contiene un email, `mail` o `correo`, puede tomarla por error como encabezado y descartarla; probarlo y dejar el resultado como **revisar**.
- Si falta nombre, se usa el teléfono como nombre; una fila sin nombre ni teléfono se descarta.
- El resumen informa creados, errores y duplicados omitidos. Al terminar se cierra el diálogo, se limpia el contenido y se actualiza la lista.
- No se importan cargo, origen ni responsable.
- No hay tests específicos de este componente; el parser, los duplicados y el resumen quedan para revisión manual.

**Qué probé:**

---

**Qué vi:**

---

**Está bien / corregir:** `[ ] Está bien` `[ ] Corregir` `[ ] Revisar`

## Registro de ejecución

- Fecha/hora: **********\*\*\*\***********\_**********\*\*\*\***********
- Tester: ************\*\*************\_************\*\*************
- Navegador y versión: ********\*\*********\_\_\_\_********\*\*********
- Tamaño de ventana: ********\*\*\*\*********\_\_********\*\*\*\*********
- Ambiente: `[ ] MSW` `[ ] backend real`
- Base URL: **********\*\*\*\***********\_\_\_**********\*\*\*\***********
- Commit o versión probada: ******\*\*\*\*******\_\_\_******\*\*\*\*******
- Resultado global: `[ ] Aprobado` `[ ] Aprobado con observaciones` `[ ] No aprobado`
- Incidencias/enlaces: ********\*\*\*\*********\_********\*\*\*\*********

## Requests de Contactos para mirar en Network

| Acción         | Método y ruta                                                              |
| -------------- | -------------------------------------------------------------------------- |
| Listado        | `GET /api/contactos/get-all`                                               |
| Detalle        | `GET /api/contactos/get-by-id?id=<id>`                                     |
| Crear          | `POST /api/contactos/create`                                               |
| Editar         | `PUT /api/contactos/edit?id=<id>`                                          |
| Cambiar estado | `PUT /api/contactos/cambiar-estado?id=<id>` con `{ "nuevoEstado": "..." }` |
| Eliminar       | `DELETE /api/contactos/delete?id=<id>`                                     |

## Qué está cubierto por tests y qué no

Antes de esta checklist pasaron **20 archivos y 165 tests** del alcance de Contactos y sus relaciones.

Los tests sí cubren, entre otras cosas, estados, schema, filtros, hooks principales, handlers MSW, detalle, relaciones con Empresa y Customer 360.

Quedaron para comprobar especialmente desde la interfaz: importación/exportación CSV, integración completa de los diálogos de crear/editar/eliminar, ordenamiento y paginación real, recarga visible, doble clic, nombres repetidos, datos largos, algunos mensajes de error y persistencia real del backend.

## Referencias consultadas

- `src/features/contactos/pages/ContactosPage.tsx`
- `src/features/contactos/pages/ContactoDetailPage.tsx`
- `src/features/contactos/components/`
- `src/features/contactos/hooks/`
- `src/features/contactos/lib/` y `src/features/contactos/schemas/`
- `src/features/contactos/__tests__/` y `src/features/contactos/schemas/__tests__/`
- `src/api/types.ts`, `src/api/endpoints.ts` y `src/api/pagination.ts`
- `src/routes/router.tsx` y `src/lib/useTabSync.ts`
- `src/mocks/fixtures/contactos.ts` y `src/mocks/handlers/contactos.ts`
- `src/mocks/handlers/__tests__/contactos.handler.test.ts`
- `src/features/empresas/components/EmpresaContactosTab.tsx`
- `src/features/customer-360/components/Contacto360Tab.tsx`

## Pendientes personales

- Me queda pendiente revisar los cambios globales relacionados con WhatsApp: probablemente se eliminen, así que no los aplico ni los valido en esta tanda.
