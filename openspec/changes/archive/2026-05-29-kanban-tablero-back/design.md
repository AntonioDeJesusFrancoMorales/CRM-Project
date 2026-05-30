# Design: Kanban de Tratos backed por el contrato real del back

## Technical Approach

Feature-flat `src/features/kanban/` (ADR-040): `schemas/`, `hooks/`, `components/`, `pages/`, `__tests__/`. Schemas zod alineados 1:1 al contrato RPC del back (verificado contra Java). Render del tablero = 2 llamadas (`tableros/get-by-id?id=` para estructura + `fichas/get-all` filtrado client-side por `columnaId`). El estado del trato se DERIVA cruzando `ficha.tratoId → ficha.columnaId → columnaTablero.estadoTrato`. Mover ficha = `PUT /api/fichas/edit?id=` cambiando `columnaId` (no hay endpoint dedicado). DnD con `@dnd-kit/core` (re-instalar; hoy NO está en package.json). MSW reescrito al patrón RPC `?id=`. W1 resuelto reusando la derivación en ContactoDetailPage.

## Enums confirmados contra Java (fuente de verdad)

| Enum | Valores EXACTOS | Archivo Java |
|------|-----------------|--------------|
| `TipoTablero` | `TAREAS`, `TRATOS` | `domain/.../enums/TipoTablero.java` |
| `TipoFicha` | `TRATO`, `TAREA` | `enums/TipoFicha.java` |
| `TipoColumna` | `PREDETERMINADA`, `PERSONALIZADA` | `enums/TipoColumna.java` |
| `TipoEstadoColumnaTableroTrato` | `ABIERTO`, `GANADO`, `PERDIDO` | `enums/TipoEstadoColumnaTableroTrato.java` |
| `TipoEstadoColumnaTableroTarea` | `PENDIENTE`, `EN_CURSO`, `FINALIZADA` | `enums/TipoEstadoColumnaTableroTarea.java` |

## Architecture Decisions

| Decisión | Opción elegida | Alternativa | Rationale |
|----------|---------------|-------------|-----------|
| Ubicación de tipos | Schemas zod en `kanban/schemas/` con `z.infer`; tipos viejos inventados eliminados de `api/types.ts` | Tipos manuales en `api/types.ts` | Tratos ya usa schema-as-source-of-truth; `Tablero/Columna/Ficha` inventados en `api/types.ts` (líneas 113-136) están obsoletos y deben borrarse junto con `TipoFicha` viejo (`'trato'|'tarea'`) |
| Cache D2 (fichas) | queryKey plana compartida `['fichas']`; UNA query `useFichas()` consumida por Kanban y W1 | Query separada por tablero | Back no filtra fichas por tablero (`get-all` devuelve todas); filtrar client-side. Cache única = W1 reusa la misma sin red extra |
| Mover ficha | `useUpdateFicha` (PUT edit con `columnaId` nuevo) + invalidación de `['fichas']`. SIN optimistic en v1 | Optimistic update | Simplicidad; el back es idempotente al mover. Optimistic queda como mejora futura (riesgo de rollback en DnD) |
| Orden intra-columna | Derivado estable por `creadoEn` ASC (campo confirmado en `FichaResponse`) | `valorEstimado` (vive en Trato, no en Ficha) | `creadoEn` existe en `FichaResponse`; no requiere join con Trato. Orden NO se persiste |
| Derivación estado | Util pura `deriveEstadoTrato(tratoId, fichas, columnas)` en `kanban/lib/` | Lógica inline en page | Reusable por Kanban y W1; testeable aislada |
| DnD scope | `@dnd-kit/core` drag solo ENTRE columnas | Reordenar intra-columna | Back no persiste posición de ficha; reordenar no tendría dónde guardarse |

## Data Flow

```
KanbanPage
  ├─ useTablero(id)  ─GET /tableros/get-by-id?id=─→  columnas[] (estructura + estadoTrato)
  └─ useFichas()     ─GET /fichas/get-all────────→  fichas[]  (cache ['fichas'])
        │
        ▼ agrupar client-side por ficha.columnaId, orden por creadoEn ASC
   KanbanColumn[] ──renderiza──→ KanbanCard[] (1 por ficha TRATO)
        │
   onDragEnd(fichaId, columnaIdDestino) ──→ useUpdateFicha ──PUT /fichas/edit?id=──→ invalidate ['fichas']

ContactoDetailPage (W1)
   useFichas() (mismo cache) + useTablero(TRATOS) → deriveEstadoTrato → tieneTratosActivos
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/features/kanban/schemas/tablero.schema.ts` | Create | `tableroSchema`, `columnaTableroSchema`, enums |
| `src/features/kanban/schemas/columna.schema.ts` | Create | `columnaSchema` (catálogo) |
| `src/features/kanban/schemas/ficha.schema.ts` | Create | `fichaSchema`, `fichaCreateSchema`, `fichaEditSchema`, `tipoFicha` enum |
| `src/features/kanban/hooks/useTableros.ts` | Create | `tablerosKeys` + `useTableros()` |
| `src/features/kanban/hooks/useTablero.ts` | Create | `useTablero(id)` |
| `src/features/kanban/hooks/useColumnas.ts` | Create | `useColumnas()` catálogo |
| `src/features/kanban/hooks/useFichas.ts` | Create | `fichasKeys` + `useFichas()` |
| `src/features/kanban/hooks/useCreateFicha.ts` | Create | POST create |
| `src/features/kanban/hooks/useUpdateFicha.ts` | Create | PUT edit (incluye mover) |
| `src/features/kanban/hooks/useDeleteFicha.ts` | Create | DELETE |
| `src/features/kanban/hooks/useAsignarColumna.ts` | Create | POST asignar-columna |
| `src/features/kanban/hooks/useReordenarColumnas.ts` | Create | PUT reordenar-columnas |
| `src/features/kanban/lib/deriveEstadoTrato.ts` | Create | Util de derivación pura |
| `src/features/kanban/components/KanbanBoard.tsx` | Create | DndContext + columnas |
| `src/features/kanban/components/KanbanColumn.tsx` | Create | Droppable; muestra limiteWip/totalValorEstimado |
| `src/features/kanban/components/KanbanCard.tsx` | Create | Draggable; tarjeta de ficha/trato |
| `src/features/kanban/pages/KanbanPage.tsx` | Create | Orquesta queries + board |
| `src/features/kanban/__tests__/` | Create | Tests schema + deriveEstadoTrato |
| `src/api/endpoints.ts` | Modify | + `tableros`, `columnas`, `fichas` |
| `src/api/types.ts` | Modify | Borrar `Tablero/Columna/Ficha/TipoFicha` inventados (113-136) |
| `src/mocks/fixtures/tableros.ts` | Modify | Reescribir al shape RPC real |
| `src/mocks/handlers/tableros.ts` | Modify | Reescribir a rutas RPC `?id=` |
| `src/features/contactos/pages/ContactoDetailPage.tsx` | Modify | Fix W1 |
| `src/features/contactos/hooks/useTransicionEstado.ts` | Modify | Actualizar comentario (estado derivado) |
| `src/components/layout/Sidebar.tsx` | Modify | Habilitar Tableros (quitar disabled/badge) |
| `src/routes/placeholders.tsx` | Modify | Quitar `TablerosPlaceholder` |
| `package.json` | Modify | + `@dnd-kit/core` |

## Interfaces / Contracts — Schemas zod (campos + tipos)

```ts
// enums
tipoTablero = z.enum(['TAREAS', 'TRATOS'])
tipoFicha   = z.enum(['TRATO', 'TAREA'])
tipoColumna = z.enum(['PREDETERMINADA', 'PERSONALIZADA'])
estadoTrato = z.enum(['ABIERTO', 'GANADO', 'PERDIDO'])

// ColumnaTableroDto (embedded en TableroResponse)
columnaTableroSchema = {
  id: string,            // = columnaId del catálogo (gotcha confirmado)
  nombre: string,
  color: string,
  limiteWip: number.int.nullable(),
  nota: string.nullable(),
  estadoTarea: string.nullable(),       // null en tablero TRATOS
  estadoTrato: estadoTrato.nullable(),  // ABIERTO|GANADO|PERDIDO
  totalValorEstimado: number,           // BigDecimal → number
}

// TableroResponse
tableroSchema = {
  id, nombre, descripcion: string, tipoTablero,
  columnas: columnaTableroSchema[],
  creadoEn: string,                     // LocalDateTime
}

// ColumnaResponse (catálogo)
columnaSchema = { id, nombre, color, tipoTablero, tipoColumna }

// FichaResponse
fichaSchema = {
  id, columnaId, tipoFicha,
  tratoId: string.nullable(),
  tareaId: string.nullable(),
  responsableId, creadoPor,
  creadoEn: string, actualizadoEn: string,  // Instant
}

// CreateFichaRequest
fichaCreateSchema = { columnaId, tipoFicha, tratoId?, tareaId?, responsableId, creadoPor }
// EditFichaRequest (SIN creadoPor — inmutable)
fichaEditSchema   = { columnaId, tipoFicha, tratoId?, tareaId?, responsableId }
```

## Contratos de hooks (input → output / método / endpoint / queryKey)

| Hook | Método + Endpoint | Input | Output | queryKey |
|------|-------------------|-------|--------|----------|
| `useTableros()` | GET `/tableros/get-all` | — | `Tablero[]` | `['tableros']` |
| `useTablero(id?)` | GET `/tableros/get-by-id?id=` | `id` | `Tablero` | `['tableros', id]` |
| `useColumnas()` | GET `/columnas/get-all` | — | `Columna[]` | `['columnas']` |
| `useFichas()` | GET `/fichas/get-all` | — | `Ficha[]` | `['fichas']` |
| `useCreateFicha()` | POST `/fichas/create` | `FichaCreateInput` | `Ficha` | invalida `['fichas']` |
| `useUpdateFicha()` | PUT `/fichas/edit?id=` | `{id, data: FichaEditInput}` | `Ficha` | invalida `['fichas']` |
| `useDeleteFicha()` | DELETE `/fichas/delete?id=` | `id` | 204 | invalida `['fichas']` |
| `useAsignarColumna()` | POST `/tableros/asignar-columna?id=&columnaId=` | `{tableroId, columnaId, data: AsignarColumnaInput}` | `Tablero` | invalida `['tableros', id]` |
| `useReordenarColumnas()` | PUT `/tableros/reordenar-columnas?id=` | `{tableroId, nuevoOrden: string[]}` | `Tablero` | invalida `['tableros', id]` |

`AsignarColumnaInput = { limiteWip: number≥1, nota?: string≤500, estadoTarea?, estadoTrato?, totalValorEstimado: number }` (totalValorEstimado @NotNull en Java).

## Estrategia de derivación de estado

```ts
// kanban/lib/deriveEstadoTrato.ts
function deriveEstadoTrato(
  tratoId: string, fichas: Ficha[], columnas: ColumnaTablero[]
): EstadoTrato | null {
  const ficha = fichas.find(f => f.tipoFicha === 'TRATO' && f.tratoId === tratoId);
  if (!ficha) return null;
  const col = columnas.find(c => c.id === ficha.columnaId);
  return col?.estadoTrato ?? null;
}
```
W1: `tieneTratosActivos = tratosDelContacto.some(t => deriveEstadoTrato(t.id, fichas, columnas) === 'ABIERTO')`.

## Integración @dnd-kit

`KanbanBoard` envuelve en `<DndContext onDragEnd={handle}>`. Cada `KanbanColumn` es `useDroppable({ id: columnaId })`; cada `KanbanCard` es `useDraggable({ id: fichaId })`. `onDragEnd`: si `over.id !== fichaColumnaActual` → `useUpdateFicha({ id: fichaId, data: { ...fichaActual, columnaId: over.id } })` (necesita estado COMPLETO de la ficha; el edit reenvía todos los campos). Límite WIP: si la columna destino tiene `fichas.length >= limiteWip`, bloquear en UI (no soltar) y toast — el back NO expone validación WIP en el contrato leído (NO CONFIRMADO que la rechace server-side).

## Plan MSW (drop-in al contrato back)

Reescribir `fixtures/tableros.ts` con un fixture `tableroTratosFixture` (TableroResponse con 4 columnas: ABIERTO×2/GANADO/PERDIDO), `columnasFixture` (catálogo) y `fichasFixture` (FichaResponse con `tipoFicha: 'TRATO'`, `tratoId` apuntando a `tratosFixture`). Handlers siguen el estilo de `handlers/tratos.ts`: rutas explícitas, `id` por `url.searchParams.get('id')`, sin path params. Endpoints: `tableros/{get-all,get-by-id,asignar-columna,reordenar-columnas}`, `columnas/get-all`, `fichas/{get-all,create,edit,delete}`. El edit de ficha hace merge de `columnaId` (igual que tratos edit).

## Testing Strategy

| Layer | Qué | Cómo |
|-------|-----|------|
| Unit | `deriveEstadoTrato` (ABIERTO/null/sin ficha) | Vitest puro |
| Unit | Schemas zod (parse válido/inválido, enums) | Vitest + `.safeParse` |
| Integration | mover ficha → invalida cache; W1 deriva activos | RTL + MSW handlers |

## Migration / Rollout

Aditivo. Rollback = revertir commit (restaura `TablerosPlaceholder`, Sidebar disabled, W1 a `length>0`). Re-instalar `@dnd-kit/core`.

## Open Questions / NO CONFIRMADO

- [ ] Validación WIP server-side: el back NO la expone en el contrato leído. Asumimos enforcement solo UI.
- [ ] `responsableId`/`creadoPor` para `useCreateFicha`: de dónde sale el usuario actual (auth fuera de alcance) — definir mock/constante en tasks.
- [ ] Cómo se selecciona el tablero TRATOS en W1 si hubiera varios: asumir el primero `tipoTablero === 'TRATOS'` (NO CONFIRMADO que sea único).
- [ ] `totalValorEstimado` en mover ficha: el edit de Ficha NO lo toca (es de la columna); confirmado que `EditFichaRequest` no lo incluye.
