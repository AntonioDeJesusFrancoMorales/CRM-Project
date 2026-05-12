import { http, HttpResponse } from 'msw';
import { makeCrudHandlers, nowIso } from '@/mocks/utils/crud';
import { withDelay } from '@/mocks/utils/withDelay';
import { empresasFixture } from '@/mocks/fixtures/empresas';
import { prospectosFixture } from '@/mocks/fixtures/prospectos';
import { clientesFixture } from '@/mocks/fixtures/clientes';
import type { Empresa } from '@/api/types';

const API = '/api/v1';

export const empresasHandlers = [
  ...makeCrudHandlers<Empresa>(
    `${API}/empresas`,
    empresasFixture,
    (body, id) => ({
      id,
      nombre: String(body['nombre'] ?? ''),
      sector: (body['sector'] as string | null) ?? null,
      telefono: (body['telefono'] as string | null) ?? null,
      pagina_web: (body['pagina_web'] as string | null) ?? null,
      facebook: (body['facebook'] as string | null) ?? null,
      instagram: (body['instagram'] as string | null) ?? null,
      twitter: (body['twitter'] as string | null) ?? null,
      creado_en: nowIso(),
      actualizado_en: nowIso(),
    }),
    (item, body) => ({ ...item, ...body, actualizado_en: nowIso() }) as Empresa,
  ),
  http.get(`${API}/empresas/:id/prospectos`, async ({ params }) => {
    await withDelay();
    return HttpResponse.json(prospectosFixture.filter((p) => p.empresa_id === params['id']));
  }),
  http.get(`${API}/empresas/:id/clientes`, async ({ params }) => {
    await withDelay();
    return HttpResponse.json(clientesFixture.filter((c) => c.empresa_id === params['id']));
  }),
];
