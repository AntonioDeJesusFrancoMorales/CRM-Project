import { useSynchronousMutationLock } from '@/components/shared/useSynchronousMutationLock';
import type { Empresa } from '@/api/types';
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
import { useDeleteEmpresa } from '../hooks/useDeleteEmpresa';

interface EmpresaDeleteDialogProps {
  empresa: Empresa | null;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function EmpresaDeleteDialog({
  empresa,
  onOpenChange,
  onSuccess,
}: EmpresaDeleteDialogProps) {
  const mutation = useDeleteEmpresa();
  const mutationError = mutation.error;
  const { acquire, release, isLocked, lockRef: submissionLock } = useSynchronousMutationLock();

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen && submissionLock.current) return;
    onOpenChange(nextOpen);
  }

  function handleDelete() {
    if (!empresa || !acquire()) return;
    mutation.mutate(empresa.id, {
      onSettled: (_data, error) => {
        release();
        if (!error) {
          handleOpenChange(false);
          onSuccess?.();
        }
      },
    });
  }

  return (
    <AlertDialog open={!!empresa} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Eliminar empresa?</AlertDialogTitle>
          <AlertDialogDescription>
            {empresa && (
              <>
                ¿Eliminar <strong>{empresa.nombre}</strong>? Esta acción no se puede deshacer. Sus
                prospectos y clientes asociados quedarán sin empresa.
                {mutationError && (
                  <span role="alert" className="mt-3 block text-destructive">
                    {isHttpError(mutationError) && mutationError.status === 409
                      ? mutationError.message
                      : 'No fue posible eliminar la empresa. Intenta de nuevo.'}
                  </span>
                )}
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={mutation.isPending || isLocked}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={mutation.isPending || isLocked}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {mutation.isPending ? 'Eliminando...' : 'Eliminar'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
