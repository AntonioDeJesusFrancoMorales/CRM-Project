import { http, HttpResponse } from 'msw';
import { withDelay } from '@/mocks/utils/withDelay';
import { errors } from '@/mocks/utils/error';
import { nowIso } from '@/mocks/utils/crud';
import { canalesFixture } from '@/mocks/fixtures/canales';
import { conversacionesFixture, mensajesFixture } from '@/mocks/fixtures/conversaciones';
import { gruposFixture, mensajesGrupoFixture } from '@/mocks/fixtures/grupos';
import type { CanalWhatsapp, Mensaje } from '@/api/types';

const API = '/api';

// Ajustes WhatsApp (objeto único, persiste en memoria durante la sesión de dev).
const ajustesMock = {
  autoAsignar: false,
  bienvenidaActiva: true,
  bienvenidaTexto: '¡Hola {{nombre}}! Gracias por escribirnos.',
  horarioActivo: false,
  horarioInicio: '09:00',
  horarioFin: '18:00',
  horarioDias: 'L,M,X,J,V',
  fueraHorarioTexto: 'Estamos fuera de horario, te responderemos pronto.',
  csatActivo: false,
};

// Plantillas (array en memoria).
const plantillasMock = [
  { id: 'p0000001-0000-0000-0000-000000000001', titulo: 'Saludo', contenido: 'Hola, ¿en qué te puedo ayudar?' },
  { id: 'p0000002-0000-0000-0000-000000000002', titulo: 'Despedida', contenido: '¡Gracias por contactarnos! Que tengas buen día.' },
];

// canalId -> empresaId, para filtrar conversaciones por empresa como hace el back.
function canalesDeEmpresa(empresaId: string): string[] {
  return canalesFixture.filter((c) => c.empresaId === empresaId).map((c) => c.id);
}

export const whatsappHandlers = [
  // GET /api/wa/canales/get-all — con o sin empresaId
  http.get(`${API}/wa/canales/get-all`, async ({ request }) => {
    await withDelay();
    const url = new URL(request.url);
    const empresaId = url.searchParams.get('empresaId');
    const result = empresaId
      ? canalesFixture.filter((c) => c.empresaId === empresaId)
      : canalesFixture;
    return HttpResponse.json(result);
  }),

  // POST /api/wa/canales/create
  http.post(`${API}/wa/canales/create`, async ({ request }) => {
    await withDelay();
    const body = (await request.json()) as Record<string, unknown>;
    const canal: CanalWhatsapp = {
      id: crypto.randomUUID(),
      empresaId: String(body['empresaId'] ?? ''),
      nombre: String(body['nombre'] ?? ''),
      instanceName: String(body['instanceName'] ?? ''),
      proveedor: 'EVOLUTION_API',
      estado: 'ACTIVO',
      apiUrl: String(body['apiUrl'] ?? ''),
      creadoEn: nowIso(),
      actualizadoEn: nowIso(),
    };
    canalesFixture.push(canal);
    return HttpResponse.json(canal, { status: 201 });
  }),

  // PUT /api/wa/canales/edit?id=
  http.put(`${API}/wa/canales/edit`, async ({ request }) => {
    await withDelay();
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    const idx = canalesFixture.findIndex((c) => c.id === id);
    if (idx === -1) return errors.notFound();
    const body = (await request.json()) as Record<string, unknown>;
    canalesFixture[idx] = {
      ...canalesFixture[idx]!,
      nombre: String(body['nombre'] ?? canalesFixture[idx]!.nombre),
      instanceName: String(body['instanceName'] ?? canalesFixture[idx]!.instanceName),
      apiUrl: String(body['apiUrl'] ?? canalesFixture[idx]!.apiUrl),
      actualizadoEn: nowIso(),
    };
    return HttpResponse.json(canalesFixture[idx]);
  }),

  // DELETE /api/wa/canales/delete?id=
  http.delete(`${API}/wa/canales/delete`, async ({ request }) => {
    await withDelay();
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    const idx = canalesFixture.findIndex((c) => c.id === id);
    if (idx === -1) return errors.notFound();
    canalesFixture.splice(idx, 1);
    return new HttpResponse(null, { status: 204 });
  }),

  // POST /api/wa/canales/conectar?id= — simula QR de Evolution
  http.post(`${API}/wa/canales/conectar`, async ({ request }) => {
    await withDelay(800);
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    const canal = canalesFixture.find((c) => c.id === id);
    if (!canal) return errors.notFound();

    // QR de ejemplo (1x1 pixel PNG en base64, en prod viene de Evolution)
    const mockQr = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

    return HttpResponse.json({ qrBase64: mockQr, estado: 'DESCONECTADO' });
  }),

  // GET /api/wa/canales/estado?id= — simula polling de estado
  http.get(`${API}/wa/canales/estado`, async ({ request }) => {
    await withDelay(300);
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    const canal = canalesFixture.find((c) => c.id === id);
    if (!canal) return errors.notFound();

    // En mock siempre retorna ACTIVO (simula que el QR fue escaneado)
    if (canal.estado !== 'ACTIVO') {
      const idx = canalesFixture.findIndex((c) => c.id === id);
      canalesFixture[idx] = { ...canalesFixture[idx]!, estado: 'ACTIVO', actualizadoEn: nowIso() };
    }

    return HttpResponse.json({ estado: 'ACTIVO' });
  }),

  // POST /api/wa/canales/sync-chats?canalId= — simula importación de historial
  http.post(`${API}/wa/canales/sync-chats`, async ({ request }) => {
    await withDelay(1200, 1800);
    const url = new URL(request.url);
    const canalId = url.searchParams.get('canalId');
    const canal = canalesFixture.find((c) => c.id === canalId);
    if (!canal) return errors.notFound();

    return HttpResponse.json({ imported: 12 });
  }),

  // ── Conversaciones ────────────────────────────────────────────────
  http.get(`${API}/wa/conversaciones/get-all`, async ({ request }) => {
    await withDelay();
    const empresaId = new URL(request.url).searchParams.get('empresaId') ?? '';
    const canales = canalesDeEmpresa(empresaId);
    return HttpResponse.json(conversacionesFixture.filter((c) => canales.includes(c.canalId)));
  }),

  http.get(`${API}/wa/conversaciones/get-by-id`, async ({ request }) => {
    await withDelay();
    const id = new URL(request.url).searchParams.get('id');
    const conv = conversacionesFixture.find((c) => c.id === id);
    return conv ? HttpResponse.json(conv) : errors.notFound();
  }),

  http.get(`${API}/wa/conversaciones/:id/mensajes`, async ({ params }) => {
    await withDelay();
    return HttpResponse.json(mensajesFixture[params['id'] as string] ?? []);
  }),

  http.put(`${API}/wa/conversaciones/asignar`, async ({ request }) => {
    await withDelay();
    const url = new URL(request.url);
    const conv = conversacionesFixture.find((c) => c.id === url.searchParams.get('id'));
    if (!conv) return errors.notFound();
    conv.asignadoA = url.searchParams.get('agenteId');
    conv.actualizadoEn = nowIso();
    return HttpResponse.json(conv);
  }),

  http.put(`${API}/wa/conversaciones/cerrar`, async ({ request }) => {
    await withDelay();
    const conv = conversacionesFixture.find((c) => c.id === new URL(request.url).searchParams.get('id'));
    if (!conv) return errors.notFound();
    conv.estado = 'CERRADA';
    conv.actualizadoEn = nowIso();
    return HttpResponse.json(conv);
  }),

  http.put(`${API}/wa/conversaciones/reabrir`, async ({ request }) => {
    await withDelay();
    const conv = conversacionesFixture.find((c) => c.id === new URL(request.url).searchParams.get('id'));
    if (!conv) return errors.notFound();
    conv.estado = 'ABIERTA';
    conv.actualizadoEn = nowIso();
    return HttpResponse.json(conv);
  }),

  http.put(`${API}/wa/conversaciones/marcar-leido`, async ({ request }) => {
    await withDelay();
    const conv = conversacionesFixture.find((c) => c.id === new URL(request.url).searchParams.get('id'));
    if (!conv) return errors.notFound();
    conv.noLeidos = 0;
    conv.actualizadoEn = nowIso();
    return HttpResponse.json(conv);
  }),

  // Toggle de bot/handoff: labels=["escalado_humano"] apaga el bot; [] lo reactiva.
  http.put(`${API}/wa/conversaciones/labels`, async ({ request }) => {
    await withDelay();
    const conv = conversacionesFixture.find((c) => c.id === new URL(request.url).searchParams.get('id'));
    if (!conv) return errors.notFound();
    const body = (await request.json()) as { labels?: string[] };
    const labels = body.labels ?? [];
    conv.labels = labels;
    conv.botActivo = !labels.includes('escalado_humano');
    conv.estado = conv.botActivo ? conv.estado : 'EN_ESPERA';
    conv.actualizadoEn = nowIso();
    return HttpResponse.json(conv);
  }),

  // ── Mensajes ──────────────────────────────────────────────────────
  http.post(`${API}/wa/mensajes/send`, async ({ request }) => {
    await withDelay();
    const conversacionId = new URL(request.url).searchParams.get('conversacionId') ?? '';
    const body = (await request.json()) as Record<string, unknown>;
    const mensaje: Mensaje = {
      id: crypto.randomUUID(),
      conversacionId,
      waMessageId: `wamid.mock-${crypto.randomUUID()}`,
      tipo: (body['tipo'] as Mensaje['tipo']) ?? 'TEXTO',
      direccion: 'SALIENTE',
      contenido: (body['contenido'] as string) ?? null,
      mediaUrl: (body['mediaUrl'] as string) ?? null,
      status: 'ENVIADO',
      enviadoPor: 'b0000001-0000-0000-0000-000000000001',
      creadoEn: nowIso(),
    };
    (mensajesFixture[conversacionId] ??= []).push(mensaje);
    return HttpResponse.json(mensaje, { status: 201 });
  }),

  // ── Grupos ────────────────────────────────────────────────────────
  http.get(`${API}/wa/grupos/get-all`, async () => {
    await withDelay();
    return HttpResponse.json(gruposFixture);
  }),

  http.get(`${API}/wa/grupos/:id/mensajes`, async ({ params }) => {
    await withDelay();
    return HttpResponse.json(mensajesGrupoFixture[params['id'] as string] ?? []);
  }),

  http.post(`${API}/wa/grupos/importar`, async () => {
    await withDelay(1000, 1500);
    return HttpResponse.json({ imported: 3 });
  }),

  http.post(`${API}/wa/grupos/:id/marcar-leido`, async ({ params }) => {
    await withDelay();
    const grupo = gruposFixture.find((g) => g.id === params['id']);
    if (!grupo) return errors.notFound();
    grupo.noLeidos = 0;
    return HttpResponse.json(grupo);
  }),

  // ── Ajustes ───────────────────────────────────────────────────────
  http.get(`${API}/wa/ajustes`, async () => {
    await withDelay();
    return HttpResponse.json(ajustesMock);
  }),

  http.put(`${API}/wa/ajustes`, async ({ request }) => {
    await withDelay();
    Object.assign(ajustesMock, await request.json());
    return HttpResponse.json(ajustesMock);
  }),

  // ── Plantillas ────────────────────────────────────────────────────
  http.get(`${API}/wa/plantillas/get-all`, async () => {
    await withDelay();
    return HttpResponse.json(plantillasMock);
  }),

  http.post(`${API}/wa/plantillas/create`, async ({ request }) => {
    await withDelay();
    const body = (await request.json()) as { titulo?: string; contenido?: string };
    const nueva = { id: crypto.randomUUID(), titulo: body.titulo ?? '', contenido: body.contenido ?? '' };
    plantillasMock.push(nueva);
    return HttpResponse.json(nueva);
  }),

  http.delete(`${API}/wa/plantillas/delete`, async ({ request }) => {
    await withDelay();
    const id = new URL(request.url).searchParams.get('id');
    const idx = plantillasMock.findIndex((p) => p.id === id);
    if (idx === -1) return errors.notFound();
    plantillasMock.splice(idx, 1);
    return new HttpResponse(null, { status: 204 });
  }),

  // ── SSE stream ────────────────────────────────────────────────────
  // Mantiene la conexión abierta sin emitir eventos (en dev no hay webhooks
  // reales). Evita el error de red / loop de reconexión que daría un 404.
  http.get(`${API}/wa/stream`, () => {
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode(': connected\n\n'));
      },
    });
    return new HttpResponse(stream, {
      headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' },
    });
  }),
];
