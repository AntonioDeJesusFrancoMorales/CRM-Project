import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import { isHttpError } from '@/api/http-error';
import type { MensajeGrupo, TipoMensaje } from '@/api/types';
import { gruposKeys } from './useGrupos';

interface SendVars {
  grupoId: string;
  payload: { tipo: TipoMensaje; contenido?: string; mediaUrl?: string };
}

export function useSendMensajeGrupo(): UseMutationResult<MensajeGrupo, Error, SendVars> {
  const queryClient = useQueryClient();

  return useMutation<MensajeGrupo, Error, SendVars>({
    mutationFn: ({ grupoId, payload }) =>
      apiClient.post<MensajeGrupo>(endpoints.wa.grupos.send(grupoId), payload),
    onSuccess: (_, { grupoId }) => {
      void queryClient.invalidateQueries({ queryKey: gruposKeys.mensajes(grupoId) });
      void queryClient.invalidateQueries({ queryKey: gruposKeys.all });
    },
    onError: (error) => {
      toast.error(isHttpError(error) ? error.message : 'No fue posible enviar el mensaje al grupo');
    },
  });
}
