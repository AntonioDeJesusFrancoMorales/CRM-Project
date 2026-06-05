import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import { isHttpError } from '@/api/http-error';
import type { Rol } from '@/api/types';
import type { RolCreateInput } from '../schemas/rol.schema';
import { rolesKeys } from './useRoles';

export function useCreateRol(): UseMutationResult<Rol, Error, RolCreateInput> {
  const queryClient = useQueryClient();

  return useMutation<Rol, Error, RolCreateInput>({
    mutationFn: (input) => apiClient.post<Rol>(endpoints.roles.create(), input),
    onSuccess: (created) => {
      void queryClient.invalidateQueries({ queryKey: rolesKeys.list() });
      toast.success(`Rol "${created.nombre}" creado`);
    },
    onError: (error) => {
      if (isHttpError(error)) {
        if (error.status === 422) return; // El form mapea details inline.
        toast.error(error.message);
      } else {
        toast.error('No fue posible crear el rol');
      }
    },
  });
}
