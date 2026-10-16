// Usuarios mock. Las contraseñas son texto plano SOLO porque es mock.
// El backend real usa password_hash con bcrypt o similar.
//
// UsuarioMock extiende Usuario (campos del back) con campos de auth
// que solo existen en el mock: password, rol_sistema, rol_empresa.
// toUsuarioDto omite los 3 campos auth y devuelve un Usuario válido.

import type { Usuario } from '@/api/types';

export interface UsuarioMock extends Usuario {
  password: string;
  rol_sistema: string; // campo mock-only — no existe en UsuarioSesion del front
  rol_empresa: string | null;
}

export const usuariosFixture: UsuarioMock[] = [
  {
    id: 'b2000000-0000-4000-8000-000000000001',
    nombre: 'Ana Torres',
    correo: 'admin@pipely.local',
    rolId: 'a022c4fb-c079-4072-a4e8-dd7e4f5789df',
    creadoEn: '2026-01-15T10:00:00.000Z',
    activo: true,
    keycloakId: '8b43ac67-3c03-4804-ab09-40e3b7476940',
    password: 'Pipely-Admin-2026!',
    rol_sistema: 'admin',
    rol_empresa: 'Administrador',
  },
  {
    id: 'b2000000-0000-4000-8000-000000000002',
    nombre: 'Laura Méndez',
    correo: 'consulta@pipely.local',
    rolId: 'b1000000-0000-4000-8000-000000000002',
    creadoEn: '2026-02-01T09:30:00.000Z',
    activo: true,
    keycloakId: '4edb4abf-63bb-47f7-8e29-543d8bb67c78',
    password: 'Pipely-Consulta-2026!',
    rol_sistema: 'usuario',
    rol_empresa: 'Consulta',
  },
  {
    id: 'b2000000-0000-4000-8000-000000000003',
    nombre: 'Andrés Navarro',
    correo: 'ventas@pipely.local',
    rolId: '29b89553-71ec-4bdd-9a10-fa64ee5d6609',
    creadoEn: '2026-02-12T08:45:00.000Z',
    activo: true,
    keycloakId: '6d0000ce-4aab-42d1-967d-3eef51ea580d',
    password: 'Pipely-Ventas-2026!',
    rol_sistema: 'usuario',
    rol_empresa: 'Ejecutivo Comercial',
  },
  {
    id: 'b2000000-0000-4000-8000-000000000004',
    nombre: 'Mariana López',
    correo: 'direccion.comercial@pipely.local',
    rolId: '438f125b-6670-4011-9991-7fa03e827481',
    creadoEn: '2026-02-18T11:15:00.000Z',
    activo: true,
    keycloakId: '87c93483-344a-4c47-9c2a-730f63053978',
    password: 'Pipely-Direccion-2026!',
    rol_sistema: 'usuario',
    rol_empresa: 'Dirección Comercial',
  },
  {
    id: 'b2000000-0000-4000-8000-000000000005',
    nombre: 'Valentina Cruz',
    correo: 'operaciones.crm@pipely.local',
    rolId: 'b1000000-0000-4000-8000-000000000003',
    creadoEn: '2026-02-24T14:20:00.000Z',
    activo: true,
    keycloakId: '84b7eae7-5e87-4509-848c-d33bde9881b0',
    password: 'Pipely-Operaciones-2026!',
    rol_sistema: 'usuario',
    rol_empresa: 'Operaciones CRM',
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
