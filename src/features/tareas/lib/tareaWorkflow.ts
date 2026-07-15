import type { Tarea } from '@/api/types';
import type { Ficha } from '@/features/kanban/schemas/ficha.schema';
import type { ColumnaTablero } from '@/features/kanban/schemas/tablero.schema';

export const TAREA_SIN_COLUMNA_LABEL = 'Sin columna';

export interface TareaWorkflowState {
  tareaId: string;
  fichaId: string | null;
  columnaId: string | null;
  nombre: string;
  color: string | null;
}

export type TareaWorkflowById = Record<string, TareaWorkflowState>;

export function resolveTareaWorkflowStates(
  tareas: Tarea[],
  fichas: Ficha[],
  columnas: ColumnaTablero[],
): TareaWorkflowById {
  const columnasById = new Map(columnas.map((columna) => [columna.id, columna]));
  const fichasByTareaId = new Map(
    fichas
      .filter((ficha) => ficha.tipoFicha === 'TAREA' && ficha.tareaId !== null)
      .map((ficha) => [ficha.tareaId as string, ficha]),
  );

  return Object.fromEntries(
    tareas.map((tarea) => {
      const ficha = fichasByTareaId.get(tarea.id);
      const columna = ficha ? columnasById.get(ficha.columnaId) : undefined;
      const state: TareaWorkflowState = {
        tareaId: tarea.id,
        fichaId: ficha?.id ?? null,
        columnaId: ficha?.columnaId ?? null,
        nombre: columna?.nombre ?? TAREA_SIN_COLUMNA_LABEL,
        color: columna?.color ?? null,
      };
      return [tarea.id, state];
    }),
  );
}

export function matchesTareaWorkflowFilter(
  state: TareaWorkflowState | undefined,
  filter: string | undefined,
): boolean {
  if (!filter) return true;
  if (!state) return false;
  if (state.columnaId === filter) return true;
  return normalizeWorkflowLabel(state.nombre) === normalizeWorkflowLabel(filter);
}

function normalizeWorkflowLabel(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/_/g, ' ')
    .trim();
}
