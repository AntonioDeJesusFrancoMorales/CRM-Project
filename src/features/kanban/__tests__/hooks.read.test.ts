// Tests de integración para hooks de lectura del feature Kanban.
// Strict TDD B2.1 (RED): tests escritos ANTES de la implementación.
// Harness: renderHook + QueryClient + MSW (mismo patrón que useTratos/useTrato).

import { describe, it, expect } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';

import { setupTestWrapper } from '@/test/wrappers';
import { server } from '@/test/server';
import type { Tablero } from '@/features/kanban/schemas/tablero.schema';
import type { Columna } from '@/features/kanban/schemas/columna.schema';
import type { Ficha } from '@/features/kanban/schemas/ficha.schema';

// ---------------------------------------------------------------------------
// Fixtures mínimos para los tests
// ---------------------------------------------------------------------------

const TABLERO_FIXTURE: Tablero = {
  id: 'f1111111-ffff-1111-ffff-111111111111',
  nombre: 'Pipeline de Tratos',
  descripcion: 'Estado actual de todos los tratos abiertos.',
  tipoTablero: 'TRATOS',
  columnas: [
    {
      id: 'a1111111-aaaa-1111-aaaa-111111111111',
      nombre: 'Por contactar',
      color: '#94a3b8',
      limiteWip: null,
      nota: null,
      totalValorEstimado: 0,
    },
    {
      id: 'a2222222-aaaa-2222-aaaa-222222222222',
      nombre: 'En negociación',
      color: '#fbbf24',
      limiteWip: 5,
      nota: 'Máximo 5 tratos activos',
      totalValorEstimado: 430000,
    },
  ],
  creadoEn: '2026-04-01T08:00:00',
};

const TABLEROS_FIXTURE: Tablero[] = [TABLERO_FIXTURE];

const COLUMNAS_FIXTURE: Columna[] = [
  {
    id: 'a1111111-aaaa-1111-aaaa-111111111111',
    nombre: 'Por contactar',
    color: '#94a3b8',
    tipoTablero: 'TRATOS',
    tipoColumna: 'PREDETERMINADA',
  },
  {
    id: 'a2222222-aaaa-2222-aaaa-222222222222',
    nombre: 'En negociación',
    color: '#fbbf24',
    tipoTablero: 'TRATOS',
    tipoColumna: 'PERSONALIZADA',
  },
];

const FICHAS_FIXTURE: Ficha[] = [
  {
    id: 'h1111111-hhhh-1111-hhhh-111111111111',
    columnaId: 'a1111111-aaaa-1111-aaaa-111111111111',
    tipoFicha: 'TRATO',
    tratoId: 'd1111111-dddd-1111-dddd-111111111111',
    tareaId: null,
    actualizadoEn: '2026-04-10T08:00:00Z',
  },
  {
    id: 'h2222222-hhhh-2222-hhhh-222222222222',
    columnaId: 'a2222222-aaaa-2222-aaaa-222222222222',
    tipoFicha: 'TRATO',
    tratoId: 'd2222222-dddd-2222-dddd-222222222222',
    tareaId: null,
    actualizadoEn: '2026-04-11T09:00:00Z',
  },
  {
    id: 'h3333333-hhhh-3333-hhhh-333333333333',
    columnaId: 'a2222222-aaaa-2222-aaaa-222222222222',
    tipoFicha: 'TRATO',
    tratoId: 'd3333333-dddd-3333-dddd-333333333333',
    tareaId: null,
    actualizadoEn: '2026-04-12T10:00:00Z',
  },
];

// ---------------------------------------------------------------------------
// useTableros — lista todos los tableros, queryKey ['tableros']
// ---------------------------------------------------------------------------

describe('useTableros', () => {
  it('invoca GET /api/tableros/get-all y retorna lista de tableros', async () => {
    let capturedUrl: string | null = null;
    server.use(
      http.get('/api/tableros/get-all', ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json(TABLEROS_FIXTURE);
      }),
    );

    const { Wrapper } = setupTestWrapper();
    const { useTableros } = await import('../hooks/useTableros');
    const { result } = renderHook(() => useTableros(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(capturedUrl).toContain('/tableros/get-all');
    expect(Array.isArray(result.current.data)).toBe(true);
    expect(result.current.data!.length).toBe(1);
  });

  it('filtra tableros TRATOS client-side — solo devuelve tipoTablero === TRATOS', async () => {
    const MIXED: Tablero[] = [
      TABLERO_FIXTURE,
      { ...TABLERO_FIXTURE, id: 'f9999', tipoTablero: 'TAREAS', nombre: 'Tareas' },
    ];
    server.use(
      http.get('/api/tableros/get-all', () => HttpResponse.json(MIXED)),
    );

    const { Wrapper } = setupTestWrapper();
    const { useTableros } = await import('../hooks/useTableros');
    const { result } = renderHook(() => useTableros(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Los datos raw incluyen los dos; el filtrado es responsabilidad del consumidor.
    // El hook devuelve todos — el filtro es client-side EN LA PAGE, no en el hook.
    const data = result.current.data!;
    expect(data.length).toBe(2);
    const soloTratos = data.filter((t) => t.tipoTablero === 'TRATOS');
    expect(soloTratos.length).toBe(1);
  });

  it('queryKey es exactamente ["tableros"]', async () => {
    server.use(
      http.get('/api/tableros/get-all', () => HttpResponse.json(TABLEROS_FIXTURE)),
    );

    const { Wrapper, queryClient } = setupTestWrapper();
    const { useTableros } = await import('../hooks/useTableros');
    const { result } = renderHook(() => useTableros(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const queryCache = queryClient.getQueryCache().findAll();
    const q = queryCache.find((q) => q.queryKey[0] === 'tableros' && q.queryKey.length === 1);
    expect(q).toBeDefined();
    expect(q!.queryKey).toEqual(['tableros']);
  });

  it('retorna campos del schema — id, nombre, tipoTablero, columnas[]', async () => {
    server.use(
      http.get('/api/tableros/get-all', () => HttpResponse.json(TABLEROS_FIXTURE)),
    );

    const { Wrapper } = setupTestWrapper();
    const { useTableros } = await import('../hooks/useTableros');
    const { result } = renderHook(() => useTableros(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const tablero = result.current.data![0]!;
    expect(tablero).toHaveProperty('id');
    expect(tablero).toHaveProperty('nombre');
    expect(tablero).toHaveProperty('tipoTablero');
    expect(Array.isArray(tablero.columnas)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// useTablero — tablero individual por id, queryKey ['tableros', id]
// ---------------------------------------------------------------------------

describe('useTablero', () => {
  const TABLERO_ID = 'f1111111-ffff-1111-ffff-111111111111';

  it('invoca GET /api/tableros/get-by-id?id= con el id correcto', async () => {
    let capturedUrl: string | null = null;
    server.use(
      http.get('/api/tableros/get-by-id', ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json(TABLERO_FIXTURE);
      }),
    );

    const { Wrapper } = setupTestWrapper();
    const { useTablero } = await import('../hooks/useTablero');
    const { result } = renderHook(() => useTablero(TABLERO_ID), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(capturedUrl).toContain(`/tableros/get-by-id?id=${TABLERO_ID}`);
  });

  it('retorna el tablero con columnas del schema', async () => {
    server.use(
      http.get('/api/tableros/get-by-id', () => HttpResponse.json(TABLERO_FIXTURE)),
    );

    const { Wrapper } = setupTestWrapper();
    const { useTablero } = await import('../hooks/useTablero');
    const { result } = renderHook(() => useTablero(TABLERO_ID), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.id).toBe(TABLERO_ID);
    expect(Array.isArray(result.current.data?.columnas)).toBe(true);
    expect(result.current.data?.columnas.length).toBe(2);
  });

  it('queryKey es ["tableros", id]', async () => {
    server.use(
      http.get('/api/tableros/get-by-id', () => HttpResponse.json(TABLERO_FIXTURE)),
    );

    const { Wrapper, queryClient } = setupTestWrapper();
    const { useTablero } = await import('../hooks/useTablero');
    const { result } = renderHook(() => useTablero(TABLERO_ID), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const queryCache = queryClient.getQueryCache().findAll();
    const q = queryCache.find(
      (q) => q.queryKey[0] === 'tableros' && q.queryKey[1] === TABLERO_ID,
    );
    expect(q).toBeDefined();
    expect(q!.queryKey).toEqual(['tableros', TABLERO_ID]);
  });

  it('no hace fetch cuando id es undefined', async () => {
    let called = false;
    server.use(
      http.get('/api/tableros/get-by-id', () => {
        called = true;
        return HttpResponse.json(TABLERO_FIXTURE);
      }),
    );

    const { Wrapper } = setupTestWrapper();
    const { useTablero } = await import('../hooks/useTablero');
    const { result } = renderHook(() => useTablero(undefined), { wrapper: Wrapper });

    await new Promise((r) => setTimeout(r, 100));

    expect(result.current.isSuccess).toBe(false);
    expect(called).toBe(false);
  });

  it('reporta error 404 cuando el tablero no existe', async () => {
    server.use(
      http.get('/api/tableros/get-by-id', () =>
        HttpResponse.json(
          { status: 404, error: 'NOT_FOUND', message: 'Tablero no encontrado' },
          { status: 404 },
        ),
      ),
    );

    const { Wrapper } = setupTestWrapper();
    const { useTablero } = await import('../hooks/useTablero');
    const { result } = renderHook(
      () => useTablero('ffffffff-ffff-ffff-ffff-ffffffffffff'),
      { wrapper: Wrapper },
    );

    await waitFor(() => expect(result.current.isError).toBe(true));

    const error = result.current.error as Error & { status?: number };
    expect(error.status).toBe(404);
  });
});

// ---------------------------------------------------------------------------
// useColumnas — catálogo de columnas, queryKey ['columnas']
// ---------------------------------------------------------------------------

describe('useColumnas', () => {
  it('invoca GET /api/columnas/get-all y retorna lista de columnas', async () => {
    let capturedUrl: string | null = null;
    server.use(
      http.get('/api/columnas/get-all', ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json(COLUMNAS_FIXTURE);
      }),
    );

    const { Wrapper } = setupTestWrapper();
    const { useColumnas } = await import('../hooks/useColumnas');
    const { result } = renderHook(() => useColumnas(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(capturedUrl).toContain('/columnas/get-all');
    expect(Array.isArray(result.current.data)).toBe(true);
    expect(result.current.data!.length).toBe(2);
  });

  it('queryKey es exactamente ["columnas"]', async () => {
    server.use(
      http.get('/api/columnas/get-all', () => HttpResponse.json(COLUMNAS_FIXTURE)),
    );

    const { Wrapper, queryClient } = setupTestWrapper();
    const { useColumnas } = await import('../hooks/useColumnas');
    const { result } = renderHook(() => useColumnas(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const queryCache = queryClient.getQueryCache().findAll();
    const q = queryCache.find((q) => q.queryKey[0] === 'columnas');
    expect(q).toBeDefined();
    expect(q!.queryKey).toEqual(['columnas']);
  });

  it('retorna campos del schema — id, nombre, color, tipoTablero, tipoColumna', async () => {
    server.use(
      http.get('/api/columnas/get-all', () => HttpResponse.json(COLUMNAS_FIXTURE)),
    );

    const { Wrapper } = setupTestWrapper();
    const { useColumnas } = await import('../hooks/useColumnas');
    const { result } = renderHook(() => useColumnas(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const col = result.current.data![0]!;
    expect(col).toHaveProperty('id');
    expect(col).toHaveProperty('nombre');
    expect(col).toHaveProperty('color');
    expect(col).toHaveProperty('tipoTablero');
    expect(col).toHaveProperty('tipoColumna');
  });
});

// ---------------------------------------------------------------------------
// useFichas — lista todas las fichas, queryKey ['fichas'], filtrable client-side
// ---------------------------------------------------------------------------

describe('useFichas', () => {
  it('invoca GET /api/fichas/get-all y retorna todas las fichas', async () => {
    let capturedUrl: string | null = null;
    server.use(
      http.get('/api/fichas/get-all', ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json(FICHAS_FIXTURE);
      }),
    );

    const { Wrapper } = setupTestWrapper();
    const { useFichas } = await import('../hooks/useFichas');
    const { result } = renderHook(() => useFichas(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(capturedUrl).toContain('/fichas/get-all');
    expect(Array.isArray(result.current.data)).toBe(true);
    expect(result.current.data!.length).toBe(3);
  });

  it('queryKey es exactamente ["fichas"]', async () => {
    server.use(
      http.get('/api/fichas/get-all', () => HttpResponse.json(FICHAS_FIXTURE)),
    );

    const { Wrapper, queryClient } = setupTestWrapper();
    const { useFichas } = await import('../hooks/useFichas');
    const { result } = renderHook(() => useFichas(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const queryCache = queryClient.getQueryCache().findAll();
    const q = queryCache.find((q) => q.queryKey[0] === 'fichas' && q.queryKey.length === 1);
    expect(q).toBeDefined();
    expect(q!.queryKey).toEqual(['fichas']);
  });

  it('filtrado client-side por columnaId — solo devuelve fichas de esa columna', async () => {
    server.use(
      http.get('/api/fichas/get-all', () => HttpResponse.json(FICHAS_FIXTURE)),
    );

    const TARGET_COLUMNA = 'a2222222-aaaa-2222-aaaa-222222222222';
    const { Wrapper } = setupTestWrapper();
    const { useFichas } = await import('../hooks/useFichas');
    const { result } = renderHook(() => useFichas(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // El hook devuelve TODAS; el filtrado es client-side en el consumidor
    const todas = result.current.data!;
    const deColumna = todas.filter((f) => f.columnaId === TARGET_COLUMNA);
    expect(deColumna.length).toBe(2);
  });

  it('retorna campos del schema — id, columnaId, tipoFicha, tratoId, actualizadoEn', async () => {
    server.use(
      http.get('/api/fichas/get-all', () => HttpResponse.json(FICHAS_FIXTURE)),
    );

    const { Wrapper } = setupTestWrapper();
    const { useFichas } = await import('../hooks/useFichas');
    const { result } = renderHook(() => useFichas(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const ficha = result.current.data![0]!;
    expect(ficha).toHaveProperty('id');
    expect(ficha).toHaveProperty('columnaId');
    expect(ficha).toHaveProperty('tipoFicha');
    expect(ficha).toHaveProperty('tratoId');
    expect(ficha).toHaveProperty('actualizadoEn');
  });
});

// ---------------------------------------------------------------------------
// useTratosSinFicha — tratos que NO tienen ficha activa
// Tasks 1.5 (RED) + 1.6 (GREEN)
// ---------------------------------------------------------------------------

// Fichas solo para d1 y d2 — d3 queda sin ficha intencionalmente
const FICHAS_D1_D2: Ficha[] = [
  {
    id: 'h1111111-hhhh-1111-hhhh-111111111111',
    columnaId: 'a1111111-aaaa-1111-aaaa-111111111111',
    tipoFicha: 'TRATO',
    tratoId: 'd1111111-dddd-1111-dddd-111111111111',
    tareaId: null,
    actualizadoEn: '2026-04-10T08:00:00Z',
  },
  {
    id: 'h2222222-hhhh-2222-hhhh-222222222222',
    columnaId: 'a2222222-aaaa-2222-aaaa-222222222222',
    tipoFicha: 'TRATO',
    tratoId: 'd2222222-dddd-2222-dddd-222222222222',
    tareaId: null,
    actualizadoEn: '2026-04-11T09:00:00Z',
  },
];

// Fixtures para useTratosSinFicha
// d1 y d2 tienen fichas; d3 no tiene ficha → solo d3 debe retornarse
const TRATOS_FIXTURE_SIN_FICHA = [
  {
    id: 'd1111111-dddd-1111-dddd-111111111111',
    nombre: 'Trato con ficha 1',
    contactoId: 'c1',
    responsableId: 'u1',
    valorEstimado: null,
    probabilidad: null,
    fechaCierreEsperada: null,
    tipoContrato: 'SERVICIO',
    motivoPerdida: null,
    creadoEn: '2026-01-01T00:00:00',
    actualizadoEn: null,
  },
  {
    id: 'd2222222-dddd-2222-dddd-222222222222',
    nombre: 'Trato con ficha 2',
    contactoId: 'c2',
    responsableId: 'u1',
    valorEstimado: null,
    probabilidad: null,
    fechaCierreEsperada: null,
    tipoContrato: 'SERVICIO',
    motivoPerdida: null,
    creadoEn: '2026-01-02T00:00:00',
    actualizadoEn: null,
  },
  {
    id: 'd3333333-dddd-3333-dddd-333333333333',
    nombre: 'Trato sin ficha',
    contactoId: 'c3',
    responsableId: 'u1',
    valorEstimado: null,
    probabilidad: null,
    fechaCierreEsperada: null,
    tipoContrato: 'SERVICIO',
    motivoPerdida: null,
    creadoEn: '2026-01-03T00:00:00',
    actualizadoEn: null,
  },
];

// FICHAS_FIXTURE ya incluye fichas para d1 y d2; d3 no tiene ficha

describe('useTratosSinFicha', () => {
  it('retorna solo los tratos que no tienen ficha activa', async () => {
    // d1 y d2 tienen fichas; d3 no → solo d3 debe aparecer
    server.use(
      http.get('/api/tratos/get-all', () => HttpResponse.json(TRATOS_FIXTURE_SIN_FICHA)),
      http.get('/api/fichas/get-all', () => HttpResponse.json(FICHAS_D1_D2)),
    );

    const { Wrapper } = setupTestWrapper();
    const { useTratosSinFicha } = await import('../lib/useTratosSinFicha');
    const { result } = renderHook(() => useTratosSinFicha(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const tratos = result.current.data!;
    expect(tratos).toHaveLength(1);
    expect(tratos[0]!.id).toBe('d3333333-dddd-3333-dddd-333333333333');
  });

  it('retorna todos los tratos cuando ninguno tiene ficha', async () => {
    // Sin fichas → todos los tratos deben retornarse
    server.use(
      http.get('/api/tratos/get-all', () => HttpResponse.json(TRATOS_FIXTURE_SIN_FICHA)),
      http.get('/api/fichas/get-all', () => HttpResponse.json([])),
    );

    const { Wrapper } = setupTestWrapper();
    const { useTratosSinFicha } = await import('../lib/useTratosSinFicha');
    const { result } = renderHook(() => useTratosSinFicha(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const tratos = result.current.data!;
    expect(tratos).toHaveLength(3);
  });

  it('retorna lista vacía cuando todos los tratos tienen ficha', async () => {
    // Fichas para d1, d2, y también d3 → ningún trato queda libre
    const FICHAS_TODAS: Ficha[] = [
      ...FICHAS_D1_D2,
      {
        id: 'h4444444-hhhh-4444-hhhh-444444444444',
        columnaId: 'a1111111-aaaa-1111-aaaa-111111111111',
        tipoFicha: 'TRATO',
        tratoId: 'd3333333-dddd-3333-dddd-333333333333',
        tareaId: null,
        actualizadoEn: '2026-04-13T11:00:00Z',
      },
    ];

    server.use(
      http.get('/api/tratos/get-all', () => HttpResponse.json(TRATOS_FIXTURE_SIN_FICHA)),
      http.get('/api/fichas/get-all', () => HttpResponse.json(FICHAS_TODAS)),
    );

    const { Wrapper } = setupTestWrapper();
    const { useTratosSinFicha } = await import('../lib/useTratosSinFicha');
    const { result } = renderHook(() => useTratosSinFicha(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const tratos = result.current.data!;
    // Todos los tratos tienen ficha → resultado vacío (condición producida por el filtro)
    expect(tratos).toHaveLength(0);
  });
});
