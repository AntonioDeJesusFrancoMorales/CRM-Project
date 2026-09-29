import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import { isHttpError } from '@/api/http-error';
import type { Trato } from '@/api/types';
import { getContactoDeleteErrorMessage } from '../lib/contactoErrors';
import { contactosKeys } from './useContactos';

export function useDeleteContacto(tratos: Trato[] = []): UseMutationResult<void, Error, string> {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: (id) => apiClient.delete<void>(endpoints.contactos.delete(id)),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: contactosKeys.list() });
      toast.success('Contacto eliminado');
    },
    onError: (error) => {
      if (isHttpError(error)) {
        toast.error(getContactoDeleteErrorMessage(error, tratos));
      } else {
        toast.error('No fue posible eliminar el contacto');
      }
    },
  });
}
