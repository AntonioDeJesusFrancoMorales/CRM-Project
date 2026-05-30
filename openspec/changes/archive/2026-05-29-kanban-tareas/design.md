# Design: Kanban de Tareas (Change 6)

## Technical Approach

Estrategia "solo hojas" (D1): generalizar los componentes hoja de `src/features/kanban/` con props nuevas OPCIONALES (backward-compatible), y dejar la decisión de `tipoTablero`/`tipoFicha` en las páginas (`KanbanListPage`, `KanbanPage`) que ya conocen el tablero. Espejar Change 5 para `deriveEstadoTarea.ts` y `useTareasSinFicha`. NINGÚN componente compartido branquea por `tipoTablero` internamente más allá del mínimo (badge dual de estado en `KanbanColumn`).

## Architecture Decisions

| Decisión | Opción elegida | Alternativa rechazada | Rationale |
|---|---|---|---|
| D1 generalización | Solo hojas: props opcionales | Componentes paralelos / `tipoTablero` interno | Minimiza delta sobre 529 tests; sin duplicación |
| D2 derivación estado | `deriveEstadoTarea` espejo | Función genérica `deriveEstadoFicha` | Directa, testeable; unificar es refactor futuro |
| D3 tareaId | `useTareasSinFicha` client-side | Endpoint back | No hay endpoint; back es fuente de verdad |
| D5 schema | Un `asignarColumnaSchema` + `superRefine` | Dos schemas | Un solo contrato; refine valida exclusividad |
| Discriminador | Página pasa `tipoTablero`/`tipoFicha` como prop | Componente lo infiere | Páginas ya conocen el tablero |

## Contratos / Firmas

### 1. KanbanCard — `label` pre-resuelto, backward-compatible

```ts
interface KanbanCardProps {
  ficha: Ficha;
  label?: string; // pre-resuelto por el padre. Si undefined → fallback interno actual.
}
```

Migración: el cuerpo conserva `useTratos()` + el cálculo `tratoLabel` como FALLBACK. El texto mostrado pasa a `label ?? tratoLabel`. Los tests existentes (`<KanbanCard ficha={...} />` sin `label`) siguen verdes: con `label` undefined, cae al path actual (`useTratos` → `tratoId` → `'Sin trato'`). El padre (`KanbanColumn`) resuelve el label por tipo y lo pasa explícito en producción.

### 2. deriveEstadoTarea.ts — NEW, espejo exacto

```ts
import type { Ficha } from '../schemas/ficha.schema';
import type { ColumnaTablero, EstadoTarea } from '../schemas/tablero.schema';

export function deriveEstadoTarea(
  tareaId: string,
  fichas: Ficha[],
  columnas: ColumnaTablero[],
): EstadoTarea | null {
  const ficha = fichas.find((f) => f.tipoFicha === 'TAREA' && f.tareaId === tareaId);
  if (!ficha) return null;
  const columna = columnas.find((c) => c.id === ficha.columnaId);
  if (!columna) return null;
  return columna.estadoTarea; // requiere tipar estadoTarea como enum (ver tablero.schema)
}
```

### 3. tablero.schema.ts — tipar `estadoTarea` como enum

```ts
export const estadoTarea = z.enum(['PENDIENTE', 'EN_CURSO', 'FINALIZADA']);
export type EstadoTarea = z.infer<typeof estadoTarea>;
// columnaTableroSchema: estadoTarea: estadoTarea.nullable() (antes z.string().nullable())
```

### 4. useTareasSinFicha.ts — NEW, espejo de useTratosSinFicha

```ts
import { useTareas } from '@/features/tareas/hooks/useTareas';
import { useFichas } from '../hooks/useFichas';
import type { Tarea } from '@/api/types';

export interface TareasSinFichaResult {
  data: Tarea[] | undefined; isSuccess: boolean; isLoading: boolean;
  isError: boolean; error: Error | null;
}
// filtro: !fichas.data!.some((f) => f.tipoFicha === 'TAREA' && f.tareaId === t.id)
```

### 5. FichaForm — generalizado por `tipoFicha`

```ts
type ItemSinFicha = { id: string; label: string };

interface FichaFormProps {
  columnaId: string;
  tipoFicha: TipoFicha;              // 'TRATO' | 'TAREA' — discriminador (default 'TRATO')
  items: ItemSinFicha[];            // tratos O tareas sin ficha, ya mapeados {id,label}
  itemsLoading?: boolean;
  onSubmit: (values: FichaFormValues) => void;
  onCancel?: () => void;
  isSubmitting?: boolean;
  serverErrors?: Array<{ field: string; message: string }>;
}
// Schema dinámico: el campo se llama 'entidadId' (genérico). El label/placeholder
// del selector cambia según tipoFicha ('Trato' vs 'Tarea'). FichaFormValues:
// { entidadId: string; responsableId: string }.
```

El padre (FichaCreateDialog) provee `items` (resueltos de `useTratosSinFicha`→`{id, label:nombre}` o `useTareasSinFicha`→`{id, label:titulo}`) y mapea `entidadId` a `tratoId`/`tareaId` según `tipoFicha`. FichaForm deja de importar `useTratosSinFicha` directamente.

### 6. FichaCreateDialog — propaga `tipoFicha`

```ts
interface FichaCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  columnaId: string;
  tipoFicha?: TipoFicha; // default 'TRATO' (backward-compatible)
}
```

El dialog resuelve items según `tipoFicha`, y compone el body:
`tipoFicha==='TAREA'` → `{ tipoFicha:'TAREA', tareaId: entidadId, tratoId: null, columnaId, responsableId, creadoPor: MOCK_USER_ID }`; `'TRATO'` → como hoy (`tratoId: entidadId, tareaId: null`).

### 7. asignarColumnaSchema — refine de exclusividad

```ts
export const asignarColumnaSchema = z
  .object({
    tipoTablero,                                  // discriminador del form
    limiteWip: z.number().int().min(1, 'El límite WIP debe ser al menos 1'),
    estadoTrato: estadoTrato.optional(),
    estadoTarea: estadoTarea.optional(),
    totalValorEstimado: z.number().min(0),
  })
  .superRefine((v, ctx) => {
    if (v.tipoTablero === 'TRATOS') {
      if (!v.estadoTrato) ctx.addIssue({ code: 'custom', path: ['estadoTrato'], message: 'Selecciona un estado de trato' });
      if (v.estadoTarea) ctx.addIssue({ code: 'custom', path: ['estadoTarea'], message: 'No aplica en tableros de tratos' });
    } else { // TAREAS
      if (!v.estadoTarea) ctx.addIssue({ code: 'custom', path: ['estadoTarea'], message: 'Selecciona un estado de tarea' });
      if (v.estadoTrato) ctx.addIssue({ code: 'custom', path: ['estadoTrato'], message: 'No aplica en tableros de tareas' });
      if (v.totalValorEstimado !== 0) ctx.addIssue({ code: 'custom', path: ['totalValorEstimado'], message: 'Debe ser 0 en tableros de tareas' });
    }
  });
```

`KanbanPage` setea `tipoTablero` en `defaultValues` desde `tablero.tipoTablero`; para TAREAS fija `totalValorEstimado: 0`, oculta ese campo y renderiza selector `estadoTarea` en vez de `estadoTrato`. El submit envía SOLO el estado del tipo correcto (`tipoTablero` no se manda al back).

### 8. Páginas — discriminador

- **KanbanListPage**: quitar el filtro `tipoTablero === 'TRATOS'`; renderizar todos; añadir badge `tablero.tipoTablero` por card.
- **KanbanPage**: `tipoTablero = tablero.tipoTablero`. Filtrar fichas por `tipoFicha === (tipoTablero==='TAREAS'?'TAREA':'TRATO')`. Pasar `tipoFicha` a `KanbanBoard`→`KanbanColumn`→`FichaCreateDialog`. `KanbanColumn` resuelve `label` por tipo (trato.nombre / tarea.titulo) y lo pasa a `KanbanCard`; muestra badge `estadoTarea` o `estadoTrato`.

## File Changes

| File | Action | Description |
|---|---|---|
| `kanban/lib/deriveEstadoTarea.ts` | Create | Espejo de deriveEstadoTrato |
| `kanban/lib/useTareasSinFicha.ts` | Create | Espejo de useTratosSinFicha (tipoFicha='TAREA') |
| `kanban/schemas/tablero.schema.ts` | Modify | enum `estadoTarea`; tipar campo en columnaTableroSchema |
| `kanban/schemas/columna.schema.ts` | Modify | `tipoTablero`+`estadoTarea` opcionales + superRefine |
| `kanban/components/KanbanCard.tsx` | Modify | prop opcional `label` con fallback |
| `kanban/components/KanbanColumn.tsx` | Modify | prop `tipoFicha`; badge dual; resolver y pasar `label` |
| `kanban/components/KanbanBoard.tsx` | Modify | prop `tipoFicha`; filtrar por tipo (no hardcode TRATO) |
| `kanban/components/FichaForm.tsx` | Modify | props `tipoFicha`+`items`; campo `entidadId` |
| `kanban/components/FichaCreateDialog.tsx` | Modify | prop `tipoFicha`; resuelve items; mapea body |
| `kanban/pages/KanbanListPage.tsx` | Modify | quitar filtro; badge de tipo |
| `kanban/pages/KanbanPage.tsx` | Modify | detectar tipo; selector estado correcto; pasar tipoFicha |

## Testing Strategy

| Layer | What | Approach |
|---|---|---|
| Unit | deriveEstadoTarea (4 escenarios spec) | Función pura, fixtures inline |
| Component | FichaForm selector por tipo; tareaId requerido; asignarColumna refine | RTL + zodResolver |
| Integration | Lista unificada + badge; crear ficha TAREA; asignar estadoTarea+tValEst=0; filtro fichas por tipo; 409 quitar columna | MSW con fixtures TAREAS |

## Migration / Rollout

Sin migración de datos. Cambios backward-compatible (props opcionales con default/fallback).

**Nota de migración de tests existentes:**
- **KanbanCard**: tests actuales pasan SIN `label` → siguen verdes (fallback a `useTratos`). No requieren cambios. Tests nuevos cubren `label` explícito.
- **FichaForm**: tests que renderizan FichaForm deben pasar `tipoFicha='TRATO'` + `items` (mapeados de tratos sin ficha). El selector ahora usa name `entidadId` en vez de `tratoId` → ajustar selectores de test que buscaban `tratoId` por name. Es el cambio de mayor impacto en tests.
- **FichaCreateDialog / KanbanColumn / KanbanBoard**: `tipoFicha` default `'TRATO'` → tests de TRATOS sin cambios.
- **asignarColumnaSchema**: tests deben incluir `tipoTablero` en el input; los de TRATOS añaden `estadoTrato`.

## Open Questions

Ninguna. Las 5 decisiones (D1–D5) están resueltas en la exploración con opción clara.
