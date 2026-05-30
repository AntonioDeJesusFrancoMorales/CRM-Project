import { http, HttpResponse } from 'msw';
import { withDelay } from '@/mocks/utils/withDelay';
import { errors } from '@/mocks/utils/error';
import { nowIso } from '@/mocks/utils/crud';
import { empresasFixture } from '@/mocks/fixtures/empresas';
import type { Empresa } from '@/api/types';

const API = '/api';

export const empresasHandlers = [
  // GET /api/empresas/get-all — retorna lista completa sin filtros server-side
  http.get(`${API}/empresas/get-all`, async () => {
    await withDelay();
    return HttpResponse.json(empresasFixture);
  }),

  // POST /api/empresas/create — crea empresa
  http.post(`${API}/empresas/create`, async ({ request }) => {
    await withDelay();
    const body = (await request.json()) as Record<string, unknown>;
    const empresa: Empresa = {
      id: crypto.randomUUID(),
      nombre: String(body['nombre'] ?? ''),
      sector: (body['sector'] as string | null) ?? null,
      telefono: (body['telefono'] as string | null) ?? null,
      paginaWeb: (body['paginaWeb'] as string | null) ?? null,
      facebook: (body['facebook'] as string | null) ?? null,
      instagram: (body['instagram'] as string | null) ?? null,
      twitter: (body['twitter'] as string | null) ?? null,
      estadoRelacion: ((body['estadoRelacion'] as Empresa['estadoRelacion']) ?? 'ACTIVO'),
      responsableId: (body['responsableId'] as string | null) ?? null,
      creadoPor: (body['creadoPor'] as string | null) ?? null,
      notas: (body['notas'] as string | null) ?? null,
      creadoEn: nowIso(),
      actualizadoEn: nowIso(),
    };
    empresasFixture.push(empresa);
    return HttpResponse.json(empresa, { status: 201 });
  }),

  // PUT /api/empresas/edit?id= — actualiza empresa por query param
  http.put(`${API}/empresas/edit`, async ({ request }) => {
    await withDelay();
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    const idx = empresasFixture.findIndex((e) => e.id === id);
    if (idx === -1) return errors.notFound();
    const body = (await request.json()) as Record<string, unknown>;
    empresasFixture[idx] = {
      ...empresasFixture[idx]!,
      ...body,
      actualizadoEn: nowIso(),
    } as Empresa;
    return HttpResponse.json(empresasFixture[idx]);
  }),

  // DELETE /api/empresas/delete?id= — elimina empresa por query param
  http.delete(`${API}/empresas/delete`, async ({ request }) => {
    await withDelay();
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    const idx = empresasFixture.findIndex((e) => e.id === id);
    if (idx === -1) return errors.notFound();
    empresasFixture.splice(idx, 1);
    return new HttpResponse(null, { status: 204 });
  }),

];
