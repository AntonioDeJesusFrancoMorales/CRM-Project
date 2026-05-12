import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '@/api/client';
import { isHttpError } from '@/api/http-error';
import { empresasKeys } from './useEmpresas';

export function useDeleteEmpresa(): UseMutationResult<void, Error, string> {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: (id) => apiClient.delete<void>(`/empresas/${id}`),
    onSuccess: (_void, id) => {
      queryClient.removeQueries({ queryKey: empresasKeys.detail(id) });
      void queryClient.invalidateQueries({ queryKey: empresasKeys.list() });
      toast.success('Empresa eliminada');
    },
    onError: (error) => {
      if (isHttpError(error)) {
        if (error.status === 404) {
          toast.message('La empresa ya fue eliminada');
          void queryClient.invalidateQueries({ queryKey: empresasKeys.list() });
          return;
        }
        toast.error(error.message);
      } else {
        toast.error('No fue posible eliminar la empresa');
      }
    },
  });
}
