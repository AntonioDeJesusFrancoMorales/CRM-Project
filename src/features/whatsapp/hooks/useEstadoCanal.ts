import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import type { EstadoCanal } from '@/api/types';

interface EstadoResponse {
  estado: EstadoCanal;
}

export function useEstadoCanal(
  canalId: string | null,
  enabled = false,
): UseQueryResult<EstadoResponse> {
  return useQuery<EstadoResponse>({
    queryKey: ['wa-canal-estado', canalId],
    queryFn: () => apiClient.get<EstadoResponse>(endpoints.wa.canales.estado(canalId!)),
    enabled: enabled && !!canalId,
    refetchInterval: (query) => {
      const estado = query.state.data?.estado;
      // Deja de hacer polling cuando está conectado
      return estado === 'ACTIVO' ? false : 3000;
    },
    refetchIntervalInBackground: false,
  });
}
