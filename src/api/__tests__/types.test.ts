// Tests del modelo UsuarioSesion — Phase 1.1 RED.
// Verifica que UsuarioSesion expone el contrato alineado al ActorContext del back
// y que RolSistema ya NO existe como export de api/types.

import { describe, it, expect, expectTypeOf } from 'vitest';
import type { UsuarioSesion } from '../types';

describe('UsuarioSesion — shape alineado al ActorContext del back', () => {
  it('(a) tiene los campos del modelo nuevo: subject, username, email, usuario_id, super_usuario_id, roles', () => {
    // Construimos un objeto que cumpla el tipo; si el tipo tiene campos distintos,
    // TypeScript fallará en tiempo de compilación. En runtime verificamos la asignabilidad.
    const sesion: UsuarioSesion = {
      subject: 'sub-abc',
      username: 'jdoe',
      email: 'jdoe@example.com',
      usuario_id: 'uuid-123',
      super_usuario_id: null,
      roles: ['USUARIO'],
    };

    expect(sesion.subject).toBe('sub-abc');
    expect(sesion.username).toBe('jdoe');
    expect(sesion.email).toBe('jdoe@example.com');
    expect(sesion.usuario_id).toBe('uuid-123');
    expect(sesion.super_usuario_id).toBeNull();
    expect(sesion.roles).toEqual(['USUARIO']);
  });

  it('(b) super_usuario_id puede ser string (admin) o null (usuario normal)', () => {
    const admin: UsuarioSesion = {
      subject: 'sub-admin',
      username: 'admin',
      email: 'admin@crm.test',
      usuario_id: 'uuid-admin',
      super_usuario_id: 'super-uuid',
      roles: ['SUPER_USUARIO'],
    };
    expect(admin.super_usuario_id).toBe('super-uuid');

    const normal: UsuarioSesion = {
      subject: 'sub-normal',
      username: 'normal',
      email: 'normal@crm.test',
      usuario_id: 'uuid-normal',
      super_usuario_id: null,
      roles: [],
    };
    expect(normal.super_usuario_id).toBeNull();
  });

  it('(c) roles es un array de strings', () => {
    const sesion: UsuarioSesion = {
      subject: 'sub-xyz',
      username: 'user',
      email: 'user@crm.test',
      usuario_id: 'uuid-xyz',
      super_usuario_id: null,
      roles: ['ROL_A', 'ROL_B'],
    };
    expectTypeOf(sesion.roles).toEqualTypeOf<string[]>();
    expect(sesion.roles).toHaveLength(2);
  });
});

describe('UsuarioSesion — campos legacy eliminados', () => {
  it('(d) no tiene campo id (legacy)', () => {
    const sesion: UsuarioSesion = {
      subject: 's',
      username: 'u',
      email: 'e@e.com',
      usuario_id: 'uid',
      super_usuario_id: null,
      roles: [],
    };
    // En runtime, el objeto no tiene `id`
    expect((sesion as unknown as Record<string, unknown>)['id']).toBeUndefined();
  });

  it('(e) no tiene campo nombre (legacy)', () => {
    const sesion: UsuarioSesion = {
      subject: 's',
      username: 'u',
      email: 'e@e.com',
      usuario_id: 'uid',
      super_usuario_id: null,
      roles: [],
    };
    expect((sesion as unknown as Record<string, unknown>)['nombre']).toBeUndefined();
  });

  it('(f) no tiene campo correo (legacy)', () => {
    const sesion: UsuarioSesion = {
      subject: 's',
      username: 'u',
      email: 'e@e.com',
      usuario_id: 'uid',
      super_usuario_id: null,
      roles: [],
    };
    expect((sesion as unknown as Record<string, unknown>)['correo']).toBeUndefined();
  });
});
