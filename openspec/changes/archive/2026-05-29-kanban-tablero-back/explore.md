# Exploration: kanban-tablero-back

> Fecha: 2026-05-28  
> Objetivo: Reintroducir el Kanban en el front modelado contra el contrato REAL del back AR-CRM (Tablero / Columna / ColumnaTablero / Ficha).

---

## 1. Rutas RPC, verbos y query params

### Tablero — `/api/tableros`

| Método | Path | Query params | Body DTO | Response DTO |
|--------|------|-------------|----------|--------------|
| POST | `/api/tableros/create` | — | `CreateTableroRequest` | `TableroResponse` |
| GET | `/api/tableros/get-all` | — | — | `List<TableroResponse>` |
| GET | `/api/tableros/get-by-id` | `id: UUID` | — | `TableroResponse` |
| PUT | `/api/tableros/edit` | `id: UUID` | `EditTableroRequest` | `TableroResponse` |
| DELETE | `/api/tableros/delete` | `id: UUID` | — | 204 |
| POST | `/api/tableros/agregar-columna` | `id: UUID` | `AgregarColumnaRequest` (**@Deprecated**) | `TableroResponse` |
| DELETE | `/api/tableros/eliminar-columna` | `id: UUID`, `columnaId: UUID` | — | 204 |
| POST | `/api/tableros/asignar-columna` | `id: UUID`, `columnaId: UUID` | `AsignarColumnaRequest` | `TableroResponse` |
| PUT | `/api/tableros/reordenar-columnas` | `id: UUID` | `ReordenarColumnasRequest` | `TableroResponse` |

### Columna (catálogo) — `/api/columnas`

| Método | Path | Query params | Body DTO | Response DTO |
|--------|------|-------------|----------|--------------|
| POST | `/api/columnas/create` | — | `CreateColumnaRequest` | `ColumnaResponse` |
| GET | `/api/columnas/get-all` | — | — | `List<ColumnaResponse>` |
| GET | `/api/columnas/get-by-id` | `id: UUID` | — | `ColumnaResponse` |
| PUT | `/api/columnas/edit` | `id: UUID` | `EditColumnaRequest` | `ColumnaResponse` |
| DELETE | `/api/columnas/delete` | `id: UUID` | — | 204 |

### Ficha — `/api/fichas`

| Método | Path | Query params | Body DTO | Response DTO |
|--------|------|-------------|----------|--------------|
| POST | `/api/fichas/create` | — | `CreateFichaRequest` | `FichaResponse` |
| GET | `/api/fichas/get-all` | — | — | `List<FichaResponse>` |
| GET | `/api/fichas/get-by-id` | `id: UUID` | — | `FichaResponse` |
| PUT | `/api/fichas/edit` | `id: UUID` | `EditFichaRequest` | `FichaResponse` |
| DELETE | `/api/fichas/delete` | `id: UUID` | — | 204 |

**Patrón RPC uniforme**: todas las rutas usan `?id=` (nunca `/:id`). Igual que Tratos, Empresas, Tareas.  
**No hay endpoint de "mover ficha"**: el movimiento se hace mediante `PUT /api/fichas/edit` cambiando el campo `columnaId` en el body.

---

## 2. Forma exacta de cada entidad

### CreateTableroRequest (body)
```
nombre: String (1-100, @NotBlank)
descripcion: String (@NotBlank)
tipoTablero: TipoTablero (TAREAS | TRATOS, @NotNull)
superUsuarioId: UUID (@NotNull)
columnasPredeterminadas: boolean
```
El back crea **4 columnas predeterminadas automáticamente** al crear un Tablero con `columnasPredeterminadas = true`. El cliente no las define.

### EditTableroRequest (body)
```
nombre: String (1-100, @NotBlank)
descripcion: String
```
Solo `nombre` y `descripcion` son editables. `tipoTablero` no se puede cambiar.

### TableroResponse
```
id: UUID
nombre: String
descripcion: String
tipoTablero: TipoTablero (TAREAS | TRATOS)
columnas: List<ColumnaTableroDto>
creadoEn: LocalDateTime
```

### ColumnaTableroDto (columna en contexto de tablero — embedded en TableroResponse)
```
id: UUID           ← es el columnaId del catálogo, NO un id propio de la asignación
nombre: String     ← hidratado del catálogo Columna
color: String      ← hidratado del catálogo Columna
limiteWip: Integer
nota: String | null
estadoTarea: String | null   ← TipoEstadoColumnaTableroTarea: PENDIENTE | EN_CURSO | FINALIZADA
estadoTrato: String | null   ← TipoEstadoColumnaTableroTrato: ABIERTO | GANADO | PERDIDO
totalValorEstimado: BigDecimal
```
**Invariante dominio**: `estadoTarea` y `estadoTrato` son mutuamente excluyentes. Un tablero TRATOS tiene `estadoTrato != null` y `estadoTarea == null` en cada columna. Un tablero TAREAS tiene lo opuesto.

### CreateColumnaRequest (body — catálogo)
```
superUsuarioId: UUID (requerido para PREDETERMINADA, opcional para PERSONALIZADA)
nombre: String (1-80)
color: String (max 7, ej. #RRGGBB; default #FFFFFF si null)
tipoTablero: TipoTablero (TAREAS | TRATOS)
tipoColumna: TipoColumna (PREDETERMINADA | PERSONALIZADA)
```

### ColumnaResponse (catálogo)
```
id: UUID
nombre: String
color: String
tipoTablero: String (TAREAS | TRATOS)
tipoColumna: String (PREDETERMINADA | PERSONALIZADA)
```
**Sin** `posicion`, **sin** `limiteWip`, **sin** `estadoTrato/Tarea` — esos campos viven en `ColumnaTableroDto`.

### AsignarColumnaRequest (body — asignar columna de catálogo a tablero)
```
limiteWip: Integer (@NotNull, @Min(1))
nota: String | null (max 500)
estadoTarea: TipoEstadoColumnaTableroTarea | null
estadoTrato: TipoEstadoColumnaTableroTrato | null
totalValorEstimado: BigDecimal (@NotNull)
```
El `columnaId` del catálogo viene como `@RequestParam`, no en el body.

### ReordenarColumnasRequest (body)
```
nuevoOrden: List<ColumnaId>  ← lista completa de IDs en el nuevo orden deseado
```
El back valida que la lista contenga exactamente los mismos IDs que ya tiene el tablero (sin agregar ni quitar, solo reordenar).

### CreateFichaRequest (body)
```
columnaId: UUID (@NotNull)     ← qué columna del tablero recibe la ficha
tipoFicha: TipoFicha (@NotNull) ← TRATO | TAREA
tratoId: UUID | null            ← requerido si tipoFicha == TRATO, nulo si TAREA
tareaId: UUID | null            ← requerido si tipoFicha == TAREA, nulo si TRATO
responsableId: UUID (@NotNull)
creadoPor: UUID (@NotNull)
```

### EditFichaRequest (body)
```
columnaId: UUID (@NotNull)     ← cambiar columnaId = mover la ficha entre columnas
tipoFicha: TipoFicha (@NotNull)
tratoId: UUID | null
tareaId: UUID | null
responsableId: UUID (@NotNull)
```
No incluye `creadoPor` (inmutable).

### FichaResponse
```
id: UUID
columnaId: UUID
tipoFicha: TipoFicha (TRATO | TAREA)
tratoId: UUID | null
tareaId: UUID | null
responsableId: UUID
creadoPor: UUID
creadoEn: Instant
actualizadoEn: Instant
```

---

## 3. Cómo Ficha vincula un Trato a una Columna/Tablero

La Ficha es el **nodo de unión** entre el mundo del tablero y el mundo del negocio:

- `ficha.columnaId` → identifica en qué columna está (implícitamente, en qué tablero, dado que una columna pertenece a un solo tablero)
- `ficha.tipoFicha = TRATO` → indica que el contenido de la ficha es un trato
- `ficha.tratoId` → UUID del Trato que representa esta ficha en el kanban

**Una Ficha es una tarjeta kanban**. No hay concepto de "posición numérica" en la Ficha — el orden dentro de una columna no está persistido en el back en este momento. El back no tiene campo `posicion` en Ficha.

**Invariante dominio** (validado en Java):
- `tipoFicha == TRATO` → `tratoId != null` y `tareaId == null`
- `tipoFicha == TAREA` → `tareaId != null` y `tratoId == null`

---

## 4. Estado del Trato y derivación desde la Columna

### Trato NO tiene campo `estado`

`TratoResponse` expone: `id, contactoId, responsableId, nombre, valorEstimado, probabilidad, fechaCierreEsperada, tipoContrato, motivoPerdida, creadoEn, actualizadoEn`.

**No hay `estado` en Trato.** El estado del ciclo de vida (abierto/ganado/perdido) se **deriva** de la columna donde está la ficha del trato: `columnaTableroDto.estadoTrato` → `ABIERTO | GANADO | PERDIDO`.

Para saber en qué estado está un Trato:
1. Buscar la Ficha donde `ficha.tratoId == trato.id` y `ficha.tipoFicha == TRATO`
2. Obtener el Tablero que contiene la columna `ficha.columnaId`
3. Leer `columnaTableroDto.estadoTrato` para esa columna

El frente debe derivar el estado del trato a partir del tablero, no del Trato directamente.

---

## 5. Mover una Ficha entre columnas

**No existe un endpoint específico "mover ficha"**. El movimiento se realiza con:

```
PUT /api/fichas/edit?id={fichaId}
Body: EditFichaRequest {
  columnaId: <nueva_columna_uuid>,  ← este es el campo que cambia
  tipoFicha: TRATO,
  tratoId: <mismo_trato_uuid>,
  tareaId: null,
  responsableId: <mismo_usuario_uuid>
}
```

El dominio (`Ficha.moverAColumna`) acepta el nuevo `columnaId`. Si es el mismo, es un no-op idempotente.

**Reordenar columnas** (cambiar el orden de columnas en el tablero):
```
PUT /api/tableros/reordenar-columnas?id={tableroId}
Body: ReordenarColumnasRequest {
  nuevoOrden: [columnaId1, columnaId2, columnaId3, ...]
}
```
La lista debe contener **todos** los IDs de columnas del tablero exactamente una vez. El back devuelve el `TableroResponse` con las columnas en el nuevo orden.

**No hay persistencia de posición de Ficha dentro de una columna**. El orden de las fichas en una columna no está persistido. Si el front quiere mostrar las fichas en un orden estable, tendrá que derivarlo localmente (ej. por `creadoEn`).

---

## 6. Estado actual del front

### Fixtures (`src/mocks/fixtures/tableros.ts`)
Los fixtures actuales usan una forma **inventada** que NO corresponde al contrato del back:
- `Tablero.tipo_ficha` (snake_case, campo no existe en el back — el back usa `tipoTablero: TipoTablero`)
- `Columna.tablero_id` (snake_case; en el back las columnas del catálogo no tienen `tablero_id`)
- `Columna.posicion` (no existe en el back — el orden es la posición en la lista `columnas` del Tablero)
- `Columna.estado_vinculado` (string libre; en el back es `estadoTrato: TipoEstadoColumnaTableroTrato`)
- `Ficha` en el fixture solo tiene `{ id, columna_id, responsable_id, creado_por }` — faltan `tipoFicha`, `tratoId`, `tareaId`

Todo el fixture y los tipos de `@/api/types` relacionados con tableros/columnas/fichas deben ser **reescritos** para alinearlos al contrato real.

### Handler MSW (`src/mocks/handlers/tableros.ts`)
- **Sí está cableado** en `src/mocks/handlers/index.ts` (`...tablerosHandlers`)
- Las rutas del handler son inventadas (REST con path params: `GET /api/tableros/:id`, `POST /api/tableros/:id/columnas`, `PATCH /api/fichas/:id/mover`) — **todas divergen** del patrón RPC real del back (`?id=`, rutas nombradas, sin path variable)
- El handler completo debe ser **reescrito** para seguir el patrón RPC

### Feature kanban eliminado (Change 3)
- No existe `src/features/kanban/` — la carpeta fue eliminada completamente
- No existe `KanbanCard.tsx`, `KanbanColumna.tsx` ni ningún componente kanban
- En `src/features/tratos/` solo quedan: lista plana de tratos, CRUD, schema sin `estado`
- `TratosListPage.tsx` tiene comentario explícito: "sin toggle Kanban/Tabla"
- `src/routes/placeholders.tsx` tiene `TablerosPlaceholder` apuntando a "Change 7"
- `src/components/layout/Sidebar.tsx` tiene la entrada de Tableros con `disabled: true, badge: 'Próximamente'`
- La rama `origin/feat/kanban-tratos` existe en remoto pero NO debe usarse — es el diseño viejo inventado

### Deuda W1: `tieneTratosActivos` en `ContactoDetailPage.tsx`
**Problema actual**: `tieneTratosActivos = tratosDelContacto.length > 0`  
Esta lógica es incorrecta desde el punto de vista del negocio. Cualquier trato vinculado (incluyendo GANADO o PERDIDO) bloquea marcar el contacto como INACTIVO.

El comentario en el código dice:
> "El modelo Trato ya no expone `estado` (ciclo de vida diferido al Kanban, Change 4)"

Y el comentario en `useTransicionEstado.ts` dice:
> `tieneTratosActivos = tratosDelContacto.some(t => t.estado === 'abierto')`

Esto implica que la lógica correcta una vez implementado el Kanban sería:  
`tieneTratosActivos = tratosDelContacto.some(t => estadoTratoDerivadoDeFicha(t.id) === 'ABIERTO')`

Para implementarlo correctamente se necesitaría:
1. Obtener todas las fichas del tablero TRATOS
2. Cruzar `ficha.tratoId` con los tratos del contacto
3. Leer `columna.estadoTrato === 'ABIERTO'` de la columna de esa ficha

---

## 7. Decisiones abiertas

### D1: Librería de drag & drop
**Opciones**:
- **@dnd-kit/core** (la que usaba el kanban viejo): accesible, flexible, bien mantenida, sin dependencias de DOM. ~42kb gzipped. Re-agregar como dependencia.
- **react-beautiful-dnd**: más popular pero deprecada por Atlassian, no soporta React 18 Strict Mode correctamente.
- **HTML5 Drag & Drop nativo**: cero dependencias, pero UX limitada, sin soporte para touch, sin accesibilidad built-in, difícil animar.
- **@hello-pangea/dnd** (fork de react-beautiful-dnd compatible con React 18): API familiar, activamente mantenida.

**Recomendación preliminar**: @dnd-kit/core o @hello-pangea/dnd. Requiere decisión del equipo.

### D2: Derivación del estado del Trato desde la Columna
El back confirma que `Trato` NO tiene campo `estado`. El estado ABIERTO/GANADO/PERDIDO es una propiedad de la columna (`estadoTrato`), no del trato.

**Opciones para el front**:
- **Opción A (pura client-side)**: al obtener las fichas, cruzar `ficha.tratoId → columna.estadoTrato` en el cliente. No requiere endpoint adicional del back.
- **Opción B (endpoint dedicado)**: pedir al back un endpoint que devuelva el estado del trato. No existe hoy, y el back es fuente de verdad sin campo `estado` en Trato.

**Implicación**: La opción A es la correcta y la única sin requerir cambios al back.

### D3: ¿Kanban por Tablero? ¿Qué tipo_ficha aplica?
El back soporta `TipoTablero.TRATOS` y `TipoTablero.TAREAS`. Un tablero dado es uno u otro.

**Para este Change** (reintroducir el Kanban de Tratos):
- Se trabaja exclusivamente con `TipoTablero.TRATOS` → `tipoFicha = TRATO`
- Las fichas de tipo TAREA quedan para un tablero de tipo TAREAS (scope futuro)
- Decisión abierta: ¿se construye un componente genérico que soporte ambos tipos, o se especifica para TRATOS primero?

### D4: Restaurar semántica fina de `tieneTratosActivos` en ContactoDetailPage
**Situación**: hoy `tieneTratosActivos = tratosDelContacto.length > 0` bloquea INACTIVO con cualquier trato.  
**Correcto**: debería ser `any ficha de ese trato tiene estadoTrato === 'ABIERTO'`.

**Opciones**:
- **Opción A (derivar en el cliente)**: al cargar `ContactoDetailPage`, también fetchear las fichas del tablero TRATOS y cruzar. Más carga de red.
- **Opción B (mantener la aproximación conservadora actual)**: no romper nada, el cambio queda como deuda hasta que haya UI de Kanban que muestre el contexto. Es menos preciso pero no es incorrecto desde perspectiva de seguridad (falla por el lado cauteloso).
- **Opción C (calcular en el Kanban feature y exponer vía estado global/context)**: una vez que el Kanban está renderizado, la derivación de `estadoTrato` es natural. Requeire coordinación entre features.

**Recomendación preliminar**: Opción B para este Change. La deuda W1 se resuelve cuando el Kanban esté funcionando (Change siguiente o posterior).

### D5: Posición de Ficha dentro de una columna
El back NO persiste el orden de las fichas dentro de una columna. Si el front implementa DnD para reordenar fichas dentro de una columna, ese orden solo existe en memoria o debe persistirse en otro lado.

**Opciones**:
- **Sin posición intra-columna**: el orden se determina por `creadoEn` (implícito en el back).
- **Posición persistida en el front**: localStorage u otro mecanismo de estado local.
- **Pedir al back un campo `posicion` en Ficha**: requiere cambio al back (fuera del contrato actual).

---

## Afectados por este Change

- `src/api/endpoints.ts` — agregar tableros, columnas, fichas
- `src/api/types.ts` — tipos Tablero, ColumnaTableroDto, Ficha alineados al back
- `src/mocks/fixtures/tableros.ts` — reescribir con shape real
- `src/mocks/handlers/tableros.ts` — reescribir con rutas RPC reales
- `src/features/tratos/` — sin cambios estructurales, pero el tablero referenciará `Trato` por `tratoId`
- `src/features/contactos/pages/ContactoDetailPage.tsx` — deuda W1 (evaluar en este change o diferir)
- `src/routes/placeholders.tsx` — reemplazar `TablerosPlaceholder` con el componente real
- `src/components/layout/Sidebar.tsx` — habilitar entrada de Tableros
- Nueva feature: `src/features/tableros/` — schemas, hooks, components, pages

---

## Gotchas detectados

1. **`ColumnaTableroDto.id` es el `columnaId` del catálogo**, no un ID propio de la asignación. El frente debe entender que el "id" de una columna en el tablero es el mismo que el ID de la columna en el catálogo.

2. **`AgregarColumnaRequest` está deprecado**. El flujo correcto para agregar columnas al tablero es `asignar-columna` (usando columnas del catálogo), no `agregar-columna`. El front NO debe usar `/agregar-columna`.

3. **Mover una ficha = `PUT /api/fichas/edit` con nuevo `columnaId`**. No hay endpoint dedicado. Esto implica que hay que enviar todos los campos de la ficha (no solo el `columnaId`) — el frente debe tener el estado completo de la ficha para hacer el edit.

4. **Reordenar columnas requiere la lista completa** (`nuevoOrden` debe tener todos los IDs, no solo el movido). El back valida que el tamaño de la lista sea igual al número actual de columnas.

5. **`totalValorEstimado` es obligatorio en `AsignarColumnaRequest`** para tableros TRATOS. Para tableros TAREAS debe ser `BigDecimal.ZERO`. El frente debe manejar esto.

6. **El back no filtra fichas por tablero**: `GET /api/fichas/get-all` devuelve todas las fichas. El frente debe filtrar por `columnaId` para mostrar las fichas de cada columna. Esto implica que para renderizar un tablero se necesitan dos llamadas: `GET /api/tableros/get-by-id?id=X` (para la estructura) + `GET /api/fichas/get-all` (para el contenido).

7. **No existe endpoint `GET /api/tableros/:id/fichas`** — no hay endpoint compuesto que devuelva tablero + fichas en una sola llamada.
