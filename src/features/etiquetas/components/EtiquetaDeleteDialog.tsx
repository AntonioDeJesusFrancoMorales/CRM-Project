import { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import type { Etiqueta } from '@/api/types';
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
import {
  useDeleteEtiqueta,
  ETIQUETA_EN_USO_STATUS,
} from '../hooks/useDeleteEtiqueta';

interface EtiquetaDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  etiqueta: Etiqueta | null;
}

export function EtiquetaDeleteDialog({ open, onOpenChange, etiqueta }: EtiquetaDeleteDialogProps) {
  const mutation = useDeleteEtiqueta();
  const { acquire, release, isLocked, lockRef: submissionLock } = useSynchronousMutationLock();
  // Cuando el back responde 409 (etiqueta en uso), pasamos a modo confirmación:
  // el segundo intento manda confirm=true y la desasocia de todas las fichas.
  const [requiresConfirm, setRequiresConfirm] = useState(false);

  // Reset del estado de confirmación cada vez que se abre/cierra el diálogo.
  useEffect(() => {
    if (!open) setRequiresConfirm(false);
  }, [open]);

  function handleDelete() {
    if (!etiqueta || !acquire()) return;
    mutation.mutate(
      { id: etiqueta.id, confirm: requiresConfirm },
      {
        onError: (error) => {
          if (isHttpError(error) && error.status === ETIQUETA_EN_USO_STATUS) {
            setRequiresConfirm(true);
          }
        },
        onSettled: (_data, error) => {
          release();
          if (!error) handleOpenChange(false);
        },
      },
    );
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen && submissionLock.current) return;
    onOpenChange(nextOpen);
  }

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {requiresConfirm ? 'La etiqueta está en uso' : '¿Eliminar etiqueta?'}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {etiqueta && !requiresConfirm && (
              <>
                ¿Eliminar la etiqueta <strong>{etiqueta.nombre}</strong>? Esta acción no se puede deshacer.
              </>
            )}
            {etiqueta && requiresConfirm && (
              <span className="flex items-start gap-2 text-destructive">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <span>
                  <strong>{etiqueta.nombre}</strong> está asignada a una o más fichas. Si continuás,
                  se quitará de todas ellas. ¿Eliminar de todos modos?
                </span>
              </span>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={mutation.isPending || isLocked}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              // Controlamos el cierre manualmente según el resultado (éxito / 409 / error).
              e.preventDefault();
              handleDelete();
            }}
            disabled={mutation.isPending || isLocked}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {mutation.isPending
              ? 'Eliminando...'
              : requiresConfirm
                ? 'Eliminar de todas formas'
                : 'Eliminar'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
