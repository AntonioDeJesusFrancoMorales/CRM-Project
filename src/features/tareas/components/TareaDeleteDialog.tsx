// TareaDeleteDialog — AlertDialog de confirmación para eliminar una tarea.
// Presentational: la lógica de DELETE + manejo 409/204 vive en el host (TareaDetailPage).
// Homologa TratoDeleteDialog.

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

interface TareaDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  titulo: string;
  onConfirm: () => void;
  isDeleting?: boolean;
}

export function TareaDeleteDialog({
  open,
  onOpenChange,
  titulo,
  onConfirm,
  isDeleting = false,
}: TareaDeleteDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Eliminar tarea?</AlertDialogTitle>
          <AlertDialogDescription>
            ¿Eliminar <strong>{titulo}</strong>? Esta acción no se puede deshacer.
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
