// Tests de los handlers MSW de usuarios — contrato RPC del back.
// Rutas RPC, PUT en edit, id por query param, campos del back (rolId, creadoEn, keycloakId, activo).
// Sin rutas legacy REST (/api/usuarios, /api/usuarios/:id, /api/usuarios/:id/desactivar).

import { describe, it, expect } from 'vitest';

const USUARIO_ID = '11111111-1111-1111-1111-111111111111';
const NONEXISTENT_ID = 'ffffffff-ffff-ffff-ffff-ffffffffffff';

describe('GET /api/usuarios/get-all — retorna lista con campos del back', () => {
  it('responde 200 con un array de usuarios', async () => {
    const res = await fetch('/api/usuarios/get-all');
    expect(res.status).toBe(200);
    const data = (await res.json()) as unknown[];
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);
  });

  it('los items tienen rolId, creadoEn, keycloakId y activo (campos del back)', async () => {
    const res = await fetch('/api/usuarios/get-all');
    const data = (await res.json()) as Record<string, unknown>[];
    data.forEach((u) => {
      expect('rolId' in u).toBe(true);
      expect('creadoEn' in u).toBe(true);
      expect('keycloakId' in u).toBe(true);
      expect('activo' in u).toBe(true);
    });
  });

  it('los items NO tienen rol_sistema ni rol_empresa ni creado_en', async () => {
    const res = await fetch('/api/usuarios/get-all');
    const data = (await res.json()) as Record<string, unknown>[];
    data.forEach((u) => {
      expect('rol_sistema' in u).toBe(false);
      expect('rol_empresa' in u).toBe(false);
      expect('creado_en' in u).toBe(false);
    });
  });

  it('los items NO tienen password', async () => {
    const res = await fetch('/api/usuarios/get-all');
    const data = (await res.json()) as Record<string, unknown>[];
    data.forEach((u) => {
      expect('password' in u).toBe(false);
    });
  });
});

describe('GET /api/usuarios/get-by-id?id= — retorna usuario individual', () => {
  it('retorna el usuario correcto por id en query param', async () => {
    const res = await fetch(`/api/usuarios/get-by-id?id=${USUARIO_ID}`);
    expect(res.status).toBe(200);
    const data = (await res.json()) as { id: string };
    expect(data.id).toBe(USUARIO_ID);
  });

  it('retorna 404 para id inexistente', async () => {
    const res = await fetch(`/api/usuarios/get-by-id?id=${NONEXISTENT_ID}`);
    expect(res.status).toBe(404);
  });
});

describe('POST /api/usuarios/create — crea usuario con rolId e initialPassword', () => {
  it('responde 201 y retorna el usuario creado sin initialPassword', async () => {
    const body = {
      nombre: 'Nuevo Usuario',
      correo: 'nuevo@crm.test',
      rolId: 'rol-admin-uuid',
      initialPassword: 'Password123!',
    };
    const res = await fetch('/api/usuarios/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    expect(res.status).toBe(201);
    const data = (await res.json()) as Record<string, unknown>;
    expect(data['id']).toBeTruthy();
    expect(data['nombre']).toBe('Nuevo Usuario');
    expect('initialPassword' in data).toBe(false);
    expect('password' in data).toBe(false);
  });

  it('responde 422 si el body es inválido', async () => {
    const res = await fetch('/api/usuarios/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(422);
  });
});

describe('PUT /api/usuarios/edit?id= — actualiza usuario con PUT y query param', () => {
  it('acepta PUT (no PATCH) y lee el id del query param', async () => {
    const res = await fetch(`/api/usuarios/edit?id=${USUARIO_ID}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre: 'Actualizado', correo: 'admin@crm.test', rolId: 'rol-admin-uuid' }),
    });
    expect(res.status).toBe(200);
    const data = (await res.json()) as { id: string; nombre: string };
    expect(data.id).toBe(USUARIO_ID);
    expect(data.nombre).toBe('Actualizado');
  });

  it('retorna 404 para id inexistente', async () => {
    const res = await fetch(`/api/usuarios/edit?id=${NONEXISTENT_ID}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre: 'X', correo: 'x@x.com', rolId: 'rol-admin-uuid' }),
    });
    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/usuarios/delete?id= — elimina usuario', () => {
  it('responde 204 al eliminar usuario existente', async () => {
    // Primero creamos uno para no romper otros tests
    const createRes = await fetch('/api/usuarios/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombre: 'Para Borrar',
        correo: 'borrar@crm.test',
        rolId: 'rol-admin-uuid',
        initialPassword: 'Pass123!',
      }),
    });
    const created = (await createRes.json()) as { id: string };
    const res = await fetch(`/api/usuarios/delete?id=${created.id}`, {
      method: 'DELETE',
    });
    expect(res.status).toBe(204);
  });

  it('retorna 404 para id inexistente', async () => {
    const res = await fetch(`/api/usuarios/delete?id=${NONEXISTENT_ID}`, {
      method: 'DELETE',
    });
    expect(res.status).toBe(404);
  });
});
