import { http, HttpResponse } from 'msw';
import { makeCrudHandlers, nowIso } from '@/mocks/utils/crud';
import { withDelay } from '@/mocks/utils/withDelay';
import { apiError, errors } from '@/mocks/utils/error';
import { tratosFixture } from '@/mocks/fixtures/tratos';
import { tareasFixture } from '@/mocks/fixtures/tareas';
import type { Trato } from '@/api/types';

const API = '/api';

export const tratosHandlers = [
  // Override DELETE — ANTES del spread makeCrudHandlers (MSW resuelve en orden)
  // ADR-046: bloquea eliminación con 409 si el trato tiene tareas asociadas
  http.delete(`${API}/tratos/:id`, async ({ params }) => {
    await withDelay();
    const id = String(params['id']);
    const idx = tratosFixture.findIndex((t) => t.id === id);
    if (idx === -1) return errors.notFound();

    const tareasVinculadas = tareasFixture.filter((t) => t.tratoId === id);
    if (tareasVinculadas.length > 0) {
      const n = tareasVinculadas.length;
      return apiError(
        409,
        'CONFLICT',
        `El trato tiene ${n} tarea${n === 1 ? '' : 's'} asociada${n === 1 ? '' : 's'}`,
        [{ field: 'trato_id', message: 'tareas_vinculadas' }],
      );
    }
    tratosFixture.splice(idx, 1);
    return new HttpResponse(null, { status: 204 });
  }),
  http.get(`${API}/tratos`, async ({ request }) => {
    await withDelay();
    const url = new URL(request.url);
    const estado = url.searchParams.get('estado');
    const responsableId = url.searchParams.get('responsable_id');
    const prospectoId = url.searchParams.get('prospecto_id');
    const clienteId = url.searchParams.get('cliente_id');
    let result = tratosFixture;
    if (estado) result = result.filter((t) => t.estado === estado);
    if (responsableId) result = result.filter((t) => t.responsable_id === responsableId);
    if (prospectoId) result = result.filter((t) => t.prospecto_id === prospectoId);
    if (clienteId) result = result.filter((t) => t.cliente_id === clienteId);
    return HttpResponse.json(result);
  }),
  ...makeCrudHandlers<Trato>(
    `${API}/tratos`,
    tratosFixture,
    (body, id) => ({
      id,
      prospecto_id: (body['prospecto_id'] as string | null) ?? null,
      cliente_id: (body['cliente_id'] as string | null) ?? null,
      responsable_id: String(body['responsable_id'] ?? ''),
      nombre: String(body['nombre'] ?? ''),
      valor_estimado: (body['valor_estimado'] as number | null) ?? null,
      probabilidad: (body['probabilidad'] as number | null) ?? null,
      fecha_cierre_esperada: (body['fecha_cierre_esperada'] as string | null) ?? null,
      tipo_contrato: (body['tipo_contrato'] as Trato['tipo_contrato']) ?? null,
      estado: 'abierto',
      motivo_perdida: null,
      creado_en: nowIso(),
      actualizado_en: nowIso(),
    }),
    (item, body) => ({ ...item, ...body, actualizado_en: nowIso() }) as Trato,
  ).slice(1),
  http.patch(`${API}/tratos/:id/ganar`, async ({ params }) => {
    await withDelay();
    const t = tratosFixture.find((x) => x.id === params['id']);
    if (!t) return errors.notFound();
    t.estado = 'ganado';
    t.actualizado_en = nowIso();
    return HttpResponse.json(t);
  }),
  http.patch(`${API}/tratos/:id/perder`, async ({ params, request }) => {
    await withDelay();
    const t = tratosFixture.find((x) => x.id === params['id']);
    if (!t) return errors.notFound();
    const body = (await request.json().catch(() => ({}))) as { motivo_perdida?: string };
    if (!body.motivo_perdida) {
      return errors.validation([{ field: 'motivo_perdida', message: 'El motivo es requerido' }]);
    }
    t.estado = 'perdido';
    t.motivo_perdida = body.motivo_perdida;
    t.actualizado_en = nowIso();
    return HttpResponse.json(t);
  }),
  http.get(`${API}/tratos/:id/tareas`, async ({ params }) => {
    await withDelay();
    return HttpResponse.json(tareasFixture.filter((t) => t.tratoId === params['id']));
  }),
];
