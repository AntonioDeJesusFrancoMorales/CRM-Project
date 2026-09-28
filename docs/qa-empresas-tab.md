# Checklist QA — Empresas

Fecha: 2026-09-27
Alcance: listado `/empresas`, detalle `/empresas/:id`, formulario de creación/edición y acciones CRUD visibles de Empresa.

Esta checklist se basa en la implementación actual. Distingue el comportamiento del mock MSW del comportamiento que debe confirmarse contra el backend real; no convierte una decisión de producto no documentada en un resultado esperado.

## Preparación

- [x] Iniciar sesión con un usuario válido y abrir **Empresas** desde el menú lateral.
- [x] Registrar el ambiente de ejecución: `[x] MSW del frontend` `[x] backend real`.
- [x] Para los casos de red, conservar la solicitud y respuesta HTTP, incluido método, ruta, status y body.
- [x] No usar datos personales ni dominios de producción. Los valores de esta checklist son ficticios y `example.com` es un dominio reservado para ejemplos.

## Datos de prueba

| Campo                         | Valor seguro para QA                       |
| ----------------------------- | ------------------------------------------ |
| Nombre nuevo                  | `QA Example Holdings 2026-09-27-01`        |
| Sector                        | `Tecnología`                               |
| Teléfono                      | `+52 55 5555 0101`                         |
| Página web                    | `https://www.example.com/qa-empresa-01`    |
| Facebook                      | `https://www.example.com/qa-facebook-01`   |
| Instagram                     | `@qa_example_01`                           |
| Twitter / X                   | `@qa_example_01`                           |
| Estado                        | `Prospecto` (valor inicial del formulario) |
| Notas                         | `Registro QA con datos ficticios.`         |
| Empresa existente para editar | `Innovatech Solutions`                     |
| Nombre duplicado              | `Innovatech Solutions`                     |
| ID existente para detalle     | `a1111111-aaaa-1111-aaaa-111111111111`     |

Si se repite la ejecución, agregar un sufijo del tester al nombre nuevo para no confundir resultados de ambientes distintos.

Las redes sociales aceptan una URL completa o un identificador con `@`. Los identificadores se normalizan a una URL HTTPS de perfil antes de enviarse al backend; por ejemplo, Instagram usa `https://instagram.com/qa_example_01` y Twitter/X usa `https://x.com/qa_example_01`.

## Lectura de validación y contrato actual

- `nombre` es el único campo requerido por `empresaCreateSchema`. El formulario usa `empresaCreateSchema` como resolver tanto en creación como en edición; `empresaUpdateSchema` existe, pero no es el resolver que usa `EmpresaForm`.
- El cliente actual limita `nombre` a 150 caracteres (`schema.max(150)` y `maxLength={150}`). El contrato documentado del backend indica `CreateEmpresaRequest.nombre` con máximo 200. Los casos de longitud deben registrar esta diferencia; no se debe asumir que el límite del backend y el del frontend son equivalentes.
- Los campos opcionales vacíos se convierten de `''` a `null` antes de enviar la mutación. La UI no presenta controles para `responsableId` ni `creadoPor`, aunque aparecen como opcionales en la referencia del contrato de creación.
- `estadoRelacion` solo tiene las opciones `PROSPECTO`, `ACTIVO` e `INACTIVO`; en creación el valor inicial visible es `Prospecto`.

### Análisis explícito de `www.pagina.com`

- Como **hostname**, `www.pagina.com` tiene sintaxis válida; esta comprobación no confirma que el nombre exista o resuelva en DNS.
- Como **URL absoluta**, `www.pagina.com` no incluye un esquema (`https://` o `http://`). El formulario agrega `https://` antes de validar y persistir el valor.
- El validador acepta dominios comunes sin esquema, conserva `http://`/`https://` explícitos y rechaza esquemas no web como `ftp://`, URLs relativas y valores malformados.
- El `<form>` declara `noValidate`, por lo que el mensaje que gobierna este caso es `La página web debe ser una URL válida.`. No hay comprobación de DNS ni de disponibilidad del sitio.

## Casos críticos — creación y edición

- [x] **TC-01 — Abrir el listado de Empresas.**
  1. Desde el menú lateral, seleccionar **Empresas**.
  2. Confirmar que la URL es `/empresas` y que se muestra el encabezado **Empresas**.
  3. Esperar la carga de los datos.
  - **Resultado esperado:** se solicita `GET /api/empresas/get-all` mediante la ruta centralizada del cliente; con el fixture actual aparecen `Innovatech Solutions`, `Corporativo Maya` y `Distribuidora del Sur`. Mientras carga se muestra el esqueleto de tabla; los KPI y filtros no deben mostrar ceros engañosos si la consulta falla.
  - **Resultado real / notas:** **********\*\***********\_\_\_\_**********\*\***********

- [x] **TC-02 — Crear una empresa con el flujo feliz.**
  1. Seleccionar **Nueva empresa**.
  2. Completar el formulario con los datos de prueba de la tabla, conservando `Prospecto` como estado.
  3. Seleccionar **Crear empresa** una sola vez.
  - **Resultado esperado:** el cliente envía `POST /api/empresas/create` con campos camelCase, sin `pagina_web`, y la respuesta del mock es `201`. La mutación devuelve la empresa con un ID generado, aparece un toast de creación, el diálogo se cierra y la nueva fila aparece después de invalidar la consulta de empresas. Los valores opcionales no deben transformarse en nombres snake_case. `www.pagina.com` se envía como `https://www.pagina.com/`; los handles de redes se envían como URLs HTTPS de perfil.
  - **Resultado real / notas:**: habiamos comentado del www.pagina.com. Otra cosa es que el ig o twitter deberia dejar con el arroba o el link? porque me pusiste el arroba para poner pero me esta pidiendo el link si no no deja poner nada.
  - **Resolución aplicada:** se aceptan dominios web sin esquema y handles con `@`; ambos se normalizan a enlaces HTTPS antes de la mutación y el formulario explica los dos formatos.

- [x] **TC-03 — Validar el campo requerido `Nombre`.**
  1. Abrir **Nueva empresa** y dejar todos los campos sin valor.
  2. Seleccionar **Crear empresa**.
  - **Resultado esperado:** aparece el error inline `El nombre es requerido`, el diálogo permanece abierto y no se emite `POST /api/empresas/create`. Los demás campos opcionales no deben generar errores por estar vacíos.
  - **Resultado real / notas:** **********\*\***********\_\_\_\_**********\*\***********

- [x] **TC-04 — Confirmar valores opcionales, estado y body enviado.**
  1. Abrir **Nueva empresa**.
  2. Completar solo `Nombre`; dejar sector, teléfono, página web, redes y notas vacíos.
  3. Inspeccionar el body de la solicitud y seleccionar explícitamente cada estado disponible en una ejecución controlada.
  - **Resultado esperado:** el selector solo ofrece `Prospecto`, `Activo` e `Inactivo`; el valor inicial es `Prospecto`. Los strings opcionales vacíos se convierten a `null` por `stringsToNulls`; el estado permanece como enum en mayúsculas. No se envían `responsableId` ni `creadoPor` desde este formulario porque no existen controles para ellos.
  - **Resultado real / notas:** **********\*\***********\_\_\_\_**********\*\***********

- [x] **TC-05 — Intentar crear una empresa duplicada.**
  1. Abrir **Nueva empresa** y usar `Innovatech Solutions` como nombre.
  2. Enviar el formulario.
  3. Registrar por separado si se ejecuta MSW o el backend real.
  - **Resultado esperado según la implementación:** el frontend compara nombres recortados sin distinguir mayúsculas y minúsculas contra la lista de empresas cargada. En creación bloquea el envío y muestra un error inline; en edición excluye el ID de la empresa actual. Si la lista no está disponible o el backend real responde un error, la validación del servidor se conserva como respaldo.
  - **Resultado real / notas:** actualmente el backend no tiene ninguna limitacion, como no es nuestra responsabilidad realizar cambios en el backend, al menos en este caso, haz una logica aqui en el front que impida en base al nombre que no se pueda repetir al momento de crear o editar
  - **Resolución aplicada:** se agregó la guardia frontend para creación y edición, sin modificar el backend ni asumir que reemplaza su validación.

- [x] **TC-06 — Editar una empresa existente.**
  1. En la fila de `Innovatech Solutions`, abrir el menú de acciones y seleccionar **Editar**.
  2. Confirmar que los valores actuales, incluido el sitio web y el estado, aparecen precargados.
  3. Cambiar el nombre a `QA Example Holdings Edited 2026-09-27-01`, modificar una nota y guardar.
  - **Resultado esperado:** se envía `PUT /api/empresas/edit?id=<id>`; no se usa `PATCH` ni se coloca el ID en el path. El formulario actual envía el conjunto de valores visibles, convierte vacíos a `null` y no envía `creadoPor`. Con respuesta exitosa, el diálogo se cierra, aparece el toast de actualización y se invalidan la lista y el detalle; el nombre modificado se ve en la tabla y al abrir el detalle.
  - **Resultado real / notas:** **********\*\***********\_\_\_\_**********\*\***********

- [x] **TC-07 — Cancelar y comprobar el reinicio del formulario.**
  1. En creación, introducir un nombre y varios valores sin guardar.
  2. Seleccionar **Cancelar**.
  3. Volver a abrir **Nueva empresa**.
  4. Repetir en edición: modificar un valor, cancelar y volver a abrir la misma empresa.
  - **Resultado esperado:** no se emite una mutación al cancelar. No existe un botón independiente **Restablecer**; cancelar cierra el diálogo. Al reabrir creación, los campos deben volver a los valores vacíos y `Prospecto`; al reabrir edición, deben mostrar los datos persistidos/cacheados, no los cambios cancelados.
  - **Resultado real / notas:** **********\*\***********\_\_\_\_**********\*\***********

- [x] **TC-08 — Confirmar actualización, recarga y persistencia.**
  1. Crear o editar una empresa y esperar el cierre exitoso del diálogo.
  2. Confirmar que la fila se actualiza sin recargar manualmente.
  3. Seleccionar el botón **Recargar empresas**.
  4. Si el ambiente es MSW, distinguir una recarga de datos de un refresh completo del navegador; si es backend real, recargar el navegador completo.
  - **Resultado esperado:** la mutación invalida las consultas y la recarga del listado vuelve a mostrar el cambio. El botón **Recargar empresas** se deshabilita, anima su icono y anuncia que la consulta está recargando mientras la refetch real está pendiente. En MSW, los cambios de `empresasFixture` viven en memoria durante la sesión, pero un refresh completo reinicia el módulo y no demuestra persistencia durable. Solo el backend real puede confirmar persistencia después de cerrar/reabrir la sesión o reiniciar el frontend.
  - \*\*Resultado real / notas: al darle al boton de recargar si que se hace el getall correspondiente, pero no se ve visualmente, quizas un destello o algo que indique que recargo estaría bien.
  - **Resolución aplicada:** el botón ahora refleja `isFetching` de React Query con estado deshabilitado, icono animado y estado accesible; no depende de un temporizador.

## Casos de navegación, listado y detalle

- [x] **TC-09 — Navegar al detalle y regresar al listado.**
  1. Seleccionar el nombre de una empresa o **Ver detalle**.
  2. Confirmar la URL `/empresas/<id>`.
  3. Revisar las pestañas **Resumen 360**, **Información** y **Contactos**.
  4. Seleccionar **Volver a empresas** y también probar el enlace **Empresas** del menú lateral.
  - **Resultado esperado:** el detalle se resuelve desde `GET /api/empresas/get-all` y el ID se filtra en cliente; no debe solicitarse `GET /empresas/get-by-id`, porque esa ruta no existe en el contrato documentado. La información muestra campos vacíos como `—`, los enlaces de teléfono/web conservan su destino y la navegación vuelve a `/empresas` sin perder la aplicación.
  - **Resultado real / notas:** **********\*\***********\_\_\_\_**********\*\***********

- [x] **TC-10 — Usar búsqueda y filtros de Empresas.**
  1. Abrir **Mostrar filtros**.
  2. Buscar `Maya`, seleccionar un estado, un sector y las opciones de sitio web.
  3. Verificar el contador y usar **Limpiar filtros**.
  - **Resultado esperado:** la búsqueda cubre nombre, sector, teléfono y sitio web; los filtros se aplican en cliente sobre la lista recibida. Cambiarlos no debe emitir una nueva solicitud de empresas con query params de filtro. **Limpiar filtros** restaura todas las filas y el contador.
  - **Resultado real / notas:** **********\*\***********\_\_\_\_**********\*\***********

- [x] **TC-11 — Detalle con ID inexistente o error de servidor.**
  1. Abrir `/empresas/inexistente` con una respuesta vacía del listado.
  2. Repetir con `GET /api/empresas/get-all` respondiendo `500`.
  - **Resultado esperado:** para un ID que no existe se muestra `Esta empresa no existe. Volviendo al listado...`, aparece el mensaje `Empresa no encontrada` y se navega a `/empresas` aproximadamente 1.5 segundos después. Para un error general se muestra `No fue posible cargar la empresa.` y el botón **Volver al listado**, sin tratar el error como un 404.
  - **Resultado real / notas:** **********\*\***********\_\_\_\_**********\*\***********

## Casos negativos y de límites

- [x] **TC-12 — URL inválida y análisis de `www.pagina.com`.**
  1. En `Página web`, probar individualmente `www.pagina.com`, `pagina.com`, `https://www.pagina.com`, `http://www.pagina.com`, `ftp://www.pagina.com`, `//www.pagina.com`, `https://` y `no-es-url`.
  2. Probar también el valor vacío.
  - **Resultado esperado:** `www.pagina.com` y `pagina.com` son aceptadas y se normalizan a `https://` antes de persistirse. Las variantes explícitas `http://` y `https://` conservan su esquema. `ftp://`, `//www.pagina.com`, `https://` y `no-es-url` son rechazadas con `La página web debe ser una URL válida.`. El vacío es válido y se transforma a `null`; no se debe probar disponibilidad DNS como parte de este caso.
  - \*\*Resultado real / notas: todo funciona como deberia, solo que, el mensaje de error que sale como ventana emergente se ve con teste texto "El campo paginaWeb tiene un formato de URL inválido." y pues deberia verse como Pagina Web no? no junto
  - **Resolución aplicada:** la etiqueta visible es **Página web**, se aceptan dominios sin esquema, se rechazan esquemas no web y los alias `paginaWeb`/`pagina_web` se mapean al mensaje español del campo.

- [x] **TC-13 — Espacios en blanco.**
  1. Probar `Nombre = "   "`, `Sector = "   "`, `Teléfono = "       "` y `Página web = "   "`.
  2. Observar si se detiene el cliente o si llega una solicitud al servidor.
  - **Resultado esperado:** el frontend recorta los valores antes de validar. Un nombre compuesto solo por espacios se rechaza como requerido; los campos opcionales compuestos solo por espacios se convierten en vacío y luego en `null` al persistir. La validación del backend sigue siendo la autoridad final.
  - \*\*Resultado real / notas: por parte del front si acepta estos espacios en blanco, aunque no deberia y en el back regresa el error en ingles y se muestra el error en ingles name is required. Corrige esto, en el front tampoco deberia dejar poner, o hazlo como se hace de normal o la norma o patron.
  - **Resolución aplicada:** se agregó `trim` en el schema y payload, se bloquea el nombre vacío y `name is required` se muestra como `El nombre es requerido` en el campo **Nombre**.

- [x] **TC-14 — Valores largos en los límites implementados.**
  1. Probar `nombre` con 150 y 151 caracteres.
  2. Probar `sector` con 80 y 81, redes sociales con 150 y 151, `notas` con 2000 y 2001.
  3. Probar teléfono con 20 y 21 caracteres permitidos.
  4. Probar un sitio web válido con un path largo, ya que `paginaWeb` no tiene `maxLength` ni `.max()` en el schema.
  - **Resultado esperado basado en el frontend:** 150/80/150/2000/20 son los límites inclusivos de sus respectivos validadores actuales; el valor siguiente debe mostrar error o quedar impedido por `maxLength` cuando el input lo declara. El sitio web largo solo debe evaluarse por sintaxis URL en el cliente; el límite del backend no está especificado en la referencia consultada. Registrar especialmente el desfase nombre 150 del frontend frente al máximo 200 documentado para el DTO del backend.
  - **Resultado real / notas:** **********\*\***********\_\_\_\_**********\*\***********

- [x] **TC-15 — Identificador duplicado: comprobar aplicabilidad.**
  1. Revisar el formulario de creación y el body de la solicitud.
  2. Confirmar si existe algún campo de RFC, registro fiscal, código externo o ID editable.
  - **Resultado esperado:** la UI actual no tiene un campo de identificador de negocio; el `id` de Empresa lo genera la API/mock (`crypto.randomUUID()` en MSW). Por ello no es posible ejecutar una duplicación de identificador desde esta pantalla. Usar TC-05 para el duplicado de nombre y, si el backend real exige otro identificador no expuesto por la UI, registrar ese desfase como contrato pendiente en lugar de inventar un caso de formulario.
  - **Resultado real / notas:** **********\*\***********\_\_\_\_**********\*\***********

- [x] **TC-16 — Fallos de API y estados de error del formulario.**
  1. Hacer que `GET /api/empresas/get-all` responda `500`.
  2. Hacer que create o edit responda `422` con `details: [{ field: "nombre", message: "El nombre ya existe" }]`.
  3. Repetir create o edit con un `500`, `409` u otro error no `422`.
  4. Para delete, probar una respuesta `409` y una `404`.
  - **Resultado esperado:** el listado muestra `No fue posible cargar las empresas. Intenta de nuevo.` y **Reintentar**. Un `422` con details se muestra inline y mantiene abierto el diálogo. Un error no `422` de create/edit se muestra mediante toast y no cierra el diálogo. Al eliminar, un `409` se muestra dentro de la confirmación; un `404` produce el mensaje `La empresa ya fue eliminada` y actualiza la lista.
  - **Resultado real / notas:** **********\*\***********\_\_\_\_**********\*\***********

- [x] **TC-17 — Doble envío.**
  1. Introducir los datos del caso feliz.
  2. Simular una respuesta lenta del endpoint y hacer doble clic rápidamente en **Crear empresa** o **Guardar cambios**.
  3. Revisar las solicitudes de red y el listado.
  - **Resultado esperado:** mientras la mutación está pendiente, el botón se deshabilita y cambia a `Guardando...`; **Cancelar** también queda deshabilitado. El guardado usa un bloqueo síncrono además del estado pendiente, por lo que un doble clic o dos eventos rápidos producen una sola solicitud y una sola empresa creada/actualizada. Esto no sustituye la idempotencia del servidor.
  - \*\*Resultado real / notas: efectivamente ocurre en todos los botones, arregla eso porque si salen cosas duplicadas
  - **Resolución aplicada:** se agregó un bloqueo inmediato en el formulario compartido de creación/edición para evitar mutaciones duplicadas antes de que React actualice el estado pendiente.

- [x] **TC-18 — Eliminar con confirmación y cancelar.**
  1. Abrir el menú de una empresa y seleccionar **Eliminar**.
  2. Verificar el nombre y el aviso de que la acción no se puede deshacer.
  3. Seleccionar **Cancelar** y confirmar que no se envía DELETE.
  4. Repetir y confirmar **Eliminar**.
  - **Resultado esperado:** la confirmación cancela sin mutación. Al confirmar se envía `DELETE /api/empresas/delete?id=<id>` y la fila desaparece tras `204`, con toast `Empresa eliminada`; el ID no aparece en el path.
  - **Resultado real / notas:** **********\*\***********\_\_\_\_**********\*\***********

- [x] **TC-19 — Nombre muy largo en listado y detalle.**
  1. Crear o cargar una empresa con un nombre suficientemente largo para superar el ancho disponible de la tabla.
  2. Revisar el listado y abrir el detalle de esa empresa.
  - **Resultado esperado:** la tabla conserva un layout fijo; el nombre se trunca con puntos suspensivos, no ensancha la tabla ni crea scroll horizontal inferior y permite inspeccionar el valor completo mediante `title`. El detalle muestra el nombre completo con ajuste seguro de línea.
  - **Resolución aplicada:** se agregó layout fijo y truncamiento con tooltip nativo en la tabla, además de ajuste seguro de línea en el encabezado del detalle.

## Registro de ejecución

- Fecha/hora: **\*\*\*\***\_\_\_\_**\*\*\*\***
- Tester: **\*\*\*\***\_\_\_\_**\*\*\*\***
- Navegador/versión: **\*\*\*\***\_\_\_\_**\*\*\*\***
- Ambiente: `[ ] MSW` `[ ] backend real` Base URL: **\*\*\*\***\_\_\_\_**\*\*\*\***
- Commit o versión probada: **\*\*\*\***\_\_\_\_**\*\*\*\***
- Resultado global: `[ ] Aprobado` `[ ] Aprobado con observaciones` `[ ] No aprobado`
- Incidencias/enlaces: ************\*\*************\_\_************\*\*************

## Referencias consultadas

### Implementación y contrato local

- `src/features/empresas/pages/EmpresasListPage.tsx`
- `src/features/empresas/pages/EmpresaDetailPage.tsx`
- `src/features/empresas/components/EmpresaForm.tsx`
- `src/features/empresas/components/EmpresaFormDialog.tsx`
- `src/features/empresas/components/EmpresasTable.tsx`
- `src/features/empresas/components/EmpresasHeader.tsx`
- `src/features/empresas/components/EmpresasFilters.tsx`
- `src/features/empresas/components/EmpresaInfoTab.tsx`
- `src/features/empresas/components/EmpresaContactosTab.tsx`
- `src/features/empresas/components/EmpresaDeleteDialog.tsx`
- `src/features/empresas/schemas/empresa.schema.ts`
- `src/features/empresas/lib/empresaLinks.ts`, `empresaValues.ts`, `empresaValidation.ts`
- `src/features/empresas/hooks/useEmpresas.ts`, `useEmpresa.ts`, `useCreateEmpresa.ts`, `useUpdateEmpresa.ts`, `useDeleteEmpresa.ts`
- `src/api/types.ts`, `src/api/endpoints.ts`, `src/api/client.ts`
- `src/lib/form-utils.ts`
- `src/components/ui/dialog.tsx`
- `package.json`, `pnpm-lock.yaml` (versión de Zod utilizada)
- `src/mocks/handlers/empresas.ts`, `src/mocks/fixtures/empresas.ts`
- `src/routes/router.tsx`, `src/components/layout/Sidebar.tsx`

### Tests y referencias del backend

- `src/features/empresas/__tests__/empresa.schema.test.ts`
- `src/features/empresas/__tests__/empresaLinks.test.ts`, `empresaValidation.test.ts`, `EmpresaForm.test.tsx`, `EmpresasTable.test.tsx`, `useUpdateEmpresa.test.tsx`
- `src/features/empresas/__tests__/EmpresasListPage.test.tsx`
- `src/features/empresas/__tests__/EmpresaDetailPage.test.tsx`
- `src/features/empresas/__tests__/useCreateEmpresa.test.tsx`
- `src/features/empresas/__tests__/useEmpresas.test.tsx`
- `src/features/empresas/__tests__/useDeleteEmpresa.test.tsx`
- `src/mocks/handlers/__tests__/empresas.handler.test.ts`
- `docs/contrato-api-back-vs-front.md`
- `openspec/specs/empresas-management/spec.md`
- `docs/qa-kanban-workflow-state-source.md` como referencia de ubicación y formato de QA existente.

No se encontró código fuente Java ni un OpenAPI dentro de este repositorio; la referencia del backend consultada es la documentación de contrato indicada arriba.
