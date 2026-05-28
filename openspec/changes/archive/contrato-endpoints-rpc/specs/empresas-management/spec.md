# empresas-management — Delta Spec

**Capability**: empresas-management
**Change**: contrato-endpoints-rpc (Change 1)
**Base spec**: openspec/changes/empresas-crud/specs/empresas-management/spec.md
**Delta tipo**: MODIFICA (rutas RPC, método PUT, campos/enums del back, detalle client-side, filtros client-side)
**Status**: proposed
**Fecha**: 2026-05-27

---

## Contexto del delta

La spec base de `empresas-management` fue escrita contra un contrato REST inexistente (`/api/v1/empresas`, PATCH, id en path, filtros server-side). Este delta la reconcilia con el contrato **real** del back AR-CRM verificado en `EmpresaController.java`, `CreateEmpresaRequest.java`, `EditEmpresaRequest.java` y `EmpresaResponse.java`.

Cambios estructurales que este delta impone:
- Prefijo `/api/v1` → `/api` (via `BASE_URL`); rutas RPC en `endpoints.ts`.
- Método PATCH → **PUT** en edición (el back usa `@PutMapping`).
- El back **NO tiene** `GET /empresas/get-by-id`: el detalle de empresa pasa a resolverse **client-side** desde el `get-all`.
- Payload de create/edit alineado al back: campo `paginaWeb` (camelCase, no `pagina_web`), `estadoRelacion` enum `ACTIVO|INACTIVO|PROSPECTO`, campos opcionales `responsableId`, `notas`. `creadoPor` solo en create.
- Filtros de empresas son 100% **client-side**; el back no filtra por query params.
- Handlers MSW reescritos para imitar el contrato real (rutas RPC, PUT, camelCase, enums del back).
- `src/api/endpoints.ts` es la única fuente de verdad de rutas; hooks, handlers MSW y tests la importan.

---

## Requirements

---

### Requirement: endpoints.ts como fuente unica de verdad de rutas

El sistema MUST centralizar todas las rutas HTTP de empresas en `src/api/endpoints.ts`. El objeto `endpoints.empresas` MUST exponer exactamente: `getAll()`, `create()`, `edit(id: string)`, `delete(id: string)`. MUST NOT exponer `getById` (el back no lo tiene). Ninguna ruta de empresas MUST estar hardcodeada fuera de `endpoints.ts`; hooks, handlers MSW y tests MUST importar desde ese modulo.

#### Scenario: endpoints.empresas expone solo las rutas del back [unit test]

- WHEN se importa `endpoints.empresas`
- THEN `endpoints.empresas.getAll()` retorna `/empresas/get-all`
- AND `endpoints.empresas.create()` retorna `/empresas/create`
- AND `endpoints.empresas.edit('abc-123')` retorna `/empresas/edit?id=abc-123`
- AND `endpoints.empresas.delete('abc-123')` retorna `/empresas/delete?id=abc-123`
- AND `endpoints.empresas` NO tiene propiedad `getById`

#### Scenario: ninguna ruta literal de empresas fuera de endpoints.ts [unit test]

- WHEN se ejecuta type-check y se inspeccionan hooks y handlers MSW de empresas
- THEN no existe ningun string literal `/api/v1/empresas` ni `/empresas/:id` ni `/empresas/${id}` en esos archivos
- AND todas las rutas derivan de `endpoints.empresas`

---

### Requirement: apiClient gana metodo PUT y BASE_URL baja a /api

`src/api/client.ts` MUST exponer `apiClient.put<T>(path: string, body: unknown): Promise<T>`. El type `Method` MUST incluir `'PUT'`. `BASE_URL` MUST ser `/api` (sin `/v1`); si `VITE_API_BASE_URL` esta definido, se usa ese valor, con fallback a `/api`.

#### Scenario: apiClient.put hace PUT con body [hook test]

- GIVEN un handler MSW registrado en `PUT /api/empresas/edit?id=e1111111`
- WHEN se invoca `apiClient.put('/empresas/edit?id=e1111111', { nombre: 'ACME' })`
- THEN el handler recibe metodo PUT
- AND el body del request es `{ nombre: 'ACME' }`

#### Scenario: BASE_URL no incluye /v1 [unit test]

- WHEN se construye la URL base del apiClient
- THEN la URL emitida empieza con `/api/empresas/...`, no con `/api/v1/empresas/...`

---

### Requirement: Listado de empresas con ruta RPC

El sistema MUST consumir `GET /api/empresas/get-all` (via `endpoints.empresas.getAll()`) para obtener el listado de empresas. La queryKey MUST ser `['empresas']`. La respuesta del back es un array de objetos con los campos de `EmpresaResponse` (camelCase: `paginaWeb`, `estadoRelacion`, `responsableId`, `creadoPor`, `notas`, `creadoEn`, `actualizadoEn`). El hook MUST tipar la respuesta con el tipo `Empresa` actualizado.

#### Scenario: useEmpresas invoca GET /empresas/get-all [hook test]

- WHEN se monta `useEmpresas()`
- THEN se invoca `GET /api/empresas/get-all`
- AND la queryKey es `['empresas']`
- AND la respuesta se tipifica como `Empresa[]`

#### Scenario: Listado con datos renderiza la tabla [integration test]

- GIVEN el handler MSW de `GET /api/empresas/get-all` retorna un array de 2 empresas con campos camelCase
- WHEN el usuario navega a `/empresas`
- THEN se renderizan 2 filas en la tabla
- AND cada empresa muestra su nombre, sector, y `estadoRelacion` como badge

#### Scenario: Listado vacio muestra empty state [integration test]

- GIVEN el handler retorna `[]`
- THEN se muestra "No hay empresas todavia" y boton "Crear primera empresa"

#### Scenario: Error 500 muestra boton reintentar [integration test]

- GIVEN el handler responde 500
- THEN se muestra mensaje de error con boton "Reintentar"
- AND no se renderiza la tabla

---

### Requirement: Filtros de empresas son client-side

El sistema MUST aplicar todos los filtros de empresas (por `nombre`, `sector`, `estadoRelacion`) sobre el array completo devuelto por `GET /api/empresas/get-all`. MUST NOT enviar query params de filtro al back. El hook `useEmpresas` MUST recibir la lista completa y el componente de pagina aplica los filtros localmente.

#### Scenario: Filtro por nombre es client-side [integration test]

- GIVEN la tabla muestra 3 empresas con nombres "Innovatech", "Soluciones SA", "InnovaPro"
- WHEN el usuario escribe "innova" en el input de busqueda
- THEN solo se muestran "Innovatech" e "InnovaPro"
- AND NO se emite ninguna nueva peticion HTTP al back

#### Scenario: Filtro por estadoRelacion es client-side [integration test]

- GIVEN la tabla muestra empresas con `estadoRelacion: ACTIVO`, `INACTIVO`, `PROSPECTO`
- WHEN el usuario selecciona filtro "ACTIVO"
- THEN solo se muestran las empresas con `estadoRelacion: 'ACTIVO'`
- AND NO se emite nueva peticion HTTP

#### Scenario: Filtro sin coincidencias muestra mensaje [integration test]

- WHEN el texto buscado no coincide con ninguna empresa
- THEN se muestra "No hay empresas que coincidan con tu busqueda"

---

### Requirement: Detalle de empresa resuelto client-side desde get-all

El sistema MUST resolver el detalle de una empresa leyendo el array del `get-all` y filtrando por `id`, ya que el back NO tiene `GET /empresas/get-by-id`. El hook `useEmpresa(id)` MUST retornar el item encontrado en la cache de `['empresas']`, o ejecutar `getAll` si la cache no existe. MUST NOT emitir `GET /empresas/get-by-id?id=...` (la ruta no existe).

#### Scenario: useEmpresa resuelve desde cache [hook test]

- GIVEN la queryKey `['empresas']` ya tiene datos en cache con una empresa `id: 'e1111111'`
- WHEN se monta `useEmpresa('e1111111')`
- THEN retorna la empresa con ese id sin emitir nueva peticion HTTP al back

#### Scenario: useEmpresa hace get-all cuando la cache esta vacia [hook test]

- GIVEN la queryKey `['empresas']` no tiene datos en cache
- WHEN se monta `useEmpresa('e1111111')`
- THEN se invoca `GET /api/empresas/get-all`
- AND retorna la empresa con `id: 'e1111111'`
- AND NO se invoca ningun endpoint `get-by-id`

#### Scenario: id inexistente en la lista retorna undefined [hook test]

- GIVEN el get-all retorna empresas pero ninguna tiene `id: 'x9999999'`
- WHEN se monta `useEmpresa('x9999999')`
- THEN el hook retorna `undefined`

#### Scenario: Pagina de detalle navega a /empresas si empresa no existe [integration test]

- GIVEN no existe empresa con ese id en el get-all
- WHEN el usuario navega a `/empresas/x9999999`
- THEN se muestra toast "Empresa no encontrada"
- AND el router navega a `/empresas`

---

### Requirement: Payload de create alineado al back

El sistema MUST enviar `POST /api/empresas/create` con el body en camelCase segun `CreateEmpresaRequest`: `nombre` (requerido), `sector?`, `telefono?`, `paginaWeb?` (camelCase), `facebook?`, `instagram?`, `twitter?`, `estadoRelacion?` (enum `ACTIVO|INACTIVO|PROSPECTO`), `responsableId?` (UUID), `creadoPor?` (UUID), `notas?`. MUST NOT enviar el campo `pagina_web` (snake_case). El schema Zod MUST validar `nombre` como requerido y `estadoRelacion` como enum opcional.

#### Scenario: Creacion exitosa envia camelCase [integration test]

- GIVEN el usuario completa nombre "ACME Corp" y `estadoRelacion: 'ACTIVO'`
- WHEN envia el formulario
- THEN se invoca `POST /api/empresas/create` con body `{ nombre: 'ACME Corp', estadoRelacion: 'ACTIVO' }`
- AND el body NO contiene `pagina_web`
- AND el handler responde 201
- AND el Dialog se cierra y se muestra toast de exito
- AND la queryKey `['empresas']` se invalida

#### Scenario: nombre vacio bloquea submit [component test]

- WHEN el usuario envia el form sin nombre
- THEN se muestra error inline "El nombre es requerido"
- AND no se invoca el backend

#### Scenario: estadoRelacion acepta solo valores del enum del back [unit test]

- GIVEN el schema Zod del form de empresa
- WHEN se parsea `{ nombre: 'X', estadoRelacion: 'ACTIVO' }`
- THEN `success === true`
- AND cuando se parsea `{ nombre: 'X', estadoRelacion: 'SERVICIO' }`
- THEN `success === false` con error en `estadoRelacion`

#### Scenario: Error 422 mapea field errors [integration test]

- WHEN el backend responde 422 con `details: [{ field: "nombre", message: "ya existe" }]`
- THEN el form muestra el error inline en el campo `nombre`
- AND el Dialog permanece abierto

---

### Requirement: Edicion de empresa con PUT y ruta RPC

El sistema MUST enviar `PUT /api/empresas/edit?id={uuid}` (via `endpoints.empresas.edit(id)` + `apiClient.put`) para editar una empresa. MUST NOT usar PATCH ni poner el id en el path. El body MUST seguir `EditEmpresaRequest`: mismos campos que create excepto `creadoPor` (que no va en edit). Los valores iniciales del form se cargan desde `useEmpresa(id)` (client-side).

#### Scenario: Edicion exitosa invoca PUT con id como query param [integration test]

- GIVEN existe empresa `e1111111` con nombre "ACME Corp"
- WHEN el usuario cambia nombre a "ACME Corporation" y envia
- THEN se invoca `PUT /api/empresas/edit?id=e1111111` con `{ nombre: 'ACME Corporation' }`
- AND el metodo HTTP es PUT, no PATCH
- AND NO hay `/empresas/e1111111` en la URL (id no va en el path)
- AND se invalidan `['empresas']` y `['empresas', 'e1111111']`

#### Scenario: Form prefilled carga datos actuales [component test]

- GIVEN empresa `e1111111` tiene `nombre: 'ACME Corp'`, `estadoRelacion: 'ACTIVO'`, `paginaWeb: 'https://acme.com'`
- WHEN se abre el dialog de edicion
- THEN el campo nombre muestra "ACME Corp"
- AND el select de estadoRelacion muestra "ACTIVO"
- AND el campo paginaWeb muestra "https://acme.com"

---

### Requirement: Eliminacion de empresa con ruta RPC

El sistema MUST enviar `DELETE /api/empresas/delete?id={uuid}` (via `endpoints.empresas.delete(id)`) tras confirmacion en AlertDialog. El id va como query param, no en el path. Respuesta 204 → remover `['empresas', id]` + invalidar `['empresas']`.

#### Scenario: Eliminacion exitosa invoca DELETE con id como query param [integration test]

- GIVEN empresa `e1111111` existe en la lista
- WHEN el usuario hace clic en "Eliminar" y confirma
- THEN se invoca `DELETE /api/empresas/delete?id=e1111111`
- AND NO hay `/empresas/e1111111` en el path (id no va en el path)
- AND la fila desaparece de la tabla
- AND se muestra toast "Empresa eliminada"

#### Scenario: 404 al eliminar muestra toast [integration test]

- WHEN el backend responde 404
- THEN se muestra toast "La empresa ya fue eliminada"
- AND la lista se invalida
- AND el AlertDialog se cierra

#### Scenario: Cancelar no invoca DELETE [component test]

- WHEN el usuario hace clic en "Cancelar" en el AlertDialog
- THEN se cierra el dialog
- AND no se invoca `DELETE`

---

### Requirement: Invalidacion de cache tras mutations

| Mutation | Keys a invalidar |
|---|---|
| Crear empresa | `invalidate ['empresas']` |
| Editar empresa | `invalidate ['empresas']` + `invalidate ['empresas', id]` |
| Eliminar empresa | `removeQueries ['empresas', id]` + `invalidate ['empresas']` |

#### Scenario: Crear empresa invalida la lista [hook test]

- GIVEN `useCreateEmpresa` ejecuta `POST /api/empresas/create` con exito (201)
- WHEN la mutacion se resuelve
- THEN `queryClient.invalidateQueries({ queryKey: ['empresas'] })` se invoca

#### Scenario: Eliminar empresa remueve key individual [hook test]

- GIVEN `useDeleteEmpresa` ejecuta `DELETE /api/empresas/delete?id=e1111111` con exito (204)
- WHEN la mutacion se resuelve
- THEN `queryClient.removeQueries({ queryKey: ['empresas', 'e1111111'] })` se invoca
- AND `queryClient.invalidateQueries({ queryKey: ['empresas'] })` se invoca

---

### Requirement: Handlers MSW fieles al contrato real del back

Los handlers MSW de empresas (`src/mocks/handlers/empresas.ts`) MUST imitar exactamente el contrato del back: rutas RPC (`/api/empresas/get-all`, `/api/empresas/create`, `/api/empresas/edit?id=`, `/api/empresas/delete?id=`), metodo PUT en edit, id como query param en edit/delete, respuesta en camelCase, sin filtrado server-side. Las fixtures MUST usar los campos de `EmpresaResponse` (camelCase). El objetivo es drop-in: apuntando `VITE_API_BASE_URL` al back real, el front funciona sin tocar hooks ni tests.

#### Scenario: Handler GET /api/empresas/get-all retorna lista sin filtrar [hook test]

- GIVEN el handler MSW esta registrado en `GET /api/empresas/get-all`
- WHEN `useEmpresas()` ejecuta la query
- THEN se intercepta `GET /api/empresas/get-all`
- AND la respuesta es un array con todos los items de la fixture (sin filtrado por query params)
- AND los campos estan en camelCase (`paginaWeb`, `estadoRelacion`, etc.)

#### Scenario: Handler POST /api/empresas/create retorna 201 con la empresa creada [hook test]

- GIVEN el handler MSW en `POST /api/empresas/create`
- WHEN `useCreateEmpresa` envia `{ nombre: 'Nueva Empresa', estadoRelacion: 'PROSPECTO' }`
- THEN el handler responde 201 con la empresa creada incluyendo `id` generado
- AND el body de la empresa retornada tiene campo `estadoRelacion: 'PROSPECTO'`

#### Scenario: Handler PUT /api/empresas/edit?id= retorna la empresa editada [hook test]

- GIVEN el handler MSW en `PUT /api/empresas/edit?id=e1111111`
- WHEN `useUpdateEmpresa` envia PUT con `{ nombre: 'Editada' }`
- THEN el handler lee el id del query param `id`
- AND responde 200 con la empresa actualizada

#### Scenario: Handler DELETE /api/empresas/delete?id= responde 204 [hook test]

- GIVEN el handler MSW en `DELETE /api/empresas/delete?id=e1111111`
- WHEN `useDeleteEmpresa` envia DELETE
- THEN el handler responde 204

---

## API Contract Reference (back real — verificado)

| Metodo | Path | Descripcion |
|---|---|---|
| GET | `/api/empresas/get-all` | Lista todas las empresas; sin filtros server-side |
| POST | `/api/empresas/create` | Crea empresa; `nombre` requerido; id como query param NO aplica |
| PUT | `/api/empresas/edit?id={uuid}` | Edita empresa; id como query param; NO tiene get-by-id |
| DELETE | `/api/empresas/delete?id={uuid}` | Elimina empresa; responde 204; id como query param |

**Payload create** (`CreateEmpresaRequest`): `nombre` (NotBlank, max 200), `sector?`, `telefono?`, `paginaWeb?`, `facebook?`, `instagram?`, `twitter?`, `estadoRelacion?: EstadoRelacion`, `responsableId?: UUID`, `creadoPor?: UUID`, `notas?`.

**Payload edit** (`EditEmpresaRequest`): mismos campos que create excepto sin `creadoPor`.

**Response** (`EmpresaResponse`): `id: UUID`, `nombre`, `sector`, `telefono`, `paginaWeb`, `facebook`, `instagram`, `twitter`, `estadoRelacion`, `responsableId`, `creadoPor`, `notas`, `creadoEn: LocalDateTime`, `actualizadoEn: LocalDateTime`.

**Enum `EstadoRelacion`**: `ACTIVO | INACTIVO | PROSPECTO`

Errores normalizados: `{ status, error, message, details? }`.

---

## Tipo TypeScript actualizado

```ts
// src/api/types.ts — Empresa (delta)
export type EstadoRelacion = 'ACTIVO' | 'INACTIVO' | 'PROSPECTO';

export interface Empresa {
  id: string;
  nombre: string;
  sector?: string;
  telefono?: string;
  paginaWeb?: string;        // camelCase (antes: pagina_web)
  facebook?: string;
  instagram?: string;
  twitter?: string;
  estadoRelacion?: EstadoRelacion;  // nuevo campo
  responsableId?: string;           // nuevo campo
  creadoPor?: string;               // nuevo campo
  notas?: string;                   // nuevo campo
  creadoEn: string;
  actualizadoEn: string;
}
```

---

## Out of Scope (este delta)

- `GET /empresas/get-by-id` — no existe en el back; detalle es siempre client-side.
- `useEmpresaProspectos` / `useEmpresaClientes` — se dejan intactos como deuda de Change 2.
- Paginacion, ordenamiento server-side, exportacion CSV.
- Permisos por rol, historial de cambios.
- Logo corporativo.
- Campos `responsableId` / `creadoPor` en la UI del form — se definen como opcionales en el payload pero la UI los expone o no segun decision de UX futura (no es requisito de este change).
