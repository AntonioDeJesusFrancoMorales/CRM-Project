// useEliminarTarjeta — hook de orquestación del borrado desde el Kanban.
//
// Decisión de dominio (Lote 7):
//   - TAREA (hoja): borrar tarea → borrar ficha (best-effort). bloqueado siempre false.
//   - TRATO sin tareas: borrar trato → borrar ficha (best-effort). bloqueado false.
//   - TRATO con tareas: bloqueado=true, eliminar() no hace nada.
//
// Orden garantizado: se borra primero la entidad (trato/tarea); si tiene éxito,
// se borra la ficha. Si la ficha falla, la entidad ya se borró (degradación elegante
// — preferable a tener un trato/tarea borrado con ficha huérfana al revés).
//
// Toast UX (decisión Lote 7):
//   - useDeleteTarea y useDeleteTrato ya muestran sus propios toasts de éxito
//     ("Tarea eliminada" / "Trato eliminado").
//   - useDeleteFicha se invoca con { silentSuccess: true } para NO mostrar un segundo
//     toast "Ficha eliminada" que sería ruido duplicado. Mismo patrón que useCreateFicha.
//   - Si la ficha falla (error silencioso), el error toast SÍ se muestra (error de red real).

import { useDeleteFicha } from './useDeleteFicha';
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
  // silentSuccess: true — useDeleteTarea/useDeleteTrato ya muestran toast de éxito
  const deleteFicha = useDeleteFicha({ silentSuccess: true });

  const { data: todasLasTareas } = useTareas();

  // Calcular cuántas tareas pertenecen al trato de esta ficha
  const cantidadTareas =
    ficha.tipoFicha === 'TRATO' && ficha.tratoId
      ? (todasLasTareas ?? []).filter((t) => t.tratoId === ficha.tratoId).length
      : 0;

  const bloqueado = ficha.tipoFicha === 'TRATO' && cantidadTareas > 0;

  const isPending =
    deleteTarea.isPending || deleteTrato.isPending || deleteFicha.isPending;

  async function eliminar(): Promise<void> {
    if (bloqueado) return;

    if (ficha.tipoFicha === 'TAREA') {
      if (!ficha.tareaId) return;
      // 1. Borrar tarea
      await new Promise<void>((resolve, reject) => {
        deleteTarea.mutate(ficha.tareaId!, {
          onSuccess: () => resolve(),
          onError: (err) => reject(err),
        });
      });
      // 2. Borrar ficha (best-effort — si falla, la tarea ya se borró)
      await new Promise<void>((resolve) => {
        deleteFicha.mutate(ficha.id, {
          onSuccess: () => resolve(),
          onError: () => resolve(), // degradación elegante
        });
      });
    } else {
      // TRATO (garantizamos bloqueado=false aquí)
      if (!ficha.tratoId) return;
      // 1. Borrar trato
      await new Promise<void>((resolve, reject) => {
        deleteTrato.mutate(ficha.tratoId!, {
          onSuccess: () => resolve(),
          onError: (err) => reject(err),
        });
      });
      // 2. Borrar ficha (best-effort)
      await new Promise<void>((resolve) => {
        deleteFicha.mutate(ficha.id, {
          onSuccess: () => resolve(),
          onError: () => resolve(), // degradación elegante
        });
      });
    }
  }

  return { eliminar, isPending, bloqueado, cantidadTareas };
}
