import { apiClient } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import type { Rol, Usuario, PermisoRecurso } from '@/api/types';
import { normalizeRol } from './permissions';

export interface ResolvedCapabilities {
  usuario: Usuario;
  rol: Rol;
  permisos: PermisoRecurso[];
}

/**
 * Resuelve la cadena de autorización disponible en el backend actual.
 * No usa claims de Keycloak como permisos CRM ni agrega endpoints nuevos.
 */
export async function resolveCapabilities(usuarioId: string): Promise<ResolvedCapabilities> {
  const usuario = await apiClient.get<Usuario>(endpoints.usuarios.getById(usuarioId));
  if (!usuario.rolId) {
    throw new Error('El usuario autenticado no tiene un rol CRM asignado');
  }

  const rol = normalizeRol(await apiClient.get<Rol>(endpoints.roles.getById(usuario.rolId)));
  return {
    usuario,
    rol,
    permisos: rol.permisos,
  };
}
