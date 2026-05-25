import { http, HttpResponse } from 'msw';
import { withDelay } from '@/mocks/utils/withDelay';
import { errors } from '@/mocks/utils/error';
import { nowIso } from '@/mocks/utils/crud';
import { tareasFixture } from '@/mocks/fixtures/tareas';
import type { Tarea } from '@/api/types';

const API = '/api/v1';

/**
 * Suma N días a una fecha ISO en formato 'YYYY-MM-DD' y devuelve 'YYYY-MM-DD'.
 * Operación puramente de strings para evitar problemas de zona horaria.
 */
function addDaysIso(dateIso: string, days: number): string {
  const d = new Date(`${dateIso}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export const tareasHandlers = [
  // Override GET /tareas con filtros server-side — ANTES de los handlers específicos
  // ADR-053: filtros: trato_id, responsable_id, estado, prioridad (Number()), vencimiento
  // Semántica de vencimiento:
  //   vencidas  = fecha_limite < hoy && estado != 'completada'
  //   proximas  = fecha_limite in [hoy, hoy+7d] && estado != 'completada'
  //   todas     = sin filtro de fecha
  http.get(`${API}/tareas`, async ({ request }) => {
    await withDelay();
    const url = new URL(request.url);
    const tratoId = url.searchParams.get('trato_id');
    const responsableId = url.searchParams.get('responsable_id');
    const estado = url.searchParams.get('estado');
    const prioridadRaw = url.searchParams.get('prioridad');
    const vencimiento = url.searchParams.get('vencimiento');

    let result: Tarea[] = tareasFixture;

    if (tratoId) result = result.filter((t) => t.trato_id === tratoId);
    if (responsableId) result = result.filter((t) => t.responsable_id === responsableId);
    if (estado) result = result.filter((t) => t.estado === estado);
    if (prioridadRaw) {
      const prioridad = Number(prioridadRaw) as Tarea['prioridad'];
      result = result.filter((t) => t.prioridad === prioridad);
    }

    if (vencimiento && vencimiento !== 'todas') {
      const hoy = nowIso().slice(0, 10);
      if (vencimiento === 'vencidas') {
        result = result.filter(
          (t) => t.fecha_limite !== null && t.fecha_limite < hoy && t.estado !== 'completada',
        );
      } else if (vencimiento === 'proximas') {
        const limite = addDaysIso(hoy, 7);
        result = result.filter(
          (t) =>
            t.fecha_limite !== null &&
            t.fecha_limite >= hoy &&
            t.fecha_limite <= limite &&
            t.estado !== 'completada',
        );
      }
    }

    return HttpResponse.json(result);
  }),
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
