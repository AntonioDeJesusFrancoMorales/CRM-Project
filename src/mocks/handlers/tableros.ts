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
// Cada columna creada se registra también en columnasFixture (catálogo)
// para que pueda clasificarse con esPredeterminada y editarse desde el UI.
function buildDefaultColumns(tipo: TipoTablero): ColumnaTablero[] {
  const base = { color: '#94a3b8', nota: null, totalValorEstimado: 0 };

  type ColDef = {
    nombre: string;
    limiteWip: number;
    estadoTarea: ColumnaTablero['estadoTarea'];
    estadoTrato: ColumnaTablero['estadoTrato'];
  };

  const defs: ColDef[] = tipo === 'TAREAS'
    ? [
        { nombre: 'Pendiente',  limiteWip: 5, estadoTarea: 'PENDIENTE',  estadoTrato: null },
        { nombre: 'En Curso',   limiteWip: 3, estadoTarea: 'EN_CURSO',   estadoTrato: null },
        { nombre: 'Finalizada', limiteWip: 5, estadoTarea: 'FINALIZADA', estadoTrato: null },
        { nombre: 'Cancelada',  limiteWip: 5, estadoTarea: 'PENDIENTE',  estadoTrato: null },
      ]
    : [
        { nombre: 'Abierto',  limiteWip: 10, estadoTarea: null, estadoTrato: 'ABIERTO' },
        { nombre: 'Ganado',   limiteWip: 10, estadoTarea: null, estadoTrato: 'GANADO'  },
        { nombre: 'Perdido',  limiteWip: 10, estadoTarea: null, estadoTrato: 'PERDIDO' },
        { nombre: 'Archivado', limiteWip: 10, estadoTarea: null, estadoTrato: 'PERDIDO' },
      ];

  return defs.map((def) => {
    const id = crypto.randomUUID();

    // Registrar en el catálogo para que esPredeterminada() y las queries de columnas funcionen
    const entrada: Columna = {
      id,
      nombre: def.nombre,
      color: base.color,
      tipoTablero: tipo,
      tipoColumna: 'PREDETERMINADA',
    };
    columnasFixture.push(entrada);

    const columnaTablero: ColumnaTablero = {
      id,
      nombre: def.nombre,
      color: base.color,
      limiteWip: def.limiteWip,
      nota: base.nota,
      estadoTarea: def.estadoTarea,
      estadoTrato: def.estadoTrato,
      totalValorEstimado: base.totalValorEstimado,
    };
    return columnaTablero;
  });
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

  // POST /tableros/asignar-columna?id=&columnaId= — agrega la columna del catálogo al tablero
  http.post(`${API}/tableros/asignar-columna`, async ({ request }) => {
    await withDelay();
    const params = new URL(request.url).searchParams;
    const tableroId = params.get('id');
    const columnaId = params.get('columnaId');
    const t = tablerosFixture.find((x) => x.id === tableroId);
    if (!t) return errors.notFound();

    // Guard de duplicados (el back lanza ColumnaYaExisteEnTableroException)
    if (columnaId && !t.columnas.some((c) => c.id === columnaId)) {
      const body = (await request.json()) as Partial<
        Pick<ColumnaTablero, 'limiteWip' | 'nota' | 'estadoTarea' | 'estadoTrato' | 'totalValorEstimado'>
      >;
      const cat = columnasFixture.find((c) => c.id === columnaId);
      const nueva: ColumnaTablero = {
        id: columnaId,
        nombre: cat?.nombre ?? 'Nueva columna',
        color: cat?.color ?? '#FFFFFF',
        limiteWip: body.limiteWip ?? null,
        nota: body.nota ?? null,
        estadoTarea: body.estadoTarea ?? null,
        estadoTrato: body.estadoTrato ?? null,
        totalValorEstimado: body.totalValorEstimado ?? 0,
      };
      t.columnas.push(nueva);
    }
    return HttpResponse.json(t);
  }),

  // POST /tableros/agregar-columna?id= — crea la columna del catálogo Y la agrega al
  // tablero en una sola operación (flujo vigente del front). Devuelve el tablero.
  http.post(`${API}/tableros/agregar-columna`, async ({ request }) => {
    await withDelay();
    const tableroId = new URL(request.url).searchParams.get('id');
    const t = tablerosFixture.find((x) => x.id === tableroId);
    if (!t) return errors.notFound();

    const body = (await request.json()) as Partial<
      Pick<ColumnaTablero, 'nombre' | 'color' | 'limiteWip' | 'nota' | 'estadoTarea' | 'estadoTrato' | 'totalValorEstimado'>
    >;

    const nuevaId = crypto.randomUUID();
    const nueva: ColumnaTablero = {
      id: nuevaId,
      nombre: body.nombre ?? 'Nueva columna',
      color: body.color ?? '#FFFFFF',
      limiteWip: body.limiteWip ?? null,
      nota: body.nota ?? null,
      estadoTarea: body.estadoTarea ?? null,
      estadoTrato: body.estadoTrato ?? null,
      totalValorEstimado: body.totalValorEstimado ?? 0,
    };
    t.columnas.push(nueva);
    return HttpResponse.json(t, { status: 201 });
  }),

  // DELETE /tableros/eliminar-columna?id=&columnaId= — quita la columna del tablero.
  // El back rechaza con 409 si la columna tiene fichas activas (hay que moverlas antes).
  http.delete(`${API}/tableros/eliminar-columna`, async ({ request }) => {
    await withDelay();
    const params = new URL(request.url).searchParams;
    const tableroId = params.get('id');
    const columnaId = params.get('columnaId');
    const t = tablerosFixture.find((x) => x.id === tableroId);
    if (!t) return errors.notFound();
    // Guard 409: no se puede quitar una columna con fichas
    const tieneFichas = fichasFixture.some((f) => f.columnaId === columnaId);
    if (tieneFichas) {
      return errors.conflict('La columna tiene fichas activas');
    }
    if (columnaId) {
      t.columnas = t.columnas.filter((c) => c.id !== columnaId);
    }
    return HttpResponse.json(t);
  }),

  // PUT /tableros/reordenar-columnas?id= — aplica nuevoOrden (permutación de ColumnaId records)
  // El back usa List<ColumnaId> donde ColumnaId = record(UUID value).
  // Jackson serializa/deserializa records con sus campos nominales → [{value: uuid}], NO [uuid].
  http.put(`${API}/tableros/reordenar-columnas`, async ({ request }) => {
    await withDelay();
    const id = new URL(request.url).searchParams.get('id');
    const t = tablerosFixture.find((x) => x.id === id);
    if (!t) return errors.notFound();
    const body = (await request.json()) as { nuevoOrden?: Array<{ value: string }> };
    if (body.nuevoOrden && body.nuevoOrden.length > 0) {
      const orden = body.nuevoOrden.map((item) => item.value);
      // Reordena las columnas del tablero según la posición en nuevoOrden
      t.columnas = [...t.columnas].sort(
        (a, b) => orden.indexOf(a.id) - orden.indexOf(b.id),
      );
    }
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

  // PUT /columnas/edit?id= — edición parcial del catálogo + sincroniza las
  // ColumnaTablero embebidas en los tableros (espeja TableroResponse.fromDomain del back,
  // que resuelve nombre/color desde el catálogo al construir la respuesta del tablero).
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

    // Propaga nombre/color a las copias embebidas en todos los tableros
    for (const t of tablerosFixture) {
      for (const col of t.columnas) {
        if (col.id !== id) continue;
        if (body.nombre !== undefined) col.nombre = body.nombre;
        if (body.color !== undefined) col.color = body.color;
      }
    }
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

  // POST /fichas/create — responde con FichaResponse (sin responsableId/creadoPor/creadoEn)
  http.post(`${API}/fichas/create`, async ({ request }) => {
    await withDelay();
    const body = (await request.json()) as Record<string, unknown>;
    const ficha: Ficha = {
      id: crypto.randomUUID(),
      columnaId: String(body['columnaId'] ?? ''),
      tipoFicha: (body['tipoFicha'] as Ficha['tipoFicha']) ?? 'TRATO',
      tratoId: (body['tratoId'] as string | null) ?? null,
      tareaId: (body['tareaId'] as string | null) ?? null,
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

  // PUT /fichas/mover-columna?id= — endpoint dedicado para drag entre columnas
  // body: { targetColumnaId: uuid }
  // Responde con FichaResponse (sin responsableId/creadoPor/creadoEn)
  http.put(`${API}/fichas/mover-columna`, async ({ request }) => {
    await withDelay();
    const id = new URL(request.url).searchParams.get('id');
    const f = fichasFixture.find((x) => x.id === id);
    if (!f) return errors.notFound();
    const body = (await request.json()) as { targetColumnaId?: string };
    if (body.targetColumnaId) {
      f.columnaId = body.targetColumnaId;
      f.actualizadoEn = nowIso();
    }
    return HttpResponse.json(f);
  }),
];
