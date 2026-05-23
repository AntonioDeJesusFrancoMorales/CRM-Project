import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '@/api/client';
import { isHttpError } from '@/api/http-error';
import { stringsToNulls } from '@/lib/form-utils';
import type { Prospecto } from '@/api/types';
import type { ProspectoCreateInput } from '../schemas/prospecto.schema';
import { prospectosKeys } from './useProspectos';

export function useCreateProspecto(): UseMutationResult<Prospecto, Error, ProspectoCreateInput> {
  const queryClient = useQueryClient();

  return useMutation<Prospecto, Error, ProspectoCreateInput>({
    mutationFn: (input) => apiClient.post<Prospecto>('/prospectos', stringsToNulls(input)),
    onSuccess: (created) => {
      void queryClient.invalidateQueries({ queryKey: prospectosKeys.list() });
      toast.success(`Prospecto "${created.nombre_contacto}" creado`);
    },
    onError: (error) => {
      if (isHttpError(error)) {
        if (error.status === 422) return; // El form mapea details inline.
        toast.error(error.message);
      } else {
        toast.error('No fue posible crear el prospecto');
      }
    },
  });
}
