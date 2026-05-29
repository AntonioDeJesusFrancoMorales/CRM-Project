# Exploración: kanban-crud-ui (Change 5)

**Fecha**: 2026-05-29
**Artifact store**: hybrid (openspec + engram)
**Base**: feat/kanban-tablero-back (Change 4 archivado, commit 6f2d400, 485/485 tests verdes)

---

## 1. Estado actual del feature kanban — inventario de archivos

### Capa existente (COMPLETA y testeada)

| Archivo | Estado | Notas |
|---|---|---|
| `schemas/tablero.schema.ts` | ✅ DONE | `Tablero`, `ColumnaTablero`, enums `tipoTablero/tipoColumna/estadoTrato` |
| `schemas/ficha.schema.ts` | ✅ DONE | `Ficha`, `FichaCreateInput`, `FichaEditInput`, enum `tipoFicha` |
| `schemas/columna.schema.ts` | ✅ DONE | `Columna` (catálogo), reutiliza enums de tablero.schema |
| `hooks/useTableros.ts` | ✅ DONE | GET /tableros/get-all, queryKey `['tableros']` |
| `hooks/useTablero.ts` | ✅ DONE | GET /tableros/get-by-id?id=, queryKey `['tableros', id]` |
| `hooks/useFichas.ts` | ✅ DONE | GET /fichas/get-all, queryKey `['fichas']` |
| `hooks/useColumnas.ts` | ✅ DONE | GET /columnas/get-all, queryKey `['columnas']` |
| `hooks/useCreateFicha.ts` | ✅ DONE | POST /fichas/create, invalida `['fichas']` |
| `hooks/useUpdateFicha.ts` | ✅ DONE | PUT /fichas/edit?id=, invalida `['fichas']` |
| `hooks/useDeleteFicha.ts` | ✅ DONE | DELETE /fichas/delete?id=, invalida `['fichas']` |
| `hooks/useAsignarColumna.ts` | ✅ DONE | POST /tableros/asignar-columna?id=&columnaId=, invalida `['tableros', tableroId]` |
| `hooks/useReordenarColumnas.ts` | ✅ DONE | PUT /tableros/reordenar-columnas?id=, 4 guards validación cliente |
| `lib/deriveEstadoTrato.ts` | ✅ DONE | Util pura: tratoId → fichas → columnas → EstadoTrato \| null |
| `components/KanbanBoard.tsx` | ✅ DONE | DnD con @dnd-kit/core, buildDragEndHandler exportada |
| `components/KanbanColumn.tsx` | ✅ DONE | Droppable, badge estadoTrato, indicador WIP, sortByFechaAsc |
| `components/KanbanCard.tsx` | ✅ DONE | Draggable, muestra `ficha.tratoId ?? 'Sin trato'` (placeholder) |
| `pages/KanbanListPage.tsx` | ✅ DONE | Lista tableros TRATOS, filtro client-side |
| `pages/KanbanPage.tsx` | ✅ DONE | Vista tablero + fichas, 404→redirect |
| `mocks/fixtures/tableros.ts` | ✅ DONE | Fixtures completos (tablero, columnas, fichas, catálogo) |
| `mocks/handlers/tableros.ts` | ✅ DONE | Handlers MSW completos (tableros, columnas, fichas CRUD) |

### Lo que FALTA (5 scenarios PARTIAL del verify de Change 4)

| Componente faltante | Scenario PARTIAL | Dependencia |
|---|---|---|
| `FichaCreateDialog.tsx` | "tratoId requerido para ficha TRATO" + "Creación muestra ficha en columna" | `useCreateFicha` ✅ |
| `FichaDeleteDialog.tsx` | "Cancelar no invoca DELETE" | `useDeleteFicha` ✅ |
| UI en `KanbanCard.tsx` (botón abrir `FichaDeleteDialog`) | Sin acceso a eliminar desde la tarjeta | — |
| UI en `KanbanColumn.tsx` (botón quitar columna) | "Quitar columna invoca eliminar-columna" | Falta `useQuitarColumna` hook |
| UI en `KanbanPage.tsx` o `KanbanBoard.tsx` (botón asignar columna / reordenar) | "Asignar columna desde UI" | `useAsignarColumna` ✅, `useReordenarColumnas` ✅ |

**No existe aún ningún hook `useQuitarColumna`** — `useAsignarColumna` y `useReordenarColumnas` sí existen pero no hay hook que envuelva `DELETE /tableros/eliminar-columna`. Los endpoints sí están en `endpoints.ts`.

---

## 2. Contrato Java verificado (fuente de verdad)

### 2.1 CreateFichaRequest

```
POST /api/fichas/create
Body:
  columnaId    UUID    @NotNull
  tipoFicha    enum    @NotNull  (TRATO | TAREA)
  tratoId      UUID    nullable  (requerido si tipoFicha=TRATO — validado en domain)
  tareaId      UUID    nullable  (requerido si tipoFicha=TAREA — validado en domain)
  responsableId UUID  @NotNull
  creadoPor    UUID   @NotNull

Response: 201 FichaResponse
```

**Observación crítica**: `responsableId` y `creadoPor` son `UUID` en Java. El front usa `'MOCK_USER'` (string no-UUID) como placeholder. El back Java fallará la deserialización si el string no es UUID válido. Esto es un problema silencioso en dev (MSW acepta cualquier string) pero romperá con el back real.

### 2.2 EditFichaRequest

```
PUT /api/fichas/edit?id={UUID}
Body:
  columnaId    UUID    @NotNull
  tipoFicha    enum    @NotNull
  tratoId      UUID    nullable
  tareaId      UUID    nullable
  responsableId UUID  @NotNull

Response: 200 FichaResponse
```

### 2.3 DeleteFicha

```
DELETE /api/fichas/delete?id={UUID}
Response: 204 No Content
```

### 2.4 AsignarColumnaRequest

```
POST /api/tableros/asignar-columna?id={tableroId}&columnaId={columnaId}
Body:
  limiteWip           Integer  @NotNull @Min(1)  ← IMPORTANTE: mínimo 1, no 0
  nota                String   @Size(max=500)     nullable
  estadoTarea         enum     nullable
  estadoTrato         enum     nullable  (ABIERTO|GANADO|PERDIDO)
  totalValorEstimado  BigDecimal @NotNull

Response: 201 TableroResponse
```

**Discrepancia encontrada**: `AsignarColumnaInput` del front declara `limiteWip: number` sin validación `@Min(1)`. El back rechaza `limiteWip = 0`. El schema Zod de `AsignarColumnaInput` necesita `.min(1)`.

### 2.5 EliminarColumna (no hay hook dedicado aún)

```
DELETE /api/tableros/eliminar-columna?id={tableroId}&columnaId={columnaId}
Response: 204 No Content (409 Conflict si la columna tiene fichas)
```

### 2.6 ReordenarColumnasRequest (ya confirmado en Change 4)

```
PUT /api/tableros/reordenar-columnas?id={tableroId}
Body: { nuevoOrden: UUID[] }
Response: 200 TableroResponse
```

### 2.7 Catálogo de Columnas

```
GET /api/columnas/get-all → ColumnaResponse[]
  id          UUID
  nombre      String   (NON-NULL — viene de Columna.getColumnanombre())
  color       String   (NON-NULL — viene de Columna.getColor())
  tipoTablero enum     (TAREAS | TRATOS)
  tipoColumna enum     (PREDETERMINADA | PERSONALIZADA)

POST /api/columnas/create
  superUsuarioId  UUID   (nullable en Java — Optional.ofNullable)
  nombre          String (sin @NotNull en el DTO, pero el domain lo requiere)
  color           String
  tipoTablero     enum
  tipoColumna     enum

PUT /api/columnas/edit?id=
  nombre      String
  color       String
  tipoTablero enum
  tipoColumna enum

DELETE /api/columnas/delete?id=
```

**Nota**: `CreateColumnaRequest.superUsuarioId` es `Optional.ofNullable(request.superUsuarioId())` en el mapper → nullable en práctica.

### 2.8 RESOLUCIÓN: nombre/color en ColumnaTableroDto — ¿@NotNull?

**Veredicto**: **SON NULLABLE** en el DTO de respuesta. La evidencia es `ColumnaTableroDto.fromDomain()`:

```java
columna != null ? columna.getColumnanombre() : null,
columna != null ? columna.getColor() : null,
```

El mapper hidrata la `Columna` del catálogo y si por algún motivo es `null` (columna eliminada del catálogo pero aún referenciada en el tablero), devuelve `null`. Por tanto el schema Zod actual (`nombre: z.string().nullable()`) es **CORRECTO**. El fallback en `KanbanColumn.tsx` (`columna.nombre ?? 'Sin nombre'`) es adecuado y debe mantenerse.

La sugerencia de Change 4 verify ("podrían ser non-nullable") era incorrecta — el contrato real puede enviar null. El schema actual es el correcto.

---

## 3. Patrón homologado de forms/dialogs en otras features

Todas las features (empresas, tratos) siguen el mismo patrón:

### Patrón create/edit dialog:
- **Radix `<Dialog>`** (`DialogContent`, `DialogHeader`, `DialogTitle`, `DialogDescription`)
- **`{Feature}Form`** separado (react-hook-form + zodResolver)
- Dialog wrapper (`{Feature}CreateDialog` o `{Feature}FormDialog`) que conecta mutation + serverErrors + onSuccess close
- Props del dialog: `open: boolean`, `onOpenChange: (open: boolean) => void`, `defaultValues?: Partial<...>`
- Server 422 errors se pasan como `serverErrors?: Array<{field: string; message: string}>`
- Submit button muestra "Guardando..." cuando `mutation.isPending`
- Cancel button: `disabled={isSubmitting}`

### Patrón delete dialog:
- **Radix `<AlertDialog>`** (`AlertDialogAction`, `AlertDialogCancel`, `AlertDialogFooter`)
- Action button con `className="bg-destructive text-destructive-foreground hover:bg-destructive/90"`
- Dos variantes:
  - **Presentacional** (TratoDeleteDialog): lógica de DELETE en el host (TratoDetailPage)
  - **Con hook interno** (EmpresaDeleteDialog): el hook vive en el dialog
- La variante preferida en Change 5 será la **con hook interno** (más autocontenida)

### Campos de selección:
- Radix `<Select>` con `<SelectTrigger>`, `<SelectContent>`, `<SelectItem>`
- Loading state: `disabled={isLoading}` + `placeholder="Cargando..."`
- Data: hooks existentes (e.g., `useTratos()`, `useColumnas()`)

### Estructura de archivos:
```
src/features/kanban/
  components/
    FichaCreateDialog.tsx     ← NUEVO (Dialog + FichaForm)
    FichaDeleteDialog.tsx     ← NUEVO (AlertDialog, hook interno)
    FichaForm.tsx             ← NUEVO (react-hook-form + zod)
    KanbanColumnHeader.tsx    ← POSIBLE refactor de KanbanColumn header
  schemas/
    ficha-form.schema.ts      ← POSIBLE schema dedicado al form (vs FichaCreateInput)
  hooks/
    useQuitarColumna.ts       ← NUEVO (DELETE /tableros/eliminar-columna)
```

---

## 4. Decisiones abiertas para el usuario

### D1: ¿Qué incluye el alcance de Change 5?

**Opciones**:
- **A — Ficha CRUD únicamente** (recomendado como mínimo):
  - `FichaCreateDialog`: formulario con selector de trato (de `useTratos`) + selector de columna + responsableId (MOCK_USER)
  - `FichaDeleteDialog`: diálogo AlertDialog en KanbanCard
  - **No incluye**: gestión de columnas (asignar/quitar/reordenar desde UI)
  - Esfuerzo: Medium (2–3 batches)

- **B — Ficha CRUD + gestión básica de columnas** (recomendado completo):
  - Todo lo de A más:
  - UI "Asignar columna" en KanbanPage (pick del catálogo + form `AsignarColumnaRequest`)
  - Botón "Quitar columna" en KanbanColumn header (con confirmación, maneja 409)
  - **No incluye**: reordenar columnas con drag (complejidad extra)
  - Esfuerzo: Medium-High (4–5 batches)

- **C — Ficha CRUD + gestión completa de columnas** (incluye reordenar con drag):
  - Todo lo de B más reordenar columnas arrastrando los headers
  - Esfuerzo: High (6–7 batches), requiere DnD en los headers de columna

- **D — Catálogo de columnas también** (CRUD de `Columna` del catálogo):
  - Incluye B + UI para `POST /columnas/create`, `PUT /columnas/edit`, `DELETE /columnas/delete`
  - `CreateColumnaRequest.superUsuarioId` es nullable en el back (no hay auth) → puede enviarse null/undefined
  - Esfuerzo: High (8–9 batches)

**Recomendación**: Opción **B** (Ficha CRUD + quitar/asignar columna). Cubre los 5 PARTIAL del verify y agrega valor real al usuario sin complejidad excesiva. Reordenar con drag queda para Change 6 si se desea.

---

### D2: ¿Qué hacer con MOCK_USER (responsableId / creadoPor)?

**Contexto**: `CreateFichaRequest.responsableId` y `creadoPor` son `@NotNull UUID` en Java. El back real fallará si se envía el string `'MOCK_USER'` (no es UUID válido). En el MSW dev esto no se nota porque el handler acepta cualquier string.

**Opciones**:
- **A — Exportar constante UUID fake** (recomendado): 
  - `export const MOCK_USER_ID = '00000000-0000-0000-0000-000000000001'`
  - Es UUID válido, no rompe el back real, fácil de reemplazar con auth
  - Ubicación: `src/features/kanban/lib/mockUser.ts` o `src/lib/mockUser.ts`
  
- **B — Selector de responsable en el form**:
  - Agregar `useUsuarios()` al `FichaCreateDialog` y mostrar un Select de responsable
  - Más correcto UX pero incrementa complejidad del form
  - `creadoPor` seguiría siendo MOCK hasta que haya auth real

- **C — Mantener 'MOCK_USER' string**:
  - Solo funciona con MSW; romperá con el back real
  - No recomendado

**Recomendación**: Opción **A** para `creadoPor` (inmutable, nunca se pedirá al usuario), opción **B** para `responsableId` (el responsable sí es campo lógico del form y ya existe en TratoForm).

---

### D3: ¿Cómo se selecciona el trato al crear una ficha?

**Contexto**: Al crear una `Ficha` de tipo TRATO, se necesita pasar un `tratoId`. La pregunta es qué tratos mostrar en el selector.

**Evidencia**: Los fixtures muestran que hay 5 tratos (`d1`–`d5`) y 3 fichas. Los tratos `d4` y `d5` no tienen ficha, pero `d1`–`d3` sí. El back no valida unicidad de tratoId en Ficha (puede haber dos fichas para el mismo trato en distintos tableros — no hay constraint documentado).

**Opciones**:
- **A — Mostrar TODOS los tratos** (más simple):
  - `useTratos()` → lista completa → `<Select>` con nombre del trato
  - No filtra los que ya tienen ficha
  - Riesgo: el usuario puede crear fichas duplicadas para el mismo trato

- **B — Mostrar solo tratos SIN ficha en el tablero actual** (recomendado):
  - Cruzar `useTratos()` + `useFichas()` (ya cacheado) y filtrar tratos cuyo id no aparece en ninguna ficha del tablero actual
  - Más correcto semánticamente
  - Complejidad: `const tratosDisponibles = tratos.filter(t => !fichas.some(f => f.tratoId === t.id && f.columnaId está en este tablero))`

- **C — Recibir tratoId como prop** (si se llama desde TratosListPage o TratoDetailPage):
  - El botón "Agregar al Kanban" viviría en la lista/detalle de tratos
  - El dialog recibe `tratoId` pre-fijado → no necesita selector
  - Requiere coordinar con otras features

**Recomendación**: Opción **B** o **C** según donde viva el botón "crear ficha". **Si el botón está en KanbanColumn** (dentro del tablero): opción B. **Si el botón está en TratosListPage/TratoDetailPage** (acción sobre el trato): opción C es más natural. Necesita decisión del usuario.

---

### D4: ¿Dónde vive el botón para crear/eliminar fichas?

**Opciones** para crear ficha:
- **A** — Botón "+" en el header de `KanbanColumn` → abre `FichaCreateDialog` con `columnaId` pre-fijado
- **B** — Botón "Agregar trato al Kanban" en `TratosListPage` o `TratoDetailPage` → dialog con selector de columna

**Opciones** para eliminar ficha:
- **A** — Botón "×" o menú contextual en `KanbanCard` (siempre visible o en hover)
- **B** — Menú dropdown en `KanbanCard` (Radix DropdownMenu ya instalado) con "Eliminar"

**Recomendación**: Crear ficha → Opción A (botón en columna, flujo natural del Kanban). Eliminar ficha → Opción B (dropdown, más limpio visualmente y evita clics accidentales).

---

## 5. Hallazgos adicionales

### Hallazgo 1: KanbanCard muestra `ficha.tratoId` en bruto
El componente actual muestra `ficha.tratoId ?? 'Sin trato'` — un UUID. Change 5 debería mejorar esto mostrando el `nombre` del trato (cross-referencia con `useTratos()`). Es pequeño pero mejora mucho la UX.

### Hallazgo 2: `useQuitarColumna` no existe
El endpoint `DELETE /tableros/eliminar-columna` existe en `endpoints.ts` (como `eliminarColumna`), el handler MSW también existe, pero no hay hook dedicado. Change 5 necesita crearlo si incluye UI de gestión de columnas.

### Hallazgo 3: limiteWip @Min(1) en AsignarColumnaInput no está validado en Zod
`AsignarColumnaInput.limiteWip: number` no tiene validación de mínimo 1 en el schema actual. Si se construye un form para asignar columna, el Zod debe incluir `.min(1)`.

### Hallazgo 4: 409 Conflict al eliminar columna con fichas
`TableroController.eliminarColumna` devuelve 409 si la columna tiene fichas. El `useQuitarColumna` hook y el dialog de confirmación deben manejar este caso (no el genérico 422).

### Hallazgo 5: Columna catálogo vs contexto
`AsignarColumnaRequest` **no** lleva `nombre`/`color`/`tipoColumna` — esos datos vienen del catálogo. El form de "asignar columna" solo necesita: seleccionar una columna del catálogo (`useColumnas()`) + configurar `limiteWip`, `estadoTrato`, `nota`, `totalValorEstimado`.

---

## 6. Opciones de implementación

### Opción 1 — Ficha CRUD solo (alcance mínimo)
- **Pros**: menor esfuerzo, focalizado en los 5 PARTIAL del verify
- **Cons**: deja la gestión de columnas sin UI (limita utilidad del Kanban)
- **Effort**: Medium (3 batches)

### Opción 2 — Ficha CRUD + gestión columnas (alcance recomendado)
- **Pros**: Kanban completamente operativo desde la UI
- **Cons**: más batches, más componentes
- **Effort**: Medium-High (5 batches)

### Opción 3 — Ficha CRUD + gestión columnas + catálogo de columnas
- **Pros**: permite crear columnas personalizadas desde la UI
- **Cons**: scope creep, `CreateColumnaRequest.superUsuarioId` ambiguo sin auth
- **Effort**: High (7–8 batches)

**Recomendación**: Opción 2.

---

## 7. Riesgos

1. **MOCK_USER no es UUID válido**: romperá con el back real. Requiere fix antes del deploy.
2. **KanbanCard muestra UUID**: mala UX, requiere cross-ref con tratos.
3. **409 en eliminar columna con fichas**: debe manejarse en el hook y mostrar mensaje claro al usuario ("La columna tiene fichas activas").
4. **Unicidad tablero TRATOS**: `ContactoDetailPage` toma el primer tablero TRATOS con `.find()`. Si hubiera varios, toma el primero. Deuda documentada pero no resuelta.
5. **`asignarColumna` limiteWip @Min(1)**: el form debe validar min:1 para no enviar 0 al back.

---

## Decisiones que necesitan respuesta del usuario

Solo cuatro decisiones genuinas (todo lo demás se puede resolver del código):

1. **D1**: ¿Alcance de Change 5? — Recomendado: Opción B (Ficha CRUD + asignar/quitar columna, sin reordenar con drag)
2. **D2**: ¿MOCK_USER como UUID fake o selector de responsable? — Recomendado: UUID fake para `creadoPor` + selector `useUsuarios()` para `responsableId`
3. **D3**: ¿Selector de tratos muestra todos o filtra los que ya tienen ficha? ¿O el botón crear ficha viene desde TratoDetailPage con tratoId pre-fijado? — Recomendado: botón en KanbanColumn con selector de tratos sin ficha en el tablero
4. **D4**: ¿El botón crear ficha está en KanbanColumn o en TratosListPage/TratoDetailPage? — Recomendado: en KanbanColumn (flujo natural del tablero)
