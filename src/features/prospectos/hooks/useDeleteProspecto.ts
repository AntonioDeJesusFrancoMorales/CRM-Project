import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '@/api/client';
import { isHttpError } from '@/api/http-error';
import { prospectosKeys } from './useProspectos';

export function useDeleteProspecto(): UseMutationResult<void, Error, string> {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: (id) => apiClient.delete<void>(`/prospectos/${id}`),
    onSuccess: (_void, id) => {
      queryClient.removeQueries({ queryKey: prospectosKeys.detail(id) });
      void queryClient.invalidateQueries({ queryKey: prospectosKeys.list() });
      toast.success('Prospecto eliminado');
    },
    onError: (error) => {
      if (isHttpError(error)) {
        if (error.status === 404) {
          toast.message('El prospecto ya fue eliminado');
          void queryClient.invalidateQueries({ queryKey: prospectosKeys.list() });
          return;
        }
        toast.error(error.message);
      } else {
        toast.error('No fue posible eliminar el prospecto');
      }
    },
  });
}
