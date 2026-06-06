// FichaCreateDialog — wrapper Radix Dialog + useCreateFicha.
// Recibe columnaId y tipoFicha como props (precargados desde KanbanColumn).
// Resuelve items según tipoFicha:
//   - 'TRATO' → useTratosSinFicha() mapeado a {id, label: nombre}
//   - 'TAREA' → useTareasSinFicha() mapeado a {id, label: titulo}
// Mapea body según tipoFicha:
//   - 'TRATO' → { tratoId: entidadId, tareaId: null }
//   - 'TAREA' → { tareaId: entidadId, tratoId: null }
// Compone FichaCreateInput con columnaId y tipoFicha (sin responsableId/creadoPor — back infiere del JWT).
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
import { useTratosSinFicha } from '../lib/useTratosSinFicha';
import { useTareasSinFicha } from '../lib/useTareasSinFicha';
import { FichaForm } from './FichaForm';
import type { FichaFormValues } from './FichaForm';
import type { TipoFicha } from '@/features/kanban/schemas/ficha.schema';

interface FichaCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  columnaId: string;
  tipoFicha?: TipoFicha; // default 'TRATO' (backward-compatible)
}

export function FichaCreateDialog({
  open,
  onOpenChange,
  columnaId,
  tipoFicha = 'TRATO',
}: FichaCreateDialogProps) {
  const mutation = useCreateFicha();

  // Resolver items según tipoFicha
  const tratos = useTratosSinFicha();
  const tareas = useTareasSinFicha();

  const items =
    tipoFicha === 'TAREA'
      ? (tareas.data ?? []).map((t) => ({ id: t.id, label: t.titulo }))
      : (tratos.data ?? []).map((t) => ({ id: t.id, label: t.nombre }));

  const itemsLoading = tipoFicha === 'TAREA' ? tareas.isLoading : tratos.isLoading;

  // Extract 422 server errors to pass down to FichaForm — same pattern as TratoCreateDialog
  // Remap 'tratoId'/'tareaId' → 'entidadId' since FichaForm uses the generic field name
  const rawServerErrors =
    isHttpError(mutation.error) &&
    mutation.error.status === 422 &&
    mutation.error.details
      ? mutation.error.details
      : undefined;

  const serverErrors = rawServerErrors?.map((e) => ({
    ...e,
    field: e.field === 'tratoId' || e.field === 'tareaId' ? 'entidadId' : e.field,
  }));

  function handleSubmit(values: FichaFormValues) {
    // Mapear entidadId → tratoId/tareaId según tipo
    const tratoId = tipoFicha === 'TRATO' ? values.entidadId : null;
    const tareaId = tipoFicha === 'TAREA' ? values.entidadId : null;

    mutation.mutate(
      {
        columnaId,
        tipoFicha,
        tratoId,
        tareaId,
      },
      {
        onSuccess: () => onOpenChange(false),
      },
    );
  }

  const dialogTitle = tipoFicha === 'TAREA' ? 'Nueva ficha de tarea' : 'Nueva ficha';
  const dialogDesc =
    tipoFicha === 'TAREA'
      ? 'Crea una ficha de tarea para esta columna.'
      : 'Crea una ficha de trato para esta columna.';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
          <DialogDescription>{dialogDesc}</DialogDescription>
        </DialogHeader>
        <FichaForm
          columnaId={columnaId}
          tipoFicha={tipoFicha}
          items={items}
          itemsLoading={itemsLoading}
          onSubmit={handleSubmit}
          onCancel={() => onOpenChange(false)}
          isSubmitting={mutation.isPending}
          serverErrors={serverErrors}
        />
      </DialogContent>
    </Dialog>
  );
}
