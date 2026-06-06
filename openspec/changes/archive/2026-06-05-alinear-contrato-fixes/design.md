# Design: alinear-contrato-fixes (Change 1)

## Technical Approach

Este change no introduce arquitectura nueva — aplica correcciones de contrato sobre patrones ya establecidos (schemas Zod, hooks TanStack Query, handlers MSW). Las unicas decisiones arquitectonicas no triviales son: (1) el wrapping de `ColumnaId` en el front mientras el back no agrega `@JsonValue`, (2) la eliminacion del `fichaSchema` de campos que el back no devuelve, y (3) la creacion de `useMoverFicha` como el primer hook de kanban con optimistic update completo.

## Decision 1 — Wrapping de ColumnaId en el front (item 1)

**Decision:** El front transforma `nuevoOrden.map(id => ({ value: id }))` dentro del `mutationFn` de `useReordenarColumnas`.

**Rationale:** `ColumnaId = record(UUID value)` en el back sin `@JsonValue`/`@JsonCreator` → Jackson usa el nombre del campo del record como clave JSON. La alternativa correcta long-term es que el back agregue `@JsonValue` al accessor `value()` del record para que Jackson serialice/deserialice como un string plano, eliminando la necesidad del wrapper. Esto requiere coordinacion con el back-team.

**Nota en el codigo:** se agrego un comentario en `useReordenarColumnas.ts` documentando esta decision y mencionando la limpieza pendiente del back.

**Impacto en el mock MSW:** el handler de `reordenar-columnas` extrae `item.value` de cada elemento del body.

---

## Decision 2 — `fichaSchema` response: eliminar 3 campos, no agregar los correctos del back

**Decision:** El schema de respuesta queda como `{id, columnaId, tipoFicha, tratoId, tareaId, actualizadoEn}`. NO se intenta rellenar `responsableId`/`creadoPor` de otra fuente.

**Rationale:** Esos datos ahora viven en `Trato`/`Tarea` respectivamente segun el comentario en `FichaCommandMapper.java`. El kanban no los necesita para renderizar fichas. El `buildDragEndHandler` que leia `ficha.responsableId` para reenviarla al edit ya no es necesario — la nueva ruta `mover-columna` solo necesita `targetColumnaId`.

---

## Decision 3 — useMoverFicha con optimistic update

**Decision:** Implementar optimistic update en `useMoverFicha` siguiendo el patron estandar de TanStack Query: `onMutate` → snapshot + update cache, `onError` → rollback con snapshot, `onSuccess` → invalidate.

**Rationale:** El drag-and-drop tiene expectativa visual inmediata. El back es el autorizado — en `onSuccess` siempre se invalida para asegurar coherencia con el servidor. `useUpdateFicha` NO implemento optimistic update (v1 simple); `useMoverFicha` es el primer hook de kanban con esta capacidad, documentado como patron de referencia.

**Query keys afectadas:** `fichasKeys.all` = `['fichas']`. No hay key por tablero para fichas — el filtro es client-side.

**Secuencia (mover-columna con optimistic update):**

```
Usuario arrastra ficha h1 de col-a a col-b
         │
         ▼
buildDragEndHandler detecta cross-column drop
         │
         ▼
useMoverFicha.mutate({ fichaId: 'h1', targetColumnaId: 'col-b' })
         │
         ▼
onMutate:
  snapshot = queryClient.getQueryData(['fichas'])
  queryClient.setQueryData(['fichas'], fichas.map(f =>
    f.id === 'h1' ? { ...f, columnaId: 'col-b' } : f
  ))
  return { snapshot }   ← context para rollback
         │
         ▼
HTTP: PUT /api/fichas/mover-columna?id=h1
      body: { targetColumnaId: 'col-b' }
         │
    ┌────┴────┐
 200 OK     error
    │           │
    ▼           ▼
onSuccess:  onError:
  invalidate   queryClient.setQueryData(['fichas'], context.snapshot)
  ['fichas']   toast.error(msg) [salvo 422]
```

---

## Decision 4 — `buildDragEndHandler` cambio de firma

**Decision:** Cambiar la firma del `mutate` en `DragEndHandlerParams` de `(vars: { id: string; data: FichaEditInput }) => void` a `(vars: { fichaId: string; targetColumnaId: string }) => void`.

**Rationale:** Ahora el handler solo necesita el ID de la ficha y el ID de la columna destino. El `FichaEditInput` completo ya no se requiere (no se envia al back). El nombre `fichaId` es mas explicito que `id`.

---

## Decision 5 — `useUpdateFicha` despues del cambio

**Decision:** `useUpdateFicha` se mantiene para ediciones generales de fichas (cambiar `tipoFicha`, `tratoId`, `tareaId`) con el schema `fichaEditSchema` ya corregido (sin `responsableId`). El drag pasa a `useMoverFicha`. `useUpdateFicha` queda con invalidacion simple (sin optimistic update).

---

## Decision 6 — FichaForm: eliminar selector responsable muerto (W1 cleanup)

**Decision:** El selector de responsable en `FichaForm` era un campo muerto — `FichaCreateDialog.handleSubmit` lo descartaba antes del HTTP call. Se elimino el campo completo: import `useUsuarios`, campo `responsableId` del schema local, `FormField` Responsable, y `useUsuarios()` call.

**Rationale:** Un selector que no tiene efecto en el back introduce deuda cognitiva y contradice el contrato limpio. Investigado antes de eliminar: no habia otra ruta que consumiera el valor.

---

## TanStack Query Keys

| Key | Uso |
|-----|-----|
| `['fichas']` | Query de todas las fichas (useFichas). Invalidada por: useMoverFicha, useCreateFicha, useUpdateFicha, useDeleteFicha |
| `['tableros', tableroId]` | Query de tablero individual. Invalidada por useReordenarColumnas |

No se crean keys nuevas. `useMoverFicha` opera sobre `['fichas']`.

---

## MSW Handler Shapes (back real)

### POST /api/fichas/create — CreateFichaRequest

```typescript
// Request body (back acepta):
{ columnaId: string, tipoFicha: 'TRATO'|'TAREA', tratoId: string|null, tareaId: string|null }

// Response (FichaResponse):
{ id: string, columnaId: string, tipoFicha: 'TRATO'|'TAREA', tratoId: string|null, tareaId: string|null, actualizadoEn: string }
```

### PUT /api/fichas/mover-columna?id={fichaId} — NUEVO

```typescript
// Request body (MoverColumnaRequest.java):
{ targetColumnaId: string }  // @NotNull UUID

// Response (FichaResponse):
{ id, columnaId, tipoFicha, tratoId, tareaId, actualizadoEn }
```

### PUT /api/tableros/reordenar-columnas?id={tableroId} — ReordenarColumnasRequest

```typescript
// Request body (ReordenarColumnasRequest.java → List<ColumnaId>):
{ nuevoOrden: Array<{ value: string }> }  // ColumnaId = record(UUID value)
// Response: TableroResponse completo
```

---

## Tipo Ficha despues del cambio

```typescript
// fichaSchema despues de REQ-5b:
export const fichaSchema = z.object({
  id: z.string(),
  columnaId: z.string(),
  tipoFicha,
  tratoId: z.string().nullable(),
  tareaId: z.string().nullable(),
  actualizadoEn: z.string(),
});
// Campos ELIMINADOS: responsableId, creadoPor, creadoEn
```

---

## File Changes

| Archivo | Accion | Descripcion |
|---------|--------|-------------|
| `src/features/kanban/schemas/ficha.schema.ts` | Modify | fichaSchema sin responsableId/creadoPor/creadoEn; fichaCreate/EditSchema limpios |
| `src/features/empresas/schemas/empresa.schema.ts` | Modify | `paginaWeb` camelCase |
| `src/features/tareas/schemas/tarea.schema.ts` | Modify | tareaUpdateSchema sin .partial(), 5 campos required |
| `src/features/usuarios/schemas/usuario.schema.ts` | Modify | nombre y correo required |
| `src/mocks/fixtures/tableros.ts` | Modify | fichasFixture sin responsableId/creadoPor/creadoEn |
| `src/mocks/handlers/tableros.ts` | Modify | create handler limpio; reordenar acepta `[{value}]`; nuevo handler mover-columna |
| `src/api/endpoints.ts` | Modify | `fichas.moverColumna(id)` agregado |
| `src/features/kanban/hooks/useAutoFicha.ts` | Modify | payload sin responsableId/creadoPor |
| `src/features/kanban/hooks/useReordenarColumnas.ts` | Modify | `nuevoOrden.map(id => ({value: id}))` |
| `src/features/kanban/hooks/useMoverFicha.ts` | Create | PUT /fichas/mover-columna con optimistic update + rollback |
| `src/features/kanban/components/KanbanBoard.tsx` | Modify | buildDragEndHandler rewired a useMoverFicha |
| `src/features/kanban/components/KanbanColumn.tsx` | Modify | sortByFechaAsc usa `actualizadoEn` (no `creadoEn`) |
| `src/features/kanban/components/FichaCreateDialog.tsx` | Modify | payload sin responsableId/creadoPor |
| `src/features/kanban/components/FichaForm.tsx` | Modify | W1: selector responsable eliminado |
| `src/features/empresas/components/EmpresaForm.tsx` | Modify | paginaWeb en name y EMPTY_DEFAULTS |
| `src/features/empresas/components/EmpresaFormDialog.tsx` | Modify | paginaWeb |
| `src/features/tareas/components/TareaEditDialog.tsx` | Modify | responsableId incluido en updateData |
| `src/features/tareas/hooks/useCrearTareaConFicha.ts` | Modify | responsableId removido de crearFichaPara |
| `src/features/tratos/hooks/useCrearTratoConFicha.ts` | Modify | responsableId removido de crearFichaPara |

---

## Testing Strategy

| Capa | Que | Enfoque |
|------|-----|---------|
| Unit | fichaSchema parse con shape real del back | Strict TDD: test RED primero |
| Unit | fichaCreate/EditSchema sin responsableId | idem |
| Unit | empresa schema paginaWeb camelCase | idem |
| Unit | tareaUpdateSchema campos required | idem |
| Unit | usuarioUpdateSchema nombre/correo required | idem |
| Hook | useMoverFicha: PUT, optimistic update, rollback, invalidation | 4 tests nuevos |
| Hook | useReordenarColumnas: body como `[{value}]` | test sobre capturedBody |
| Hook | useAutoFicha: body sin responsableId/creadoPor | test sobre capturedBody |

---

## Open Questions

Ninguna. Todas las decisiones D1-D6 cerradas.
