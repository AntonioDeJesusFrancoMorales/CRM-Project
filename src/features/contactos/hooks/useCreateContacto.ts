import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import { isHttpError } from '@/api/http-error';
import type { Contacto, ContactoCreatePayload } from '@/api/types';
import { normalizeContactoValues } from '../lib/contactoValues';
import { mapContactoServerError } from '../lib/contactoValidation';
import { contactosKeys } from './useContactos';

export function useCreateContacto(): UseMutationResult<Contacto, Error, ContactoCreatePayload> {
  const queryClient = useQueryClient();

  return useMutation<Contacto, Error, ContactoCreatePayload>({
    mutationFn: (payload) =>
      apiClient.post<Contacto>(
        endpoints.contactos.create(),
        normalizeContactoValues(payload),
      ),
    onSuccess: (created) => {
      queryClient.setQueryData<Contacto[]>(contactosKeys.list(), (current) => {
        if (!current) return [created];

        const existingIndex = current.findIndex((contacto) => contacto.id === created.id);
        if (existingIndex === -1) return [...current, created];

        const next = [...current];
        next[existingIndex] = created;
        return next;
      });
      void queryClient.invalidateQueries({ queryKey: contactosKeys.list() });
      toast.success(`Contacto "${created.nombre}" creado`);
    },
    onError: (error) => {
      if (isHttpError(error)) {
        if (error.status === 422) return; // El form mapea details inline.
        const detail = error.details?.[0];
        toast.error(mapContactoServerError(detail ?? { field: '', message: error.message }).message);
      } else {
        toast.error('No fue posible crear el contacto');
      }
    },
  });
}
