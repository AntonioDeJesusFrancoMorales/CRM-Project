// Tests del handler MSW de etiquetas — contrato RPC del back (EtiquetaController).
// CRUD completo: get-all (+filtro tipo), get-by-id, create (validación + unicidad),
// edit (tipo inmutable), delete con regla de confirmación 409 cuando está en uso.

import { describe, it, expect } from 'vitest';

// Etiqueta del fixture EN USO (la ficha h2222222 referencia Prioritario/TRATO).
const ETIQUETA_EN_USO = 'c1111111-cccc-1111-cccc-111111111111';
const NONEXISTENT_ID = 'ffffffff-ffff-ffff-ffff-ffffffffffff';

async function crearEtiqueta(body: Record<string, unknown>) {
  const res = await fetch('/api/etiquetas/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return res;
}

describe('GET /api/etiquetas/get-all — catálogo de etiquetas', () => {
  it('responde 200 con un array', async () => {
    const res = await fetch('/api/etiquetas/get-all');
    expect(res.status).toBe(200);
    const data = (await res.json()) as unknown[];
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThanOrEqual(2);
  });

  it('las etiquetas exponen id, nombre, tipoEtiqueta, color y creadoEn', async () => {
    const res = await fetch('/api/etiquetas/get-all');
    const data = (await res.json()) as Record<string, unknown>[];
    data.forEach((e) => {
      expect('id' in e).toBe(true);
      expect('nombre' in e).toBe(true);
      expect('tipoEtiqueta' in e).toBe(true);
      expect('color' in e).toBe(true);
      expect('creadoEn' in e).toBe(true);
    });
  });

  it('?tipoEtiqueta=TRATO filtra solo etiquetas de tipo TRATO', async () => {
    const res = await fetch('/api/etiquetas/get-all?tipoEtiqueta=TRATO');
    expect(res.status).toBe(200);
    const data = (await res.json()) as { tipoEtiqueta: string }[];
    expect(data.length).toBeGreaterThanOrEqual(1);
    expect(data.every((e) => e.tipoEtiqueta === 'TRATO')).toBe(true);
  });
});

describe('GET /api/etiquetas/get-by-id?id=', () => {
  it('retorna la etiqueta correcta por id', async () => {
    const res = await fetch(`/api/etiquetas/get-by-id?id=${ETIQUETA_EN_USO}`);
    expect(res.status).toBe(200);
    const data = (await res.json()) as { id: string };
    expect(data.id).toBe(ETIQUETA_EN_USO);
  });

  it('retorna 404 para id inexistente', async () => {
    const res = await fetch(`/api/etiquetas/get-by-id?id=${NONEXISTENT_ID}`);
    expect(res.status).toBe(404);
  });
});

describe('POST /api/etiquetas/create', () => {
  it('responde 201 y normaliza el color a mayúsculas', async () => {
    const res = await crearEtiqueta({ nombre: 'Nueva TRATO', tipoEtiqueta: 'TRATO', color: '#a1b2c3' });
    expect(res.status).toBe(201);
    const data = (await res.json()) as Record<string, unknown>;
    expect(data['id']).toBeTruthy();
    expect(data['nombre']).toBe('Nueva TRATO');
    expect(data['color']).toBe('#A1B2C3');
  });

  it('responde 422 si falta el nombre', async () => {
    const res = await crearEtiqueta({ tipoEtiqueta: 'TRATO', color: '#FF0000' });
    expect(res.status).toBe(422);
  });

  it('responde 422 si el color no es hex #RRGGBB', async () => {
    const res = await crearEtiqueta({ nombre: 'Color malo', tipoEtiqueta: 'TAREA', color: 'rojo' });
    expect(res.status).toBe(422);
  });

  it('responde 409 si ya existe una etiqueta con ese nombre y tipo', async () => {
    await crearEtiqueta({ nombre: 'Repetida', tipoEtiqueta: 'TAREA', color: '#111111' });
    const dup = await crearEtiqueta({ nombre: 'Repetida', tipoEtiqueta: 'TAREA', color: '#222222' });
    expect(dup.status).toBe(409);
  });
});

describe('PUT /api/etiquetas/edit?id= — nombre y color (tipo inmutable)', () => {
  it('actualiza nombre y color, conservando el tipo', async () => {
    const created = (await (await crearEtiqueta({ nombre: 'Editable', tipoEtiqueta: 'TRATO', color: '#333333' })).json()) as {
      id: string;
      tipoEtiqueta: string;
    };

    const res = await fetch(`/api/etiquetas/edit?id=${created.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre: 'Editada', color: '#444444' }),
    });
    expect(res.status).toBe(200);
    const data = (await res.json()) as { nombre: string; color: string; tipoEtiqueta: string };
    expect(data.nombre).toBe('Editada');
    expect(data.color).toBe('#444444');
    expect(data.tipoEtiqueta).toBe('TRATO');
  });

  it('retorna 404 para id inexistente', async () => {
    const res = await fetch(`/api/etiquetas/edit?id=${NONEXISTENT_ID}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre: 'X', color: '#000000' }),
    });
    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/etiquetas/delete?id=&confirm= — regla de confirmación', () => {
  it('responde 204 al eliminar una etiqueta NO usada', async () => {
    const created = (await (await crearEtiqueta({ nombre: 'Descartable', tipoEtiqueta: 'TRATO', color: '#555555' })).json()) as {
      id: string;
    };
    const res = await fetch(`/api/etiquetas/delete?id=${created.id}&confirm=false`, { method: 'DELETE' });
    expect(res.status).toBe(204);
  });

  it('responde 409 al eliminar una etiqueta EN USO sin confirm', async () => {
    const res = await fetch(`/api/etiquetas/delete?id=${ETIQUETA_EN_USO}&confirm=false`, { method: 'DELETE' });
    expect(res.status).toBe(409);
  });

  it('responde 204 al eliminar una etiqueta EN USO con confirm=true', async () => {
    // Etiqueta nueva + ficha que la referencia → queda "en uso", luego se borra con confirm.
    const etiqueta = (await (await crearEtiqueta({ nombre: 'En uso temporal', tipoEtiqueta: 'TRATO', color: '#666666' })).json()) as {
      id: string;
    };
    await fetch('/api/fichas/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        columnaId: 'a1111111-aaaa-1111-aaaa-111111111111',
        tipoFicha: 'TRATO',
        tratoId: 'd9999999-dddd-9999-dddd-999999999999',
        etiquetaIds: [etiqueta.id],
      }),
    });

    const sinConfirm = await fetch(`/api/etiquetas/delete?id=${etiqueta.id}&confirm=false`, { method: 'DELETE' });
    expect(sinConfirm.status).toBe(409);

    const conConfirm = await fetch(`/api/etiquetas/delete?id=${etiqueta.id}&confirm=true`, { method: 'DELETE' });
    expect(conConfirm.status).toBe(204);
  });

  it('retorna 404 para id inexistente', async () => {
    const res = await fetch(`/api/etiquetas/delete?id=${NONEXISTENT_ID}`, { method: 'DELETE' });
    expect(res.status).toBe(404);
  });
});
