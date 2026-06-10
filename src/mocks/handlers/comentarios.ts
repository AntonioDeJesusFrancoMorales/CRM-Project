import { http, HttpResponse } from 'msw';
import { withDelay } from '@/mocks/utils/withDelay';
import { errors } from '@/mocks/utils/error';
import { nowIso } from '@/mocks/utils/crud';
import { comentariosFixture } from '@/mocks/fixtures/tableros';
import type { Comentario } from '@/api/types';

const API = '/api';

// Handlers legacy de comentarios de ficha (contrato snake_case, aún sin endpoint en
// endpoints.ts). Se conservan separados de etiquetas, que ya migró al contrato real.
export const comentariosHandlers = [
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
