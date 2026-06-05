import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import type { Rol } from '@/api/types';

// Factory de query keys de roles — fuente única para la cache de roles.
// El selector de roles del UsuarioForm y la pantalla de Configuración comparten
// estas keys, por lo que invalidar tras crear/editar/eliminar refresca AMBOS.
export const rolesKeys = {
  all: ['roles'] as const,
  list: () => ['roles'] as const,
  detail: (id: string) => ['roles', id] as const,
};

export function useRoles(): UseQueryResult<Rol[]> {
  return useQuery<Rol[]>({
    queryKey: rolesKeys.list(),
    queryFn: () => apiClient.get<Rol[]>(endpoints.roles.getAll()),
  });
}
