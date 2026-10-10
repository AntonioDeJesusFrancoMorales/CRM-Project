import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import { isHttpError } from '@/api/http-error';
import type { Contacto, ContactoUpdatePayload } from '@/api/types';
import { normalizeContactoValues } from '../lib/contactoValues';
import { mapContactoServerError } from '../lib/contactoValidation';
import { contactosKeys } from './useContactos';

interface UpdateContactoInput {
  id: string;
  data: ContactoUpdatePayload;
}

export function useUpdateContacto(): UseMutationResult<Contacto, Error, UpdateContactoInput> {
  const queryClient = useQueryClient();

  return useMutation<Contacto, Error, UpdateContactoInput>({
    mutationFn: ({ id, data }) =>
      apiClient.put<Contacto>(endpoints.contactos.edit(id), normalizeContactoValues(data)),
    onSuccess: (updated, { id }) => {
      queryClient.setQueryData<Contacto[]>(contactosKeys.list(), (current) => {
        if (!current) return [updated];

        const existingIndex = current.findIndex((contacto) => contacto.id === updated.id);
        if (existingIndex === -1) return [...current, updated];

        const next = [...current];
        next[existingIndex] = updated;
        return next;
      });
      queryClient.setQueryData(contactosKeys.detail(id), updated);
      void queryClient.invalidateQueries({ queryKey: contactosKeys.list() });
      void queryClient.invalidateQueries({ queryKey: contactosKeys.detail(id) });
      toast.success(`Contacto "${updated.nombre}" actualizado`);
    },
    onError: (error) => {
      if (isHttpError(error)) {
        if (error.status === 422 || (error.status === 400 && error.details?.length)) return;
        const detail = error.details?.[0];
        toast.error(mapContactoServerError(detail ?? { field: '', message: error.message }).message);
      } else {
        toast.error('No fue posible actualizar el contacto');
      }
    },
  });
}
