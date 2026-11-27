# Figura X. Movimiento de una ficha entre columnas del tablero Kanban (octubre de 2026)

Archivos: [PlantUML editable](secuencia_movimiento_ficha.puml), [PNG](secuencia_movimiento_ficha.png) y [SVG](secuencia_movimiento_ficha.svg).

## Texto para Resultados

La Figura X muestra el movimiento de una ficha entre columnas del tablero Kanban. La interfaz comprobó el destino, los permisos y la disponibilidad de la operación. Después actualizó la posición local antes de enviar el cambio a la API. Ante una respuesta correcta, solicitó sincronizar las fichas y mostró una confirmación; ante un error, recuperó los datos anteriores. El flujo permitió seguir visualmente los cambios de columna y distinguir el movimiento inmediato de la confirmación del servidor.

## Evidencia de participantes y mensajes

| Participante o mensaje | Archivo y función que lo comprueba |
| --- | --- |
| Persona usuaria → Tablero: suelta una ficha | `src/features/kanban/components/KanbanBoard.tsx:217-233,259`: `KanbanBoard`, `handleDragEndConGuard` y `DndContext.onDragEnd`; `src/features/kanban/components/KanbanCard.tsx:86-105`: tarjeta arrastrable. |
| Identifica ficha y destino; descarta movimientos | `src/features/kanban/components/KanbanBoard.tsx:60-76`: `buildDragEndHandler` devuelve `handleDragEnd`, comprueba `over`, busca la ficha y compara `columnaId` con `String(over.id)`. |
| Revisa permisos y bloqueo; adquiere el bloqueo | `src/features/kanban/components/KanbanBoard.tsx:144-156`: `canMoveFicha` y `moveFicha`; `src/features/kanban/lib/kanbanPermissions.ts:4-7`: `KANBAN_MOVE_FICHA_CHECKS`; `src/components/shared/useSynchronousMutationLock.ts:3-17`: `acquire` y `release`. |
| Tablero → Movimiento y datos locales | `src/features/kanban/components/KanbanBoard.tsx:148,153-156`: `useMoverFicha`, `mutate(vars, { onSettled: () => releaseMove() })`. Es una solicitud asíncrona; el tablero no espera una devolución de `mutate` con el resultado HTTP. |
| Comprueba permisos y cancela consultas | `src/features/kanban/hooks/useMoverFicha.ts:25-43`: `canMoveFicha` y `onMutate`; primero comprueba permisos y después espera `queryClient.cancelQueries({ queryKey: fichasKeys.all })`. `mutationFn` vuelve a comprobar permisos antes de enviar. |
| Guarda copia y cambia la columna local | `src/features/kanban/hooks/useMoverFicha.ts:45-59`: `getQueriesData`, `setQueryData` y contexto `previousQueries`; actualiza `columnaId` de la ficha en cada lista con datos bajo la clave `['fichas']`. |
| Nueva posición local / recuperación visible | `src/features/kanban/hooks/useFichas.ts:10-23`: `fichasKeys` y `useFichas`; `src/features/kanban/pages/KanbanPage.tsx:136,206-211`: observa las fichas y las entrega a `KanbanBoard`. Las flechas hacia el tablero resumen esa propagación de datos, no llamadas directas a un método del tablero. |
| Movimiento → Conexión con la API | `src/features/kanban/hooks/useMoverFicha.ts:31-35`: `mutationFn` llama `apiClient.put<Ficha>(endpoints.fichas.moverColumna(id), { targetColumnaId })`. |
| Conexión → API externa; resultado o error | `src/api/endpoints.ts:85-90`: `endpoints.fichas.moverColumna`; `src/api/client.ts:9-34,36-90`: `request` y `apiClient.put`, envío con `fetch`, interpretación de JSON y rechazo con `HttpError` ante respuestas HTTP no exitosas. Un fallo de comunicación también puede rechazar la promesa sin respuesta HTTP. |
| Respuesta correcta → sincronización y confirmación | `src/features/kanban/hooks/useMoverFicha.ts:76-80`: `onSuccess` llama con `void` a `invalidateQueries({ queryKey: fichasKeys.all })` y después a `toast.success('Ficha movida')`. |
| Error → restaura datos y muestra el mensaje aplicable | `src/features/kanban/hooks/useMoverFicha.ts:63-74`: `onError` recorre las copias anteriores y llama a `setQueryData`; después decide si muestra `toast.error`. |
| Al terminar → libera bloqueo; retorno Fin | `src/features/kanban/components/KanbanBoard.tsx:153-156`: callback `onSettled` pasado a `mutate`; `src/components/shared/useSynchronousMutationLock.ts:14-17`: `release`. El retorno discontinuo representa el fin del callback, no una respuesta HTTP ni un valor de negocio. |

## Ramas y precisiones

- **Movimiento descartado:** no hay destino, la ficha no se encuentra entre las fichas consideradas por el tablero o se suelta sobre su columna actual. Si ese filtro se supera, `moveFicha` comprueba permisos y el bloqueo: si faltan permisos o ya hay un movimiento en curso, no inicia otra mutación. No se envía una solicitud ni se libera el bloqueo de una operación ajena. Estos descartes no muestran un aviso específico.
- **Respuesta correcta:** tras cambiar la caché local y recibir un resultado correcto, se solicita sincronizar todas las consultas de fichas y se muestra **«Ficha movida»**. La invalidación no se espera; el diagrama no afirma que las consultas hayan terminado antes de la confirmación o de liberar el bloqueo. La ficha recibida por el PUT no reemplaza directamente la versión local en `onSuccess`.
- **Error:** se intenta restablecer cada entrada con su valor anterior. Para un `HttpError` diferente de 422, se muestra `error.message`; para otro tipo de error, **«No fue posible mover la ficha»**. Un `HttpError` 422 también activa la restauración, pero **no muestra notificación**. El mensaje de error del diagrama es una etiqueta general, no un texto visible adicional inventado.
- **Permisos exactos:** la interfaz exige conjuntamente `FICHA:ACTUALIZAR` y `COLUMNA:LEER`. No se comprobó una restricción específica por tablero dentro de este flujo. El hook repite la comprobación tanto en `onMutate` como en `mutationFn`; un uso directo sin permiso no modifica la caché ni envía el PUT. Estas comprobaciones del frontend no garantizan autorización del servidor.
- **Alcance del bloqueo:** pertenece a esa instancia del tablero; no se presentó como un bloqueo global entre pestañas ni entre otras formas de invocar el hook.
- **Destino:** el código usa el identificador de `over` como columna destino; no comprueba explícitamente su pertenencia a la lista de columnas. Por eso el diagrama dice «identifica», no «valida la existencia de la columna». El flujo excluye arrastrar o reordenar columnas.
- **Orden:** revisión del tablero → bloqueo → `onMutate` → `mutationFn` / solicitud → `onSuccess` o `onError` → callback `onSettled` del tablero. El hook no define su propio `onSettled`. La secuencia presupone que el tablero continúa montado hasta que se notifica el fin de la operación.

## Contrato observado en el frontend

`PUT /api/fichas/mover-columna?id=<id>` con cuerpo JSON `{ "targetColumnaId": "<destino>" }`. La base se configura mediante `VITE_API_BASE_URL` o se usa `/api`; el host no se fijó en el diagrama. El cliente añade `Authorization: Bearer ...` cuando dispone de token. Puede solicitar renovación de sesión, pero no reintenta automáticamente escrituras después de un 401. No se dibujó otro flujo de autenticación.

La respuesta está tipada como `Ficha` en el hook; el diagrama no atribuye un estado de éxito concreto al servidor. El fragmento `opt` de respuesta HTTP evita dibujar un retorno de la API cuando falla la comunicación. El resultado de la solicitud llega a la lógica de movimiento antes de seleccionar éxito o error.

## Pruebas y límites de la verificación

Se revisó estáticamente el código y se ejecutaron pruebas automatizadas con respuestas simuladas, no una sesión del sistema desplegado ni un arrastre manual en un navegador:

```text
node node_modules/vitest/vitest.mjs run src/features/kanban/__tests__/KanbanBoard.test.tsx src/features/kanban/__tests__/useMoverFicha.test.ts src/features/kanban/__tests__/kanbanAuthorization.test.tsx
Resultado observado: 3 archivos y 19 pruebas aprobadas.
```

- `KanbanBoard.test.tsx:67-146`: destino distinto, misma columna, ausencia de destino, ficha desconocida y datos enviados; `:268-299`: solicitud de movimiento invocando el hook, no un arrastre DOM completo.
- `useMoverFicha.test.ts:47-165`: método/ruta/cuerpo, actualización local antes de la respuesta, recuperación ante error e invalidación posterior al éxito.
- `kanbanAuthorization.test.tsx:41-62`: ausencia de solicitud cuando falta alguno de los permisos requeridos. El archivo también contiene pruebas de otras acciones, ejecutadas sin ampliar el diagrama.
- Los tres archivos no prueban por sí solos todas las ramas de notificación, la liberación final del bloqueo o todas las combinaciones de cachés; esos detalles se verificaron leyendo el código. No se afirmó que una entrada previamente indefinida se borre de la caché: se describió la llamada que intenta restablecerla.
- No se consultó AR-CRM para este diagrama. El contrato se comprobó en el cliente y sus pruebas; no se verificó su implementación o su autorización en un servidor real.
- Las flechas abiertas hacia el tablero representan actualizaciones de interfaz por suscripción a los datos; no garantizan que el navegador pinte antes de emitir la solicitud. Las activaciones no implican bloqueo del hilo JavaScript. La notificación final es un callback y se dibujó como llamada, no como retorno de la petición HTTP.
- Se comprobaron la sintaxis PlantUML, los archivos generados desde la misma fuente y la imagen completa. No se modificó código de la aplicación ni se representaron el registro de tratos, inteligencia artificial, WhatsApp o procesos internos del backend.

## Rama, commit y archivos revisados

Frontend: rama **`main`**, commit **`43049a8c5b9bff03c2e553475ba7ff057268211e`**. La revisión se realizó sobre el árbol de trabajo, sin cambios pendientes en los archivos de aplicación consultados. El primer diagrama, en `docs/secuencia-registro-trato/`, ya existía sin seguimiento y no se modificó.

Se consultaron los archivos concretos de la tabla anterior y los tres archivos de pruebas indicados. `docs/secuencia-registro-trato/secuencia.puml` se consultó únicamente como referencia visual. No se revisó el backend ni se modificaron los archivos consultados.

## Inserción de la figura

Usar A4 vertical, márgenes de 1 cm y un ancho de imagen aproximado de 18.5 cm; conservar la proporción y colocar el título como texto fuera de la imagen. El PNG completo mide **2272 × 3080 píxeles**. Se conservó el estilo del primer diagrama: fondo blanco, participantes del frontend sobre azul claro y API externa en ocre. El SVG conserva el original vectorial. Las condiciones de `alt`/`else` aparecen entre corchetes generados por PlantUML.

Ambas imágenes se generaron localmente con PlantUML 1.2025.10 a 220 dpi. La comprobación de sintaxis terminó correctamente. Además de inspeccionar el PNG completo, se extrajo la fuente incrustada del PNG y del SVG y se comprobó que ambas coincidieran con el `.puml` final, normalizando únicamente los saltos de línea. Se contrastaron los participantes, los destinos de las flechas y las ramas con la evidencia de código; no se reutilizó la secuencia de registro de tratos.
