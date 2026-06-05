// Tests del handler MSW de roles — contrato RPC del back.
// CRUD completo: get-all, get-by-id?id=, create, edit?id=, delete?id= (con regla 409).

import { describe, it, expect } from 'vitest';

// Roles del fixture — ambos tienen usuarios asignados (regla 409 al borrar).
const ROL_CON_USUARIOS = 'rol-admin-uuid-1111-111111111111';
const NONEXISTENT_ID = 'ffffffff-ffff-ffff-ffff-ffffffffffff';

describe('GET /api/roles/get-all — retorna lista de roles', () => {
  it('responde 200 con un array de al menos 2 roles', async () => {
    const res = await fetch('/api/roles/get-all');
    expect(res.status).toBe(200);
    const data = (await res.json()) as unknown[];
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThanOrEqual(2);
  });

  it('los roles tienen los campos id, nombre, descripcion y activo', async () => {
    const res = await fetch('/api/roles/get-all');
    const data = (await res.json()) as Record<string, unknown>[];
    data.forEach((r) => {
      expect('id' in r).toBe(true);
      expect('nombre' in r).toBe(true);
      expect('descripcion' in r).toBe(true);
      expect('activo' in r).toBe(true);
    });
  });
});

describe('GET /api/roles/get-by-id?id= — retorna un rol individual', () => {
  it('retorna el rol correcto por id en query param', async () => {
    const res = await fetch(`/api/roles/get-by-id?id=${ROL_CON_USUARIOS}`);
    expect(res.status).toBe(200);
    const data = (await res.json()) as { id: string };
    expect(data.id).toBe(ROL_CON_USUARIOS);
  });

  it('retorna 404 para id inexistente', async () => {
    const res = await fetch(`/api/roles/get-by-id?id=${NONEXISTENT_ID}`);
    expect(res.status).toBe(404);
  });
});

describe('POST /api/roles/create — crea rol', () => {
  it('responde 201 y retorna el rol creado con activo=true', async () => {
    const res = await fetch('/api/roles/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre: 'Supervisor', descripcion: 'Supervisa equipos' }),
    });
    expect(res.status).toBe(201);
    const data = (await res.json()) as Record<string, unknown>;
    expect(data['id']).toBeTruthy();
    expect(data['nombre']).toBe('Supervisor');
    expect(data['activo']).toBe(true);
  });

  it('descripcion es opcional → null cuando no se envía', async () => {
    const res = await fetch('/api/roles/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre: 'Auditor' }),
    });
    expect(res.status).toBe(201);
    const data = (await res.json()) as { descripcion: unknown };
    expect(data.descripcion).toBeNull();
  });

  it('responde 422 si falta el nombre', async () => {
    const res = await fetch('/api/roles/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ descripcion: 'sin nombre' }),
    });
    expect(res.status).toBe(422);
  });
});

describe('PUT /api/roles/edit?id= — actualiza rol con PUT y query param', () => {
  it('acepta PUT y lee el id del query param', async () => {
    // Creamos uno para no depender de roles con usuarios asignados.
    const createRes = await fetch('/api/roles/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre: 'Editable' }),
    });
    const created = (await createRes.json()) as { id: string };

    const res = await fetch(`/api/roles/edit?id=${created.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre: 'Editado', descripcion: 'nueva desc' }),
    });
    expect(res.status).toBe(200);
    const data = (await res.json()) as { id: string; nombre: string; descripcion: string };
    expect(data.id).toBe(created.id);
    expect(data.nombre).toBe('Editado');
    expect(data.descripcion).toBe('nueva desc');
  });

  it('retorna 404 para id inexistente', async () => {
    const res = await fetch(`/api/roles/edit?id=${NONEXISTENT_ID}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre: 'X' }),
    });
    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/roles/delete?id= — elimina rol con regla 409', () => {
  it('responde 204 al eliminar un rol SIN usuarios asignados', async () => {
    const createRes = await fetch('/api/roles/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre: 'Para Borrar' }),
    });
    const created = (await createRes.json()) as { id: string };

    const res = await fetch(`/api/roles/delete?id=${created.id}`, { method: 'DELETE' });
    expect(res.status).toBe(204);
  });

  it('responde 409 si el rol tiene usuarios asignados', async () => {
    const res = await fetch(`/api/roles/delete?id=${ROL_CON_USUARIOS}`, { method: 'DELETE' });
    expect(res.status).toBe(409);
  });

  it('retorna 404 para id inexistente', async () => {
    const res = await fetch(`/api/roles/delete?id=${NONEXISTENT_ID}`, { method: 'DELETE' });
    expect(res.status).toBe(404);
  });
});
