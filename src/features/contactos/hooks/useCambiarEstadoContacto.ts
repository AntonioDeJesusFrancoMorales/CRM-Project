import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import { isHttpError } from '@/api/http-error';
import type { Contacto, EstadoRelacion, CambiarEstadoPayload } from '@/api/types';
import { contactosKeys } from './useContactos';

interface CambiarEstadoInput {
  id: string;
  nuevoEstado: EstadoRelacion;
}

// Cambia SOLO el estadoRelacion vía el endpoint dedicado del back
// (PUT /contactos/cambiar-estado?id={id} body { nuevoEstado }).
// NO usar useUpdateContacto para esto: su PUT /edit es reemplazo total y exige
// nombre (@NotBlank) — mandar solo el estado devuelve 400.
export function useCambiarEstadoContacto(): UseMutationResult<Contacto, Error, CambiarEstadoInput> {
  const queryClient = useQueryClient();

  return useMutation<Contacto, Error, CambiarEstadoInput>({
    mutationFn: ({ id, nuevoEstado }) =>
      apiClient.put<Contacto>(endpoints.contactos.cambiarEstado(id), {
        nuevoEstado,
      } satisfies CambiarEstadoPayload),
    onSuccess: (updated, { id }) => {
      void queryClient.invalidateQueries({ queryKey: contactosKeys.list() });
      void queryClient.invalidateQueries({ queryKey: contactosKeys.detail(id) });
      toast.success(`Estado de "${updated.nombre}" actualizado`);
    },
    onError: (error) => {
      if (isHttpError(error)) {
        if (error.status === 422) return;
        toast.error(error.message);
      } else {
        toast.error('No fue posible cambiar el estado del contacto');
      }
    },
  });
}
