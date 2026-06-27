import { useEffect, useRef, useState } from 'react';
import { initKeycloak, loginWithKeycloak, getKeycloakUserFromToken } from '@/lib/keycloak';
import { useAuthStore } from '@/store/authStore';
import { useTokenRefresh } from '@/features/auth/hooks/useTokenRefresh';
import { useNavigate, useLocation } from 'react-router';

const BYPASS_AUTH = import.meta.env.VITE_BYPASS_AUTH === 'true';

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [isLoading, setIsLoading] = useState(true);
  const setKeycloakSession = useAuthStore((s) => s.setKeycloakSession);
  const setKeycloakReady = useAuthStore((s) => s.setKeycloakReady);
  const setSession = useAuthStore((s) => s.setSession);
  const navigate = useNavigate();
  const location = useLocation();
  const loginRedirectStarted = useRef(false);
  // Destino al montar la app, capturado UNA sola vez (antes de cualquier navegación).
  // Si refrescaste parado en /tratos, esto guarda '/tratos' y nos deja respetarlo.
  const initialPath = useRef(location.pathname);

  useTokenRefresh();

  useEffect(() => {
    const init = async () => {
      if (BYPASS_AUTH) {
        setSession('mock-dev-token', {
          subject: 'dev-user-id',
          username: 'dev',
          email: 'dev@local.test',
          usuario_id: 'dev-user-id',
          super_usuario_id: null,
          roles: ['admin'],
        });
        setKeycloakReady(true);
        const path = initialPath.current;
        if (path === '/login') {
          navigate('/', { replace: true });
        }
        setIsLoading(false);
        return;
      }

      const authenticated = await initKeycloak();
      setKeycloakReady(true);

      if (authenticated) {
        const user = getKeycloakUserFromToken();
        if (user) {
          setKeycloakSession(user);
        }
        // Si volvés autenticado desde /login, mandamos al Inicio (/).
        // Si refrescaste estando en otra ruta, te quedás donde estabas.
        const path = initialPath.current;
        if (path === '/login') {
          navigate('/', { replace: true });
        }
      } else if (!loginRedirectStarted.current) {
        loginRedirectStarted.current = true;
        await loginWithKeycloak();
        return;
      }

      setIsLoading(false);
    };

    init();
  }, [navigate, setKeycloakSession, setKeycloakReady]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
