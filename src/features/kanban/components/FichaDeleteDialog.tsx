// FichaDeleteDialog — AlertDialog presentacional para eliminar una tarjeta del Kanban.
// Soporta tres modos según las props recibidas:
//
//   1. Normal (tipoFicha=TAREA, bloqueado=false):
//      Muestra "¿Eliminar tarea?" + confirmación + botón destructivo.
//
//   2. Normal (tipoFicha=TRATO, bloqueado=false):
//      Muestra "¿Eliminar trato?" + confirmación + botón destructivo.
//
//   3. Bloqueado (tipoFicha=TRATO, bloqueado=true):
//      Muestra aviso "Este trato tiene N tareas. Eliminá primero las tareas."
//      SIN botón destructivo — solo "Entendido" (cierra el dialog).
//
// Sin lógica de red. El host (KanbanCard + useEliminarTarjeta) maneja la orquestación.

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { TipoFicha } from '@/features/kanban/schemas/ficha.schema';

interface FichaDeleteDialogProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting?: boolean;
  /** Tipo de entidad que se está borrando — personaliza los mensajes. */
  tipoFicha?: TipoFicha;
  /** true cuando el trato tiene tareas asociadas y no puede borrarse. */
  bloqueado?: boolean;
  /** Cantidad de tareas del trato (se muestra en el aviso de bloqueo). */
  cantidadTareas?: number;
}

export function FichaDeleteDialog({
  open,
  onConfirm,
  onCancel,
  isDeleting = false,
  tipoFicha,
  bloqueado = false,
  cantidadTareas = 0,
}: FichaDeleteDialogProps) {
  const entidad = tipoFicha === 'TAREA' ? 'tarea' : tipoFicha === 'TRATO' ? 'trato' : 'tarjeta';

  // onOpenChange handles the close from ESC / overlay click.
  return (
    <AlertDialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onCancel(); }}>
      <AlertDialogContent>
        {bloqueado ? (
          // Modo bloqueado — TRATO con tareas
          <>
            <AlertDialogHeader>
              <AlertDialogTitle>No se puede eliminar el trato</AlertDialogTitle>
              <AlertDialogDescription>
                Este trato tiene{' '}
                <strong>
                  {cantidadTareas} {cantidadTareas === 1 ? 'tarea asociada' : 'tareas asociadas'}
                </strong>
                . Eliminá primero las tareas antes de eliminar el trato.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Entendido</AlertDialogCancel>
            </AlertDialogFooter>
          </>
        ) : (
          // Modo normal — acción destructiva disponible
          <>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Eliminar {entidad}?</AlertDialogTitle>
              <AlertDialogDescription>
                Esto eliminará el {entidad} y su tarjeta del tablero. No se puede deshacer.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={onConfirm}
                disabled={isDeleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isDeleting ? 'Eliminando...' : `Eliminar ${entidad}`}
              </AlertDialogAction>
            </AlertDialogFooter>
          </>
        )}
      </AlertDialogContent>
    </AlertDialog>
  );
}
