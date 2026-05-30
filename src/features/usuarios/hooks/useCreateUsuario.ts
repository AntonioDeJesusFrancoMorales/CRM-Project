import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import { isHttpError } from '@/api/http-error';
import type { Usuario } from '@/api/types';
import type { UsuarioCreateInput } from '../schemas/usuario.schema';
import { usuariosKeys } from './useUsuarios';

export function useCreateUsuario(): UseMutationResult<Usuario, Error, UsuarioCreateInput> {
  const queryClient = useQueryClient();

  return useMutation<Usuario, Error, UsuarioCreateInput>({
    mutationFn: (input) => apiClient.post<Usuario>(endpoints.usuarios.create(), input),
    onSuccess: (created) => {
      void queryClient.invalidateQueries({ queryKey: usuariosKeys.list() });
      toast.success(`Usuario "${created.nombre}" creado`);
    },
    onError: (error) => {
      if (isHttpError(error)) {
        if (error.status === 422) return; // El form mapea details inline.
        toast.error(error.message);
      } else {
        toast.error('No fue posible crear el usuario');
      }
    },
  });
}
