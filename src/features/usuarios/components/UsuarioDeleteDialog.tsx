import type { Usuario } from '@/api/types';
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
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useDeleteUsuario } from '../hooks/useDeleteUsuario';

interface UsuarioDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  usuario: Usuario | null;
  isOwnAccount: boolean;
}

export function UsuarioDeleteDialog({
  open,
  onOpenChange,
  usuario,
  isOwnAccount,
}: UsuarioDeleteDialogProps) {
  const mutation = useDeleteUsuario();
  const { acquire, release, isLocked, lockRef: submissionLock } = useSynchronousMutationLock();

  function handleDelete() {
    if (!usuario || !acquire()) return;
    mutation.mutate(usuario.id, {
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
          <AlertDialogTitle>¿Eliminar usuario?</AlertDialogTitle>
          <AlertDialogDescription>
            {usuario && (
              <>
                ¿Eliminar a <strong>{usuario.nombre}</strong>? Esta acción no se
                puede deshacer.
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={mutation.isPending || isLocked}>
            Cancelar
          </AlertDialogCancel>
          {/* Defensa en profundidad (ADR-017): el botón Eliminar también está bloqueado
              cuando el usuario intenta eliminar su propia cuenta. */}
          {isOwnAccount ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <AlertDialogAction
                    disabled
                    className="pointer-events-none bg-destructive text-destructive-foreground opacity-50"
                  >
                    Eliminar
                  </AlertDialogAction>
                </span>
              </TooltipTrigger>
              <TooltipContent>No puedes eliminar tu propia cuenta</TooltipContent>
            </Tooltip>
          ) : (
            <AlertDialogAction
              onClick={handleDelete}
              disabled={mutation.isPending || isLocked}
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
