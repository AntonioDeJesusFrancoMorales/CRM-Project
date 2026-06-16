import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import { isHttpError } from '@/api/http-error';
import type { Mensaje, SendMensajePayload } from '@/api/types';
import { mensajesKeys } from './useMensajes';

interface SendVars {
  conversacionId: string;
  payload: SendMensajePayload;
}

export function useSendMensaje(): UseMutationResult<Mensaje, Error, SendVars> {
  const queryClient = useQueryClient();

  return useMutation<Mensaje, Error, SendVars>({
    mutationFn: ({ conversacionId, payload }) =>
      apiClient.post<Mensaje>(endpoints.wa.mensajes.send(conversacionId), payload),
    onSuccess: (_, { conversacionId }) => {
      void queryClient.invalidateQueries({ queryKey: mensajesKeys.byConversacion(conversacionId) });
    },
    onError: (error) => {
      if (isHttpError(error)) {
        toast.error(error.message);
      } else {
        toast.error('No fue posible enviar el mensaje');
      }
    },
  });
}
