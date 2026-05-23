import type { Prospecto } from '@/api/types';
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
import { useDeleteProspecto } from '../hooks/useDeleteProspecto';

interface ProspectoDeleteDialogProps {
  prospecto: Prospecto | null;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function ProspectoDeleteDialog({
  prospecto,
  onOpenChange,
  onSuccess,
}: ProspectoDeleteDialogProps) {
  const mutation = useDeleteProspecto();

  function handleDelete() {
    if (!prospecto) return;
    mutation.mutate(prospecto.id, {
      onSuccess: () => {
        onOpenChange(false);
        onSuccess?.();
      },
    });
  }

  return (
    <AlertDialog open={!!prospecto} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Eliminar prospecto?</AlertDialogTitle>
          <AlertDialogDescription>
            {prospecto && (
              <>
                ¿Eliminar a{' '}
                <strong>{prospecto.nombre_contacto}</strong>? Esta acción no se puede deshacer.
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={mutation.isPending}>
            Cancelar
          </AlertDialogCancel>
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
