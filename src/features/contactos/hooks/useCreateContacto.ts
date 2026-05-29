import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import { isHttpError } from '@/api/http-error';
import type { Contacto, ContactoCreatePayload } from '@/api/types';
import { contactosKeys } from './useContactos';

export function useCreateContacto(): UseMutationResult<Contacto, Error, ContactoCreatePayload> {
  const queryClient = useQueryClient();

  return useMutation<Contacto, Error, ContactoCreatePayload>({
    mutationFn: (payload) =>
      apiClient.post<Contacto>(endpoints.contactos.create(), payload),
    onSuccess: (created) => {
      void queryClient.invalidateQueries({ queryKey: contactosKeys.list() });
      toast.success(`Contacto "${created.nombre}" creado`);
    },
    onError: (error) => {
      if (isHttpError(error)) {
        if (error.status === 422) return; // El form mapea details inline.
        toast.error(error.message);
      } else {
        toast.error('No fue posible crear el contacto');
      }
    },
  });
}
