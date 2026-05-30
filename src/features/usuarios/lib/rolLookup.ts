import type { Rol } from '@/api/types';

/**
 * Resuelve el nombre de un rol dado su id.
 * Si el id no se encuentra en la lista, devuelve el rolId como fallback.
 * Funcion pura, sin efectos secundarios.
 */
export function resolveRolNombre(rolId: string, roles: Rol[]): string {
  return roles.find((r) => r.id === rolId)?.nombre ?? rolId;
}
