// Handlers MSW de tratos — contrato RPC del back.
// Estilo contactos.ts: rutas explícitas, id por query param, sin makeCrudHandlers.
// Sin /ganar, /perder, /:id/tareas, filtros de estado/cliente/prospecto.

import { http, HttpResponse } from 'msw';
import { withDelay } from '@/mocks/utils/withDelay';
import { errors } from '@/mocks/utils/error';
import { apiError } from '@/mocks/utils/error';
import { nowIso } from '@/mocks/utils/crud';
import { tratosFixture } from '@/mocks/fixtures/tratos';
import { tareasFixture } from '@/mocks/fixtures/tareas';
import type { Trato } from '@/api/types';

const API = '/api';

export const tratosHandlers = [
  // GET /api/tratos/get-all — retorna lista completa sin filtros server-side
  http.get(`${API}/tratos/get-all`, async () => {
    await withDelay();
    return HttpResponse.json(tratosFixture);
  }),

  // GET /api/tratos/get-by-id?id= — retorna trato por query param
  http.get(`${API}/tratos/get-by-id`, async ({ request }) => {
    await withDelay();
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    const trato = tratosFixture.find((t) => t.id === id);
    if (!trato) return errors.notFound();
    return HttpResponse.json(trato);
  }),

  // POST /api/tratos/create — crea trato
  http.post(`${API}/tratos/create`, async ({ request }) => {
    await withDelay();
    const body = (await request.json()) as Record<string, unknown>;
    const trato: Trato = {
      id: crypto.randomUUID(),
      contactoId: String(body['contactoId'] ?? ''),
      responsableId: String(body['responsableId'] ?? ''),
      nombre: String(body['nombre'] ?? ''),
      valorEstimado: (body['valorEstimado'] as number | null) ?? null,
      probabilidad: (body['probabilidad'] as number | null) ?? null,
      fechaCierreEsperada: (body['fechaCierreEsperada'] as string | null) ?? null,
      tipoContrato: ((body['tipoContrato'] as Trato['tipoContrato']) ?? 'OTRO'),
      motivoPerdida: null,
      creadoEn: nowIso(),
      actualizadoEn: null,
    };
    tratosFixture.push(trato);
    return HttpResponse.json(trato, { status: 201 });
  }),

  // PUT /api/tratos/edit?id= — actualiza trato por query param (no PATCH)
  http.put(`${API}/tratos/edit`, async ({ request }) => {
    await withDelay();
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    const idx = tratosFixture.findIndex((t) => t.id === id);
    if (idx === -1) return errors.notFound();
    const body = (await request.json()) as Record<string, unknown>;
    // contactoId es inmutable — no se permite en el body de edición
    const { contactoId: _cid, ...safeBody } = body;
    void _cid;
    tratosFixture[idx] = {
      ...tratosFixture[idx]!,
      ...safeBody,
      actualizadoEn: nowIso(),
    } as Trato;
    return HttpResponse.json(tratosFixture[idx]);
  }),

  // DELETE /api/tratos/delete?id= — elimina trato; 409 si tiene tareas asociadas
  http.delete(`${API}/tratos/delete`, async ({ request }) => {
    await withDelay();
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    const idx = tratosFixture.findIndex((t) => t.id === id);
    if (idx === -1) return errors.notFound();

    // Guard 409: el trato tiene tareas asociadas
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
];
