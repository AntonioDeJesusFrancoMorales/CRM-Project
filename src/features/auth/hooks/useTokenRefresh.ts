import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/store/authStore';
import { isKeycloakAuthenticated, registerOnTokenExpired, MIN_VALIDITY, REFRESH_INTERVAL } from '@/lib/keycloak';
import { useNavigate } from 'react-router';

export function useTokenRefresh() {
  const navigate = useNavigate();
  const token = useAuthStore((s) => s.token);
  const isKeycloakReady = useAuthStore((s) => s.isKeycloakReady);
  const refreshKeycloakToken = useAuthStore((s) => s.refreshKeycloakToken);
  const handleSessionExpired = useAuthStore((s) => s.handleSessionExpired);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    // Refresca con MARGEN (no al filo del lifespan). Si el refresh es imposible
    // (refresh token / SSO session vencidos), corta la sesión de forma limpia.
    const refreshWithMargin = async () => {
      if (!isKeycloakAuthenticated()) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        return;
      }

      const success = await refreshKeycloakToken(MIN_VALIDITY);
      if (!success) {
        await handleSessionExpired();
        navigate('/login', { replace: true });
      }
    };

    if (!(isKeycloakReady && token && isKeycloakAuthenticated())) {
      return;
    }

    // Capa 1: intervalo proactivo con margen.
    intervalRef.current = window.setInterval(refreshWithMargin, REFRESH_INTERVAL);

    // Capa 3: red de seguridad. Si el token expira pese al intervalo, intentamos refrescar;
    // si falla, corte de sesión. unregister se llama en el cleanup para no fugar el callback.
    const unregister = registerOnTokenExpired(() => {
      void refreshWithMargin();
    });

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      unregister();
    };
  }, [isKeycloakReady, token, refreshKeycloakToken, handleSessionExpired, navigate]);
}
