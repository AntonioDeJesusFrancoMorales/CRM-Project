import { http, HttpResponse } from 'msw';
import { withDelay } from '@/mocks/utils/withDelay';
import { errors } from '@/mocks/utils/error';
import { nowIso } from '@/mocks/utils/crud';
import { agendasFixture } from '@/mocks/fixtures/agenda';
import type { Agenda } from '@/features/agenda/schemas/agenda.schema';

const API = '/api';

// Usuario "logueado" del mock (coincide con creadoPor de las fixtures). En el back real
// el filtro por usuario sale del JWT; acá devolvemos toda la fixture como "mi agenda".
const MOCK_USUARIO_ID = '550e8400-e29b-41d4-a716-446655440001';

export const agendaHandlers = [
  // GET /api/agendas/get-all-by-user — agenda del usuario autenticado (mock: toda la fixture)
  http.get(`${API}/agendas/get-all-by-user`, async () => {
    await withDelay();
    return HttpResponse.json(agendasFixture);
  }),

  // GET /api/agendas/get-by-id?id= — evento individual por query param
  http.get(`${API}/agendas/get-by-id`, async ({ request }) => {
    await withDelay();
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    const agenda = agendasFixture.find((a) => a.id === id);
    return agenda ? HttpResponse.json(agenda) : errors.notFound();
  }),

  // POST /api/agendas/create — crea evento; creadoPor lo deriva el back del JWT
  http.post(`${API}/agendas/create`, async ({ request }) => {
    await withDelay();
    const body = (await request.json()) as Record<string, unknown>;
    const recordatorioHabilitado = Boolean(body['recordatorioHabilitado']);
    const agenda: Agenda = {
      id: crypto.randomUUID(),
      tipo: (body['tipo'] as Agenda['tipo']) ?? 'REUNION',
      asunto: String(body['asunto'] ?? ''),
      descripcion: (body['descripcion'] as string | null) ?? null,
      fecha: String(body['fecha'] ?? ''),
      horaInicio: String(body['horaInicio'] ?? ''),
      horaFin: (body['horaFin'] as string | null) ?? null,
      tareaId: (body['tareaId'] as string | null) ?? null,
      tratoId: (body['tratoId'] as string | null) ?? null,
      ubicacion: (body['ubicacion'] as string | null) ?? null,
      linkVideollamada: (body['linkVideollamada'] as string | null) ?? null,
      creadoPor: MOCK_USUARIO_ID,
      creadoEn: nowIso(),
      actualizadoEn: nowIso(),
      recordatorioHabilitado,
      minutosAntes: recordatorioHabilitado ? Number(body['minutosAntes'] ?? 0) : null,
      recordatorioEstado: recordatorioHabilitado ? 'PENDIENTE' : null,
      recordatorioEnviadoEn: null,
      ultimoIntentoEn: null,
    };
    agendasFixture.push(agenda);
    return HttpResponse.json(agenda, { status: 201 });
  }),

  // PUT /api/agendas/edit?id= — actualiza evento por query param (full replace)
  http.put(`${API}/agendas/edit`, async ({ request }) => {
    await withDelay();
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    const idx = agendasFixture.findIndex((a) => a.id === id);
    if (idx === -1) return errors.notFound();
    const body = (await request.json()) as Record<string, unknown>;
    const recordatorioHabilitado = Boolean(body['recordatorioHabilitado']);
    const current = agendasFixture[idx]!;
    agendasFixture[idx] = {
      ...current,
      ...body,
      recordatorioHabilitado,
      minutosAntes: recordatorioHabilitado ? Number(body['minutosAntes'] ?? 0) : null,
      recordatorioEstado: recordatorioHabilitado ? (current.recordatorioEstado ?? 'PENDIENTE') : null,
      actualizadoEn: nowIso(),
    } as Agenda;
    return HttpResponse.json(agendasFixture[idx]);
  }),

  // DELETE /api/agendas/delete?id= — elimina evento por query param
  http.delete(`${API}/agendas/delete`, async ({ request }) => {
    await withDelay();
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    const idx = agendasFixture.findIndex((a) => a.id === id);
    if (idx === -1) return errors.notFound();
    agendasFixture.splice(idx, 1);
    return new HttpResponse(null, { status: 204 });
  }),
];
