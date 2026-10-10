import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useQuery, type QueryObserverResult } from '@tanstack/react-query';
import type {
  AccionPermiso,
  GrupoSensible,
  PermisoRecurso,
  RecursoCRM,
} from '@/api/types';
import { useAuthStore } from '@/store/authStore';
import {
  canFromPermisos,
  canReadGroupFromPermisos,
  canWriteGroupFromPermisos,
} from './lib/permissions';
import { resolveCapabilities, type ResolvedCapabilities } from './lib/resolver';

export const permissionsKeys = {
  all: ['permissions'] as const,
  capabilities: (usuarioId: string) => ['permissions', 'capabilities', usuarioId] as const,
};

export type PermissionStatus = 'loading' | 'resolved' | 'unavailable';

export interface PermissionCheck {
  resource: RecursoCRM;
  action: AccionPermiso;
}

export interface PermissionsContextValue {
  status: PermissionStatus;
  error: unknown;
  usuario: ResolvedCapabilities['usuario'] | undefined;
  rol: ResolvedCapabilities['rol'] | undefined;
  permisos: PermisoRecurso[];
  can: (resource: RecursoCRM, action: AccionPermiso) => boolean;
  canAny: (checks: readonly PermissionCheck[]) => boolean;
  canAll: (checks: readonly PermissionCheck[]) => boolean;
  allowsAll: (checks: readonly PermissionCheck[]) => boolean;
  canReadGroup: (resource: RecursoCRM, group: GrupoSensible) => boolean;
  canWriteGroup: (resource: RecursoCRM, group: GrupoSensible) => boolean;
  /** Permite UX optimista solo cuando el resolver no pudo obtener capacidades. */
  allows: (resource: RecursoCRM, action: AccionPermiso) => boolean;
  refetch: () => Promise<QueryObserverResult<ResolvedCapabilities, Error>>;
  providerActive: boolean;
}

const unavailableContext: PermissionsContextValue = {
  status: 'unavailable',
  error: undefined,
  usuario: undefined,
  rol: undefined,
  permisos: [],
  can: () => false,
  canAny: () => false,
  canAll: () => false,
  allowsAll: () => true,
  canReadGroup: () => false,
  canWriteGroup: () => false,
  allows: () => true,
  refetch: async () => ({
    data: undefined,
    error: null,
    isError: false,
    isPending: false,
    isLoading: false,
    isSuccess: false,
    isFetching: false,
  }) as unknown as QueryObserverResult<ResolvedCapabilities, Error>,
  providerActive: false,
};

const PermissionsContext = createContext<PermissionsContextValue>(unavailableContext);

export function PermissionsProvider({ children }: { children: ReactNode }) {
  const usuarioId = useAuthStore((state) => state.usuario?.usuario_id ?? '');
  const query = useQuery<ResolvedCapabilities, Error>({
    queryKey: permissionsKeys.capabilities(usuarioId),
    queryFn: () => resolveCapabilities(usuarioId),
    enabled: Boolean(usuarioId),
    retry: false,
    staleTime: 30 * 1000,
  });

  const value = useMemo<PermissionsContextValue>(() => {
    const status: PermissionStatus = !usuarioId
      ? 'unavailable'
      : query.isPending
        ? 'loading'
        : query.isSuccess && query.data
          ? 'resolved'
          : 'unavailable';
    const permisos = query.data?.permisos ?? [];
    const can = (resource: RecursoCRM, action: AccionPermiso) =>
      status === 'resolved' && canFromPermisos(permisos, resource, action);
    const canAny = (checks: readonly PermissionCheck[]) => checks.some(({ resource, action }) => can(resource, action));
    const canAll = (checks: readonly PermissionCheck[]) => checks.every(({ resource, action }) => can(resource, action));
    const allowsAll = (checks: readonly PermissionCheck[]) =>
      checks.every(({ resource, action }) => status !== 'resolved' || can(resource, action));

    return {
      status,
      error: query.error,
      usuario: query.data?.usuario,
      rol: query.data?.rol,
      permisos,
      can,
      canAny,
      canAll,
      allowsAll,
      canReadGroup: (resource, group) =>
        status === 'resolved' && canReadGroupFromPermisos(permisos, resource, group),
      canWriteGroup: (resource, group) =>
        status === 'resolved' && canWriteGroupFromPermisos(permisos, resource, group),
      allows: (resource, action) => status !== 'resolved' || can(resource, action),
      refetch: query.refetch,
      providerActive: true,
    };
  }, [query.data, query.error, query.isPending, query.isSuccess, query.refetch, usuarioId]);

  return <PermissionsContext.Provider value={value}>{children}</PermissionsContext.Provider>;
}

export function usePermissions(): PermissionsContextValue {
  return useContext(PermissionsContext);
}
