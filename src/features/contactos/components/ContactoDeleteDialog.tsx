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

interface ContactoDeleteDialogProps {
  contacto: Contacto | null;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function ContactoDeleteDialog({
  contacto,
  onOpenChange,
  onSuccess,
}: ContactoDeleteDialogProps) {
  const mutation = useDeleteContacto();

  function handleDelete() {
    if (!contacto) return;
    mutation.mutate(contacto.id, {
      onSuccess: () => {
        onOpenChange(false);
        onSuccess?.();
      },
    });
  }

  return (
    <AlertDialog open={!!contacto} onOpenChange={onOpenChange}>
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
          <AlertDialogCancel disabled={mutation.isPending}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={mutation.isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {mutation.isPending ? 'Eliminando...' : 'Eliminar'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
