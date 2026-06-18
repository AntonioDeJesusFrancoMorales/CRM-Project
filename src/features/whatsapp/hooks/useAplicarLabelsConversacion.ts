import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import { isHttpError } from '@/api/http-error';
import type { Conversacion } from '@/api/types';
import { conversacionesKeys } from './useConversaciones';

interface AplicarLabelsVars {
  conversacionId: string;
  empresaId: string;
  labels: string[];
}

/**
 * Toggle de bot/handoff desde el panel humano. Mismo contrato que usa el bot de n8n
 * (POST .../labels con api_access_token): mandar ["escalado_humano"] apaga el bot y
 * pasa la conversación a EN_ESPERA; mandar [] la reactiva.
 */
export function useAplicarLabelsConversacion(): UseMutationResult<Conversacion, Error, AplicarLabelsVars> {
  const queryClient = useQueryClient();

  return useMutation<Conversacion, Error, AplicarLabelsVars>({
    mutationFn: ({ conversacionId, labels }) =>
      apiClient.put<Conversacion>(endpoints.wa.conversaciones.labels(conversacionId), { labels }),
    onSuccess: (updated, { empresaId }) => {
      void queryClient.invalidateQueries({ queryKey: conversacionesKeys.list(empresaId) });
      toast.success(updated.botActivo ? 'Bot reactivado' : 'Bot apagado — conversación cedida a un agente');
    },
    onError: (error) => {
      if (isHttpError(error)) {
        toast.error(error.message);
      } else {
        toast.error('No fue posible cambiar el estado del bot');
      }
    },
  });
}
