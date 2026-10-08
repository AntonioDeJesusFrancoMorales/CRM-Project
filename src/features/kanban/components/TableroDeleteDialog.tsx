import { useEffect } from 'react';
import { useSynchronousMutationLock } from '@/components/shared/useSynchronousMutationLock';
import { isHttpError } from '@/api/http-error';
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
import { useDeleteTablero } from '../hooks/useDeleteTablero';
import type { Tablero } from '../schemas/tablero.schema';

interface TableroDeleteDialogProps {
  tablero: Tablero | null;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  /** Frontend interim guard for the base board derived by tableroPolicy.ts. */
  deletable?: boolean;
}

export function TableroDeleteDialog({
  tablero,
  onOpenChange,
  onSuccess,
  deletable = true,
}: TableroDeleteDialogProps) {
  const mutation = useDeleteTablero();
  const { acquire, release, isLocked, lockRef: submissionLock } = useSynchronousMutationLock();

  useEffect(() => {
    if (tablero) mutation.reset();
  }, [mutation.reset, tablero?.id]);

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen && submissionLock.current) return;
    onOpenChange(nextOpen);
  }

  function handleDelete() {
    if (!tablero || !deletable || !acquire()) return;

    mutation.mutate(tablero.id, {
      onSettled: (_data, error) => {
        release();
        if (!error) {
          handleOpenChange(false);
          onSuccess?.();
        }
      },
    });
  }

  const isDeleting = mutation.isPending || isLocked;

  return (
    <AlertDialog open={!!tablero} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {deletable ? '¿Eliminar tablero?' : 'No se puede eliminar este tablero'}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {tablero && deletable ? (
              <>
                ¿Eliminar <strong>{tablero.nombre}</strong>? Esta acción no se puede deshacer.
              </>
            ) : (
              'Este tablero es uno de los tableros base y debe conservarse.'
            )}
            {mutation.error && (
              <span role="alert" className="mt-3 block text-destructive">
                {isHttpError(mutation.error)
                  ? mutation.error.message
                  : 'No fue posible eliminar el tablero. Intenta de nuevo.'}
              </span>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
          {deletable && (
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              aria-busy={mutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {mutation.isPending ? 'Eliminando...' : 'Eliminar'}
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
