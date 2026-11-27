# Secuencia de registro de una oportunidad (trato)

Flujo comprobado: registro de una oportunidad desde el listado de Tratos. No se sustituyó por otro flujo: se encontraron el formulario, la revisión de los datos, el envío a la API y el manejo del resultado. Artefactos: [PlantUML](secuencia.puml), [PNG](secuencia.png) y [SVG](secuencia.svg).

## Pie de figura

Figura X. Secuencia de registro de una oportunidad en el frontend de Pipely. Fuente: elaboración propia

## Texto para Resultados

El diagrama mostró cómo se registró una oportunidad comercial, denominada trato en Pipely. La persona usuaria abrió el formulario, completó los campos y solicitó guardar la información. La aplicación revisó los datos en el navegador antes de enviarlos. Cuando encontró datos incompletos o incorrectos, señaló los campos que debían corregirse y no envió la solicitud de registro. Cuando los datos fueron válidos, preparó la información y la envió a la API mediante la sesión del usuario. El contrato revisado confirmó que el registro exitoso devolvió los datos de la oportunidad creada. Después, la aplicación solicitó actualizar los listados, mostró una confirmación y cerró el formulario. También se representaron los errores devueltos por la API, distinguiendo los asociados a campos específicos de los demás errores. Los nombres de los métodos se conservaron como referencia al código implementado.

## Participantes y evidencia de los mensajes

La línea de vida «Formulario de oportunidad» agrupó `TratoForm`, `TratoCreateDialog` y `useCreateTrato`; no afirmó que fueran una sola clase. «Validación de datos» representó la revisión local con React Hook Form y Zod. «Conexión con la API» representó `apiClient`. Se usaron nombres sencillos para explicar sus responsabilidades, conservando los métodos en los mensajes como referencia al código. El listado se incluyó solo como punto de entrada. La API externa se trató como caja negra.

| Participante / mensaje | Archivo, función y evidencia |
| --- | --- |
| Persona usuaria: Nuevo trato | `src/features/tratos/pages/TratosListPage.tsx:119-124,257-263,640-641`: `TratosListPage`, `canCreate`, `setCreateOpen(true)` y `TratoCreateDialog`. |
| Diálogo y acción Crear trato | `src/features/tratos/components/TratoCreateDialog.tsx`: `TratoCreateDialog` y `DialogTitle`; `src/features/tratos/components/TratoForm.tsx:324-338`: `TratoForm`, botón submit y texto Crear trato. |
| Formulario → validación → resultado | `TratoForm.tsx:75-78,94-110`: `useForm`, `zodResolver(tratoSchema)`, `form.handleSubmit(handleValidSubmit)`; `src/features/tratos/schemas/trato.schema.ts:9-50`: `tratoFields`, `refineFechaCierre`, `tratoSchema`. `noValidate` desactiva la validación nativa HTML. |
| Datos inválidos → mensajes | `TratoForm.tsx:146` y restantes `FormMessage`; `src/components/ui/form.tsx:143-164`: `FormMessage` muestra `error.message`. El callback válido no se invoca si falla el resolver. |
| Datos válidos → normalización | `TratoForm.tsx:94-100`: `handleValidSubmit` llama `onSubmit`; `TratoCreateDialog.tsx:56-74`: `handleSubmit` construye `TratoCreatePayload`, normaliza opcionales y espera `mutation.mutateAsync(payload)`. |
| Alta → apiClient | `src/features/tratos/hooks/useCreateTrato.ts:17-56`: `useCreateTrato`, `createTratoSingleFlight`, `canonicalizeTratoCreatePayload`; `mutationFn` usa `apiClient.post<Trato>(endpoints.tratos.create(), payload)`. |
| Cliente → API REST | `src/api/endpoints.ts:44-49`: `endpoints.tratos.create()` devuelve `/tratos/create`; `src/api/client.ts:9-34,86-89`: `apiClient.post`, `request`, base configurable, cabeceras y `fetch`. |
| API → respuesta HTTP | `../AR-CRM/infrastructure/src/main/java/com/ar/crm2/adapter/in/rest/TratoController.java:52-55,72-76`: `create(@Valid @RequestBody CreateTratoRequest)` devuelve `HttpStatus.CREATED` con `TratoResponse.fromDomain(trato)`. Solo se consultó el contrato del controlador, no los procesos internos. |
| Contrato de entrada / salida | `../AR-CRM/infrastructure/src/main/java/com/ar/crm2/adapter/in/rest/dto/request/CreateTratoRequest.java:15-36` y `../AR-CRM/infrastructure/src/main/java/com/ar/crm2/adapter/in/rest/dto/response/TratoResponse.java:16-28`. |
| Cliente → resultado o rechazo | `src/api/client.ts:33-82`: `request` comprueba `res.ok`, interpreta la respuesta, normaliza `ApiError` y lanza `HttpError` en errores HTTP. |
| Éxito → invalidación, notificación y cierre | `useCreateTrato.ts:56-63`: `onSuccess` solicita, sin esperar, `invalidateQueries` para tratos y fichas y muestra `toast.success`; `TratoCreateDialog.tsx:74-83`: el `await mutateAsync` termina y se llama `onOpenChange(false)`. El mensaje es la plantilla `Trato "${created.nombre}" creado`. |
| Error con campos → mensajes | `useCreateTrato.ts:64-70`: `onError` omite toast para 422 y 400 con detalles; `TratoCreateDialog.tsx:49-54,84-87`: `serverErrors` y `release`; `TratoForm.tsx:80-85`: efecto que aplica `form.setError`. |
| Otros errores HTTP | `useCreateTrato.ts:64-70`: `toast.error(error.message)` para el resto de errores HTTP; `TratoCreateDialog.handleSubmit` libera el bloqueo y no cierra el diálogo. Para 422 sin detalles tampoco se muestra toast: el diagrama conserva ese comportamiento. |

## Alcance y límites comprobados

- Precondiciones: sesión autenticada con token disponible, permiso `TRATO/CREAR`, formulario cargado y sin un envío previo pendiente. Se representó un solo intento, no los catálogos previos de contactos y usuarios, ni las repeticiones descartadas por los bloqueos síncronos y el mecanismo single-flight.
- La base HTTP es configurable (`VITE_API_BASE_URL` o `/api`). `/api/tratos/create` expresa la ruta del contrato de AR-CRM, no un host fijo.
- El cliente puede renovar el token antes de `fetch`. En un 401 puede solicitar otra renovación, pero no reintenta el POST. Se encapsuló ese comportamiento en `apiClient`; no se dibujó otra interacción con Keycloak.
- La rama de datos válidos presupone que los bloqueos permiten el envío. La rama de datos inválidos no hace la solicitud de creación, aunque la pantalla puede haber cargado catálogos previamente.
- Las flechas discontinuas son retornos/resultados o retroalimentación a la persona. «Registro recibido o error» representa las dos formas de terminación de la promesa, no que un error sea un retorno exitoso. La primera respuesta HTTP agrupa el contrato de éxito y las respuestas no exitosas; las condiciones posteriores seleccionan su tratamiento.
- Las activaciones representan el período de atención de la interacción; no implican bloqueo del hilo JavaScript. La línea de validación termina antes del fragmento alternativo y el cliente termina antes de los efectos de interfaz.
- Las invalidaciones de caché se solicitaron con `void`: no se afirmó que la recarga de los listados hubiera finalizado antes del cierre.
- Se excluyó la variante con `targetColumnId`, que puede mover la ficha después de crear el trato. No se representaron inteligencia artificial, WhatsApp, base de datos ni procesos internos del backend.
- Los fallos sin respuesta HTTP quedaron fuera de los retornos HTTP del diagrama: el hook sí los maneja con `toast.error('No fue posible crear el trato')`, y el diálogo libera su bloqueo. No se inventó una respuesta de la API para esos fallos.
- Los estados 400/422 se verificaron como condiciones manejadas por el frontend; no se inspeccionó el generador de respuestas de error del backend. No se afirmó que este garantice un cuerpo o mensaje determinado para cada caso. Un 201 sin JSON válido tampoco corresponde al caso de éxito dibujado.
- La condición `registro creado y datos recibidos (201)` describe el éxito del contrato consultado: el frontend no compara explícitamente con 201, sino que acepta `res.ok` y consume JSON. No se atribuyó al código una comprobación específica de ese estado.
- La revisión fue estática: no se realizó una creación real ni se verificó un despliegue. Se contrastaron las guardas y mensajes con el código y se revisó la imagen renderizada.

## Rama y commit revisados

- Frontend: rama `main`, commit `43049a8c5b9bff03c2e553475ba7ff057268211e`.
- AR-CRM: rama `main`, commit base `2c380bebc04391f79120752a026e5cc581ea0196`; solo se consultaron controlador y DTO del alta. Había cambios locales previos en otros archivos del backend; no se modificó ninguno.
- No se modificó código de la aplicación. Los diagramas y este documento son archivos nuevos de documentación.

## Inserción en Google Docs

Preferir A4 vertical, márgenes de 1 cm y conservar la proporción de la imagen, reservando espacio para el pie de figura. El SVG conserva el original vectorial; el PNG se generó localmente con PlantUML 1.2025.10 a 200 dpi. El pie de figura debe colocarse como texto fuera de la imagen. PlantUML añade los corchetes visibles a las condiciones de `alt` y `else`; no se escribieron corchetes adicionales para evitar que su procesador de texto los interpretara como enlaces.
