// Usuarios mock. Las contraseñas son texto plano SOLO porque es mock.
// El backend real usa password_hash con bcrypt o similar.

import type { Usuario } from '@/api/types';

interface UsuarioMock extends Usuario {
  password: string;
}

export const usuariosFixture: UsuarioMock[] = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    nombre: 'Antonio Franco',
    correo: 'admin@crm.test',
    password: 'Admin123!',
    rol_sistema: 'admin',
    rol_empresa: 'Director Comercial',
    activo: true,
    creado_en: '2026-01-15T10:00:00.000Z',
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    nombre: 'María González',
    correo: 'vendedor@crm.test',
    password: 'Vendedor123!',
    rol_sistema: 'usuario',
    rol_empresa: 'Ejecutiva de Ventas',
    activo: true,
    creado_en: '2026-02-01T09:30:00.000Z',
  },
];

export function findUsuarioByCreds(correo: string, password: string): UsuarioMock | undefined {
  return usuariosFixture.find((u) => u.correo === correo && u.password === password && u.activo);
}

export function findUsuarioById(id: string): UsuarioMock | undefined {
  return usuariosFixture.find((u) => u.id === id);
}

export function toUsuarioDto(user: UsuarioMock): Usuario {
  // Excluye password antes de devolverlo en respuestas.
  const { password: _password, ...rest } = user;
  return rest;
}
