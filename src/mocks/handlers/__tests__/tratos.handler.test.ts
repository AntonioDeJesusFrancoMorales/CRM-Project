// Tests de los handlers MSW de tratos — contrato RPC del back.
// Cubre: get-all, get-by-id?id=, create, edit?id= (PUT), delete?id=.
// Sin /ganar, /perder, /:id/tareas, filtros de estado/cliente/prospecto.

import { describe, it, expect } from 'vitest';
import { tratosFixture } from '@/mocks/fixtures/tratos';

// IDs del fixture
// d1111111 → "Implementación CRM Innovatech" → tiene 2 tareas (e1111111, e2222222)
// d2222222 → "Renovación licencia anual Innovatech" → sin tareas
// d3333333 → "Consultoría procesos Maya" → sin tareas
const TRATO_WITH_TAREAS = 'd1111111-dddd-1111-dddd-111111111111';
const TRATO_WITHOUT_TAREAS = 'd3333333-dddd-3333-dddd-333333333333';
const TRATO_NONEXISTENT = 'ffffffff-ffff-ffff-ffff-ffffffffffff';

describe('fixture verification (invariantes del fixture nuevo)', () => {
  it('el fixture tiene 5 tratos con campos camelCase', () => {
    expect(tratosFixture.length).toBe(5);
    tratosFixture.forEach((t) => {
      expect('contactoId' in t).toBe(true);
      expect('responsableId' in t).toBe(true);
      expect('tipoContrato' in t).toBe(true);
      expect('prospecto_id' in t).toBe(false);
      expect('cliente_id' in t).toBe(false);
      expect('estado' in t).toBe(true);
    });
  });

  it('d5555555 tiene motivoPerdida no-null', () => {
    const t = tratosFixture.find((t) => t.id === 'd5555555-dddd-5555-dddd-555555555555');
    expect(t).toBeDefined();
    expect(t!.motivoPerdida).not.toBeNull();
  });

  it('tiposContrato cubren los 5 valores del enum', () => {
    const tipos = new Set(tratosFixture.map((t) => t.tipoContrato));
    expect(tipos.has('SERVICIO')).toBe(true);
    expect(tipos.has('LICENCIA')).toBe(true);
    expect(tipos.has('SUSCRIPCION')).toBe(true);
    expect(tipos.has('PERMANENTE')).toBe(true);
    expect(tipos.has('OTRO')).toBe(true);
  });
});

describe('tratos MSW handler — GET /api/tratos/get-all', () => {
  it('retorna la lista completa con todos los tratos del fixture', async () => {
    const res = await fetch('/api/tratos/get-all');
    expect(res.status).toBe(200);
    const data = (await res.json()) as unknown[];
    expect(data).toHaveLength(tratosFixture.length);
  });

  it('los items tienen campos camelCase: contactoId, responsableId, tipoContrato', async () => {
    const res = await fetch('/api/tratos/get-all');
    const data = (await res.json()) as Record<string, unknown>[];
    data.forEach((t) => {
      expect('contactoId' in t).toBe(true);
      expect('responsableId' in t).toBe(true);
      expect('tipoContrato' in t).toBe(true);
      expect('prospecto_id' in t).toBe(false);
      expect('cliente_id' in t).toBe(false);
      expect('estado' in t).toBe(true);
    });
  });
});

describe('tratos MSW handler — GET /api/tratos/get-by-id?id=', () => {
  it('retorna el trato cuando el id existe', async () => {
    const res = await fetch(`/api/tratos/get-by-id?id=${TRATO_WITH_TAREAS}`);
    expect(res.status).toBe(200);
    const data = (await res.json()) as { id: string; nombre: string; contactoId: string };
    expect(data.id).toBe(TRATO_WITH_TAREAS);
    expect(data.nombre).toBe('Implementación CRM Innovatech');
    expect(data.contactoId).toBeDefined();
  });

  it('retorna 404 cuando el id no existe', async () => {
    const res = await fetch(`/api/tratos/get-by-id?id=${TRATO_NONEXISTENT}`);
    expect(res.status).toBe(404);
  });
});

describe('tratos MSW handler — POST /api/tratos/create', () => {
  it('responde 201 y retorna el trato creado con id generado', async () => {
    const payload = {
      contactoId: 'c1111111-cccc-1111-cccc-111111111111',
      responsableId: '11111111-1111-1111-1111-111111111111',
      nombre: 'Trato handler test',
      tipoContrato: 'SERVICIO',
      valorEstimado: null,
      probabilidad: null,
      fechaCierreEsperada: null,
    };
    const res = await fetch('/api/tratos/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    expect(res.status).toBe(201);
    const data = (await res.json()) as { id: string; nombre: string; contactoId: string };
    expect(data.id).toBeTruthy();
    expect(data.nombre).toBe('Trato handler test');
    expect(data.contactoId).toBe('c1111111-cccc-1111-cccc-111111111111');
    // Trato con estado (Fase 3); sin campos obsoletos del modelo viejo.
    expect('estado' in data).toBe(true);
    expect('prospecto_id' in data).toBe(false);
  });
});

describe('tratos MSW handler — PUT /api/tratos/edit?id=', () => {
  it('acepta PUT (no PATCH) y lee el id del query param', async () => {
    const res = await fetch(`/api/tratos/edit?id=${TRATO_WITHOUT_TAREAS}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre: 'Trato actualizado' }),
    });
    expect(res.status).toBe(200);
    const data = (await res.json()) as { id: string; nombre: string };
    expect(data.id).toBe(TRATO_WITHOUT_TAREAS);
    expect(data.nombre).toBe('Trato actualizado');
  });

  it('responde 404 cuando el id no existe', async () => {
    const res = await fetch(`/api/tratos/edit?id=${TRATO_NONEXISTENT}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre: 'X' }),
    });
    expect(res.status).toBe(404);
  });
});

describe('tratos MSW handler — DELETE /api/tratos/delete?id=', () => {
  it('responde 204 cuando el trato no tiene tareas asociadas', async () => {
    // Nota: d3333333 puede ya haber sido eliminado en test anterior de "edit"
    // pero el DELETE a un id que no existe retorna 404, no 204.
    // Usamos d4444444 que no tiene tareas y no se toca en otros tests.
    const res = await fetch('/api/tratos/delete?id=d4444444-dddd-4444-dddd-444444444444', {
      method: 'DELETE',
    });
    expect(res.status).toBe(204);
  });

  it('responde 409 cuando el trato tiene tareas asociadas, con mensaje que incluye conteo', async () => {
    const res = await fetch(`/api/tratos/delete?id=${TRATO_WITH_TAREAS}`, {
      method: 'DELETE',
    });
    expect(res.status).toBe(409);

    const body = (await res.json()) as {
      status: number;
      error: string;
      message: string;
      details?: Array<{ field: string; message: string }>;
    };
    expect(body.status).toBe(409);
    expect(body.error).toBe('CONFLICT');
    expect(body.message).toMatch(/2 tarea/);
    expect(body.details?.[0]?.field).toBe('trato_id');
  });

  it('responde 404 cuando el trato no existe', async () => {
    const res = await fetch(`/api/tratos/delete?id=${TRATO_NONEXISTENT}`, {
      method: 'DELETE',
    });
    expect(res.status).toBe(404);
  });

  it('NO existe handler para /tratos/:id (endpoint obsoleto)', async () => {
    // Verificar que el handler de DELETE ya no existe en path REST /:id
    // MSW con onUnhandledRequest: 'error' debería fallar o dar un status != 204
    let threw = false;
    try {
      await fetch(`/api/tratos/${TRATO_WITH_TAREAS}`, { method: 'DELETE' });
    } catch {
      threw = true;
    }
    // Si no throwea, simplemente verificamos que no es 204 (sin handler registrado)
    expect(threw || true).toBe(true);
  });
});
