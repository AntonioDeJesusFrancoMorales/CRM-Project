import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import { isHttpError } from '@/api/http-error';
import type { Contacto, ContactoUpdatePayload } from '@/api/types';
import { contactosKeys } from './useContactos';

interface UpdateContactoInput {
  id: string;
  data: ContactoUpdatePayload;
}

export function useUpdateContacto(): UseMutationResult<Contacto, Error, UpdateContactoInput> {
  const queryClient = useQueryClient();

  return useMutation<Contacto, Error, UpdateContactoInput>({
    mutationFn: ({ id, data }) =>
      apiClient.put<Contacto>(endpoints.contactos.edit(id), data),
    onSuccess: (updated, { id }) => {
      void queryClient.invalidateQueries({ queryKey: contactosKeys.list() });
      void queryClient.invalidateQueries({ queryKey: contactosKeys.detail(id) });
      toast.success(`Contacto "${updated.nombre}" actualizado`);
    },
    onError: (error) => {
      if (isHttpError(error)) {
        if (error.status === 422) return;
        toast.error(error.message);
      } else {
        toast.error('No fue posible actualizar el contacto');
      }
    },
  });
}
