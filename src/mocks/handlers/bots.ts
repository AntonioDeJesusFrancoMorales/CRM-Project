import { http, HttpResponse } from 'msw';
import { withDelay } from '@/mocks/utils/withDelay';
import { errors } from '@/mocks/utils/error';
import { nowIso } from '@/mocks/utils/crud';
import { botsFixture } from '@/mocks/fixtures/bots';
import type { Bot } from '@/api/types';

const API = '/api';

function generarToken(): string {
  return crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '');
}

// Handlers RPC del back para bots — espejo del BotController (path params /bots/:id).
export const botsHandlers = [
  http.get(`${API}/bots`, async () => {
    await withDelay();
    return HttpResponse.json(botsFixture);
  }),

  http.get(`${API}/bots/:id`, async ({ params }) => {
    await withDelay();
    const bot = botsFixture.find((b) => b.id === params['id']);
    return bot ? HttpResponse.json(bot) : errors.notFound();
  }),

  http.post(`${API}/bots`, async ({ request }) => {
    await withDelay();
    const body = (await request.json()) as Record<string, unknown>;
    const nombre = String(body['nombre'] ?? '').trim();
    if (!nombre) {
      return errors.validation([{ field: 'nombre', message: 'El nombre es requerido' }]);
    }
    const webhookUrl = String(body['webhookUrl'] ?? '');
    if (!webhookUrl) {
      return errors.validation([{ field: 'webhookUrl', message: 'La URL del webhook es requerida' }]);
    }
    const nuevo: Bot = {
      id: crypto.randomUUID(),
      nombre,
      canalId: (body['canalId'] as string | undefined) ?? null,
      webhookUrl,
      apiAccessToken: generarToken(),
      activo: true,
      creadoEn: nowIso(),
      actualizadoEn: nowIso(),
    };
    botsFixture.push(nuevo);
    return HttpResponse.json(nuevo, { status: 201 });
  }),

  http.put(`${API}/bots/:id`, async ({ params, request }) => {
    await withDelay();
    const idx = botsFixture.findIndex((b) => b.id === params['id']);
    if (idx === -1) return errors.notFound();
    const body = (await request.json()) as Record<string, unknown>;
    const current = botsFixture[idx]!;
    botsFixture[idx] = {
      ...current,
      nombre: String(body['nombre'] ?? current.nombre),
      canalId: (body['canalId'] as string | undefined) ?? null,
      webhookUrl: String(body['webhookUrl'] ?? current.webhookUrl),
      actualizadoEn: nowIso(),
    };
    return HttpResponse.json(botsFixture[idx]);
  }),

  http.delete(`${API}/bots/:id`, async ({ params }) => {
    await withDelay();
    const idx = botsFixture.findIndex((b) => b.id === params['id']);
    if (idx === -1) return errors.notFound();
    botsFixture.splice(idx, 1);
    return new HttpResponse(null, { status: 204 });
  }),

  http.put(`${API}/bots/:id/activar`, async ({ params }) => {
    await withDelay();
    const idx = botsFixture.findIndex((b) => b.id === params['id']);
    if (idx === -1) return errors.notFound();
    botsFixture[idx] = { ...botsFixture[idx]!, activo: true, actualizadoEn: nowIso() };
    return HttpResponse.json(botsFixture[idx]);
  }),

  http.put(`${API}/bots/:id/desactivar`, async ({ params }) => {
    await withDelay();
    const idx = botsFixture.findIndex((b) => b.id === params['id']);
    if (idx === -1) return errors.notFound();
    botsFixture[idx] = { ...botsFixture[idx]!, activo: false, actualizadoEn: nowIso() };
    return HttpResponse.json(botsFixture[idx]);
  }),
];
