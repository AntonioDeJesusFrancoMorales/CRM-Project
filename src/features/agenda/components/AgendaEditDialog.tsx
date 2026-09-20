// AgendaEditDialog — wrapper sobre AgendaForm + useUpdateAgenda.
// Precarga el evento mapeando AgendaResponse → AgendaEditInput. Las horas del back pueden
// venir como "HH:mm:ss"; el input type="time" usa "HH:mm", por eso se recorta a 5 chars.
// Homologa AgendaCreateDialog.

import { isHttpError } from '@/api/http-error';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { Agenda, AgendaEditInput } from '../schemas/agenda.schema';
import { useUpdateAgenda } from '../hooks/useUpdateAgenda';
import { AgendaForm } from './AgendaForm';

interface AgendaEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agenda: Agenda;
}

/** Recorta una hora del back ("HH:mm:ss" o "HH:mm") al formato del input type=time ("HH:mm"). */
function toInputTime(hora: string | null): string | null {
  return hora ? hora.slice(0, 5) : null;
}

export function AgendaEditDialog({ open, onOpenChange, agenda }: AgendaEditDialogProps) {
  const mutation = useUpdateAgenda();

  const serverErrors =
    isHttpError(mutation.error) && mutation.error.status === 422 && mutation.error.details
      ? mutation.error.details
      : undefined;

  function handleSubmit(values: AgendaEditInput) {
    mutation.mutate({ id: agenda.id, data: values }, { onSuccess: () => onOpenChange(false) });
  }

  const initial: Partial<AgendaEditInput> = {
    tipo: agenda.tipo,
    asunto: agenda.asunto,
    descripcion: agenda.descripcion,
    fecha: agenda.fecha,
    horaInicio: toInputTime(agenda.horaInicio) ?? '',
    horaFin: toInputTime(agenda.horaFin),
    tareaId: agenda.tareaId,
    tratoId: agenda.tratoId,
    ubicacion: agenda.ubicacion,
    linkVideollamada: agenda.linkVideollamada,
    recordatorioHabilitado: agenda.recordatorioHabilitado,
    minutosAntes: agenda.minutosAntes,
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Editar evento</DialogTitle>
          <DialogDescription>Modificá los datos de este evento de tu agenda.</DialogDescription>
        </DialogHeader>
        <AgendaForm
          mode="edit"
          defaultValues={initial}
          onSubmit={handleSubmit}
          onCancel={() => onOpenChange(false)}
          isSubmitting={mutation.isPending}
          serverErrors={serverErrors}
        />
      </DialogContent>
    </Dialog>
  );
}
