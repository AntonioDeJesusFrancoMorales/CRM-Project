// useEmpresa — resuelve client-side desde la cache ['empresas'].
// Si la cache está vacía, dispara get-all y filtra por id.
// El back no expone GET /empresas/get-by-id, por eso no usamos endpoints.empresas.getById.

import { useQuery, useQueryClient, type UseQueryResult } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import type { Empresa } from '@/api/types';
import { empresasKeys } from './useEmpresas';

export function useEmpresa(id: string | undefined): UseQueryResult<Empresa> {
  const queryClient = useQueryClient();

  return useQuery<Empresa>({
    queryKey: empresasKeys.detail(id ?? ''),
    queryFn: async () => {
      // Intentar resolver desde la cache del listado primero.
      const cached = queryClient.getQueryData<Empresa[]>(empresasKeys.list());
      if (cached) {
        const found = cached.find((e) => e.id === id);
        if (found) return found;
        // La lista está en cache pero no contiene el id: empresa no existe.
        return Promise.reject(new Error('Empresa no encontrada'));
      }
      // Cache vacía: fetch get-all y filtrar.
      const list = await apiClient.get<Empresa[]>(endpoints.empresas.getAll());
      // Poblar la cache del listado para que useEmpresas no repita la llamada.
      queryClient.setQueryData(empresasKeys.list(), list);
      const found = list.find((e) => e.id === id);
      if (!found) return Promise.reject(new Error('Empresa no encontrada'));
      return found;
    },
    enabled: !!id,
  });
}
