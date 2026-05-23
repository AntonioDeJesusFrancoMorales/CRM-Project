import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '@/api/client';
import { isHttpError } from '@/api/http-error';
import { stringsToNulls } from '@/lib/form-utils';
import type { Prospecto } from '@/api/types';
import type { ProspectoUpdateInput } from '../schemas/prospecto.schema';
import { prospectosKeys } from './useProspectos';

// ADR-026: edición post-conversión permite solo notas (bloqueo en el form, no en el hook).
// El hook no cambia su contrato; la restricción se aplica vía prop isLocked en ProspectoForm.
export function useUpdateProspecto(
  id: string,
): UseMutationResult<Prospecto, Error, ProspectoUpdateInput> {
  const queryClient = useQueryClient();

  return useMutation<Prospecto, Error, ProspectoUpdateInput>({
    mutationFn: (input) =>
      apiClient.patch<Prospecto>(`/prospectos/${id}`, stringsToNulls(input as Record<string, unknown>)),
    onSuccess: (updated) => {
      void queryClient.invalidateQueries({ queryKey: prospectosKeys.list() });
      void queryClient.invalidateQueries({ queryKey: prospectosKeys.detail(id) });
      toast.success(`Prospecto "${updated.nombre_contacto}" actualizado`);
    },
    onError: (error) => {
      if (isHttpError(error)) {
        if (error.status === 422) return; // El form mapea details inline.
        toast.error(error.message);
      } else {
        toast.error('No fue posible actualizar el prospecto');
      }
    },
  });
}
