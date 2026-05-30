// Hook derivado: retorna las tareas que NO tienen ficha activa de tipo TAREA.
// Cruza useTareas() + useFichas() y filtra: tareas donde ninguna ficha
// de tipo TAREA tiene ese tareaId. Sin petición extra al back — filtrado client-side.
// Espejo exacto de useTratosSinFicha.ts para el dominio de Tareas.

import { useTareas } from '@/features/tareas/hooks/useTareas';
import { useFichas } from '../hooks/useFichas';
import type { Tarea } from '@/api/types';

export interface TareasSinFichaResult {
  data: Tarea[] | undefined;
  isSuccess: boolean;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
}

export function useTareasSinFicha(): TareasSinFichaResult {
  const tareas = useTareas();
  const fichas = useFichas();

  const isSuccess = tareas.isSuccess && fichas.isSuccess;
  const isLoading = tareas.isLoading || fichas.isLoading;
  const isError = tareas.isError || fichas.isError;
  const error = tareas.error ?? fichas.error ?? null;

  const data = isSuccess
    ? tareas.data!.filter(
        (t) => !fichas.data!.some((f) => f.tipoFicha === 'TAREA' && f.tareaId === t.id),
      )
    : undefined;

  return { data, isSuccess, isLoading, isError, error };
}
