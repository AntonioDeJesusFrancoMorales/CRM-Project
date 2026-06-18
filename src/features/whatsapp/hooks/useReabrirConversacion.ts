import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import { isHttpError } from '@/api/http-error';
import type { Conversacion } from '@/api/types';
import { conversacionesKeys } from './useConversaciones';

interface ReabrirVars {
  conversacionId: string;
  empresaId: string;
}

export function useReabrirConversacion(): UseMutationResult<Conversacion, Error, ReabrirVars> {
  const queryClient = useQueryClient();

  return useMutation<Conversacion, Error, ReabrirVars>({
    mutationFn: ({ conversacionId }) =>
      apiClient.put<Conversacion>(endpoints.wa.conversaciones.reabrir(conversacionId)),
    onSuccess: (_, { empresaId }) => {
      void queryClient.invalidateQueries({ queryKey: conversacionesKeys.list(empresaId) });
      toast.success('Conversación reabierta');
    },
    onError: (error) => {
      toast.error(isHttpError(error) ? error.message : 'No fue posible reabrir la conversación');
    },
  });
}
