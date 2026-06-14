// Tests de integración para hooks de escritura del feature Kanban.
// Strict TDD B3.1 (RED): tests escritos ANTES de la implementación.
// Harness: renderHook + QueryClient + MSW (mismo patrón que hooks.read.test.ts).

import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { http, HttpResponse } from 'msw';

import { setupTestWrapper } from '@/test/wrappers';
import { server } from '@/test/server';
import type { Ficha, FichaCreateInput } from '@/features/kanban/schemas/ficha.schema';
import type { Tablero } from '@/features/kanban/schemas/tablero.schema';

// ---------------------------------------------------------------------------
// Fixtures mínimos para los tests de mutación
// ---------------------------------------------------------------------------

const FICHA_FIXTURE: Ficha = {
  id: 'h1111111-hhhh-1111-hhhh-111111111111',
  columnaId: 'a1111111-aaaa-1111-aaaa-111111111111',
  tipoFicha: 'TRATO',
  tratoId: 'd1111111-dddd-1111-dddd-111111111111',
  tareaId: null,
  actualizadoEn: '2026-04-10T08:00:00Z',
};

const TABLERO_FIXTURE: Tablero = {
  id: 'f1111111-ffff-1111-ffff-111111111111',
  nombre: 'Pipeline de Tratos',
  descripcion: null,
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
      nombre: 'Ganado',
      color: '#22c55e',
      limiteWip: null,
      nota: null,
      totalValorEstimado: 0,
    },
  ],
  creadoEn: '2026-04-01T08:00:00',
};

const CREATE_PAYLOAD: FichaCreateInput = {
  columnaId: 'a1111111-aaaa-1111-aaaa-111111111111',
  tipoFicha: 'TRATO',
  tratoId: 'd1111111-dddd-1111-dddd-111111111111',
  tareaId: null,
};

// ---------------------------------------------------------------------------
// useCreateFicha — POST /fichas/create, invalida ['fichas']
// ---------------------------------------------------------------------------

describe('useCreateFicha', () => {
  it('invoca POST /api/fichas/create con el payload correcto', async () => {
    let capturedBody: unknown = null;
    server.use(
      http.post('/api/fichas/create', async ({ request }) => {
        capturedBody = await request.json();
        return HttpResponse.json(FICHA_FIXTURE, { status: 201 });
      }),
    );

    const { Wrapper } = setupTestWrapper();
    const { useCreateFicha } = await import('../hooks/useCreateFicha');
    const { result } = renderHook(() => useCreateFicha(), { wrapper: Wrapper });

    await act(async () => {
      result.current.mutate(CREATE_PAYLOAD);
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(capturedBody).toMatchObject({
      columnaId: CREATE_PAYLOAD.columnaId,
      tipoFicha: 'TRATO',
      tratoId: CREATE_PAYLOAD.tratoId,
    });
  });

  it('invalida queryKey ["fichas"] en onSuccess', async () => {
    server.use(
      http.post('/api/fichas/create', () => HttpResponse.json(FICHA_FIXTURE, { status: 201 })),
      http.get('/api/fichas/get-all', () => HttpResponse.json([FICHA_FIXTURE])),
    );

    const { Wrapper, queryClient } = setupTestWrapper();
    const { useCreateFicha } = await import('../hooks/useCreateFicha');
    const { result } = renderHook(() => useCreateFicha(), { wrapper: Wrapper });

    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    await act(async () => {
      result.current.mutate(CREATE_PAYLOAD);
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ['fichas'] }),
    );
  });

  it('retorna la ficha creada en result.current.data', async () => {
    server.use(
      http.post('/api/fichas/create', () => HttpResponse.json(FICHA_FIXTURE, { status: 201 })),
    );

    const { Wrapper } = setupTestWrapper();
    const { useCreateFicha } = await import('../hooks/useCreateFicha');
    const { result } = renderHook(() => useCreateFicha(), { wrapper: Wrapper });

    await act(async () => {
      result.current.mutate(CREATE_PAYLOAD);
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.id).toBe(FICHA_FIXTURE.id);
    expect(result.current.data?.columnaId).toBe(FICHA_FIXTURE.columnaId);
  });

  it('por defecto muestra el toast "Ficha creada" en onSuccess (flujo manual)', async () => {
    const { toast } = await import('sonner');
    const toastSuccessSpy = vi.spyOn(toast, 'success');
    server.use(
      http.post('/api/fichas/create', () => HttpResponse.json(FICHA_FIXTURE, { status: 201 })),
    );

    const { Wrapper } = setupTestWrapper();
    const { useCreateFicha } = await import('../hooks/useCreateFicha');
    const { result } = renderHook(() => useCreateFicha(), { wrapper: Wrapper });

    await act(async () => {
      result.current.mutate(CREATE_PAYLOAD);
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(toastSuccessSpy).toHaveBeenCalledWith('Ficha creada');
  });

  it('con silentSuccess no muestra el toast "Ficha creada"', async () => {
    const { toast } = await import('sonner');
    const toastSuccessSpy = vi.spyOn(toast, 'success');
    server.use(
      http.post('/api/fichas/create', () => HttpResponse.json(FICHA_FIXTURE, { status: 201 })),
    );

    const { Wrapper } = setupTestWrapper();
    const { useCreateFicha } = await import('../hooks/useCreateFicha');
    const { result } = renderHook(() => useCreateFicha({ silentSuccess: true }), {
      wrapper: Wrapper,
    });

    await act(async () => {
      result.current.mutate(CREATE_PAYLOAD);
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(toastSuccessSpy).not.toHaveBeenCalledWith('Ficha creada');
  });
});

// ---------------------------------------------------------------------------
// useUpdateFicha — PUT /fichas/edit?id=, invalida ['fichas']
// ---------------------------------------------------------------------------

describe('useUpdateFicha', () => {
  it('invoca PUT /api/fichas/edit?id= con el id correcto', async () => {
    let capturedUrl: string | null = null;
    server.use(
      http.put('/api/fichas/edit', ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json({
          ...FICHA_FIXTURE,
          columnaId: 'a2222222-aaaa-2222-aaaa-222222222222',
        });
      }),
    );

    const { Wrapper } = setupTestWrapper();
    const { useUpdateFicha } = await import('../hooks/useUpdateFicha');
    const { result } = renderHook(() => useUpdateFicha(), { wrapper: Wrapper });

    await act(async () => {
      result.current.mutate({
        id: FICHA_FIXTURE.id,
        data: {
          columnaId: 'a2222222-aaaa-2222-aaaa-222222222222',
          tipoFicha: 'TRATO',
          tratoId: FICHA_FIXTURE.tratoId,
        },
      });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(capturedUrl).toContain(`/fichas/edit?id=${FICHA_FIXTURE.id}`);
  });

  it('invalida queryKey ["fichas"] en onSuccess (mover ficha entre columnas)', async () => {
    server.use(
      http.put('/api/fichas/edit', () =>
        HttpResponse.json({ ...FICHA_FIXTURE, columnaId: 'a2222222-aaaa-2222-aaaa-222222222222' }),
      ),
      http.get('/api/fichas/get-all', () => HttpResponse.json([FICHA_FIXTURE])),
    );

    const { Wrapper, queryClient } = setupTestWrapper();
    const { useUpdateFicha } = await import('../hooks/useUpdateFicha');
    const { result } = renderHook(() => useUpdateFicha(), { wrapper: Wrapper });

    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    await act(async () => {
      result.current.mutate({
        id: FICHA_FIXTURE.id,
        data: {
          columnaId: 'a2222222-aaaa-2222-aaaa-222222222222',
          tipoFicha: 'TRATO',
          tratoId: FICHA_FIXTURE.tratoId,
        },
      });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ['fichas'] }),
    );
  });

  it('retorna la ficha actualizada con el nuevo columnaId', async () => {
    const NUEVO_COLUMNA_ID = 'a2222222-aaaa-2222-aaaa-222222222222';
    server.use(
      http.put('/api/fichas/edit', () =>
        HttpResponse.json({ ...FICHA_FIXTURE, columnaId: NUEVO_COLUMNA_ID }),
      ),
    );

    const { Wrapper } = setupTestWrapper();
    const { useUpdateFicha } = await import('../hooks/useUpdateFicha');
    const { result } = renderHook(() => useUpdateFicha(), { wrapper: Wrapper });

    await act(async () => {
      result.current.mutate({
        id: FICHA_FIXTURE.id,
        data: {
          columnaId: NUEVO_COLUMNA_ID,
          tipoFicha: 'TRATO',
          tratoId: FICHA_FIXTURE.tratoId,
        },
      });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.columnaId).toBe(NUEVO_COLUMNA_ID);
  });
});

// ---------------------------------------------------------------------------
// useDeleteFicha — DELETE /fichas/delete?id=, invalida ['fichas']
// ---------------------------------------------------------------------------

describe('useDeleteFicha', () => {
  it('invoca DELETE /api/fichas/delete?id= con el id correcto', async () => {
    let capturedUrl: string | null = null;
    server.use(
      http.delete('/api/fichas/delete', ({ request }) => {
        capturedUrl = request.url;
        return new HttpResponse(null, { status: 204 });
      }),
    );

    const { Wrapper } = setupTestWrapper();
    const { useDeleteFicha } = await import('../hooks/useDeleteFicha');
    const { result } = renderHook(() => useDeleteFicha(), { wrapper: Wrapper });

    await act(async () => {
      result.current.mutate(FICHA_FIXTURE.id);
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(capturedUrl).toContain(`/fichas/delete?id=${FICHA_FIXTURE.id}`);
  });

  it('invalida queryKey ["fichas"] tras 204', async () => {
    server.use(
      http.delete('/api/fichas/delete', () => new HttpResponse(null, { status: 204 })),
      http.get('/api/fichas/get-all', () => HttpResponse.json([])),
    );

    const { Wrapper, queryClient } = setupTestWrapper();
    const { useDeleteFicha } = await import('../hooks/useDeleteFicha');
    const { result } = renderHook(() => useDeleteFicha(), { wrapper: Wrapper });

    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    await act(async () => {
      result.current.mutate(FICHA_FIXTURE.id);
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ['fichas'] }),
    );
  });

  it('result.current.data es void (undefined) en 204', async () => {
    server.use(
      http.delete('/api/fichas/delete', () => new HttpResponse(null, { status: 204 })),
    );

    const { Wrapper } = setupTestWrapper();
    const { useDeleteFicha } = await import('../hooks/useDeleteFicha');
    const { result } = renderHook(() => useDeleteFicha(), { wrapper: Wrapper });

    await act(async () => {
      result.current.mutate(FICHA_FIXTURE.id);
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // 204 → void; data puede ser undefined
    expect(result.current.data).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// useAsignarColumna — POST /tableros/asignar-columna?id=&columnaId=, invalida ['tableros', tableroId]
// ---------------------------------------------------------------------------

describe('useAsignarColumna', () => {
  const TABLERO_ID = 'f1111111-ffff-1111-ffff-111111111111';
  const COLUMNA_ID = 'a2222222-aaaa-2222-aaaa-222222222222';

  it('invoca POST /api/tableros/asignar-columna?id=&columnaId= con los parámetros correctos', async () => {
    let capturedUrl: string | null = null;
    server.use(
      http.post('/api/tableros/asignar-columna', ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json(TABLERO_FIXTURE);
      }),
    );

    const { Wrapper } = setupTestWrapper();
    const { useAsignarColumna } = await import('../hooks/useAsignarColumna');
    const { result } = renderHook(() => useAsignarColumna(), { wrapper: Wrapper });

    await act(async () => {
      result.current.mutate({
        tableroId: TABLERO_ID,
        columnaId: COLUMNA_ID,
        data: {
          limiteWip: 5,
          nota: 'Fase de negociación',
          totalValorEstimado: 0,
        },
      });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(capturedUrl).toContain(`id=${TABLERO_ID}`);
    expect(capturedUrl).toContain(`columnaId=${COLUMNA_ID}`);
  });

  it('invalida queryKey ["tableros", tableroId] en onSuccess', async () => {
    server.use(
      http.post('/api/tableros/asignar-columna', () => HttpResponse.json(TABLERO_FIXTURE)),
      http.get('/api/tableros/get-by-id', () => HttpResponse.json(TABLERO_FIXTURE)),
    );

    const { Wrapper, queryClient } = setupTestWrapper();
    const { useAsignarColumna } = await import('../hooks/useAsignarColumna');
    const { result } = renderHook(() => useAsignarColumna(), { wrapper: Wrapper });

    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    await act(async () => {
      result.current.mutate({
        tableroId: TABLERO_ID,
        columnaId: COLUMNA_ID,
        data: { limiteWip: 5, totalValorEstimado: 0 },
      });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ['tableros', TABLERO_ID] }),
    );
  });

  it('acepta totalValorEstimado: 0 como valor por defecto válido', async () => {
    let capturedBody: unknown = null;
    server.use(
      http.post('/api/tableros/asignar-columna', async ({ request }) => {
        capturedBody = await request.json();
        return HttpResponse.json(TABLERO_FIXTURE);
      }),
    );

    const { Wrapper } = setupTestWrapper();
    const { useAsignarColumna } = await import('../hooks/useAsignarColumna');
    const { result } = renderHook(() => useAsignarColumna(), { wrapper: Wrapper });

    await act(async () => {
      result.current.mutate({
        tableroId: TABLERO_ID,
        columnaId: COLUMNA_ID,
        data: { limiteWip: 1, totalValorEstimado: 0 },
      });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect((capturedBody as { totalValorEstimado: number }).totalValorEstimado).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// useReordenarColumnas — PUT /tableros/reordenar-columnas?id=, invalida ['tableros', tableroId]
// Validación client-side: nuevoOrden debe ser una permutación EXACTA de idsActuales
// (mismo length, mismos elementos sin duplicados, sin ids ajenos).
// ---------------------------------------------------------------------------

describe('useReordenarColumnas', () => {
  const TABLERO_ID = 'f1111111-ffff-1111-ffff-111111111111';
  const IDS_ACTUALES = [
    'a1111111-aaaa-1111-aaaa-111111111111',
    'a2222222-aaaa-2222-aaaa-222222222222',
  ];
  // Permutación válida: los mismos 2 ids en orden invertido
  const NUEVO_ORDEN = [
    'a2222222-aaaa-2222-aaaa-222222222222',
    'a1111111-aaaa-1111-aaaa-111111111111',
  ];

  it('invoca PUT /api/tableros/reordenar-columnas?id= con el tableroId correcto (permutación válida)', async () => {
    let capturedUrl: string | null = null;
    let capturedBody: unknown = null;
    server.use(
      http.put('/api/tableros/reordenar-columnas', async ({ request }) => {
        capturedUrl = request.url;
        capturedBody = await request.json();
        return HttpResponse.json(TABLERO_FIXTURE);
      }),
    );

    const { Wrapper } = setupTestWrapper();
    const { useReordenarColumnas } = await import('../hooks/useReordenarColumnas');
    const { result } = renderHook(() => useReordenarColumnas(), { wrapper: Wrapper });

    await act(async () => {
      result.current.mutate({ tableroId: TABLERO_ID, nuevoOrden: NUEVO_ORDEN, idsActuales: IDS_ACTUALES });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(capturedUrl).toContain(`/tableros/reordenar-columnas?id=${TABLERO_ID}`);
    // El body debe contener nuevoOrden como string[] de UUIDs crudos
    // (back usa List<UUID> nuevoOrden — ReordenarColumnasRequest.java)
    const body = capturedBody as { nuevoOrden: unknown[] };
    expect(body.nuevoOrden).toEqual(NUEVO_ORDEN);
  });

  it('invalida queryKey ["tableros", tableroId] en onSuccess', async () => {
    server.use(
      http.put('/api/tableros/reordenar-columnas', () => HttpResponse.json(TABLERO_FIXTURE)),
      http.get('/api/tableros/get-by-id', () => HttpResponse.json(TABLERO_FIXTURE)),
    );

    const { Wrapper, queryClient } = setupTestWrapper();
    const { useReordenarColumnas } = await import('../hooks/useReordenarColumnas');
    const { result } = renderHook(() => useReordenarColumnas(), { wrapper: Wrapper });

    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    await act(async () => {
      result.current.mutate({ tableroId: TABLERO_ID, nuevoOrden: NUEVO_ORDEN, idsActuales: IDS_ACTUALES });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ['tableros', TABLERO_ID] }),
    );
  });

  it('NO invoca HTTP si nuevoOrden.length === 0 (lista vacía)', async () => {
    let called = false;
    server.use(
      http.put('/api/tableros/reordenar-columnas', () => {
        called = true;
        return HttpResponse.json(TABLERO_FIXTURE);
      }),
    );

    const { Wrapper } = setupTestWrapper();
    const { useReordenarColumnas } = await import('../hooks/useReordenarColumnas');
    const { result } = renderHook(() => useReordenarColumnas(), { wrapper: Wrapper });

    await act(async () => {
      result.current.mutate({ tableroId: TABLERO_ID, nuevoOrden: [], idsActuales: IDS_ACTUALES });
    });

    await new Promise((r) => setTimeout(r, 100));

    expect(called).toBe(false);
    expect(result.current.isError).toBe(true);
  });

  it('NO invoca HTTP si nuevoOrden es subconjunto incompleto (length < total)', async () => {
    // Solo 1 de los 2 ids del tablero — validación debe rechazar sin HTTP
    let called = false;
    server.use(
      http.put('/api/tableros/reordenar-columnas', () => {
        called = true;
        return HttpResponse.json(TABLERO_FIXTURE);
      }),
    );

    const { Wrapper } = setupTestWrapper();
    const { useReordenarColumnas } = await import('../hooks/useReordenarColumnas');
    const { result } = renderHook(() => useReordenarColumnas(), { wrapper: Wrapper });

    await act(async () => {
      result.current.mutate({
        tableroId: TABLERO_ID,
        nuevoOrden: ['a1111111-aaaa-1111-aaaa-111111111111'], // falta el segundo
        idsActuales: IDS_ACTUALES,
      });
    });

    await new Promise((r) => setTimeout(r, 100));

    expect(called).toBe(false);
    expect(result.current.isError).toBe(true);
  });

  it('NO invoca HTTP si nuevoOrden tiene duplicados', async () => {
    // Mismo id dos veces — no es permutación válida
    let called = false;
    server.use(
      http.put('/api/tableros/reordenar-columnas', () => {
        called = true;
        return HttpResponse.json(TABLERO_FIXTURE);
      }),
    );

    const { Wrapper } = setupTestWrapper();
    const { useReordenarColumnas } = await import('../hooks/useReordenarColumnas');
    const { result } = renderHook(() => useReordenarColumnas(), { wrapper: Wrapper });

    await act(async () => {
      result.current.mutate({
        tableroId: TABLERO_ID,
        nuevoOrden: [
          'a1111111-aaaa-1111-aaaa-111111111111',
          'a1111111-aaaa-1111-aaaa-111111111111', // duplicado
        ],
        idsActuales: IDS_ACTUALES,
      });
    });

    await new Promise((r) => setTimeout(r, 100));

    expect(called).toBe(false);
    expect(result.current.isError).toBe(true);
  });

  it('NO invoca HTTP si nuevoOrden contiene ids ajenos al tablero', async () => {
    // Un id que no pertenece al tablero — no es permutación válida
    let called = false;
    server.use(
      http.put('/api/tableros/reordenar-columnas', () => {
        called = true;
        return HttpResponse.json(TABLERO_FIXTURE);
      }),
    );

    const { Wrapper } = setupTestWrapper();
    const { useReordenarColumnas } = await import('../hooks/useReordenarColumnas');
    const { result } = renderHook(() => useReordenarColumnas(), { wrapper: Wrapper });

    await act(async () => {
      result.current.mutate({
        tableroId: TABLERO_ID,
        nuevoOrden: [
          'a1111111-aaaa-1111-aaaa-111111111111',
          'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', // id ajeno
        ],
        idsActuales: IDS_ACTUALES,
      });
    });

    await new Promise((r) => setTimeout(r, 100));

    expect(called).toBe(false);
    expect(result.current.isError).toBe(true);
  });

  it('retorna el tablero con las columnas en el nuevo orden', async () => {
    server.use(
      http.put('/api/tableros/reordenar-columnas', () => HttpResponse.json(TABLERO_FIXTURE)),
    );

    const { Wrapper } = setupTestWrapper();
    const { useReordenarColumnas } = await import('../hooks/useReordenarColumnas');
    const { result } = renderHook(() => useReordenarColumnas(), { wrapper: Wrapper });

    await act(async () => {
      result.current.mutate({ tableroId: TABLERO_ID, nuevoOrden: NUEVO_ORDEN, idsActuales: IDS_ACTUALES });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.id).toBe(TABLERO_ID);
    expect(Array.isArray(result.current.data?.columnas)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// useQuitarColumna — DELETE /tableros/eliminar-columna?id=&columnaId=, invalida ['tableros', tableroId]
// 409 (columna con fichas) → toast distinto al genérico; 422 → sin toast genérico
// ---------------------------------------------------------------------------

describe('useQuitarColumna', () => {
  const TABLERO_ID = 'f1111111-ffff-1111-ffff-111111111111';
  const COLUMNA_ID = 'a1111111-aaaa-1111-aaaa-111111111111';

  it('invoca DELETE /api/tableros/eliminar-columna?id=&columnaId= con los parámetros correctos', async () => {
    let capturedUrl: string | null = null;
    server.use(
      http.delete('/api/tableros/eliminar-columna', ({ request }) => {
        capturedUrl = request.url;
        return new HttpResponse(null, { status: 204 });
      }),
    );

    const { Wrapper } = setupTestWrapper();
    const { useQuitarColumna } = await import('../hooks/useQuitarColumna');
    const { result } = renderHook(() => useQuitarColumna(), { wrapper: Wrapper });

    await act(async () => {
      result.current.mutate({ tableroId: TABLERO_ID, columnaId: COLUMNA_ID });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(capturedUrl).toContain(`id=${TABLERO_ID}`);
    expect(capturedUrl).toContain(`columnaId=${COLUMNA_ID}`);
  });

  it('invalida queryKey ["tableros", tableroId] tras 204', async () => {
    server.use(
      http.delete('/api/tableros/eliminar-columna', () => new HttpResponse(null, { status: 204 })),
      http.get('/api/tableros/get-by-id', () => HttpResponse.json(TABLERO_FIXTURE)),
    );

    const { Wrapper, queryClient } = setupTestWrapper();
    const { useQuitarColumna } = await import('../hooks/useQuitarColumna');
    const { result } = renderHook(() => useQuitarColumna(), { wrapper: Wrapper });

    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    await act(async () => {
      result.current.mutate({ tableroId: TABLERO_ID, columnaId: COLUMNA_ID });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ['tableros', TABLERO_ID] }),
    );
  });

  it('409 produce toast con mensaje específico de fichas pendientes', async () => {
    const { toast } = await import('sonner');
    const toastErrorSpy = vi.spyOn(toast, 'error');

    server.use(
      http.delete('/api/tableros/eliminar-columna', () =>
        HttpResponse.json(
          { status: 409, error: 'CONFLICT', message: 'La columna tiene fichas activas' },
          { status: 409 },
        ),
      ),
    );

    const { Wrapper } = setupTestWrapper();
    const { useQuitarColumna } = await import('../hooks/useQuitarColumna');
    const { result } = renderHook(() => useQuitarColumna(), { wrapper: Wrapper });

    await act(async () => {
      result.current.mutate({ tableroId: TABLERO_ID, columnaId: COLUMNA_ID });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(toastErrorSpy).toHaveBeenCalledWith(
      'La columna tiene fichas; muévelas o elimínalas antes de quitarla',
    );
  });

  it('422 no muestra toast genérico (retorna silenciosamente)', async () => {
    const { toast } = await import('sonner');
    const toastErrorSpy = vi.spyOn(toast, 'error');

    server.use(
      http.delete('/api/tableros/eliminar-columna', () =>
        HttpResponse.json(
          { status: 422, error: 'UNPROCESSABLE_ENTITY', message: 'Datos inválidos' },
          { status: 422 },
        ),
      ),
    );

    const { Wrapper } = setupTestWrapper();
    const { useQuitarColumna } = await import('../hooks/useQuitarColumna');
    const { result } = renderHook(() => useQuitarColumna(), { wrapper: Wrapper });

    await act(async () => {
      result.current.mutate({ tableroId: TABLERO_ID, columnaId: COLUMNA_ID });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(toastErrorSpy).not.toHaveBeenCalled();
  });
});
