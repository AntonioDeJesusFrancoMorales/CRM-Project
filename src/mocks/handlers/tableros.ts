// Handlers MSW para el feature Kanban.
// B1.8: imports actualizados a kanban/schemas (tipos viejos eliminados de api/types.ts).
// B5: handlers reescritos al patrón RPC ?id= del contrato back.

import { http, HttpResponse } from 'msw';
import { withDelay } from '@/mocks/utils/withDelay';
import { errors } from '@/mocks/utils/error';
import { nowIso } from '@/mocks/utils/crud';
import {
  tablerosFixture,
  columnasFixture,
  fichasFixture,
} from '@/mocks/fixtures/tableros';
import type { Ficha } from '@/features/kanban/schemas/ficha.schema';

const API = '/api';

export const tablerosHandlers = [
  // ---------------------------------------------------------------------------
  // Tableros — patrón RPC ?id=
  // ---------------------------------------------------------------------------

  // GET /tableros/get-all
  http.get(`${API}/tableros/get-all`, async () => {
    await withDelay();
    return HttpResponse.json(tablerosFixture);
  }),

  // GET /tableros/get-by-id?id=
  http.get(`${API}/tableros/get-by-id`, async ({ request }) => {
    await withDelay();
    const id = new URL(request.url).searchParams.get('id');
    const t = tablerosFixture.find((x) => x.id === id);
    if (!t) return errors.notFound();
    return HttpResponse.json(t);
  }),

  // POST /tableros/asignar-columna?id=&columnaId=
  http.post(`${API}/tableros/asignar-columna`, async ({ request }) => {
    await withDelay();
    const params = new URL(request.url).searchParams;
    const tableroId = params.get('id');
    const t = tablerosFixture.find((x) => x.id === tableroId);
    if (!t) return errors.notFound();
    return HttpResponse.json(t);
  }),

  // DELETE /tableros/eliminar-columna?id=&columnaId=
  http.delete(`${API}/tableros/eliminar-columna`, async ({ request }) => {
    await withDelay();
    const params = new URL(request.url).searchParams;
    const tableroId = params.get('id');
    const t = tablerosFixture.find((x) => x.id === tableroId);
    if (!t) return errors.notFound();
    return HttpResponse.json(t);
  }),

  // PUT /tableros/reordenar-columnas?id=
  http.put(`${API}/tableros/reordenar-columnas`, async ({ request }) => {
    await withDelay();
    const id = new URL(request.url).searchParams.get('id');
    const t = tablerosFixture.find((x) => x.id === id);
    if (!t) return errors.notFound();
    return HttpResponse.json(t);
  }),

  // ---------------------------------------------------------------------------
  // Columnas catálogo — GET /columnas/get-all
  // ---------------------------------------------------------------------------

  http.get(`${API}/columnas/get-all`, async () => {
    await withDelay();
    return HttpResponse.json(columnasFixture);
  }),

  // ---------------------------------------------------------------------------
  // Fichas — patrón RPC ?id=
  // ---------------------------------------------------------------------------

  // GET /fichas/get-all
  http.get(`${API}/fichas/get-all`, async () => {
    await withDelay();
    return HttpResponse.json(fichasFixture);
  }),

  // POST /fichas/create
  http.post(`${API}/fichas/create`, async ({ request }) => {
    await withDelay();
    const body = (await request.json()) as Record<string, unknown>;
    const ficha: Ficha = {
      id: crypto.randomUUID(),
      columnaId: String(body['columnaId'] ?? ''),
      tipoFicha: (body['tipoFicha'] as Ficha['tipoFicha']) ?? 'TRATO',
      tratoId: (body['tratoId'] as string | null) ?? null,
      tareaId: (body['tareaId'] as string | null) ?? null,
      responsableId: String(body['responsableId'] ?? ''),
      creadoPor: String(body['creadoPor'] ?? ''),
      creadoEn: nowIso(),
      actualizadoEn: nowIso(),
    };
    fichasFixture.push(ficha);
    return HttpResponse.json(ficha, { status: 201 });
  }),

  // PUT /fichas/edit?id= — merge de columnaId (mover ficha)
  http.put(`${API}/fichas/edit`, async ({ request }) => {
    await withDelay();
    const id = new URL(request.url).searchParams.get('id');
    const f = fichasFixture.find((x) => x.id === id);
    if (!f) return errors.notFound();
    const body = (await request.json()) as Partial<Ficha>;
    Object.assign(f, body, { actualizadoEn: nowIso() });
    return HttpResponse.json(f);
  }),

  // DELETE /fichas/delete?id=
  http.delete(`${API}/fichas/delete`, async ({ request }) => {
    await withDelay();
    const id = new URL(request.url).searchParams.get('id');
    const idx = fichasFixture.findIndex((x) => x.id === id);
    if (idx === -1) return errors.notFound();
    fichasFixture.splice(idx, 1);
    return new HttpResponse(null, { status: 204 });
  }),
];
