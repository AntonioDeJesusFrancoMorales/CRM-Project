import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import { isHttpError } from '@/api/http-error';
import type { Usuario } from '@/api/types';
import type { UsuarioUpdateInput } from '../schemas/usuario.schema';
import { usuariosKeys } from './useUsuarios';

/**
 * Actualiza un usuario via PUT /api/usuarios/edit?id={uuid}.
 * El id va como query param (no en el path).
 * El body sigue EditUsuarioRequest: nombre, correo, rolId (opcional).
 * No envía activo ni initialPassword.
 */
export function useEditUsuario(id: string): UseMutationResult<Usuario, Error, UsuarioUpdateInput> {
  const queryClient = useQueryClient();

  return useMutation<Usuario, Error, UsuarioUpdateInput>({
    mutationFn: (input) => apiClient.put<Usuario>(endpoints.usuarios.edit(id), input),
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
