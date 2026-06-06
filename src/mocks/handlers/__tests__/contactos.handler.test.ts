// Tests de los handlers MSW de contactos — contrato RPC del back.
// B2.2: rutas RPC, PUT en edit, id por query param, campos camelCase, estadoRelacion, 409 guard.

import { describe, it, expect } from 'vitest';
import { contactosFixture } from '@/mocks/fixtures/contactos';

// IDs del fixture
const CONTACTO_ID = 'c0111111-cccc-0001-cccc-000000000001'; // PROSPECTO sin correo
const CONTACTO_ACTIVO_ID = 'c0333333-cccc-0003-cccc-000000000003'; // ACTIVO
const CONTACTO_CON_TRATOS_ID = 'b1111111-bbbb-1111-bbbb-111111111111'; // INACTIVO con trato abierto
const CONTACTO_NONEXISTENT = 'ffffffff-ffff-ffff-ffff-ffffffffffff';

describe('contactos MSW handler — GET /api/contactos/get-all', () => {
  it('retorna la lista completa con todos los contactos del fixture', async () => {
    const res = await fetch('/api/contactos/get-all');
    expect(res.status).toBe(200);
    const data = (await res.json()) as unknown[];
    expect(data).toHaveLength(contactosFixture.length);
  });

  it('los items tienen estadoRelacion en camelCase (no estado_relacion)', async () => {
    const res = await fetch('/api/contactos/get-all');
    const data = (await res.json()) as Record<string, unknown>[];
    expect(data.length).toBeGreaterThan(0);
    data.forEach((c) => {
      expect('estadoRelacion' in c).toBe(true);
      expect('estado_relacion' in c).toBe(false);
      expect('empresaId' in c).toBe(true);
      expect('empresa_id' in c).toBe(false);
    });
  });

  it('cubre los tres estados: PROSPECTO, ACTIVO, INACTIVO', async () => {
    const res = await fetch('/api/contactos/get-all');
    const data = (await res.json()) as { estadoRelacion: string }[];
    const estados = new Set(data.map((c) => c.estadoRelacion));
    expect(estados.has('PROSPECTO')).toBe(true);
    expect(estados.has('ACTIVO')).toBe(true);
    expect(estados.has('INACTIVO')).toBe(true);
  });
});

describe('contactos MSW handler — GET /api/contactos/get-by-id?id=', () => {
  it('retorna el contacto cuando el id existe', async () => {
    const res = await fetch(`/api/contactos/get-by-id?id=${CONTACTO_ID}`);
    expect(res.status).toBe(200);
    const data = (await res.json()) as { id: string; nombre: string; estadoRelacion: string };
    expect(data.id).toBe(CONTACTO_ID);
    expect(data.nombre).toBe('Lucía');
    expect(data.estadoRelacion).toBe('PROSPECTO');
  });

  it('retorna 404 cuando el id no existe', async () => {
    const res = await fetch(`/api/contactos/get-by-id?id=${CONTACTO_NONEXISTENT}`);
    expect(res.status).toBe(404);
  });
});

describe('contactos MSW handler — POST /api/contactos/create', () => {
  it('responde 201 y retorna el contacto creado con id generado', async () => {
    const payload = {
      nombre: 'Nuevo',
      estadoRelacion: 'PROSPECTO',
      empresaId: 'a1111111-aaaa-1111-aaaa-111111111111',
    };
    const res = await fetch('/api/contactos/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    expect(res.status).toBe(201);
    const data = (await res.json()) as { id: string; nombre: string };
    expect(data.id).toBeTruthy();
    expect(data.nombre).toBe('Nuevo');
    // apellido no existe en el contrato del back
    expect('apellido' in data).toBe(false);
  });
});

describe('contactos MSW handler — PUT /api/contactos/edit?id=', () => {
  it('acepta PUT (no PATCH) y lee el id del query param', async () => {
    const res = await fetch(`/api/contactos/edit?id=${CONTACTO_ACTIVO_ID}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre: 'Sofía Actualizada', estadoRelacion: 'ACTIVO' }),
    });
    expect(res.status).toBe(200);
    const data = (await res.json()) as { id: string; nombre: string };
    expect(data.id).toBe(CONTACTO_ACTIVO_ID);
    expect(data.nombre).toBe('Sofía Actualizada');
  });

  it('responde 400 cuando falta nombre (espejo de @NotBlank del back)', async () => {
    const res = await fetch(`/api/contactos/edit?id=${CONTACTO_ACTIVO_ID}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estadoRelacion: 'ACTIVO' }),
    });
    expect(res.status).toBe(400);
  });

  it('responde 404 cuando el id no existe', async () => {
    const res = await fetch(`/api/contactos/edit?id=${CONTACTO_NONEXISTENT}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre: 'X', estadoRelacion: 'ACTIVO' }),
    });
    expect(res.status).toBe(404);
  });
});

describe('contactos MSW handler — PUT /api/contactos/cambiar-estado?id=', () => {
  it('cambia solo el estadoRelacion con body { nuevoEstado }', async () => {
    const res = await fetch(`/api/contactos/cambiar-estado?id=${CONTACTO_ACTIVO_ID}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nuevoEstado: 'INACTIVO' }),
    });
    expect(res.status).toBe(200);
    const data = (await res.json()) as { id: string; estadoRelacion: string };
    expect(data.id).toBe(CONTACTO_ACTIVO_ID);
    expect(data.estadoRelacion).toBe('INACTIVO');
  });

  it('responde 400 cuando falta nuevoEstado', async () => {
    const res = await fetch(`/api/contactos/cambiar-estado?id=${CONTACTO_ACTIVO_ID}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(400);
  });

  it('responde 404 cuando el id no existe', async () => {
    const res = await fetch(`/api/contactos/cambiar-estado?id=${CONTACTO_NONEXISTENT}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nuevoEstado: 'ACTIVO' }),
    });
    expect(res.status).toBe(404);
  });
});

describe('contactos MSW handler — DELETE /api/contactos/delete?id=', () => {
  it('responde 204 al eliminar contacto sin tratos abiertos', async () => {
    // Usa un INACTIVO sin tratos (c0555555) — seguro de eliminar
    const res = await fetch('/api/contactos/delete?id=c0555555-cccc-0005-cccc-000000000005', {
      method: 'DELETE',
    });
    expect(res.status).toBe(204);
  });

  it('responde 404 al intentar eliminar contacto inexistente', async () => {
    const res = await fetch(`/api/contactos/delete?id=${CONTACTO_NONEXISTENT}`, {
      method: 'DELETE',
    });
    expect(res.status).toBe(404);
  });

  it('responde 409 cuando el contacto tiene tratos abiertos (b1111111)', async () => {
    const res = await fetch(`/api/contactos/delete?id=${CONTACTO_CON_TRATOS_ID}`, {
      method: 'DELETE',
    });
    expect(res.status).toBe(409);
  });
});
