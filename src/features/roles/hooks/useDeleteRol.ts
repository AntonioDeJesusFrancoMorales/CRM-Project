import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import { isHttpError } from '@/api/http-error';
import { rolesKeys } from './useRoles';

// Mensaje de la regla de negocio del back: borrar un rol con usuarios asignados → 409.
export const ROL_CON_USUARIOS_MSG = 'Este rol tiene usuarios asignados y no puede eliminarse';

export function useDeleteRol(): UseMutationResult<void, Error, string> {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: (id) => apiClient.delete<void>(endpoints.roles.delete(id)),
    onSuccess: (_void, id) => {
      queryClient.removeQueries({ queryKey: rolesKeys.detail(id) });
      void queryClient.invalidateQueries({ queryKey: rolesKeys.list() });
      toast.success('Rol eliminado');
    },
    onError: (error) => {
      if (isHttpError(error)) {
        if (error.status === 409) {
          toast.error(ROL_CON_USUARIOS_MSG);
          return;
        }
        if (error.status === 404) {
          toast.message('El rol ya fue eliminado');
          void queryClient.invalidateQueries({ queryKey: rolesKeys.list() });
          return;
        }
        toast.error(error.message);
      } else {
        toast.error('No fue posible eliminar el rol');
      }
    },
  });
}
