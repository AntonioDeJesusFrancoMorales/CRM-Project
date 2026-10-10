import type { Rol } from '@/api/types';
import { applyPermissionTemplate } from '@/features/permissions/lib/permissions';

// Los UUIDs deben coincidir con los rolId usados en el fixture de usuarios.
export const rolesFixture: Rol[] = [
  {
    id: 'rol-admin-uuid-1111-111111111111',
    nombre: 'Administrador',
    descripcion: 'Acceso total al sistema',
    activo: true,
    permisos: applyPermissionTemplate('ADMINISTRADOR'),
  },
  {
    id: 'rol-user-uuid-2222-222222222222',
    nombre: 'Usuario',
    descripcion: 'Acceso estándar de ventas',
    activo: true,
    permisos: applyPermissionTemplate('OPERATIVO'),
  },
];
