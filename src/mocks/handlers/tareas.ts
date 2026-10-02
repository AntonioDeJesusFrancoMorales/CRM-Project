import { http, HttpResponse } from 'msw';
import { withDelay } from '@/mocks/utils/withDelay';
import { errors } from '@/mocks/utils/error';
import { nowIso } from '@/mocks/utils/crud';
import { tareasFixture } from '@/mocks/fixtures/tareas';
import { fichasFixture, tableroTareasFixture } from '@/mocks/fixtures/tableros';
import type { Tarea } from '@/api/types';

const API = '/api';

export const tareasHandlers = [
  // GET /api/tareas/get-all — retorna lista completa sin filtros server-side
  http.get(`${API}/tareas/get-all`, async () => {
    await withDelay();
    return HttpResponse.json(tareasFixture);
  }),

  // GET /api/tareas/get-by-id?id= — retorna tarea individual por query param
  http.get(`${API}/tareas/get-by-id`, async ({ request }) => {
    await withDelay();
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    const tarea = tareasFixture.find((t) => t.id === id);
    return tarea ? HttpResponse.json(tarea) : errors.notFound();
  }),

  // POST /api/tareas/create — crea tarea; tratoId viene del body
  http.post(`${API}/tareas/create`, async ({ request }) => {
    await withDelay();
    const body = (await request.json()) as Record<string, unknown>;
    const tarea: Tarea = {
      id: crypto.randomUUID(),
      tratoId: String(body['tratoId'] ?? ''),
      responsableId: String(body['responsableId'] ?? ''),
      titulo: String(body['titulo'] ?? ''),
      descripcion: (body['descripcion'] as string | null) ?? null,
      tipo: ((body['tipo'] as Tarea['tipo']) ?? 'GENERAL'),
      prioridad: ((body['prioridad'] as Tarea['prioridad']) ?? 'MEDIA'),
      fechaLimite: String(body['fechaLimite'] ?? nowIso()),
      fechaCompletada: null,
      creadoEn: nowIso(),
      actualizadoEn: nowIso(),
    };
    tareasFixture.push(tarea);
    const columnaInicial = tableroTareasFixture.columnas[0];
    if (columnaInicial) {
      fichasFixture.push({
        id: crypto.randomUUID(),
        columnaId: columnaInicial.id,
        tipoFicha: 'TAREA',
        tratoId: null,
        tareaId: tarea.id,
        actualizadoEn: nowIso(),
        etiquetas: [],
      });
    }
    return HttpResponse.json(tarea, { status: 201 });
  }),

  // PUT /api/tareas/edit?id= — actualiza tarea por query param
  http.put(`${API}/tareas/edit`, async ({ request }) => {
    await withDelay();
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    const idx = tareasFixture.findIndex((t) => t.id === id);
    if (idx === -1) return errors.notFound();
    const body = (await request.json()) as Record<string, unknown>;
    tareasFixture[idx] = {
      ...tareasFixture[idx]!,
      ...body,
      actualizadoEn: nowIso(),
    } as Tarea;
    return HttpResponse.json(tareasFixture[idx]);
  }),

  // DELETE /api/tareas/delete?id= — elimina tarea por query param
  http.delete(`${API}/tareas/delete`, async ({ request }) => {
    await withDelay();
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    const idx = tareasFixture.findIndex((t) => t.id === id);
    if (idx === -1) return errors.notFound();
    tareasFixture.splice(idx, 1);
    return new HttpResponse(null, { status: 204 });
  }),
];
