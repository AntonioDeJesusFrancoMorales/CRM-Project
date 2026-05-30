import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import type { Usuario } from '@/api/types';

export const usuariosKeys = {
  all: ['usuarios'] as const,
  list: () => ['usuarios'] as const,
  detail: (id: string) => ['usuarios', id] as const,
};

export function useUsuarios(): UseQueryResult<Usuario[]> {
  return useQuery<Usuario[]>({
    queryKey: usuariosKeys.list(),
    queryFn: () => apiClient.get<Usuario[]>(endpoints.usuarios.getAll()),
  });
}
