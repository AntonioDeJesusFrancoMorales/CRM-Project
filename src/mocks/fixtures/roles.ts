import type { Rol } from '@/api/types';

// Los UUIDs deben coincidir con los rolId usados en el fixture de usuarios.
export const rolesFixture: Rol[] = [
  {
    id: 'rol-admin-uuid-1111-111111111111',
    nombre: 'Administrador',
    descripcion: 'Acceso total al sistema',
    activo: true,
  },
  {
    id: 'rol-user-uuid-2222-222222222222',
    nombre: 'Usuario',
    descripcion: 'Acceso estándar de ventas',
    activo: true,
  },
];
