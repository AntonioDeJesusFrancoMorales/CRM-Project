import { useSynchronousMutationLock } from '@/components/shared/useSynchronousMutationLock';
import type { Contacto } from '@/api/types';
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
import { useDeleteContacto } from '../hooks/useDeleteContacto';
import { useTratos } from '@/features/tratos/hooks/useTratos';

interface ContactoDeleteDialogProps {
  contacto: Contacto | null;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  tratos?: ReturnType<typeof useTratos>['data'];
  tratosIsFetching?: boolean;
}

export function ContactoDeleteDialog({
  contacto,
  onOpenChange,
  onSuccess,
  tratos,
  tratosIsFetching = false,
}: ContactoDeleteDialogProps) {
  const tratosQuery = useTratos(undefined, {
    enabled: !tratos && Boolean(contacto),
  });
  const loadedTratos = tratosQuery.data ?? [];
  const relatedTratos = tratos ?? loadedTratos;
  const mutation = useDeleteContacto(relatedTratos);
  const { acquire, release, isLocked, lockRef: submissionLock } = useSynchronousMutationLock();
  const relatedDealsReady =
    !tratosIsFetching && !tratosQuery.isFetching && (tratos !== undefined || tratosQuery.isFetched);

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen && submissionLock.current) return;
    onOpenChange(nextOpen);
  }

  function handleDelete() {
    if (!contacto || !acquire()) return;
    mutation.mutate(contacto.id, {
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
    <AlertDialog open={!!contacto} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Eliminar contacto?</AlertDialogTitle>
          <AlertDialogDescription>
            {contacto && (
              <>
                ¿Eliminar a{' '}
                <strong>{contacto.nombre}</strong>
                ? Esta acción no se puede deshacer.
                {contacto.estadoRelacion !== 'INACTIVO' && (
                  <span className="mt-1 block text-destructive">
                    Este contacto puede tener tratos activos. Si el servidor
                    responde con un error, verifica sus tratos antes de
                    eliminarlo.
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
            disabled={mutation.isPending || isLocked || !relatedDealsReady}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {mutation.isPending ? 'Eliminando...' : !relatedDealsReady ? 'Cargando...' : 'Eliminar'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
