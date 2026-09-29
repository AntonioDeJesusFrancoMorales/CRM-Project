import type { Rol } from '@/api/types';
import { useSynchronousMutationLock } from '@/components/shared/useSynchronousMutationLock';
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
import { useDeleteRol } from '../hooks/useDeleteRol';

interface RolDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rol: Rol | null;
}

export function RolDeleteDialog({ open, onOpenChange, rol }: RolDeleteDialogProps) {
  const mutation = useDeleteRol();
  const { acquire, release, isLocked, lockRef: submissionLock } = useSynchronousMutationLock();

  function handleDelete() {
    if (!rol || !acquire()) return;
    // El cierre ocurre SOLO en éxito. Si el back responde 409 (rol con usuarios
    // asignados), el hook muestra el toast y el diálogo queda abierto a propósito,
    // para que el usuario entienda por qué no se eliminó.
    mutation.mutate(rol.id, {
      onSettled: (_data, error) => {
        release();
        if (!error) handleOpenChange(false);
      },
    });
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen && submissionLock.current) return;
    onOpenChange(nextOpen);
  }

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Eliminar rol?</AlertDialogTitle>
          <AlertDialogDescription>
            {rol && (
              <>
                ¿Eliminar el rol <strong>{rol.nombre}</strong>? Esta acción no se puede deshacer.
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={mutation.isPending || isLocked}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              // Evitamos el cierre automático del AlertDialog para controlarlo
              // manualmente según el resultado de la mutación (éxito vs 409).
              e.preventDefault();
              handleDelete();
            }}
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
