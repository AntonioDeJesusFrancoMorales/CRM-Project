import { http, HttpResponse } from 'msw';
import { withDelay } from '@/mocks/utils/withDelay';
import { errors } from '@/mocks/utils/error';
import { nowIso } from '@/mocks/utils/crud';
import { canalesFixture } from '@/mocks/fixtures/canales';
import type { CanalWhatsapp } from '@/api/types';

const API = '/api';

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
      proveedor: 'EVOLUTION',
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
];
