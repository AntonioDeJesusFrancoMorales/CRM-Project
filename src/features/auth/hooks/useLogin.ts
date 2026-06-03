import { loginWithKeycloak } from '@/lib/keycloak';
import { toast } from 'sonner';

export function useLogin() {
  const login = async () => {
    try {
      await loginWithKeycloak();
    } catch (error) {
      toast.error('Error al iniciar sesión con Keycloak');
      console.error('Login error:', error);
    }
  };

  return {
    mutate: login,
    mutateAsync: async () => {
      await login();
    },
    isPending: false,
    isSuccess: false,
    isError: false,
    error: null,
  };
}
