import * as AlertDialogPrimitive from '@radix-ui/react-alert-dialog';
import { Trash2 } from 'lucide-react';
import type { ComponentPropsWithoutRef } from 'react';
import type { Usuario } from '@/api/types';
import { useSynchronousMutationLock } from '@/components/shared/useSynchronousMutationLock';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  AlertDialogPortal,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useDeleteUsuario } from '../hooks/useDeleteUsuario';

type UsuarioDeleteDialogContentProps = ComponentPropsWithoutRef<
  typeof AlertDialogPrimitive.Content
>;

function UsuarioDeleteDialogContent({
  className,
  children,
  ...props
}: UsuarioDeleteDialogContentProps) {
  return (
    <AlertDialogPortal>
      <AlertDialogOverlay className="bg-black/50" />
      <AlertDialogPrimitive.Content
        className={cn(
          'fixed left-[50%] top-[50%] z-50 flex w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] flex-col gap-5 overflow-hidden rounded-xl border bg-card p-5 text-card-foreground shadow-xl duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:max-w-lg',
          className,
        )}
        {...props}
      >
        {children}
      </AlertDialogPrimitive.Content>
    </AlertDialogPortal>
  );
}

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
      <UsuarioDeleteDialogContent>
        <AlertDialogHeader className="space-y-0 text-left">
          <div
            className="flex size-10 items-center justify-center rounded-full bg-destructive/10 text-destructive"
            aria-hidden="true"
          >
            <Trash2 className="size-5" />
          </div>
          <AlertDialogTitle className="mt-4">¿Eliminar usuario?</AlertDialogTitle>
          <AlertDialogDescription className="mt-2">
            {usuario && (
              <>
                ¿Eliminar a <strong>{usuario.nombre}</strong>? Esta acción no se puede deshacer.
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-6 flex shrink-0 flex-row justify-end gap-2 border-t border-border pt-4 sm:space-x-0">
          <AlertDialogCancel className="mt-0" disabled={mutation.isPending || isLocked}>
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
      </UsuarioDeleteDialogContent>
    </AlertDialog>
  );
}
