import type { ReactNode } from 'react';
import type { AccionPermiso, GrupoSensible, RecursoCRM } from '@/api/types';
import { usePermissions, type PermissionCheck } from '../context';

export function PermissionLoadingView() {
  return (
    <div className="flex min-h-64 items-center justify-center p-6" role="status" aria-busy="true">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="h-7 w-7 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-sm text-muted-foreground">Verificando permisos CRM...</p>
      </div>
    </div>
  );
}

export function AccessDeniedView({ resource }: { resource?: RecursoCRM }) {
  return (
    <div className="flex min-h-64 items-center justify-center p-6">
      <div className="max-w-md space-y-2 text-center">
        <h1 className="text-lg font-semibold">Acceso no permitido</h1>
        <p className="text-sm text-muted-foreground">
          No tenés permiso CRM para leer{resource ? ` ${resource}` : ' este recurso'}. El backend sigue siendo la autoridad.
        </p>
      </div>
    </div>
  );
}

export function PermissionsUnavailableBanner() {
  const permissions = usePermissions();
  if (!permissions.providerActive || permissions.status !== 'unavailable') return null;

  return (
    <div
      role="status"
      className="border-b border-amber-300/60 bg-amber-50 px-4 py-2 text-center text-xs text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100"
    >
      No se pudieron resolver tus permisos CRM. La API seguirá decidiendo cada operación y puede responder 403.
    </div>
  );
}

interface PermissionRouteFallbackProps {
  resource?: RecursoCRM;
  action?: AccionPermiso;
  anyOf?: readonly PermissionCheck[];
  children: ReactNode;
  fallback?: ReactNode;
}

export function PermissionGate({
  resource,
  action = 'LEER',
  anyOf,
  children,
  fallback = null,
}: PermissionRouteFallbackProps) {
  const permissions = usePermissions();
  if (permissions.status === 'loading') return <>{fallback}</>;
  if (permissions.status === 'unavailable') return <>{children}</>;

  const allowed = anyOf
    ? permissions.canAny(anyOf)
    : resource
      ? permissions.can(resource, action)
      : false;
  return allowed ? <>{children}</> : <>{fallback}</>;
}

export function SensitiveField({
  resource,
  group,
  children,
  fallback = <span className="block text-muted-foreground">Sin permiso</span>,
}: {
  resource: RecursoCRM;
  group: GrupoSensible;
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const permissions = usePermissions();
  if (permissions.status === 'loading') return <span className="text-muted-foreground">Verificando permiso...</span>;
  if (permissions.status === 'unavailable') {
    return <span className="text-muted-foreground">Permiso no disponible</span>;
  }
  return permissions.canReadGroup(resource, group) ? <>{children}</> : <>{fallback}</>;
}

export function SensitiveWriteNotice({
  resource,
  group,
  children,
  fallback,
}: {
  resource: RecursoCRM;
  group: GrupoSensible;
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const permissions = usePermissions();
  const notice = fallback ?? (
    <p className="text-xs text-muted-foreground">
      {permissions.status === 'resolved'
        ? 'No tenés permiso de escritura para este grupo sensible.'
        : 'No se pudo verificar el permiso de escritura; el dato sensible queda bloqueado.'}
    </p>
  );

  if (permissions.status !== 'resolved') {
    return <>{notice}</>;
  }
  if (!permissions.canWriteGroup(resource, group)) return null;
  return <>{children}</>;
}
