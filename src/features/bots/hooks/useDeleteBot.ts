import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import { isHttpError } from '@/api/http-error';
import { botsKeys } from './useBots';

export function useDeleteBot(): UseMutationResult<void, Error, string> {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: (id) => apiClient.delete<void>(endpoints.bots.delete(id)),
    onSuccess: (_void, id) => {
      queryClient.removeQueries({ queryKey: botsKeys.detail(id) });
      void queryClient.invalidateQueries({ queryKey: botsKeys.all });
      toast.success('Bot eliminado');
    },
    onError: (error) => {
      if (isHttpError(error)) {
        toast.error(error.message);
      } else {
        toast.error('No fue posible eliminar el bot');
      }
    },
  });
}
