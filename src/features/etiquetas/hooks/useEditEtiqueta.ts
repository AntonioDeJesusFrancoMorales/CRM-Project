import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import { isHttpError } from '@/api/http-error';
import type { Etiqueta } from '@/api/types';
import type { EtiquetaUpdateInput } from '../schemas/etiqueta.schema';
import { etiquetasKeys } from './useEtiquetas';

/**
 * Actualiza una etiqueta via PUT /api/etiquetas/edit?id={uuid}.
 * El back solo permite cambiar nombre y color — el tipo es INMUTABLE.
 * Editar el catálogo actualiza universalmente todas las fichas que la referencian.
 */
export function useEditEtiqueta(id: string): UseMutationResult<Etiqueta, Error, EtiquetaUpdateInput> {
  const queryClient = useQueryClient();

  return useMutation<Etiqueta, Error, EtiquetaUpdateInput>({
    mutationFn: (input) => apiClient.put<Etiqueta>(endpoints.etiquetas.edit(id), input),
    onSuccess: (updated) => {
      void queryClient.invalidateQueries({ queryKey: etiquetasKeys.all });
      // Las fichas embeben solo el id de la etiqueta, así que el join del kanban
      // se refresca al invalidar el catálogo. No hace falta invalidar fichas.
      toast.success(`Etiqueta "${updated.nombre}" actualizada`);
    },
    onError: (error) => {
      if (isHttpError(error)) {
        if (error.status === 422) return; // El form mapea details inline.
        toast.error(error.message);
      } else {
        toast.error('No fue posible actualizar la etiqueta');
      }
    },
  });
}
