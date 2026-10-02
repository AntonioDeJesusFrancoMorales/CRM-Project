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
import { fichasFixture, tableroTratosFixture } from '@/mocks/fixtures/tableros';
import type { NotaTrato, Trato } from '@/api/types';

const API = '/api';

// Notas en memoria (timeline del trato) para dev/test.
const notasTrato: NotaTrato[] = [];

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
      estado: 'ABIERTO',
      motivoPerdida: null,
      creadoEn: nowIso(),
      actualizadoEn: null,
    };
    tratosFixture.push(trato);
    const columnaInicial = tableroTratosFixture.columnas[0];
    if (columnaInicial) {
      fichasFixture.push({
        id: crypto.randomUUID(),
        columnaId: columnaInicial.id,
        tipoFicha: 'TRATO',
        tratoId: trato.id,
        tareaId: null,
        actualizadoEn: nowIso(),
        etiquetas: [],
      });
    }
    return HttpResponse.json(trato, { status: 201 });
  }),

  // PUT /api/tratos/ganar?id=
  http.put(`${API}/tratos/ganar`, async ({ request }) => {
    await withDelay();
    const id = new URL(request.url).searchParams.get('id');
    const idx = tratosFixture.findIndex((t) => t.id === id);
    if (idx === -1) return errors.notFound();
    tratosFixture[idx] = { ...tratosFixture[idx]!, estado: 'GANADO', motivoPerdida: null, actualizadoEn: nowIso() };
    notasTrato.push({ id: crypto.randomUUID(), tratoId: id!, autorId: null, tipo: 'EVENTO', contenido: 'Oportunidad marcada como GANADA', creadoEn: nowIso() });
    return HttpResponse.json(tratosFixture[idx]);
  }),

  // PUT /api/tratos/perder?id=  body { motivo }
  http.put(`${API}/tratos/perder`, async ({ request }) => {
    await withDelay();
    const id = new URL(request.url).searchParams.get('id');
    const idx = tratosFixture.findIndex((t) => t.id === id);
    if (idx === -1) return errors.notFound();
    const body = (await request.json()) as { motivo?: string };
    tratosFixture[idx] = { ...tratosFixture[idx]!, estado: 'PERDIDO', motivoPerdida: body.motivo ?? '', actualizadoEn: nowIso() };
    notasTrato.push({ id: crypto.randomUUID(), tratoId: id!, autorId: null, tipo: 'EVENTO', contenido: `Oportunidad marcada como PERDIDA: ${body.motivo ?? ''}`, creadoEn: nowIso() });
    return HttpResponse.json(tratosFixture[idx]);
  }),

  // GET /api/tratos/notas/get-all?tratoId=  (más recientes primero)
  http.get(`${API}/tratos/notas/get-all`, async ({ request }) => {
    await withDelay();
    const tratoId = new URL(request.url).searchParams.get('tratoId');
    const items = notasTrato
      .filter((n) => n.tratoId === tratoId)
      .sort((a, b) => b.creadoEn.localeCompare(a.creadoEn));
    return HttpResponse.json(items);
  }),

  // POST /api/tratos/notas/create?tratoId=  body { contenido }
  http.post(`${API}/tratos/notas/create`, async ({ request }) => {
    await withDelay();
    const tratoId = new URL(request.url).searchParams.get('tratoId') ?? '';
    const body = (await request.json()) as { contenido?: string };
    const nota: NotaTrato = {
      id: crypto.randomUUID(),
      tratoId,
      autorId: 'b0000001-0000-0000-0000-000000000001',
      tipo: 'NOTA',
      contenido: body.contenido ?? '',
      creadoEn: nowIso(),
    };
    notasTrato.push(nota);
    return HttpResponse.json(nota, { status: 201 });
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
