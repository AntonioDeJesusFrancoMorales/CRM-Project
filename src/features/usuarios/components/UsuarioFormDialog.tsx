import { isHttpError } from '@/api/http-error';
import type { Usuario } from '@/api/types';
import { useSynchronousMutationLock } from '@/components/shared/useSynchronousMutationLock';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { UsuarioCreateInput, UsuarioUpdateInput } from '../schemas/usuario.schema';
import { useCreateUsuario } from '../hooks/useCreateUsuario';
import { useEditUsuario } from '../hooks/useEditUsuario';
import { UsuarioForm } from './UsuarioForm';

type CreateProps = {
  mode: 'create';
  open: boolean;
  onOpenChange: (open: boolean) => void;
  usuario?: never;
};

type EditProps = {
  mode: 'edit';
  open: boolean;
  onOpenChange: (open: boolean) => void;
  usuario: Usuario;
};

export type UsuarioFormDialogProps = CreateProps | EditProps;

// ─── Sub-componente: CreateDialog ────────────────────────────────────────────

function CreateDialog({
  open,
  onOpenChange,
}: Pick<CreateProps, 'open' | 'onOpenChange'>) {
  const mutation = useCreateUsuario();
  const { acquire, release, isLocked, lockRef: submissionLock } = useSynchronousMutationLock();

  const serverErrors =
    isHttpError(mutation.error) &&
    [400, 422].includes(mutation.error.status) &&
    mutation.error.details
      ? mutation.error.details
      : undefined;

  function handleSubmit(values: UsuarioCreateInput) {
    if (!acquire()) return;
    mutation.mutate(values, {
      onSettled: (_data, error) => {
        release();
        if (!error) onOpenChange(false);
      },
    });
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen && submissionLock.current) return;
    onOpenChange(nextOpen);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Nuevo usuario</DialogTitle>
          <DialogDescription>
            Completa los datos para registrar un nuevo usuario en el sistema.
          </DialogDescription>
        </DialogHeader>
        <UsuarioForm
          mode="create"
          onSubmit={handleSubmit}
           onCancel={() => handleOpenChange(false)}
           isSubmitting={mutation.isPending || isLocked}
          serverErrors={serverErrors}
        />
      </DialogContent>
    </Dialog>
  );
}

// ─── Sub-componente: EditDialog ───────────────────────────────────────────────

function EditDialog({
  open,
  onOpenChange,
  usuario,
}: Pick<EditProps, 'open' | 'onOpenChange' | 'usuario'>) {
  const mutation = useEditUsuario(usuario.id);
  const { acquire, release, isLocked, lockRef: submissionLock } = useSynchronousMutationLock();

  const serverErrors =
    isHttpError(mutation.error) &&
    [400, 422].includes(mutation.error.status) &&
    mutation.error.details
      ? mutation.error.details
      : undefined;

  const defaultValues: Partial<UsuarioUpdateInput> = {
    nombre: usuario.nombre,
    rolId: usuario.rolId,
    ...(usuario.correo == null ? {} : { correo: usuario.correo }),
  };

  function handleSubmit(values: UsuarioUpdateInput) {
    if (!acquire()) return;
    mutation.mutate(values, {
      onSettled: (_data, error) => {
        release();
        if (!error) onOpenChange(false);
      },
    });
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen && submissionLock.current) return;
    onOpenChange(nextOpen);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Editar usuario</DialogTitle>
          <DialogDescription>
            Modifica los datos de <strong>{usuario.nombre}</strong>.
          </DialogDescription>
        </DialogHeader>
        <UsuarioForm
          mode="edit"
          defaultValues={defaultValues}
          onSubmit={handleSubmit}
           onCancel={() => handleOpenChange(false)}
           isSubmitting={mutation.isPending || isLocked}
          serverErrors={serverErrors}
        />
      </DialogContent>
    </Dialog>
  );
}

// ─── Componente público ───────────────────────────────────────────────────────

export function UsuarioFormDialog(props: UsuarioFormDialogProps) {
  if (props.mode === 'create') {
    return <CreateDialog open={props.open} onOpenChange={props.onOpenChange} />;
  }
  return (
    <EditDialog
      open={props.open}
      onOpenChange={props.onOpenChange}
      usuario={props.usuario}
    />
  );
}
