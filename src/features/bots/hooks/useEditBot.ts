import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import { isHttpError } from '@/api/http-error';
import type { Bot } from '@/api/types';
import type { BotUpdateInput } from '../schemas/bot.schema';
import { botsKeys } from './useBots';

export function useEditBot(id: string): UseMutationResult<Bot, Error, BotUpdateInput> {
  const queryClient = useQueryClient();

  return useMutation<Bot, Error, BotUpdateInput>({
    mutationFn: ({ canalId, ...rest }) =>
      apiClient.put<Bot>(endpoints.bots.edit(id), { ...rest, canalId: canalId || undefined }),
    onSuccess: (updated) => {
      void queryClient.invalidateQueries({ queryKey: botsKeys.all });
      toast.success(`Bot "${updated.nombre}" actualizado`);
    },
    onError: (error) => {
      if (isHttpError(error)) {
        if (error.status === 422) return;
        toast.error(error.message);
      } else {
        toast.error('No fue posible actualizar el bot');
      }
    },
  });
}
