import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import { isHttpError } from '@/api/http-error';
import type { Usuario } from '@/api/types';
import type { UsuarioUpdateInput } from '../schemas/usuario.schema';
import { usuariosKeys } from './useUsuarios';
import { permissionsKeys } from '@/features/permissions/context';
import { USUARIO_DELEGACION_DENEGADA_MSG } from '../lib/authorizationMessages';

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
      void queryClient.invalidateQueries({ queryKey: permissionsKeys.all });
      toast.success(`Usuario "${updated.nombre}" actualizado`);
    },
    onError: (error) => {
      if (isHttpError(error)) {
        if (error.status === 403) {
          toast.error(USUARIO_DELEGACION_DENEGADA_MSG);
          return;
        }
        if ([400, 422].includes(error.status)) return; // El form mapea details inline.
        toast.error(error.message);
      } else {
        toast.error('No fue posible actualizar el usuario');
      }
    },
  });
}
