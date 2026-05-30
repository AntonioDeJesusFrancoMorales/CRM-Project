# Exploración: kanban-tareas (Change 6)

**Fecha**: 2026-05-29
**Base**: feat/kanban-crud-ui (Change 5 archivado, 529/529 tests verdes)
**Objetivo**: extender `src/features/kanban/` para soportar el tablero TAREAS y fichas `tipoFicha=TAREA`.

---

## Estado actual

El feature kanban soporta EXCLUSIVAMENTE tableros de tipo `TRATOS`. El back tiene dos tipos de tablero por diseño (`TipoTablero.java` línea 7-9: `TAREAS` y `TRATOS`). El front solo muestra `tipoTablero === 'TRATOS'` en `KanbanListPage` (línea 15) y filtra fichas por `tipoFicha === 'TRATO'` en `KanbanPage` (línea 80) y `KanbanBoard` (línea 84).

---

## Hallazgos Java (verificados contra código real)

### 1. Contrato de ficha TAREA

**`CreateFichaRequest.java`** (líneas 15-31):
- `columnaId` @NotNull UUID
- `tipoFicha` @NotNull TipoFicha — enum `TRATO | TAREA`
- `tratoId` nullable UUID — **null para fichas TAREA** (invariante de dominio)
- `tareaId` nullable UUID — **requerido por dominio para fichas TAREA**, pero @NotNull no está en el DTO (el dominio `Ficha` lo valida)
- `responsableId` @NotNull UUID
- `creadoPor` @NotNull UUID

**`EditFichaRequest.java`** (líneas 15-28): idéntico pero **sin `creadoPor`** (inmutable una vez creado).

**`FichaResponse.java`** (líneas 13-31): expone `tareaId` (nullable). Una ficha de tipo TAREA tiene `tareaId != null` y `tratoId == null`.

El comentario del DTO lo confirma (líneas 11-12): "TAREA requires tareaId and null tratoId, TRATO requires tratoId and null tareaId."

### 2. Derivación del estado en tablero TAREAS

**`ColumnaTablero.java`** (dominio, líneas 42-43):
- `estadoTarea`: `TipoEstadoColumnaTableroTarea` — enum `PENDIENTE | EN_CURSO | FINALIZADA`
- `estadoTrato`: `TipoEstadoColumnaTableroTrato` — enum `ABIERTO | GANADO | PERDIDO`

**`validarEstadosExclusivos`** (líneas 128-158): los estados son **mutuamente excluyentes**. Un tablero TAREAS requiere `estadoTarea != null` y `estadoTrato == null`. Un tablero TRATOS requiere lo inverso.

**`ColumnaTableroDto.java`** (líneas 18-19): expone ambos campos: `String estadoTarea` y `String estadoTrato`. El front ya parsea `estadoTarea: z.string().nullable()` en `tablero.schema.ts` (línea 35), pero **no lo usa en ningún componente**.

**`validarTotalValorEstimado`** (líneas 168-178): tableros TAREAS **requieren** `totalValorEstimado == ZERO`. Implicación para el front: al asignar columna a un tablero TAREAS, `totalValorEstimado` debe enviarse como `0` (ya soportado por `AsignarColumnaInput`).

### 3. Entidad Tarea

**`Tarea.java`** (dominio):
- Campo título: `titulo` (String, 1-200 chars) — **este es el campo a mostrar en KanbanCard**
- `tratoId` @NotNull — toda tarea pertenece a un trato. **La tarea siempre está atada a un trato.**
- Sin campo de estado propio: el estado de la tarea en el kanban se deriva de `columna.estadoTarea`, igual que el trato. El estado local de tarea (`EstadoTareaLocal` en `api/types.ts`: `pendiente | en_progreso | completada`) es un estado de la feature tareas (localStorage), **no del kanban**.

**`TareaController.java`** (líneas 62-65): `GET /api/tareas/get-all` — devuelve todas las tareas sin filtro. No existe endpoint de "tareas sin ficha": debe computarse client-side igual que `useTratosSinFicha`.

**`TareaResponse.java`** (líneas 14-26): `titulo` es el campo nombre/título de la tarea.

**`CreateTareaRequest.java`** (líneas 15-36): `tratoId` @NotNull — no se puede crear una tarea sin trato. Implicación: el selector "tareas sin ficha" solo puede mostrar tareas ya existentes (no se crean desde el kanban TAREAS).

### 4. AsignarColumnaRequest para tablero TAREAS

**`AsignarColumnaRequest.java`** (líneas 21-34):
- `estadoTarea`: `TipoEstadoColumnaTableroTarea` (nullable en el DTO)
- `estadoTrato`: `TipoEstadoColumnaTableroTrato` (nullable en el DTO)
- El back valida la exclusividad en dominio — si el tablero es TAREAS y se envía `estadoTarea=null`, fallará con `InvariantViolationException`.

El form `KanbanPage.tsx` actual **solo expone `estadoTrato`** en el formulario de asignar columna (línea 93). Para tableros TAREAS necesita exponer `estadoTarea` en su lugar.

---

## Inventario de lo hardcodeado a TRATOS en el front

| Archivo | Línea(s) | Qué está hardcodeado |
|---------|----------|----------------------|
| `KanbanListPage.tsx` | 15 | Filtra `tipoTablero === 'TRATOS'` — oculta tableros TAREAS |
| `KanbanPage.tsx` | 80 | Filtra fichas `tipoFicha === 'TRATO'` — ignora fichas TAREA |
| `KanbanPage.tsx` | 93 | Form asignar columna envía `estadoTrato` — no soporta `estadoTarea` |
| `KanbanBoard.tsx` | 84 | Filtro interno adicional `tipoFicha === 'TRATO'` |
| `KanbanCard.tsx` | 37, 45-46 | Llama `useTratos()` y resuelve `trato.nombre` — no soporta `tarea.titulo` |
| `FichaForm.tsx` | 27, 35-38, 65-66, 117-122 | Usa `useTratosSinFicha`, campo `tratoId`, selector de tratos |
| `FichaCreateDialog.tsx` | 43-48 | Hardcodea `tipoFicha: 'TRATO'`, `tareaId: null` |
| `KanbanColumn.tsx` | 25-35, 81-88 | Badge `estadoTrato` — `estadoBadgeClasses` y `estadoLabel` solo para TRATOS |
| `columna.schema.ts` | 30-33 | `asignarColumnaSchema` solo tiene `estadoTrato` (no `estadoTarea`) |
| `deriveEstadoTrato.ts` | todo | Función específica para TRATO — análoga necesaria para TAREA |
| `useTratosSinFicha.ts` | todo | Hook específico para TRATOS sin ficha — análogo necesario para TAREAS |

**Lo que NO está hardcodeado** (ya genérico):
- `fichaSchema`, `fichaCreateSchema`, `fichaEditSchema`: ya soportan `tipoFicha=TAREA` y `tareaId`
- `tableroSchema`, `columnaTableroSchema`: ya tienen `estadoTarea` (nullable) y `tipoTablero` enum con `TAREAS`
- `useCreateFicha`, `useUpdateFicha`, `useDeleteFicha`: genéricos, no asumen tipo
- `useAsignarColumna`: ya soporta `estadoTarea` en `AsignarColumnaInput` (línea 19)
- `useFichas`, `useTableros`, `useTablero`, `useColumnas`: completamente genéricos

---

## Feature tareas — exposición de hooks

**`useTareas.ts`** (líneas 26-31): `useQuery<Tarea[]>` con queryKey `['tareas']`. Devuelve `UseQueryResult<Tarea[]>`. Directamente reutilizable.

**`src/api/types.ts`** (líneas 99-111): `Tarea` interface con campo `titulo` — es el nombre a mostrar en KanbanCard para fichas TAREA.

No hay hook `useTareasSinFicha` — debe crearse en `kanban/lib/`, análogo a `useTratosSinFicha`: composición de `useTareas()` + `useFichas()` filtrando tareas cuyo `id` no aparece en ninguna ficha con `tipoFicha=TAREA`.

---

## Afectadas: rutas y navegación

**`router.tsx`** (línea 44-45): el path `/tableros/:id` lleva a `KanbanPage`. No hay ruta separada para tableros TAREAS — la misma página deberá adaptarse al tipo del tablero. No se necesita nueva ruta.

---

## DECISIONES ABIERTAS

### D1 — ¿Generalizar el feature kanban o camino paralelo para TAREAS?

**Opción A: Generalizar (un conjunto de componentes parametrizados por `tipoTablero`)**
- KanbanBoard, KanbanColumn, KanbanCard, FichaForm, FichaCreateDialog reciben `tipoTablero` como prop y branquean internamente.
- Pros: un único punto de mantenimiento; menos código duplicado; las mejoras a KanbanCard benefician a ambos tableros.
- Cons: complica las firmas de props actuales; los tests existentes (529) deben actualizarse para pasar el nuevo prop; riesgo de romper comportamiento TRATOS.
- Esfuerzo: Medio.

**Opción B: Componentes paralelos especializados para TAREAS**
- Nuevos componentes: `KanbanCardTarea`, `FichaFormTarea`, `FichaCreateDialogTarea`. KanbanBoard/Column permanecen sin cambios para TRATOS; se crean variantes TAREAS.
- Pros: cero riesgo de regresión en TRATOS; tests existentes 100% aislados.
- Cons: duplicación lógica significativa (DnD, layout, WIP badge); violación de DRY; mantenimiento doble.
- Esfuerzo: Medio-Alto.

**Opción C: Generalizar solo los componentes de hoja, dejar páginas especializadas**
- KanbanCard acepta `label` como prop (resuelto por el caller). FichaForm acepta `tipoFicha` + items del selector. FichaCreateDialog generalizado. KanbanBoard/Column generalizados (eliminar filtro `tipoFicha=TRATO` interno). KanbanListPage y KanbanPage detectan tipo del tablero y pasan las props correctas.
- Pros: máxima reutilización en componentes hoja sin exponer complejidad hacia abajo; impacto mínimo en tests existentes (solo props nuevas, no lógica nueva).
- Cons: las páginas deben conocer el tipo y branquear — pero ya lo hacen implícitamente.
- Esfuerzo: Medio.

**Recomendación**: **Opción C**. Es el balance correcto: generaliza los componentes donde el tipo es visible (KanbanCard mostrará `label` en lugar de resolver `tratoNombre`), y deja la lógica de tipo en las páginas que ya conocen el tablero. Minimiza el delta sobre los 529 tests actuales.

---

### D2 — ¿La derivación de estado de tarea es análoga a `deriveEstadoTrato`?

**Análisis**: sí, el mecanismo es idéntico. Cadena para TAREA: `tareaId → Ficha (tipoFicha=TAREA) → columnaId → columna.estadoTarea`. El enum `TipoEstadoColumnaTableroTarea` tiene `PENDIENTE | EN_CURSO | FINALIZADA`.

**Opción A**: crear `deriveEstadoTarea.ts` como espejo de `deriveEstadoTrato.ts`.
- Pros: simple, testeable aislado, sin cambiar el existente.
- Cons: dos funciones casi idénticas.

**Opción B**: generalizar en una función `deriveEstadoFicha(entidadId, fichas, columnas, tipoFicha)` que devuelve el estado apropiado.
- Pros: elimina duplicación.
- Cons: tipo de retorno más complejo (`EstadoTrato | EstadoTarea | null`); TypeScript requiere discriminated union.

**Recomendación**: **Opción A** para esta change. El valor del estado TAREA no se usa en ningún componente todavía (solo se mostrará en el badge de KanbanColumn). Una función separada y testeada es la solución más directa. La unificación es un refactor de futuro.

---

### D3 — ¿De dónde sale el `tareaId` al crear ficha TAREA?

**Análisis**: no existe endpoint "tareas sin ficha" en el back (`TareaController` solo tiene `get-all`). Debe computarse client-side igual que `useTratosSinFicha`: filtrar `useTareas()` excluyendo tareas cuyo `id` aparece en alguna ficha con `tipoFicha=TAREA`.

**Restricción del back**: `Tarea.tratoId` @NotNull — toda tarea ya tiene un trato asignado. El selector mostrará `tarea.titulo` (y podría mostrar el trato asociado como contexto).

**Opción A**: `useTareasSinFicha()` en `kanban/lib/` — composición de `useTareas()` + `useFichas()`.
- Pros: patrón establecido (`useTratosSinFicha` ya existe); sin endpoint nuevo.
- Cons: ninguno relevante.

**Opción B**: endpoint nuevo en el back `GET /api/tareas/sin-ficha`.
- Pros: filtrado server-side.
- Cons: requiere cambio en el back (fuera de alcance); viola el principio de que el front se adapta al back existente.

**Recomendación**: **Opción A**. Exactamente el mismo patrón ya establecido.

---

### D4 — ¿El tablero TAREAS ya aparece en KanbanListPage o hay que habilitarlo?

**Análisis**: `KanbanListPage.tsx` línea 15 filtra `tipoTablero === 'TRATOS'` explícitamente. Los tableros TAREAS se reciben del back pero se descartan client-side.

**Opción A**: mostrar ambos tipos en la misma lista (`/tableros`).
- Pros: UX unificada; ruta existente reutilizada.
- Cons: mezcla conceptualmente tableros de distinta naturaleza en la misma lista.

**Opción B**: mostrar ambos tipos en la misma lista pero separados por sección (TRATOS / TAREAS).
- Pros: UX más clara; sin ruta nueva.
- Cons: leve complejidad de renderizado.

**Opción C**: lista unificada sin separación (eliminar el filtro `tipoTablero === 'TRATOS'`), con badge de tipo en cada card.
- Pros: mínimo código nuevo; el badge informa el tipo.
- Cons: mezcla visual puede confundir al usuario.

**Recomendación**: **Opción C** es la más simple para esta change. Un badge `TRATOS` / `TAREAS` en la card es suficiente para diferenciar. La separación en secciones puede venir en un change posterior.

---

### D5 — ¿`asignarColumnaSchema` debe soportar tanto `estadoTrato` como `estadoTarea`?

**Análisis**: `KanbanPage.tsx` usa el mismo formulario de "Asignar columna" para cualquier tablero. Para tableros TAREAS el campo obligatorio es `estadoTarea` (el back lanza excepción si es null para TAREAS). El schema actual solo tiene `estadoTrato`.

**Opción A**: schema con ambos campos opcionales + validación refinada según `tipoTablero`.
- `asignarColumnaSchema` añade `estadoTarea: z.enum(['PENDIENTE','EN_CURSO','FINALIZADA']).optional()`. El form en `KanbanPage` renderiza el selector correcto según el tipo del tablero.
- Pros: un único schema; validación coherente.
- Cons: lógica de refinement en Zod (`z.superRefine`) para validar que exactamente uno esté presente según tipo.

**Opción B**: dos schemas distintos `asignarColumnaTratoSchema` / `asignarColumnaTareaSchema`.
- Pros: cada uno tiene exactamente lo que necesita; sin refinement.
- Cons: `KanbanPage` debe elegir el schema dinámicamente.

**Recomendación**: **Opción A** con un refinement simple. El schema base tiene ambos opcionales; el form pasa el correcto según el tipo del tablero.

---

## Áreas afectadas

| Archivo | Tipo de cambio |
|---------|---------------|
| `kanban/pages/KanbanListPage.tsx` | Eliminar filtro `tipoTablero === 'TRATOS'`, agregar badge |
| `kanban/pages/KanbanPage.tsx` | Filtrar fichas por tipo del tablero, form asignar columna con `estadoTarea` |
| `kanban/components/KanbanBoard.tsx` | Eliminar filtro interno `tipoFicha=TRATO`, recibir tipo |
| `kanban/components/KanbanColumn.tsx` | Badge `estadoTarea` (nuevo) además de `estadoTrato` |
| `kanban/components/KanbanCard.tsx` | Recibir `label` (pre-resuelto) en lugar de llamar `useTratos` |
| `kanban/components/FichaForm.tsx` | Parametrizar selector (tratos / tareas) según `tipoFicha` |
| `kanban/components/FichaCreateDialog.tsx` | Generalizar `tipoFicha` y selector de entidad |
| `kanban/lib/useTratosSinFicha.ts` | Sin cambio (mantener) |
| `kanban/lib/useTareasSinFicha.ts` | **NUEVO** — análogo a `useTratosSinFicha` |
| `kanban/lib/deriveEstadoTrato.ts` | Sin cambio (mantener) |
| `kanban/lib/deriveEstadoTarea.ts` | **NUEVO** — análogo a `deriveEstadoTrato` |
| `kanban/schemas/columna.schema.ts` | Añadir `estadoTarea` al `asignarColumnaSchema` |
| `kanban/schemas/tablero.schema.ts` | Añadir `estadoTarea` como enum tipado (ya existe como `z.string()`) |

**Total estimado**: ~14 archivos modificados/creados, sin tocar hooks de lectura/escritura ni MSW fixtures principales.

---

## Riesgos

1. **Regresión en tests TRATOS**: KanbanCard recibe `label` como prop → los 529 tests que renderizan `KanbanCard` deben actualizarse. Si la refactorización no es cuidadosa puede romper muchos tests a la vez. Mitigación: cambio backward-compatible (prop opcional con fallback).
2. **Tarea.tratoId @NotNull**: el selector de tareas sin ficha mostrará tareas ya existentes. Si la BD de prueba no tiene tareas, el selector estará vacío. Los fixtures MSW deben incluir tareas de ejemplo.
3. **`estadoTarea` tipado**: `columnaTableroSchema` declara `estadoTarea: z.string().nullable()` en lugar de un enum estricto. Al usar `estadoTarea` en el badge de KanbanColumn, TypeScript permitirá cualquier string. Puede tipificarse en este change al agregar el enum.
4. **`totalValorEstimado` para TAREAS**: el back requiere que sea `ZERO` para columnas TAREAS. El form actual tiene default `0` y el campo visible. Para tableros TAREAS ese campo debería ocultarse o fijarse en `0` automáticamente.

---

## Listo para propuesta

Sí. Las decisiones clave son D1 (generalizar vs paralelo) y D4 (lista unificada vs separada). Las demás decisiones tienen una opción clara recomendada.
