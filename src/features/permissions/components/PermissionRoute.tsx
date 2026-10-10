import { Outlet } from 'react-router';
import type { AccionPermiso, RecursoCRM } from '@/api/types';
import { usePermissions, type PermissionCheck } from '../context';
import { AccessDeniedView, PermissionLoadingView } from './PermissionState';

export function PermissionRoute({
  resource,
  action = 'LEER',
  anyOf,
}: {
  resource?: RecursoCRM;
  action?: AccionPermiso;
  anyOf?: readonly PermissionCheck[];
}) {
  const permissions = usePermissions();

  if (permissions.status === 'loading') return <PermissionLoadingView />;
  if (permissions.status === 'unavailable') return <Outlet />;

  const allowed = anyOf
    ? permissions.canAny(anyOf)
    : resource
      ? permissions.can(resource, action)
      : true;

  return allowed ? <Outlet /> : <AccessDeniedView resource={resource} />;
}
