import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import { isHttpError } from '@/api/http-error';
import { usuariosKeys } from './useUsuarios';
import { permissionsKeys } from '@/features/permissions/context';

export function useDeleteUsuario(): UseMutationResult<void, Error, string> {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: (id) => apiClient.delete<void>(endpoints.usuarios.delete(id)),
    onSuccess: (_void, id) => {
      queryClient.removeQueries({ queryKey: usuariosKeys.detail(id) });
        void queryClient.invalidateQueries({ queryKey: usuariosKeys.list() });
        void queryClient.invalidateQueries({ queryKey: permissionsKeys.all });
      toast.success('Usuario eliminado');
    },
    onError: (error) => {
      if (isHttpError(error)) {
        if (error.status === 404) {
          toast.message('El usuario ya fue eliminado');
          void queryClient.invalidateQueries({ queryKey: usuariosKeys.list() });
          void queryClient.invalidateQueries({ queryKey: permissionsKeys.all });
          return;
        }
        toast.error(error.message);
      } else {
        toast.error('No fue posible eliminar el usuario');
      }
    },
  });
}
