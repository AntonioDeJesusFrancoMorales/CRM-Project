import { useEffect } from 'react';
import { Navigate, Outlet } from 'react-router';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/authStore';
import type { RolSistema } from '@/api/types';

interface RoleGuardProps {
  role: RolSistema;
}

export function RoleGuard({ role }: RoleGuardProps) {
  const usuario = useAuthStore((s) => s.usuario);
  const hasRole = usuario?.rol_sistema === role;

  useEffect(() => {
    if (usuario && !hasRole) {
      toast.error('No tienes permisos para esta sección');
    }
  }, [usuario, hasRole]);

  if (!hasRole) {
    return <Navigate to="/empresas" replace />;
  }

  return <Outlet />;
}
