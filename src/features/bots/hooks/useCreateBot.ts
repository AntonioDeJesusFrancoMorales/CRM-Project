import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import { isHttpError } from '@/api/http-error';
import type { Bot } from '@/api/types';
import type { BotCreateInput } from '../schemas/bot.schema';
import { botsKeys } from './useBots';

export function useCreateBot(): UseMutationResult<Bot, Error, BotCreateInput> {
  const queryClient = useQueryClient();

  return useMutation<Bot, Error, BotCreateInput>({
    mutationFn: ({ canalId, ...rest }) =>
      apiClient.post<Bot>(endpoints.bots.create(), { ...rest, canalId: canalId || undefined }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: botsKeys.all });
      // El toast de éxito NO se dispara acá: el dialog de creación abre el diálogo
      // con el api_access_token para copiarlo — ver BotFormDialog.
    },
    onError: (error) => {
      if (isHttpError(error)) {
        if (error.status === 422) return; // El form mapea details inline.
        toast.error(error.message);
      } else {
        toast.error('No fue posible crear el bot');
      }
    },
  });
}
