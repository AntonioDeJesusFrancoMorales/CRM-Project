// FichaDeleteDialog — AlertDialog presentacional para eliminar una ficha.
// Sin lógica de red. El host (KanbanCard) maneja useDeleteFicha y el estado de la mutación.
// Homologa TratoDeleteDialog: mismas props open/onOpenChange, mismo estilo de botones.

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

interface FichaDeleteDialogProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting?: boolean;
}

export function FichaDeleteDialog({
  open,
  onConfirm,
  onCancel,
  isDeleting = false,
}: FichaDeleteDialogProps) {
  // onOpenChange handles the close from ESC / overlay click.
  // AlertDialogCancel closes the dialog automatically (Radix) and fires onOpenChange(false).
  // We do NOT pass onClick={onCancel} to AlertDialogCancel to avoid calling onCancel twice.
  return (
    <AlertDialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onCancel(); }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Eliminar ficha?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción eliminará la ficha del tablero. No se puede deshacer.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>
            Cancelar
          </AlertDialogCancel>
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
