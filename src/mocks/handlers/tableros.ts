import { http, HttpResponse } from 'msw';
import { withDelay } from '@/mocks/utils/withDelay';
import { errors } from '@/mocks/utils/error';
import { nowIso } from '@/mocks/utils/crud';
import {
  tablerosFixture,
  columnasFixture,
  fichasFixture,
} from '@/mocks/fixtures/tableros';
import type { Tablero, Columna, Ficha } from '@/api/types';

const API = '/api/v1';

export const tablerosHandlers = [
  // Tableros: CRUD
  http.get(`${API}/tableros`, async () => {
    await withDelay();
    return HttpResponse.json(tablerosFixture);
  }),
  http.get(`${API}/tableros/:id`, async ({ params }) => {
    await withDelay();
    const t = tablerosFixture.find((x) => x.id === params['id']);
    if (!t) return errors.notFound();
    return HttpResponse.json({
      ...t,
      columnas: columnasFixture
        .filter((c) => c.tablero_id === t.id)
        .sort((a, b) => a.posicion - b.posicion)
        .map((c) => ({ ...c, fichas: fichasFixture.filter((f) => f.columna_id === c.id) })),
    });
  }),
  http.post(`${API}/tableros`, async ({ request }) => {
    await withDelay();
    const body = (await request.json()) as Record<string, unknown>;
    const tablero: Tablero = {
      id: crypto.randomUUID(),
      nombre: String(body['nombre'] ?? ''),
      descripcion: (body['descripcion'] as string | null) ?? null,
      tipo_ficha: (body['tipo_ficha'] as Tablero['tipo_ficha']) ?? 'trato',
      creado_en: nowIso(),
    };
    tablerosFixture.push(tablero);
    return HttpResponse.json(tablero, { status: 201 });
  }),
  http.patch(`${API}/tableros/:id`, async ({ params, request }) => {
    await withDelay();
    const t = tablerosFixture.find((x) => x.id === params['id']);
    if (!t) return errors.notFound();
    const body = (await request.json()) as Record<string, unknown>;
    Object.assign(t, body);
    return HttpResponse.json(t);
  }),
  http.delete(`${API}/tableros/:id`, async ({ params }) => {
    await withDelay();
    const idx = tablerosFixture.findIndex((x) => x.id === params['id']);
    if (idx === -1) return errors.notFound();
    tablerosFixture.splice(idx, 1);
    return new HttpResponse(null, { status: 204 });
  }),

  // Columnas
  http.post(`${API}/tableros/:id/columnas`, async ({ params, request }) => {
    await withDelay();
    const body = (await request.json()) as Record<string, unknown>;
    const col: Columna = {
      id: crypto.randomUUID(),
      tablero_id: String(params['id']),
      nombre: String(body['nombre'] ?? ''),
      color: String(body['color'] ?? '#94a3b8'),
      posicion: Number(body['posicion'] ?? columnasFixture.length),
      limite_wip: (body['limite_wip'] as number | null) ?? null,
      estado_vinculado: (body['estado_vinculado'] as string | null) ?? null,
    };
    columnasFixture.push(col);
    return HttpResponse.json(col, { status: 201 });
  }),
  http.patch(`${API}/columnas/:id`, async ({ params, request }) => {
    await withDelay();
    const c = columnasFixture.find((x) => x.id === params['id']);
    if (!c) return errors.notFound();
    Object.assign(c, await request.json());
    return HttpResponse.json(c);
  }),
  http.patch(`${API}/columnas/:id/reordenar`, async ({ params, request }) => {
    await withDelay();
    const c = columnasFixture.find((x) => x.id === params['id']);
    if (!c) return errors.notFound();
    const body = (await request.json()) as { posicion?: number };
    if (typeof body.posicion === 'number') c.posicion = body.posicion;
    return HttpResponse.json(c);
  }),
  http.delete(`${API}/columnas/:id`, async ({ params }) => {
    await withDelay();
    const idx = columnasFixture.findIndex((x) => x.id === params['id']);
    if (idx === -1) return errors.notFound();
    columnasFixture.splice(idx, 1);
    return new HttpResponse(null, { status: 204 });
  }),

  // Fichas
  http.post(`${API}/columnas/:id/fichas`, async ({ params, request }) => {
    await withDelay();
    const body = (await request.json()) as Record<string, unknown>;
    const ficha: Ficha = {
      id: crypto.randomUUID(),
      columna_id: String(params['id']),
      responsable_id: String(body['responsable_id'] ?? ''),
      creado_por: String(body['creado_por'] ?? body['responsable_id'] ?? ''),
    };
    fichasFixture.push(ficha);
    return HttpResponse.json(ficha, { status: 201 });
  }),
  http.patch(`${API}/fichas/:id`, async ({ params, request }) => {
    await withDelay();
    const f = fichasFixture.find((x) => x.id === params['id']);
    if (!f) return errors.notFound();
    Object.assign(f, await request.json());
    return HttpResponse.json(f);
  }),
  http.patch(`${API}/fichas/:id/mover`, async ({ params, request }) => {
    await withDelay();
    const f = fichasFixture.find((x) => x.id === params['id']);
    if (!f) return errors.notFound();
    const body = (await request.json()) as { columna_id?: string };
    if (body.columna_id) f.columna_id = body.columna_id;
    return HttpResponse.json(f);
  }),
  http.delete(`${API}/fichas/:id`, async ({ params }) => {
    await withDelay();
    const idx = fichasFixture.findIndex((x) => x.id === params['id']);
    if (idx === -1) return errors.notFound();
    fichasFixture.splice(idx, 1);
    return new HttpResponse(null, { status: 204 });
  }),
];
