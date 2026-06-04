import { useEffect } from 'react';
import { Navigate, Outlet } from 'react-router';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/authStore';

interface RoleGuardProps {
  role: 'admin';
}

// Determina si el usuario es super usuario basándose en super_usuario_id (ActorContext del back).
// Un super usuario tiene super_usuario_id non-null.
function isSuperUsuario(superUsuarioId: string | null | undefined): boolean {
  return (superUsuarioId ?? null) !== null;
}

export function RoleGuard({ role }: RoleGuardProps) {
  const usuario = useAuthStore((s) => s.usuario);
  // Por ahora el único rol protegido es 'admin'; derivado de super_usuario_id.
  const hasRole = role === 'admin' && isSuperUsuario(usuario?.super_usuario_id);

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
