import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import { isHttpError } from '@/api/http-error';
import type { Rol } from '@/api/types';
import { normalizeRol } from '@/features/permissions/lib/permissions';
import { permissionsKeys } from '@/features/permissions/context';
import type { RolCreateInput } from '../schemas/rol.schema';
import { rolesKeys } from './useRoles';

export function useCreateRol(): UseMutationResult<Rol, Error, RolCreateInput> {
  const queryClient = useQueryClient();

  return useMutation<Rol, Error, RolCreateInput>({
    mutationFn: async (input) => {
      const created = await apiClient.post<Rol>(endpoints.roles.create(), input);
      return normalizeRol(created);
    },
    onSuccess: (created) => {
      void queryClient.invalidateQueries({ queryKey: rolesKeys.list() });
      void queryClient.invalidateQueries({ queryKey: permissionsKeys.all });
      toast.success(`Rol "${created.nombre}" creado`);
    },
    onError: (error) => {
      if (isHttpError(error)) {
        if ([400, 422].includes(error.status)) return; // El form mapea details inline.
        toast.error(error.message);
      } else {
        toast.error('No fue posible crear el rol');
      }
    },
  });
}
