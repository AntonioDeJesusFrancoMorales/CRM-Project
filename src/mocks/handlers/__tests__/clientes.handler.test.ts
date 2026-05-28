// Tests de los handlers MSW de clientes.
// Cubre: DELETE 409 con tratos asociados, DELETE 204 sin tratos,
// DELETE 404 cliente inexistente, y GET con filtros.

import { describe, it, expect } from 'vitest';
import { clientesFixture } from '@/mocks/fixtures/clientes';
import { tratosFixture } from '@/mocks/fixtures/tratos';

// IDs del fixture
// c1111111 → Ana Rodríguez  → tiene tratos (d2222222 con cliente_id = c1111111)
// c2222222 → Diego Vargas   → tiene tratos (d3333333 con cliente_id = c2222222)
// c3333333 → Valentina Cruz → SIN tratos, con prospecto_origen_id
// c4444444 → Marco Herrera  → SIN tratos, con prospecto_origen_id

const CLIENT_WITH_TRATO = 'c1111111-cccc-1111-cccc-111111111111';
const CLIENT_WITHOUT_TRATO = 'c3333333-cccc-3333-cccc-333333333333';
const CLIENT_NONEXISTENT = 'ffffffff-ffff-ffff-ffff-ffffffffffff';

const EMPRESA_A = 'a1111111-aaaa-1111-aaaa-111111111111';
const EMPRESA_B = 'a2222222-aaaa-2222-aaaa-222222222222';

describe('clientes MSW handler — DELETE /clientes/:id', () => {
  it('responde 204 cuando el cliente no tiene tratos asociados', async () => {
    const res = await fetch(`/api/clientes/${CLIENT_WITHOUT_TRATO}`, {
      method: 'DELETE',
    });
    expect(res.status).toBe(204);
  });

  it('responde 409 cuando el cliente tiene tratos asociados, con mensaje que incluye conteo', async () => {
    const res = await fetch(`/api/clientes/${CLIENT_WITH_TRATO}`, {
      method: 'DELETE',
    });
    expect(res.status).toBe(409);

    const body = (await res.json()) as {
      status: number;
      error: string;
      message: string;
      details?: unknown;
    };
    expect(body.status).toBe(409);
    expect(body.error).toBe('CONFLICT');
    // El mensaje debe mencionar el conteo de tratos (al menos "1 trato")
    expect(body.message).toMatch(/1 trato/);
  });

  it('responde 404 cuando el cliente no existe', async () => {
    const res = await fetch(`/api/clientes/${CLIENT_NONEXISTENT}`, {
      method: 'DELETE',
    });
    expect(res.status).toBe(404);
  });
});

describe('clientes MSW handler — GET /clientes con filtros', () => {
  it('sin filtros devuelve todos los clientes del fixture', async () => {
    const res = await fetch('/api/clientes');
    expect(res.status).toBe(200);
    const data = (await res.json()) as unknown[];
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBe(clientesFixture.length);
  });

  it('filtra por empresa_id devuelve solo clientes de esa empresa', async () => {
    const res = await fetch(`/api/clientes?empresa_id=${EMPRESA_A}`);
    expect(res.status).toBe(200);
    const data = (await res.json()) as { empresa_id: string }[];
    expect(data.length).toBeGreaterThan(0);
    data.forEach((c) => expect(c.empresa_id).toBe(EMPRESA_A));

    // Empresa B no debe aparecer
    const empresaBCount = data.filter((c) => c.empresa_id === EMPRESA_B).length;
    expect(empresaBCount).toBe(0);
  });

  it('origen=prospecto devuelve solo clientes con prospecto_origen_id !== null', async () => {
    const res = await fetch('/api/clientes?origen=prospecto');
    expect(res.status).toBe(200);
    const data = (await res.json()) as { prospecto_origen_id: string | null }[];
    expect(data.length).toBeGreaterThan(0);
    data.forEach((c) => expect(c.prospecto_origen_id).not.toBeNull());
  });

  it('origen=manual devuelve solo clientes con prospecto_origen_id === null', async () => {
    const res = await fetch('/api/clientes?origen=manual');
    expect(res.status).toBe(200);
    const data = (await res.json()) as { prospecto_origen_id: string | null }[];
    expect(data.length).toBeGreaterThan(0);
    data.forEach((c) => expect(c.prospecto_origen_id).toBeNull());
  });
});

// Verificación de que GET /tratos?cliente_id=X ya funciona (T_A.5)
describe('tratos MSW handler — GET /tratos?cliente_id=X', () => {
  it('filtra tratos por cliente_id', async () => {
    const res = await fetch(`/api/tratos?cliente_id=${CLIENT_WITH_TRATO}`);
    expect(res.status).toBe(200);
    const data = (await res.json()) as { cliente_id: string | null }[];
    expect(data.length).toBeGreaterThan(0);
    data.forEach((t) => expect(t.cliente_id).toBe(CLIENT_WITH_TRATO));
  });

  it('devuelve array vacío para cliente sin tratos', async () => {
    const res = await fetch(`/api/tratos?cliente_id=${CLIENT_WITHOUT_TRATO}`);
    expect(res.status).toBe(200);
    const data = (await res.json()) as unknown[];
    expect(data).toHaveLength(0);
  });
});

// Verificación fixture — asegura que el fixture tiene la estructura que esperan los tests
describe('fixture verification', () => {
  it('c1111111 tiene al menos 1 trato en tratosFixture', () => {
    const tratos = tratosFixture.filter((t) => t.cliente_id === CLIENT_WITH_TRATO);
    expect(tratos.length).toBeGreaterThan(0);
  });

  it('c3333333 no tiene tratos en tratosFixture', () => {
    const tratos = tratosFixture.filter((t) => t.cliente_id === CLIENT_WITHOUT_TRATO);
    expect(tratos).toHaveLength(0);
  });
});
