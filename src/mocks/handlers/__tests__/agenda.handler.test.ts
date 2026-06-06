// Tests de los handlers MSW de agenda — contrato RPC del back.
// Rutas RPC, PUT en edit, id por query param, campos camelCase, get-all-by-user.

import { describe, it, expect } from 'vitest';
import { agendasFixture } from '@/mocks/fixtures/agenda';

const AGENDA_ID = 'a1111111-aaaa-1111-aaaa-111111111111';
const AGENDA_BORRABLE = 'a4444444-aaaa-4444-aaaa-444444444444';
const AGENDA_NONEXISTENT = 'ffffffff-ffff-ffff-ffff-ffffffffffff';

describe('agendasFixture — invariantes', () => {
  it('tiene al menos 1 evento con recordatorio habilitado (PENDIENTE)', () => {
    const conRecordatorio = agendasFixture.find((a) => a.recordatorioHabilitado);
    expect(conRecordatorio).toBeTruthy();
    expect(conRecordatorio!.recordatorioEstado).toBe('PENDIENTE');
  });

  it('los tipos son enums del back: LLAMADA | REUNION', () => {
    const tiposValidos = new Set(['LLAMADA', 'REUNION']);
    agendasFixture.forEach((a) => expect(tiposValidos.has(a.tipo)).toBe(true));
  });

  it('usa camelCase (horaInicio, no hora_inicio)', () => {
    agendasFixture.forEach((a) => {
      expect('horaInicio' in a).toBe(true);
      expect('hora_inicio' in a).toBe(false);
    });
  });
});

describe('GET /api/agendas/get-all-by-user — agenda del usuario', () => {
  it('retorna la lista completa de la fixture', async () => {
    const res = await fetch('/api/agendas/get-all-by-user');
    expect(res.status).toBe(200);
    const data = (await res.json()) as unknown[];
    expect(data.length).toBeGreaterThan(0);
  });
});

describe('GET /api/agendas/get-by-id?id= — evento individual', () => {
  it('retorna el evento correcto por id en query param', async () => {
    const res = await fetch(`/api/agendas/get-by-id?id=${AGENDA_ID}`);
    expect(res.status).toBe(200);
    const data = (await res.json()) as { id: string };
    expect(data.id).toBe(AGENDA_ID);
  });

  it('retorna 404 para id inexistente', async () => {
    const res = await fetch(`/api/agendas/get-by-id?id=${AGENDA_NONEXISTENT}`);
    expect(res.status).toBe(404);
  });
});

describe('POST /api/agendas/create — crea evento', () => {
  it('responde 201 y retorna el evento creado con los campos del body', async () => {
    const body = {
      tipo: 'LLAMADA',
      asunto: 'Llamada nueva',
      descripcion: null,
      fecha: '2026-07-01',
      horaInicio: '12:00',
      horaFin: null,
      recordatorioHabilitado: true,
      minutosAntes: 10,
    };
    const res = await fetch('/api/agendas/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    expect(res.status).toBe(201);
    const data = (await res.json()) as {
      id: string;
      asunto: string;
      recordatorioHabilitado: boolean;
      recordatorioEstado: string | null;
    };
    expect(data.id).toBeTruthy();
    expect(data.asunto).toBe('Llamada nueva');
    // El mock deriva PENDIENTE cuando el recordatorio viene habilitado.
    expect(data.recordatorioHabilitado).toBe(true);
    expect(data.recordatorioEstado).toBe('PENDIENTE');
  });
});

describe('PUT /api/agendas/edit?id= — actualiza con PUT', () => {
  it('acepta PUT y lee el id del query param', async () => {
    const res = await fetch(`/api/agendas/edit?id=${AGENDA_ID}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tipo: 'LLAMADA',
        asunto: 'Asunto actualizado',
        fecha: '2026-06-08',
        horaInicio: '09:00',
        recordatorioHabilitado: false,
      }),
    });
    expect(res.status).toBe(200);
    const data = (await res.json()) as { id: string; asunto: string };
    expect(data.id).toBe(AGENDA_ID);
    expect(data.asunto).toBe('Asunto actualizado');
  });

  it('retorna 404 para id inexistente', async () => {
    const res = await fetch(`/api/agendas/edit?id=${AGENDA_NONEXISTENT}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tipo: 'LLAMADA',
        asunto: 'X',
        fecha: '2026-06-08',
        horaInicio: '09:00',
        recordatorioHabilitado: false,
      }),
    });
    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/agendas/delete?id= — elimina evento', () => {
  it('responde 204 al eliminar evento existente', async () => {
    const res = await fetch(`/api/agendas/delete?id=${AGENDA_BORRABLE}`, { method: 'DELETE' });
    expect(res.status).toBe(204);
  });

  it('retorna 404 para id inexistente', async () => {
    const res = await fetch(`/api/agendas/delete?id=${AGENDA_NONEXISTENT}`, { method: 'DELETE' });
    expect(res.status).toBe(404);
  });
});
