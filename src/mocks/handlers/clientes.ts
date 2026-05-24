import { http, HttpResponse } from 'msw';
import { makeCrudHandlers, nowIso } from '@/mocks/utils/crud';
import { withDelay } from '@/mocks/utils/withDelay';
import { apiError, errors } from '@/mocks/utils/error';
import { clientesFixture } from '@/mocks/fixtures/clientes';
import { tratosFixture } from '@/mocks/fixtures/tratos';
import type { Cliente } from '@/api/types';

const API = '/api/v1';

export const clientesHandlers = [
  // Override DELETE — va ANTES del spread makeCrudHandlers (MSW resuelve en orden)
  // ADR-033: bloquea eliminación con 409 si el cliente tiene tratos asociados
  http.delete(`${API}/clientes/:id`, async ({ params }) => {
    await withDelay();
    const id = String(params['id']);
    const idx = clientesFixture.findIndex((c) => c.id === id);
    if (idx === -1) return errors.notFound();

    const tratosVinculados = tratosFixture.filter((t) => t.cliente_id === id);
    if (tratosVinculados.length > 0) {
      const n = tratosVinculados.length;
      return apiError(
        409,
        'CONFLICT',
        `El cliente tiene ${n} trato${n === 1 ? '' : 's'} asociado${n === 1 ? '' : 's'}`,
        [{ field: 'cliente_id', message: 'tratos_vinculados' }],
      );
    }
    clientesFixture.splice(idx, 1);
    return new HttpResponse(null, { status: 204 });
  }),
  // Override GET lista — va ANTES del spread makeCrudHandlers (MSW resuelve en orden)
  // ADR-033: soporta filtros empresa_id y origen como query params
  http.get(`${API}/clientes`, async ({ request }) => {
    await withDelay();
    const url = new URL(request.url);
    const empresaId = url.searchParams.get('empresa_id');
    const origen = url.searchParams.get('origen'); // 'prospecto' | 'manual'
    let result = [...clientesFixture];
    if (empresaId) result = result.filter((c) => c.empresa_id === empresaId);
    if (origen === 'prospecto') result = result.filter((c) => c.prospecto_origen_id !== null);
    if (origen === 'manual') result = result.filter((c) => c.prospecto_origen_id === null);
    return HttpResponse.json(result);
  }),
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
      prospecto_origen_id: null,
      creado_en: nowIso(),
      actualizado_en: nowIso(),
    }),
    (item, body) => ({ ...item, ...body, actualizado_en: nowIso() }) as Cliente,
  ),
];
