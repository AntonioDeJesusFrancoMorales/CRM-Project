// useEliminarTarjeta — hook de orquestación del borrado desde el Kanban.
//
// Decisión de dominio:
//   - TAREA (hoja): borrar la tarea. bloqueado siempre false.
//   - TRATO sin tareas: borrar el trato. bloqueado false.
//   - TRATO con tareas: bloqueado=true, eliminar() no hace nada.
//
// El borrado de la FICHA asociada lo hace useDeleteTarea/useDeleteTrato (el back NO
// cascadea — ver eliminarFichaAsociada). Este hook solo decide QUÉ entidad borrar y
// aplica la regla de bloqueo; no toca la ficha directamente. Así el invariante
// "entidad + ficha se borran juntas" vive en un único lugar (los delete de entidad).
//
// Toast UX: useDeleteTarea/useDeleteTrato muestran su toast de éxito.

import { useDeleteTrato } from '@/features/tratos/hooks/useDeleteTrato';
import { useDeleteTarea } from '@/features/tareas/hooks/useDeleteTarea';
import { useTareas } from '@/features/tareas/hooks/useTareas';
import type { Ficha } from '@/features/kanban/schemas/ficha.schema';

export interface UseEliminarTarjetaResult {
  /** Ejecuta el borrado orquestado. Es un no-op si bloqueado=true. */
  eliminar: () => Promise<void>;
  /** true cuando alguna de las mutaciones está en vuelo */
  isPending: boolean;
  /** true cuando el trato tiene tareas asociadas y no puede borrarse */
  bloqueado: boolean;
  /** cantidad de tareas asociadas al trato (0 para TAREA) */
  cantidadTareas: number;
}

export function useEliminarTarjeta(ficha: Ficha): UseEliminarTarjetaResult {
  const deleteTarea = useDeleteTarea();
  const deleteTrato = useDeleteTrato();

  const { data: todasLasTareas } = useTareas();

  // Calcular cuántas tareas pertenecen al trato de esta ficha
  const cantidadTareas =
    ficha.tipoFicha === 'TRATO' && ficha.tratoId
      ? (todasLasTareas ?? []).filter((t) => t.tratoId === ficha.tratoId).length
      : 0;

  const bloqueado = ficha.tipoFicha === 'TRATO' && cantidadTareas > 0;

  const isPending = deleteTarea.isPending || deleteTrato.isPending;

  async function eliminar(): Promise<void> {
    if (bloqueado) return;

    if (ficha.tipoFicha === 'TAREA') {
      if (!ficha.tareaId) return;
      // useDeleteTarea borra la tarea Y su ficha asociada.
      await deleteTarea.mutateAsync(ficha.tareaId);
    } else {
      if (!ficha.tratoId) return;
      // useDeleteTrato borra el trato Y su ficha asociada.
      await deleteTrato.mutateAsync(ficha.tratoId);
    }
  }

  return { eliminar, isPending, bloqueado, cantidadTareas };
}
