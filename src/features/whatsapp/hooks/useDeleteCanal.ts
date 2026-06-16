import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import { isHttpError } from '@/api/http-error';
import { canalesKeys } from './useCanales';

export function useDeleteCanal(empresaId: string): UseMutationResult<void, Error, string> {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: (id) => apiClient.delete<void>(endpoints.wa.canales.delete(id)),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: canalesKeys.list(empresaId) });
      toast.success('Canal eliminado');
    },
    onError: (error) => {
      if (isHttpError(error)) {
        toast.error(error.message);
      } else {
        toast.error('No fue posible eliminar el canal');
      }
    },
  });
}
