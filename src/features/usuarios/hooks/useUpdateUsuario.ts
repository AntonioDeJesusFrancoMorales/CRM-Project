import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '@/api/client';
import { isHttpError } from '@/api/http-error';
import { stringsToNulls } from '@/lib/form-utils';
import type { Usuario } from '@/api/types';
import type { UsuarioUpdateInput } from '../schemas/usuario.schema';
import { usuariosKeys } from './useUsuarios';

/**
 * Actualiza un usuario vía PATCH /usuarios/:id.
 *
 * También se usa para reactivar a un usuario pasando `{ activo: true }` como
 * argumento — la reactivación no tiene endpoint dedicado (asimetría intencional, ver ADR-018).
 *
 * Para desactivar, usa `useDesactivarUsuario` que apunta al endpoint dedicado
 * PATCH /usuarios/:id/desactivar.
 *
 * @param id - ID del usuario a actualizar.
 */
export function useUpdateUsuario(id: string): UseMutationResult<Usuario, Error, UsuarioUpdateInput> {
  const queryClient = useQueryClient();

  return useMutation<Usuario, Error, UsuarioUpdateInput>({
    mutationFn: (input) =>
      apiClient.patch<Usuario>(`/usuarios/${id}`, stringsToNulls(input as Record<string, unknown>)),
    onSuccess: (updated) => {
      void queryClient.invalidateQueries({ queryKey: usuariosKeys.list() });
      void queryClient.invalidateQueries({ queryKey: usuariosKeys.detail(id) });
      toast.success(`Usuario "${updated.nombre}" actualizado`);
    },
    onError: (error) => {
      if (isHttpError(error)) {
        if (error.status === 422) return; // El form mapea details inline.
        toast.error(error.message);
      } else {
        toast.error('No fue posible actualizar el usuario');
      }
    },
  });
}
