import { http, HttpResponse } from 'msw';
import { withDelay } from '@/mocks/utils/withDelay';
import { errors } from '@/mocks/utils/error';
import { nowIso } from '@/mocks/utils/crud';
import { tareasFixture } from '@/mocks/fixtures/tareas';
import type { Tarea } from '@/api/types';

const API = '/api/v1';

export const tareasHandlers = [
  http.post(`${API}/tratos/:id/tareas`, async ({ params, request }) => {
    await withDelay();
    const body = (await request.json()) as Record<string, unknown>;
    const tarea: Tarea = {
      id: crypto.randomUUID(),
      trato_id: String(params['id']),
      responsable_id: String(body['responsable_id'] ?? ''),
      titulo: String(body['titulo'] ?? ''),
      descripcion: (body['descripcion'] as string | null) ?? null,
      tipo: (body['tipo'] as Tarea['tipo']) ?? 'seguimiento',
      estado: 'pendiente',
      prioridad: ((body['prioridad'] as Tarea['prioridad']) ?? 2),
      fecha_limite: (body['fecha_limite'] as string | null) ?? null,
      fecha_completada: null,
      creado_en: nowIso(),
      actualizado_en: nowIso(),
    };
    tareasFixture.push(tarea);
    return HttpResponse.json(tarea, { status: 201 });
  }),
  http.get(`${API}/tareas/:id`, async ({ params }) => {
    await withDelay();
    const t = tareasFixture.find((x) => x.id === params['id']);
    return t ? HttpResponse.json(t) : errors.notFound();
  }),
  http.patch(`${API}/tareas/:id`, async ({ params, request }) => {
    await withDelay();
    const idx = tareasFixture.findIndex((x) => x.id === params['id']);
    if (idx === -1) return errors.notFound();
    const body = (await request.json()) as Record<string, unknown>;
    tareasFixture[idx] = { ...tareasFixture[idx]!, ...body, actualizado_en: nowIso() } as Tarea;
    return HttpResponse.json(tareasFixture[idx]);
  }),
  http.patch(`${API}/tareas/:id/completar`, async ({ params }) => {
    await withDelay();
    const t = tareasFixture.find((x) => x.id === params['id']);
    if (!t) return errors.notFound();
    t.estado = 'completada';
    t.fecha_completada = nowIso();
    t.actualizado_en = nowIso();
    return HttpResponse.json(t);
  }),
  http.delete(`${API}/tareas/:id`, async ({ params }) => {
    await withDelay();
    const idx = tareasFixture.findIndex((x) => x.id === params['id']);
    if (idx === -1) return errors.notFound();
    tareasFixture.splice(idx, 1);
    return new HttpResponse(null, { status: 204 });
  }),
];
