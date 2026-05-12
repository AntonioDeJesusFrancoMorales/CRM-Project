// Query hook para GET /auth/me. Cache key: ['auth', 'me'].
// Solo se ejecuta cuando hay token en authStore (gating con `enabled`).

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import { useAuthStore } from '@/store/authStore';
import type { Usuario } from '@/api/types';

interface MeResponse {
  usuario: Usuario;
}

export function useMe() {
  const token = useAuthStore((s) => s.token);

  return useQuery<MeResponse, Error>({
    queryKey: ['auth', 'me'],
    queryFn: () => apiClient.get<MeResponse>('/auth/me'),
    enabled: token !== null,
    staleTime: 5 * 60 * 1000, // 5 min — el usuario no cambia seguido
  });
}
