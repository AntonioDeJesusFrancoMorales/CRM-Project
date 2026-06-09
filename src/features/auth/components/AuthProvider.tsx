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
  const navigate = useNavigate();
  const location = useLocation();
  const loginRedirectStarted = useRef(false);
  // Destino al montar la app, capturado UNA sola vez (antes de cualquier navegación).
  // Si refrescaste parado en /tratos, esto guarda '/tratos' y nos deja respetarlo.
  const initialPath = useRef(location.pathname);

  useTokenRefresh();

  useEffect(() => {
    const init = async () => {
      const authenticated = await initKeycloak();
      setKeycloakReady(true);

      if (authenticated) {
        const user = getKeycloakUserFromToken();
        if (user) {
          setKeycloakSession(user);
        }
        // Solo mandamos al default cuando NO hay un destino real: entraste por la raíz
        // o por /login. Si refrescaste estando en otra ruta, te quedás donde estabas.
        const path = initialPath.current;
        if (path === '/' || path === '/login') {
          navigate('/empresas', { replace: true });
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
