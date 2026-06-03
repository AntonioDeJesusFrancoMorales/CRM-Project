import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/store/authStore';
import { isKeycloakAuthenticated } from '@/lib/keycloak';
import { useNavigate } from 'react-router';

const TOKEN_REFRESH_INTERVAL = 5 * 60 * 1000;

export function useTokenRefresh() {
  const navigate = useNavigate();
  const token = useAuthStore((s) => s.token);
  const isKeycloakReady = useAuthStore((s) => s.isKeycloakReady);
  const refreshKeycloakToken = useAuthStore((s) => s.refreshKeycloakToken);
  const logout = useAuthStore((s) => s.logout);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    const handleTokenRefresh = async () => {
      if (!isKeycloakAuthenticated()) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        return;
      }

      const success = await refreshKeycloakToken();
      if (!success) {
        await logout();
        navigate('/login', { replace: true });
      }
    };

    if (isKeycloakReady && token && isKeycloakAuthenticated()) {
      intervalRef.current = window.setInterval(handleTokenRefresh, TOKEN_REFRESH_INTERVAL);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isKeycloakReady, token, refreshKeycloakToken, logout, navigate]);
}
