// Tests de los handlers MSW de tareas — contrato RPC del back.
// F2.4: rutas RPC, PUT en edit, id por query param, campos camelCase, sin estado en tarea.
//
// Tests previos de filtros server-side fueron eliminados (los filtros son ahora client-side).
// Se mantienen las invariantes de fixture que NO dependen del contrato viejo.

import { describe, it, expect } from 'vitest';
import { tareasFixture } from '@/mocks/fixtures/tareas';

const TAREA_ID = 'e1111111-eeee-1111-eeee-111111111111';
const TRATO_ID = 'd1111111-dddd-1111-dddd-111111111111';
const TAREA_NONEXISTENT = 'ffffffff-ffff-ffff-ffff-ffffffffffff';

// --- Invariantes del fixture (adaptadas al nuevo contrato camelCase sin estado) ---

describe('tareasFixture — invariantes (nuevo contrato camelCase)', () => {
  it('tiene exactamente 7 tareas', () => {
    expect(tareasFixture).toHaveLength(7);
  });

  it('ninguna tarea tiene campo estado (eliminado del contrato back)', () => {
    tareasFixture.forEach((t) => {
      expect('estado' in t).toBe(false);
    });
  });

  it('todas las tareas tienen fechaLimite como datetime ISO (no null)', () => {
    tareasFixture.forEach((t) => {
      expect(t.fechaLimite).toBeTruthy();
      // Formato ISO datetime (contiene T)
      expect(t.fechaLimite).toMatch(/T/);
    });
  });

  it('los tipos son enums del back: GENERAL | SEGUIMIENTO | NEGOCIACION | CIERRE', () => {
    const tiposValidos = new Set(['GENERAL', 'SEGUIMIENTO', 'NEGOCIACION', 'CIERRE']);
    tareasFixture.forEach((t) => {
      expect(tiposValidos.has(t.tipo)).toBe(true);
    });
  });

  it('las prioridades son enums del back: BAJA | MEDIA | ALTA | URGENTE', () => {
    const prioridadesValidas = new Set(['BAJA', 'MEDIA', 'ALTA', 'URGENTE']);
    tareasFixture.forEach((t) => {
      expect(prioridadesValidas.has(t.prioridad)).toBe(true);
    });
  });

  it('usa tratoId (camelCase, no trato_id)', () => {
    tareasFixture.forEach((t) => {
      expect('tratoId' in t).toBe(true);
      expect('trato_id' in t).toBe(false);
    });
  });

  it('cubre los tratos d1111111 y d2222222 (d3333333 sin tareas — invariante D4)', () => {
    const tratos = new Set(tareasFixture.map((t) => t.tratoId));
    expect(tratos.has('d1111111-dddd-1111-dddd-111111111111')).toBe(true);
    expect(tratos.has('d2222222-dddd-2222-dddd-222222222222')).toBe(true);
    expect(tareasFixture.filter((t) => t.tratoId === 'd3333333-dddd-3333-dddd-333333333333')).toHaveLength(0);
  });
});

// --- Tests de los handlers RPC ---

describe('GET /api/tareas/get-all — retorna lista completa sin filtros', () => {
  it('retorna todas las tareas del fixture', async () => {
    const res = await fetch('/api/tareas/get-all');
    expect(res.status).toBe(200);
    const data = (await res.json()) as unknown[];
    expect(data).toHaveLength(7);
  });

  it('no aplica filtros por query params (devuelve siempre todo)', async () => {
    const res = await fetch('/api/tareas/get-all?tratoId=alguno');
    expect(res.status).toBe(200);
    const data = (await res.json()) as unknown[];
    // Sin filtro server-side: devuelve las 7 tareas sin importar el query param
    expect(data).toHaveLength(7);
  });

  it('los items no tienen campo estado', async () => {
    const res = await fetch('/api/tareas/get-all');
    const data = (await res.json()) as Record<string, unknown>[];
    data.forEach((t) => {
      expect('estado' in t).toBe(false);
    });
  });

  it('los items tienen fechaLimite como datetime (campo camelCase)', async () => {
    const res = await fetch('/api/tareas/get-all');
    const data = (await res.json()) as Record<string, unknown>[];
    data.forEach((t) => {
      expect('fechaLimite' in t).toBe(true);
      expect('fecha_limite' in t).toBe(false);
      expect(typeof t['fechaLimite']).toBe('string');
    });
  });

  it('los tipos son enums del back (GENERAL/SEGUIMIENTO/NEGOCIACION/CIERRE)', async () => {
    const res = await fetch('/api/tareas/get-all');
    const data = (await res.json()) as { tipo: string }[];
    const tiposValidos = new Set(['GENERAL', 'SEGUIMIENTO', 'NEGOCIACION', 'CIERRE']);
    data.forEach((t) => expect(tiposValidos.has(t.tipo)).toBe(true));
  });
});

describe('GET /api/tareas/get-by-id?id= — retorna tarea individual', () => {
  it('retorna la tarea correcta por id en query param', async () => {
    const res = await fetch(`/api/tareas/get-by-id?id=${TAREA_ID}`);
    expect(res.status).toBe(200);
    const data = (await res.json()) as { id: string };
    expect(data.id).toBe(TAREA_ID);
  });

  it('retorna 404 para id inexistente', async () => {
    const res = await fetch(`/api/tareas/get-by-id?id=${TAREA_NONEXISTENT}`);
    expect(res.status).toBe(404);
  });
});

describe('POST /api/tareas/create — crea tarea con tratoId en el body', () => {
  it('responde 201 y retorna la tarea creada; tratoId viene del body (no del path)', async () => {
    const body = {
      tratoId: TRATO_ID,
      responsableId: '11111111-1111-1111-1111-111111111111',
      titulo: 'Tarea nueva',
      tipo: 'GENERAL',
      prioridad: 'ALTA',
      fechaLimite: '2026-06-01T00:00:00.000Z',
    };
    const res = await fetch('/api/tareas/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    expect(res.status).toBe(201);
    const data = (await res.json()) as { id: string; tratoId: string; titulo: string };
    expect(data.id).toBeTruthy();
    expect(data.tratoId).toBe(TRATO_ID);
    expect(data.titulo).toBe('Tarea nueva');
    // Sin campo estado
    expect('estado' in data).toBe(false);
  });
});

describe('PUT /api/tareas/edit?id= — actualiza tarea con PUT', () => {
  it('acepta PUT (no PATCH) y lee el id del query param', async () => {
    const res = await fetch(`/api/tareas/edit?id=${TAREA_ID}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ titulo: 'Actualizada' }),
    });
    expect(res.status).toBe(200);
    const data = (await res.json()) as { id: string; titulo: string };
    expect(data.id).toBe(TAREA_ID);
    expect(data.titulo).toBe('Actualizada');
  });

  it('retorna 404 para id inexistente', async () => {
    const res = await fetch(`/api/tareas/edit?id=${TAREA_NONEXISTENT}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ titulo: 'X' }),
    });
    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/tareas/delete?id= — elimina tarea', () => {
  it('responde 204 al eliminar tarea existente', async () => {
    // Usamos una tarea del fixture sin invariante crítica
    const res = await fetch(`/api/tareas/delete?id=${TAREA_ID}`, {
      method: 'DELETE',
    });
    expect(res.status).toBe(204);
  });

  it('retorna 404 para id inexistente', async () => {
    const res = await fetch(`/api/tareas/delete?id=${TAREA_NONEXISTENT}`, {
      method: 'DELETE',
    });
    expect(res.status).toBe(404);
  });
});
