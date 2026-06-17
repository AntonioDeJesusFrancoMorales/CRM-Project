import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import { isHttpError } from '@/api/http-error';
import type { EstadoCanal } from '@/api/types';
import { canalesKeys } from './useCanales';

export interface ConectarCanalResult {
  qrBase64: string | null;
  estado: EstadoCanal;
}

export function useConectarCanal(): UseMutationResult<ConectarCanalResult, Error, string> {
  const queryClient = useQueryClient();

  return useMutation<ConectarCanalResult, Error, string>({
    mutationFn: (id) =>
      apiClient.post<ConectarCanalResult>(endpoints.wa.canales.conectar(id), {}),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: canalesKeys.all });
    },
    onError: (error) => {
      if (isHttpError(error)) {
        toast.error(error.message);
      } else {
        toast.error('No se pudo conectar con Evolution API');
      }
    },
  });
}
