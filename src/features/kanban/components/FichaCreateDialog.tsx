// FichaCreateDialog — wrapper Radix Dialog + useCreateFicha.
// Recibe columnaId como prop (precargado desde KanbanColumn — no editable por el usuario).
// Compone FichaCreateInput completo: { ...formValues, columnaId, tipoFicha: 'TRATO', creadoPor: MOCK_USER_ID }.
// Homologa TratoCreateDialog: mutation.error → serverErrors 422 → FichaForm.setError via prop.
// Tras éxito: useCreateFicha invalida ['fichas'] (en el hook) y cerramos el dialog.

import { isHttpError } from '@/api/http-error';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useCreateFicha } from '../hooks/useCreateFicha';
import { MOCK_USER_ID } from '../lib/mockUser';
import { FichaForm } from './FichaForm';
import type { FichaFormValues } from './FichaForm';

interface FichaCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  columnaId: string;
}

export function FichaCreateDialog({
  open,
  onOpenChange,
  columnaId,
}: FichaCreateDialogProps) {
  const mutation = useCreateFicha();

  // Extract 422 server errors to pass down to FichaForm — same pattern as TratoCreateDialog
  const serverErrors =
    isHttpError(mutation.error) &&
    mutation.error.status === 422 &&
    mutation.error.details
      ? mutation.error.details
      : undefined;

  function handleSubmit(values: FichaFormValues) {
    mutation.mutate(
      {
        ...values,
        columnaId,
        tipoFicha: 'TRATO',
        creadoPor: MOCK_USER_ID,
        tareaId: null,
      },
      {
        onSuccess: () => onOpenChange(false),
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nueva ficha</DialogTitle>
          <DialogDescription>
            Crea una ficha de trato para esta columna.
          </DialogDescription>
        </DialogHeader>
        <FichaForm
          columnaId={columnaId}
          onSubmit={handleSubmit}
          onCancel={() => onOpenChange(false)}
          isSubmitting={mutation.isPending}
          serverErrors={serverErrors}
        />
      </DialogContent>
    </Dialog>
  );
}
