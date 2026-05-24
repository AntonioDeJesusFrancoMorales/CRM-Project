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

// Presentational: la lógica de DELETE + manejo 409/204 vive en el host (TratoDetailPage).

interface TratoDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nombre: string;
  onConfirm: () => void;
  isDeleting?: boolean;
}

export function TratoDeleteDialog({
  open,
  onOpenChange,
  nombre,
  onConfirm,
  isDeleting = false,
}: TratoDeleteDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Eliminar trato?</AlertDialogTitle>
          <AlertDialogDescription>
            ¿Eliminar <strong>{nombre}</strong>? Esta acción no se puede deshacer. Si el
            trato tiene tareas asociadas, la eliminación no será posible.
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
