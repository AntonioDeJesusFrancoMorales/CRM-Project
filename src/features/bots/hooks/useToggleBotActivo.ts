import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import { isHttpError } from '@/api/http-error';
import type { Bot } from '@/api/types';
import { botsKeys } from './useBots';

interface ToggleVars {
  id: string;
  activar: boolean;
}

export function useToggleBotActivo(): UseMutationResult<Bot, Error, ToggleVars> {
  const queryClient = useQueryClient();

  return useMutation<Bot, Error, ToggleVars>({
    mutationFn: ({ id, activar }) =>
      apiClient.put<Bot>(activar ? endpoints.bots.activar(id) : endpoints.bots.desactivar(id)),
    onSuccess: (updated) => {
      void queryClient.invalidateQueries({ queryKey: botsKeys.all });
      toast.success(updated.activo ? `"${updated.nombre}" activado` : `"${updated.nombre}" desactivado`);
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
