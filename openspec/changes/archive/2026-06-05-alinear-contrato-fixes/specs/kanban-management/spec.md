# kanban-management — delta spec

**Capability**: kanban-management
**Change**: alinear-contrato-fixes (Change 1)
**Delta tipo**: MODIFY (requirements modificados sobre spec existente)
**Status**: implemented
**Fecha**: 2026-06-05

---

## Purpose

Corrige 4 desajustes de contrato en el modulo kanban que rompian la feature en produccion:
1. `fichaSchema` response incluia campos que el back (`FichaResponse.java`) nunca devuelve → `z.parse()` lanzaba en cada lectura.
2. `fichaCreate/EditSchema` enviaba campos que el back ignora silenciosamente.
3. `useReordenarColumnas` enviaba `string[]` en lugar de `Array<{value: string}>` (el back espera `List<ColumnaId>`).
4. El drag-and-drop usaba `PUT /fichas/edit` con body completo; el back tiene endpoint dedicado `PUT /fichas/mover-columna?id=` con solo `{targetColumnaId}`.

---

## Requirements modificados

---

### REQ-5b (CRITICO) — fichaSchema response: campos exactos de FichaResponse

**Modifica:** Requirement "Listar fichas del tablero" en la spec canonica.

El sistema MUST NOT declarar `responsableId`, `creadoPor`, `creadoEn` en `fichaSchema`. Los campos de `FichaResponse.java` son exactamente: `id`, `columnaId`, `tipoFicha`, `tratoId`, `tareaId`, `actualizadoEn`.

**REQ-5b.1:** `fichaSchema` MUST incluir `actualizadoEn: z.string()` y MUST NOT incluir `responsableId`, `creadoPor`, ni `creadoEn`.

**REQ-5b.2:** El tipo `Ficha` exportado MUST ser `z.infer<typeof fichaSchema>`.

**REQ-5b.3:** `fichasFixture` y `FICHA_FIXTURE` en tests MUST tener la shape de `FichaResponse` (sin campos fantasma).

#### Scenario: fichaSchema.parse() exitoso con la shape real de FichaResponse [unit test]

- GIVEN la respuesta real del back `{ id, columnaId, tipoFicha, tratoId, tareaId, actualizadoEn }` (sin responsableId, creadoPor, creadoEn)
- WHEN se invoca `fichaSchema.parse(response)`
- THEN no lanza error

#### Scenario: fichaSchema.parse() con campos extra los ignora (Zod strips) [unit test]

- GIVEN `{ id, columnaId, tipoFicha, tratoId, tareaId, actualizadoEn, responsableId: 'x', creadoPor: 'x' }` (campos extra)
- WHEN se invoca `fichaSchema.parse(input)`
- THEN Zod strips los campos desconocidos — parse exitoso

---

### REQ-5a — fichaCreate/EditSchema: sin campos que el back ignora

**Modifica:** Requirement "Crear ficha de trato" y "Crear ficha de tarea" en la spec canonica.

El sistema MUST NOT incluir `responsableId` ni `creadoPor` en `fichaCreateSchema`. El sistema MUST NOT incluir `responsableId` en `fichaEditSchema`. Los unicos campos de `CreateFichaRequest`/`EditFichaRequest` son: `columnaId`, `tipoFicha`, `tratoId`, `tareaId`.

**REQ-5a.1:** `fichaCreateSchema` MUST NOT tener `responsableId` ni `creadoPor`.

**REQ-5a.2:** `fichaEditSchema` MUST NOT tener `responsableId`.

**REQ-5a.3:** `useAutoFicha` MUST NOT enviar `responsableId` ni `creadoPor` en el payload.

**REQ-5a.4:** El mock MSW `POST /api/fichas/create` MUST construir la respuesta acorde a `FichaResponse` (sin `responsableId`/`creadoPor`/`creadoEn`).

#### Scenario: useAutoFicha crea ficha sin responsableId ni creadoPor en el body [integration test]

- GIVEN `useAutoFicha` ejecuta `crearFichaPara({ id: 'uuid-trato' })`
- WHEN el HTTP POST llega al mock MSW
- THEN `capturedBody` NO contiene `responsableId` ni `creadoPor`
- AND la respuesta del mock tiene shape `{id, columnaId, tipoFicha, tratoId, tareaId, actualizadoEn}`

#### Scenario: fichaCreateSchema no requiere responsableId [unit test]

- GIVEN `{ columnaId: 'c1', tipoFicha: 'TRATO', tratoId: 't1', tareaId: null }`
- WHEN se invoca `fichaCreateSchema.safeParse(input)`
- THEN `success: true`

---

### REQ-1 — reordenar-columnas: serializacion ColumnaId

**Modifica:** Requirement "Reordenar columnas del tablero" en la spec canonica.

El front MUST transformar `nuevoOrden: string[]` a `nuevoOrden: Array<{value: string}>` antes de enviarlo al back. Esto se debe a que `ReordenarColumnasRequest.java` usa `List<ColumnaId>` donde `ColumnaId = record(UUID value)` sin `@JsonValue`/`@JsonCreator`.

**Nota cross-team:** La limpieza long-term es que el back agregue `@JsonValue` a `ColumnaId.value()`, lo que permitiria al front enviar `string[]` directamente. Esta tarea esta pendiente en el back-team.

**REQ-1.1:** `useReordenarColumnas` MUST transformar `nuevoOrden.map(id => ({ value: id }))` antes de enviarlo.

**REQ-1.2:** El mock MSW `PUT /api/tableros/reordenar-columnas` MUST aceptar `body.nuevoOrden` como `Array<{value: string}>` y extraer `item.value` para reordenar.

**REQ-1.3:** El test MUST verificar que `capturedBody.nuevoOrden[0]` es `{value: uuid}`, NO `uuid` plano.

#### Scenario: useReordenarColumnas envia nuevoOrden como Array<{value}> [hook test]

- GIVEN `reordenar({ tableroId, nuevoOrden: ['col-c','col-a','col-b'], idsActuales: [...] })` se invoca
- WHEN el body HTTP llega al mock MSW
- THEN `capturedBody.nuevoOrden[0]` es `{ value: 'col-c' }` (NO `'col-c'`)
- AND el mock procesa correctamente y devuelve el tablero reordenado

---

### REQ-6 — fichas drag: endpoint dedicado mover-columna con optimistic update

**Modifica:** Requirement "Mover ficha entre columnas con drag and drop" en la spec canonica.

El sistema MUST usar `PUT /api/fichas/mover-columna?id={fichaId}` con body `{ targetColumnaId: uuid }` para mover fichas entre columnas (drag-and-drop). MUST NOT usar `PUT /fichas/edit` para el drag. El hook MUST implementar optimistic update con rollback en onError.

**REQ-6.1:** `endpoints.fichas` MUST incluir `moverColumna: (id: string) => /fichas/mover-columna?id=${id}`.

**REQ-6.2:** MUST existir un hook `useMoverFicha` que:
- Acepta `{ fichaId: string; targetColumnaId: string }`
- Envia `PUT /api/fichas/mover-columna?id={fichaId}` con body `{ targetColumnaId: uuid }`
- Aplica optimistic update sobre el query cache `['fichas']` en `onMutate`
- Revierte el cache en `onError`
- Invalida `['fichas']` en `onSuccess`
- Muestra `toast.error` en `onError` (excepto 422)

**REQ-6.3:** `buildDragEndHandler` en `KanbanBoard` MUST usar la firma `{ fichaId: string; targetColumnaId: string }`.

**REQ-6.4:** El mock MSW MUST incluir `PUT /api/fichas/mover-columna` que lee `id` de querystring y `targetColumnaId` de body.

#### Scenario: Drag exitoso invoca useMoverFicha con fichaId y targetColumnaId [integration test]

- GIVEN una ficha `h1` en columna `col-a`, el usuario la arrastra a `col-b`
- WHEN `handleDragEnd` detecta el drop en `col-b`
- THEN se invoca `useMoverFicha.mutate({ fichaId: 'h1', targetColumnaId: 'col-b' })`
- AND el body HTTP es `{ targetColumnaId: 'col-b' }` a `PUT /api/fichas/mover-columna?id=h1`

#### Scenario: Optimistic update mueve la ficha antes de la respuesta [hook test]

- GIVEN `queryClient` tiene `['fichas']` con `[{ id: 'h1', columnaId: 'col-a', ... }]`
- WHEN `useMoverFicha.mutate({ fichaId: 'h1', targetColumnaId: 'col-b' })` se invoca
- THEN inmediatamente (antes de que el servidor responda) `queryClient.getQueryData(['fichas'])[0].columnaId === 'col-b'`

#### Scenario: Rollback en onError revierte el cache [hook test]

- GIVEN el servidor responde 500
- WHEN la mutacion falla
- THEN `queryClient.getQueryData(['fichas'])[0].columnaId` vuelve a `'col-a'` (revertido)

#### Scenario: onSuccess invalida ['fichas'] [hook test]

- GIVEN el servidor responde 200
- WHEN la mutacion tiene exito
- THEN `queryClient.invalidateQueries` se llama con `{ queryKey: ['fichas'] }`

---

### REQ-FichaForm — FichaForm: sin selector responsable muerto

**Nuevo requirement** (no existia en la spec canonica previa).

El sistema MUST NOT renderizar un selector de responsable en `FichaForm`. El campo `responsableId` MUST NOT existir en el schema local de `FichaForm` ni en sus `defaultValues`. La creacion de fichas no requiere seleccionar un responsable — ese dato pertenece a `Trato`/`Tarea`, no a `Ficha`.

#### Scenario: FichaForm no renderiza selector de responsable [component test]

- WHEN se renderiza `FichaForm`
- THEN no existe ningun `FormField` con `name="responsableId"` ni label relacionado a "responsable"
- AND no se invoca `useUsuarios()` desde el form

---

## API Contract Reference (delta — back real verificado)

| Metodo | Path | Descripcion | Item |
|--------|------|-------------|------|
| PUT | `/api/fichas/mover-columna?id={fichaId}` | Mueve ficha entre columnas. Body: `{targetColumnaId: UUID}`. Response: FichaResponse. | 6 |
| PUT | `/api/tableros/reordenar-columnas?id={tableroId}` | Body: `{nuevoOrden: Array<{value: UUID}>}`. ColumnaId es `record(UUID value)`. | 1 |

**FichaResponse (back real — `FichaResponse.java`)**:
```
{ id: UUID, columnaId: UUID, tipoFicha: TipoFicha, tratoId: UUID|null, tareaId: UUID|null, actualizadoEn: LocalDateTime }
```
Campos NO presentes: `responsableId`, `creadoPor`, `creadoEn`.

**CreateFichaRequest / EditFichaRequest**:
```
{ columnaId: UUID @NotNull, tipoFicha: TipoFicha @NotNull, tratoId: UUID|null, tareaId: UUID|null }
```
Campos ignorados por Jackson (no en el record): `responsableId`, `creadoPor`.

---

## Out of Scope (este delta)

- `fichas/get-by-id` — diferido a Change 2.
- Edicion de fichas desde UI completa.
- `KanbanColumn` ordenamiento server-side.
