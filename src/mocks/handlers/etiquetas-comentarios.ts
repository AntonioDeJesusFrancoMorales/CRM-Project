import { http, HttpResponse } from 'msw';
import { withDelay } from '@/mocks/utils/withDelay';
import { errors } from '@/mocks/utils/error';
import { nowIso } from '@/mocks/utils/crud';
import { etiquetasFixture, comentariosFixture } from '@/mocks/fixtures/tableros';
import type { Etiqueta, Comentario } from '@/api/types';

const API = '/api/v1';

export const etiquetasComentariosHandlers = [
  // Etiquetas
  http.get(`${API}/tableros/:id/etiquetas`, async ({ params }) => {
    await withDelay();
    return HttpResponse.json(etiquetasFixture.filter((e) => e.tablero_id === params['id']));
  }),
  http.post(`${API}/tableros/:id/etiquetas`, async ({ params, request }) => {
    await withDelay();
    const body = (await request.json()) as Record<string, unknown>;
    const e: Etiqueta = {
      id: crypto.randomUUID(),
      tablero_id: String(params['id']),
      nombre: String(body['nombre'] ?? ''),
      color: String(body['color'] ?? '#60a5fa'),
    };
    etiquetasFixture.push(e);
    return HttpResponse.json(e, { status: 201 });
  }),
  http.delete(`${API}/etiquetas/:id`, async ({ params }) => {
    await withDelay();
    const idx = etiquetasFixture.findIndex((x) => x.id === params['id']);
    if (idx === -1) return errors.notFound();
    etiquetasFixture.splice(idx, 1);
    return new HttpResponse(null, { status: 204 });
  }),
  http.post(`${API}/fichas/:id/etiquetas`, async () => {
    await withDelay();
    return HttpResponse.json({}, { status: 201 });
  }),
  http.delete(`${API}/fichas/:id/etiquetas/:eid`, async () => {
    await withDelay();
    return new HttpResponse(null, { status: 204 });
  }),

  // Comentarios
  http.get(`${API}/fichas/:id/comentarios`, async ({ params }) => {
    await withDelay();
    return HttpResponse.json(comentariosFixture.filter((c) => c.ficha_id === params['id']));
  }),
  http.post(`${API}/fichas/:id/comentarios`, async ({ params, request }) => {
    await withDelay();
    const body = (await request.json()) as { contenido?: string };
    const c: Comentario = {
      id: crypto.randomUUID(),
      ficha_id: String(params['id']),
      usuario_id: '11111111-1111-1111-1111-111111111111',
      contenido: String(body.contenido ?? ''),
      creado_en: nowIso(),
    };
    comentariosFixture.push(c);
    return HttpResponse.json(c, { status: 201 });
  }),
  http.delete(`${API}/comentarios/:id`, async ({ params }) => {
    await withDelay();
    const idx = comentariosFixture.findIndex((x) => x.id === params['id']);
    if (idx === -1) return errors.notFound();
    comentariosFixture.splice(idx, 1);
    return new HttpResponse(null, { status: 204 });
  }),
];
