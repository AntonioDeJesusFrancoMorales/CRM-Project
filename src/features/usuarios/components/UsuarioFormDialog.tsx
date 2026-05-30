import { isHttpError } from '@/api/http-error';
import type { Usuario } from '@/api/types';
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

  const serverErrors =
    isHttpError(mutation.error) &&
    mutation.error.status === 422 &&
    mutation.error.details
      ? mutation.error.details
      : undefined;

  function handleSubmit(values: UsuarioCreateInput) {
    mutation.mutate(values, { onSuccess: () => onOpenChange(false) });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
          onCancel={() => onOpenChange(false)}
          isSubmitting={mutation.isPending}
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

  const serverErrors =
    isHttpError(mutation.error) &&
    mutation.error.status === 422 &&
    mutation.error.details
      ? mutation.error.details
      : undefined;

  const defaultValues: Partial<UsuarioUpdateInput> = {
    nombre: usuario.nombre,
    correo: usuario.correo,
    rolId: usuario.rolId,
  };

  function handleSubmit(values: UsuarioUpdateInput) {
    mutation.mutate(values, { onSuccess: () => onOpenChange(false) });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
          onCancel={() => onOpenChange(false)}
          isSubmitting={mutation.isPending}
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
