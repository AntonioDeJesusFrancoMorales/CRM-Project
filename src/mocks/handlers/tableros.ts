// Handlers MSW para el feature Kanban.
// B1.8: imports actualizados a kanban/schemas (tipos viejos eliminados de api/types.ts).
// B5: handlers reescritos al patrón RPC ?id= del contrato back.

import { http, HttpResponse } from 'msw';
import { withDelay } from '@/mocks/utils/withDelay';
import { errors } from '@/mocks/utils/error';
import { nowIso } from '@/mocks/utils/crud';
import {
  tablerosFixture,
  columnasFixture,
  fichasFixture,
} from '@/mocks/fixtures/tableros';
import type { Ficha } from '@/features/kanban/schemas/ficha.schema';
import type {
  Tablero,
  ColumnaTablero,
  TipoTablero,
} from '@/features/kanban/schemas/tablero.schema';
import type { Columna } from '@/features/kanban/schemas/columna.schema';

const API = '/api';

// Construye las 4 columnas por defecto según el tipo de tablero,
// espejando CreateTableroService.buildDefaultColumns del back AR-CRM.
function buildDefaultColumns(tipo: TipoTablero): ColumnaTablero[] {
  const base = { color: '#FFFFFF', nota: null, totalValorEstimado: 0 };
  if (tipo === 'TAREAS') {
    return [
      { id: crypto.randomUUID(), nombre: 'Pendiente', limiteWip: 5, estadoTarea: 'PENDIENTE', estadoTrato: null, ...base },
      { id: crypto.randomUUID(), nombre: 'En Curso', limiteWip: 3, estadoTarea: 'EN_CURSO', estadoTrato: null, ...base },
      { id: crypto.randomUUID(), nombre: 'Finalizada', limiteWip: 5, estadoTarea: 'FINALIZADA', estadoTrato: null, ...base },
      { id: crypto.randomUUID(), nombre: 'Cancelada', limiteWip: 5, estadoTarea: 'PENDIENTE', estadoTrato: null, ...base },
    ];
  }
  return [
    { id: crypto.randomUUID(), nombre: 'Abierto', limiteWip: 10, estadoTarea: null, estadoTrato: 'ABIERTO', ...base },
    { id: crypto.randomUUID(), nombre: 'Ganado', limiteWip: 10, estadoTarea: null, estadoTrato: 'GANADO', ...base },
    { id: crypto.randomUUID(), nombre: 'Perdido', limiteWip: 10, estadoTarea: null, estadoTrato: 'PERDIDO', ...base },
    { id: crypto.randomUUID(), nombre: 'Archived', limiteWip: 10, estadoTarea: null, estadoTrato: 'PERDIDO', ...base },
  ];
}

export const tablerosHandlers = [
  // ---------------------------------------------------------------------------
  // Tableros — patrón RPC ?id=
  // ---------------------------------------------------------------------------

  // GET /tableros/get-all
  http.get(`${API}/tableros/get-all`, async () => {
    await withDelay();
    return HttpResponse.json(tablerosFixture);
  }),

  // GET /tableros/get-by-id?id=
  http.get(`${API}/tableros/get-by-id`, async ({ request }) => {
    await withDelay();
    const id = new URL(request.url).searchParams.get('id');
    const t = tablerosFixture.find((x) => x.id === id);
    if (!t) return errors.notFound();
    return HttpResponse.json(t);
  }),

  // POST /tableros/asignar-columna?id=&columnaId=
  http.post(`${API}/tableros/asignar-columna`, async ({ request }) => {
    await withDelay();
    const params = new URL(request.url).searchParams;
    const tableroId = params.get('id');
    const t = tablerosFixture.find((x) => x.id === tableroId);
    if (!t) return errors.notFound();
    return HttpResponse.json(t);
  }),

  // DELETE /tableros/eliminar-columna?id=&columnaId=
  http.delete(`${API}/tableros/eliminar-columna`, async ({ request }) => {
    await withDelay();
    const params = new URL(request.url).searchParams;
    const tableroId = params.get('id');
    const t = tablerosFixture.find((x) => x.id === tableroId);
    if (!t) return errors.notFound();
    return HttpResponse.json(t);
  }),

  // PUT /tableros/reordenar-columnas?id=
  http.put(`${API}/tableros/reordenar-columnas`, async ({ request }) => {
    await withDelay();
    const id = new URL(request.url).searchParams.get('id');
    const t = tablerosFixture.find((x) => x.id === id);
    if (!t) return errors.notFound();
    return HttpResponse.json(t);
  }),

  // POST /tableros/create — sintetiza 4 columnas por defecto según tipoTablero
  http.post(`${API}/tableros/create`, async ({ request }) => {
    await withDelay();
    const body = (await request.json()) as Record<string, unknown>;
    const tipoTablero = (body['tipoTablero'] as TipoTablero) ?? 'TRATOS';
    const tablero: Tablero = {
      id: crypto.randomUUID(),
      nombre: String(body['nombre'] ?? ''),
      descripcion: (body['descripcion'] as string | null) ?? null,
      tipoTablero,
      columnas: buildDefaultColumns(tipoTablero),
      creadoEn: nowIso(),
    };
    tablerosFixture.push(tablero);
    return HttpResponse.json(tablero, { status: 201 });
  }),

  // PUT /tableros/edit?id= — solo nombre y descripcion (tipoTablero/creadoEn se preservan)
  http.put(`${API}/tableros/edit`, async ({ request }) => {
    await withDelay();
    const id = new URL(request.url).searchParams.get('id');
    const t = tablerosFixture.find((x) => x.id === id);
    if (!t) return errors.notFound();
    const body = (await request.json()) as Partial<Pick<Tablero, 'nombre' | 'descripcion'>>;
    if (body.nombre !== undefined) t.nombre = body.nombre;
    if (body.descripcion !== undefined) t.descripcion = body.descripcion;
    return HttpResponse.json(t);
  }),

  // DELETE /tableros/delete?id=
  http.delete(`${API}/tableros/delete`, async ({ request }) => {
    await withDelay();
    const id = new URL(request.url).searchParams.get('id');
    const idx = tablerosFixture.findIndex((x) => x.id === id);
    if (idx === -1) return errors.notFound();
    tablerosFixture.splice(idx, 1);
    return new HttpResponse(null, { status: 204 });
  }),

  // ---------------------------------------------------------------------------
  // Columnas catálogo — patrón RPC ?id=
  // ---------------------------------------------------------------------------

  // GET /columnas/get-all
  http.get(`${API}/columnas/get-all`, async () => {
    await withDelay();
    return HttpResponse.json(columnasFixture);
  }),

  // GET /columnas/get-by-id?id=
  http.get(`${API}/columnas/get-by-id`, async ({ request }) => {
    await withDelay();
    const id = new URL(request.url).searchParams.get('id');
    const c = columnasFixture.find((x) => x.id === id);
    if (!c) return errors.notFound();
    return HttpResponse.json(c);
  }),

  // POST /columnas/create
  http.post(`${API}/columnas/create`, async ({ request }) => {
    await withDelay();
    const body = (await request.json()) as Record<string, unknown>;
    const columna: Columna = {
      id: crypto.randomUUID(),
      nombre: String(body['nombre'] ?? ''),
      color: String(body['color'] ?? '#FFFFFF'),
      tipoTablero: (body['tipoTablero'] as Columna['tipoTablero']) ?? 'TRATOS',
      tipoColumna: (body['tipoColumna'] as Columna['tipoColumna']) ?? 'PERSONALIZADA',
    };
    columnasFixture.push(columna);
    return HttpResponse.json(columna, { status: 201 });
  }),

  // PUT /columnas/edit?id= — edición parcial
  http.put(`${API}/columnas/edit`, async ({ request }) => {
    await withDelay();
    const id = new URL(request.url).searchParams.get('id');
    const c = columnasFixture.find((x) => x.id === id);
    if (!c) return errors.notFound();
    const body = (await request.json()) as Partial<Columna>;
    if (body.nombre !== undefined) c.nombre = body.nombre;
    if (body.color !== undefined) c.color = body.color;
    if (body.tipoTablero !== undefined) c.tipoTablero = body.tipoTablero;
    if (body.tipoColumna !== undefined) c.tipoColumna = body.tipoColumna;
    return HttpResponse.json(c);
  }),

  // DELETE /columnas/delete?id=
  http.delete(`${API}/columnas/delete`, async ({ request }) => {
    await withDelay();
    const id = new URL(request.url).searchParams.get('id');
    const idx = columnasFixture.findIndex((x) => x.id === id);
    if (idx === -1) return errors.notFound();
    columnasFixture.splice(idx, 1);
    return new HttpResponse(null, { status: 204 });
  }),

  // ---------------------------------------------------------------------------
  // Fichas — patrón RPC ?id=
  // ---------------------------------------------------------------------------

  // GET /fichas/get-all
  http.get(`${API}/fichas/get-all`, async () => {
    await withDelay();
    return HttpResponse.json(fichasFixture);
  }),

  // POST /fichas/create
  http.post(`${API}/fichas/create`, async ({ request }) => {
    await withDelay();
    const body = (await request.json()) as Record<string, unknown>;
    const ficha: Ficha = {
      id: crypto.randomUUID(),
      columnaId: String(body['columnaId'] ?? ''),
      tipoFicha: (body['tipoFicha'] as Ficha['tipoFicha']) ?? 'TRATO',
      tratoId: (body['tratoId'] as string | null) ?? null,
      tareaId: (body['tareaId'] as string | null) ?? null,
      responsableId: String(body['responsableId'] ?? ''),
      creadoPor: String(body['creadoPor'] ?? ''),
      creadoEn: nowIso(),
      actualizadoEn: nowIso(),
    };
    fichasFixture.push(ficha);
    return HttpResponse.json(ficha, { status: 201 });
  }),

  // PUT /fichas/edit?id= — merge de columnaId (mover ficha)
  http.put(`${API}/fichas/edit`, async ({ request }) => {
    await withDelay();
    const id = new URL(request.url).searchParams.get('id');
    const f = fichasFixture.find((x) => x.id === id);
    if (!f) return errors.notFound();
    const body = (await request.json()) as Partial<Ficha>;
    Object.assign(f, body, { actualizadoEn: nowIso() });
    return HttpResponse.json(f);
  }),

  // DELETE /fichas/delete?id=
  http.delete(`${API}/fichas/delete`, async ({ request }) => {
    await withDelay();
    const id = new URL(request.url).searchParams.get('id');
    const idx = fichasFixture.findIndex((x) => x.id === id);
    if (idx === -1) return errors.notFound();
    fichasFixture.splice(idx, 1);
    return new HttpResponse(null, { status: 204 });
  }),
];
