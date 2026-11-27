import { useEffect, useRef, useState } from 'react';
import { initKeycloak, loginWithKeycloak, getKeycloakUserFromToken } from '@/lib/keycloak';
import { useAuthStore } from '@/store/authStore';
import { useTokenRefresh } from '@/features/auth/hooks/useTokenRefresh';
import { useNavigate, useLocation } from 'react-router';

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
      const mockDevelopment = import.meta.env.DEV && import.meta.env.VITE_ENABLE_MSW === 'true';
      if (mockDevelopment || import.meta.env.VITE_BYPASS_AUTH === 'true') {
        setSession(
          'mock-dev-token',
          mockDevelopment
            ? {
                // Coincide con el usuario y rol Administrador de los fixtures de MSW.
                displayName: 'Ana Torres',
                subject: '8b43ac67-3c03-4804-ab09-40e3b7476940',
                username: 'admin',
                email: 'admin@pipely.local',
                usuario_id: 'b2000000-0000-4000-8000-000000000001',
                super_usuario_id: null,
                roles: ['admin'],
              }
            : {
                subject: 'dev-user-id',
                username: 'dev',
                email: 'dev@local.test',
                usuario_id: 'dev-user-id',
                super_usuario_id: null,
                roles: ['admin'],
              },
        );
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
  }, [navigate, setKeycloakSession, setKeycloakReady, setSession]);

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
