import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '@/api/client';
import { isHttpError } from '@/api/http-error';
import type { Usuario } from '@/api/types';
import { usuariosKeys } from './useUsuarios';

/**
 * Desactiva un usuario vía endpoint dedicado PATCH /usuarios/:id/desactivar.
 *
 * Asimetría intencional (ADR-018): para desactivar existe este endpoint dedicado.
 * Para reactivar, usa useUpdateUsuario con { activo: true } — no existe endpoint /activar.
 */
export function useDesactivarUsuario(): UseMutationResult<Usuario, Error, string> {
  const queryClient = useQueryClient();

  return useMutation<Usuario, Error, string>({
    mutationFn: (id) => apiClient.patch<Usuario>(`/usuarios/${id}/desactivar`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: usuariosKeys.list() });
      toast.success('Usuario desactivado');
    },
    onError: (error) => {
      if (isHttpError(error)) {
        toast.error(error.message);
      } else {
        toast.error('No fue posible desactivar el usuario');
      }
    },
  });
}
