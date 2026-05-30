// Usuarios mock. Las contraseñas son texto plano SOLO porque es mock.
// El backend real usa password_hash con bcrypt o similar.
//
// UsuarioMock extiende Usuario (campos del back) con campos de auth
// que solo existen en el mock: password, rol_sistema, rol_empresa.
// toUsuarioDto omite los 3 campos auth y devuelve un Usuario válido.

import type { Usuario, RolSistema } from '@/api/types';

export interface UsuarioMock extends Usuario {
  password: string;
  rol_sistema: RolSistema;
  rol_empresa: string | null;
}

export const usuariosFixture: UsuarioMock[] = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    nombre: 'Antonio Franco',
    correo: 'admin@crm.test',
    rolId: 'rol-admin-uuid-1111-111111111111',
    creadoEn: '2026-01-15T10:00:00.000Z',
    activo: true,
    keycloakId: null,
    password: 'Admin123!',
    rol_sistema: 'admin',
    rol_empresa: 'Director Comercial',
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    nombre: 'María González',
    correo: 'vendedor@crm.test',
    rolId: 'rol-user-uuid-2222-222222222222',
    creadoEn: '2026-02-01T09:30:00.000Z',
    activo: true,
    keycloakId: null,
    password: 'Vendedor123!',
    rol_sistema: 'usuario',
    rol_empresa: 'Ejecutiva de Ventas',
  },
];

export function findUsuarioByCreds(correo: string, password: string): UsuarioMock | undefined {
  return usuariosFixture.find((u) => u.correo === correo && u.password === password && u.activo);
}

export function findUsuarioById(id: string): UsuarioMock | undefined {
  return usuariosFixture.find((u) => u.id === id);
}

export function toUsuarioDto(user: UsuarioMock): Usuario {
  // Omite los campos de auth (password, rol_sistema, rol_empresa) antes de devolver.
  const { password: _password, rol_sistema: _rs, rol_empresa: _re, ...rest } = user;
  return rest;
}
