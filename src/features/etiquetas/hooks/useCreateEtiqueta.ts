import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import { isHttpError } from '@/api/http-error';
import type { Etiqueta } from '@/api/types';
import type { EtiquetaCreateInput } from '../schemas/etiqueta.schema';
import { etiquetasKeys } from './useEtiquetas';

export function useCreateEtiqueta(): UseMutationResult<Etiqueta, Error, EtiquetaCreateInput> {
  const queryClient = useQueryClient();

  return useMutation<Etiqueta, Error, EtiquetaCreateInput>({
    mutationFn: (input) => apiClient.post<Etiqueta>(endpoints.etiquetas.create(), input),
    onSuccess: (created) => {
      // Invalida TODAS las listas de etiquetas (catálogo full + filtros por tipo).
      void queryClient.invalidateQueries({ queryKey: etiquetasKeys.all });
      toast.success(`Etiqueta "${created.nombre}" creada`);
    },
    onError: (error) => {
      if (isHttpError(error)) {
        if (error.status === 422) return; // El form mapea details inline.
        // 409: nombre duplicado para ese tipo.
        toast.error(error.message);
      } else {
        toast.error('No fue posible crear la etiqueta');
      }
    },
  });
}
