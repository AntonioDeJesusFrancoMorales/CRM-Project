import type { Prospecto } from '@/api/types';
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
import { useConvertirProspecto } from '../hooks/useConvertirProspecto';

// REQ-CONV-ACCION-001, REQ-CONV-ACCION-003, REQ-CONV-ACCION-004
// El AlertDialog no invoca el endpoint al cancelar (REQ-CONV-ACCION-003)

interface ConvertirProspectoDialogProps {
  prospecto: Prospecto | null;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function ConvertirProspectoDialog({
  prospecto,
  onOpenChange,
  onSuccess,
}: ConvertirProspectoDialogProps) {
  const mutation = useConvertirProspecto();

  function handleConvertir() {
    if (!prospecto) return;
    mutation.mutate(
      { id: prospecto.id, empresa_id: prospecto.empresa_id },
      {
        onSuccess: () => {
          onOpenChange(false);
          onSuccess?.();
        },
      },
    );
  }

  return (
    <AlertDialog open={!!prospecto} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Convertir a cliente?</AlertDialogTitle>
          <AlertDialogDescription>
            {prospecto && (
              <>
                Estás por convertir a <strong>{prospecto.nombre_contacto}</strong> en
                cliente. Esta acción no se puede deshacer y el prospecto quedará marcado
                como "Convertido".
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={mutation.isPending}>
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConvertir}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? 'Convirtiendo...' : 'Convertir'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
