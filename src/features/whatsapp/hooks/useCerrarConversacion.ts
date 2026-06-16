import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import { isHttpError } from '@/api/http-error';
import type { Conversacion } from '@/api/types';
import { conversacionesKeys } from './useConversaciones';

interface CerrarVars {
  conversacionId: string;
  empresaId: string;
}

export function useCerrarConversacion(): UseMutationResult<Conversacion, Error, CerrarVars> {
  const queryClient = useQueryClient();

  return useMutation<Conversacion, Error, CerrarVars>({
    mutationFn: ({ conversacionId }) =>
      apiClient.put<Conversacion>(endpoints.wa.conversaciones.cerrar(conversacionId)),
    onSuccess: (_, { empresaId }) => {
      void queryClient.invalidateQueries({ queryKey: conversacionesKeys.list(empresaId) });
      toast.success('Conversación cerrada');
    },
    onError: (error) => {
      if (isHttpError(error)) {
        toast.error(error.message);
      } else {
        toast.error('No fue posible cerrar la conversación');
      }
    },
  });
}
