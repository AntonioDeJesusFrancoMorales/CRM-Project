import { useMemo } from 'react';
import { useFichas } from '@/features/kanban/hooks/useFichas';
import { useTableros } from '@/features/kanban/hooks/useTableros';
import { getTableroPrincipal } from '@/features/kanban/lib/getTableroPrincipal';
import type { ColumnaTablero } from '@/features/kanban/schemas/tablero.schema';
import type { Tarea } from '@/api/types';
import {
  resolveTareaWorkflowStates,
  type TareaWorkflowById,
} from '../lib/tareaWorkflow';

export function useTareaWorkflowStates(tareas: Tarea[]): {
  workflowByTareaId: TareaWorkflowById;
  workflowColumns: ColumnaTablero[];
  isLoading: boolean;
} {
  const tareaIds = useMemo(() => tareas.map((tarea) => tarea.id), [tareas]);
  const { data: tableros = [], isLoading: isLoadingTableros } = useTableros({ tipoTablero: 'TAREAS' });
  const { data: fichas = [], isLoading: isLoadingFichas } = useFichas({
    tipoFicha: 'TAREA',
    tareaIds,
  });

  const tablero = useMemo(() => getTableroPrincipal(tableros, 'TAREAS'), [tableros]);
  const workflowColumns = useMemo(() => tablero?.columnas ?? [], [tablero]);

  const workflowByTareaId = useMemo(
    () => resolveTareaWorkflowStates(tareas, fichas, workflowColumns),
    [tareas, fichas, workflowColumns],
  );

  return {
    workflowByTareaId,
    workflowColumns,
    isLoading: isLoadingTableros || isLoadingFichas,
  };
}
