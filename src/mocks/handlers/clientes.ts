import { http, HttpResponse } from 'msw';
import { makeCrudHandlers, nowIso } from '@/mocks/utils/crud';
import { withDelay } from '@/mocks/utils/withDelay';
import { clientesFixture } from '@/mocks/fixtures/clientes';
import { tratosFixture } from '@/mocks/fixtures/tratos';
import type { Cliente } from '@/api/types';

const API = '/api/v1';

export const clientesHandlers = [
  ...makeCrudHandlers<Cliente>(
    `${API}/clientes`,
    clientesFixture,
    (body, id) => ({
      id,
      empresa_id: String(body['empresa_id'] ?? ''),
      responsable_id: String(body['responsable_id'] ?? ''),
      creado_por: String(body['creado_por'] ?? body['responsable_id'] ?? ''),
      nombre_contacto: String(body['nombre_contacto'] ?? ''),
      correo_contacto: (body['correo_contacto'] as string | null) ?? null,
      telefono_contacto: (body['telefono_contacto'] as string | null) ?? null,
      cargo_contacto: (body['cargo_contacto'] as string | null) ?? null,
      como_nos_conocio: (body['como_nos_conocio'] as Cliente['como_nos_conocio']) ?? null,
      notas: (body['notas'] as string | null) ?? null,
      creado_en: nowIso(),
      actualizado_en: nowIso(),
    }),
    (item, body) => ({ ...item, ...body, actualizado_en: nowIso() }) as Cliente,
  ),
  http.get(`${API}/clientes/:id/tratos`, async ({ params }) => {
    await withDelay();
    return HttpResponse.json(tratosFixture.filter((t) => t.cliente_id === params['id']));
  }),
];
