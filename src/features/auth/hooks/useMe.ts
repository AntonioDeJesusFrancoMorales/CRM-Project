import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import { useAuthStore } from '@/store/authStore';
import { isKeycloakAuthenticated } from '@/lib/keycloak';
import type { Usuario } from '@/api/types';

interface MeResponse {
  usuario: Usuario;
}

export function useMe() {
  const token = useAuthStore((s) => s.token);

  return useQuery<MeResponse, Error>({
    queryKey: ['auth', 'me'],
    queryFn: () => apiClient.get<MeResponse>('/auth/me'),
    enabled: token !== null || isKeycloakAuthenticated(),
    staleTime: 5 * 60 * 1000,
  });
}
