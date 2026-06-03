import { useEffect, useRef, useState } from 'react';
import { keycloak, initKeycloak, loginWithKeycloak, mapKeycloakProfileToUser } from '@/lib/keycloak';
import { useAuthStore } from '@/store/authStore';
import { useTokenRefresh } from '@/features/auth/hooks/useTokenRefresh';
import { useNavigate } from 'react-router';

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [isLoading, setIsLoading] = useState(true);
  const setKeycloakSession = useAuthStore((s) => s.setKeycloakSession);
  const setKeycloakReady = useAuthStore((s) => s.setKeycloakReady);
  const navigate = useNavigate();
  const loginRedirectStarted = useRef(false);

  useTokenRefresh();

  useEffect(() => {
    const init = async () => {
      const authenticated = await initKeycloak();
      setKeycloakReady(true);

      if (authenticated) {
        const profile = await keycloak.loadUserProfile();
        if (profile) {
          const user = mapKeycloakProfileToUser(profile);
          setKeycloakSession(user);
        }
        navigate('/empresas', { replace: true });
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
