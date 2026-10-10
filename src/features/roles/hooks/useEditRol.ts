import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import { isHttpError } from '@/api/http-error';
import type { Rol } from '@/api/types';
import { normalizeRol } from '@/features/permissions/lib/permissions';
import { permissionsKeys } from '@/features/permissions/context';
import type { RolUpdateInput } from '../schemas/rol.schema';
import { rolesKeys } from './useRoles';

/**
 * Actualiza un rol via PUT /api/roles/edit?id={uuid}.
 * El id va como query param (no en el path). El body sigue EditRolRequest: nombre, descripcion.
 */
export function useEditRol(id: string): UseMutationResult<Rol, Error, RolUpdateInput> {
  const queryClient = useQueryClient();

  return useMutation<Rol, Error, RolUpdateInput>({
    mutationFn: async (input) => {
      const updated = await apiClient.put<Rol>(endpoints.roles.edit(id), input);
      return normalizeRol(updated);
    },
    onSuccess: (updated) => {
      void queryClient.invalidateQueries({ queryKey: rolesKeys.list() });
      void queryClient.invalidateQueries({ queryKey: rolesKeys.detail(id) });
      void queryClient.invalidateQueries({ queryKey: permissionsKeys.all });
      toast.success(`Rol "${updated.nombre}" actualizado`);
    },
    onError: (error) => {
      if (isHttpError(error)) {
        if ([400, 422].includes(error.status)) return; // El form mapea details inline.
        toast.error(error.message);
      } else {
        toast.error('No fue posible actualizar el rol');
      }
    },
  });
}
