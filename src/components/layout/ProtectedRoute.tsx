import { Navigate, Outlet, useLocation } from 'react-router';
import { useAuthStore } from '@/store/authStore';
import { isKeycloakAuthenticated } from '@/lib/keycloak';

export function ProtectedRoute() {
  const token = useAuthStore((s) => s.token);
  const location = useLocation();
  const authenticated = isKeycloakAuthenticated();

  if (!token && !authenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}
