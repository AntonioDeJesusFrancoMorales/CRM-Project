// AgendaDeleteDialog — AlertDialog de confirmación para eliminar un evento de agenda.
// Presentational: el DELETE vive en el host (AgendaListPage). Homologa TareaDeleteDialog.

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

interface AgendaDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  asunto: string;
  onConfirm: () => void;
  isDeleting?: boolean;
}

export function AgendaDeleteDialog({
  open,
  onOpenChange,
  asunto,
  onConfirm,
  isDeleting = false,
}: AgendaDeleteDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Eliminar evento?</AlertDialogTitle>
          <AlertDialogDescription>
            ¿Eliminar <strong>{asunto}</strong>? Esta acción no se puede deshacer.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? 'Eliminando...' : 'Eliminar'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
