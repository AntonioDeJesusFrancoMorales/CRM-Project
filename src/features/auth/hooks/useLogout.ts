// Mutation hook para POST /auth/logout. Best-effort: aunque el endpoint falle,
// limpiamos la sesión local igual.

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import { useAuthStore } from '@/store/authStore';

export function useLogout() {
  const logout = useAuthStore((s) => s.logout);
  const queryClient = useQueryClient();

  return useMutation<void, Error, void>({
    mutationFn: async () => {
      try {
        await apiClient.post('/auth/logout');
      } catch {
        // Ignoramos errores del servidor — el logout local es lo que importa.
      }
    },
    onSettled: () => {
      logout();
      queryClient.clear();
    },
  });
}
