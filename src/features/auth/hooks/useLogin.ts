// Mutation hook para POST /auth/login. Persiste sesión y cachea usuario.
// El componente que lo usa decide el redirect post-éxito vía mutate options.

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import { useAuthStore } from '@/store/authStore';
import { isHttpError } from '@/api/http-error';
import { toast } from 'sonner';
import type { LoginResponse } from '@/api/types';
import type { LoginInput } from '@/features/auth/schemas/login.schema';

export function useLogin() {
  const setSession = useAuthStore((s) => s.setSession);
  const queryClient = useQueryClient();

  return useMutation<LoginResponse, Error, LoginInput>({
    mutationFn: (input) => apiClient.post<LoginResponse>('/auth/login', input),
    onSuccess: ({ token, usuario }) => {
      setSession(token, usuario);
      queryClient.setQueryData(['auth', 'me'], { usuario });
    },
    onError: (error) => {
      if (isHttpError(error)) {
        // 422: el LoginForm mapea los detalles a setError por campo (inline).
        if (error.status === 422) return;
        // 401 y resto de errores: toast con el mensaje del backend.
        toast.error(error.message);
      } else {
        toast.error('No fue posible conectar con el servidor');
      }
    },
  });
}
