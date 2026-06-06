// useCrearTareaConFicha — hook de composición: crea una tarea y, en éxito,
// crea automáticamente una ficha TAREA en la primera columna del tablero TAREAS.
//
// Diseño (orquestación en el front):
//   El back AR-CRM desacopla CreateTareaService y CreateFicha a propósito; el cliente
//   orquesta ambas llamadas. Esto es contract-respecting (el back expone ambos endpoints
//   justamente para eso).
//
// Robustez:
//   Si no hay tablero TAREAS, o el tablero no tiene columnas, la tarea se crea igual y
//   la ficha se omite sin lanzar error (degradación elegante). Ver useAutoFicha.
//
// UX de toasts:
//   useCreateTarea emite "Tarea creada" en su onSuccess.
//   La ficha se crea en silencio (useCreateFicha con silentSuccess) para NO mostrar un
//   segundo toast "Ficha creada": al crear una tarea, la única confirmación es la de la
//   tarea. El flujo manual de crear ficha (FichaCreateDialog) sigue mostrando su toast.

import { useState } from 'react';
import { useAutoFicha } from '@/features/kanban/hooks/useAutoFicha';
import { useCreateTarea } from './useCreateTarea';
import type { TareaCreateInput } from '../schemas/tarea.schema';
import type { Tarea } from '@/api/types';

// Forma pública del hook — API tipo mutación simplificada
export interface UseCrearTareaConFichaResult {
  crear: (values: TareaCreateInput) => Promise<Tarea>;
  isPending: boolean;
  error: Error | null;
}

export function useCrearTareaConFicha(): UseCrearTareaConFichaResult {
  const createTareaMutation = useCreateTarea();
  const { crearFichaPara } = useAutoFicha('TAREAS', 'TAREA');
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  async function crear(values: TareaCreateInput): Promise<Tarea> {
    setIsPending(true);
    setError(null);

    try {
      // Paso 1: crear la tarea
      const createdTarea = await new Promise<Tarea>((resolve, reject) => {
        createTareaMutation.mutate(values, {
          onSuccess: (tarea) => resolve(tarea),
          onError: (err) => reject(err),
        });
      });

      // Paso 2: crear la ficha automáticamente (best-effort, degradación elegante)
      await crearFichaPara({
        id: createdTarea.id,
      });

      return createdTarea;
    } catch (err) {
      const e = err instanceof Error ? err : new Error('Error desconocido al crear tarea');
      setError(e);
      throw e;
    } finally {
      setIsPending(false);
    }
  }

  return { crear, isPending, error };
}
