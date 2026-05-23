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

// ADR-039 T_D.4: ClienteDeleteDialog es puramente presentacional.
// La lógica de DELETE + manejo 409 (toast error) + 204 (navigate) vive en el host
// (ClienteDetailPage). Este componente solo emite onConfirm() y onCancel().

interface ClienteDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nombreContacto: string;
  onConfirm: () => void;
  isDeleting?: boolean;
}

export function ClienteDeleteDialog({
  open,
  onOpenChange,
  nombreContacto,
  onConfirm,
  isDeleting = false,
}: ClienteDeleteDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Eliminar cliente?</AlertDialogTitle>
          <AlertDialogDescription>
            ¿Eliminar a <strong>{nombreContacto}</strong>? Esta acción no se puede
            deshacer. Si el cliente tiene tratos asociados, la eliminación no será
            posible.
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
