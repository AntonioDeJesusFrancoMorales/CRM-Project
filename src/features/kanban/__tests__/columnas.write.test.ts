// Tests de integración para hooks de escritura del catálogo de columnas.
// Cubre: useCreateColumna, useUpdateColumna, useCrearColumnaEnTablero.
// Strict TDD — tests escritos antes de la implementación.
// Harness: renderHook + QueryClient + MSW (igual que hooks.write.test.ts).

import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { http, HttpResponse } from 'msw';

import { setupTestWrapper } from '@/test/wrappers';
import { server } from '@/test/server';
import type { Columna, ColumnaCreateInput, ColumnaEditInput } from '@/features/kanban/schemas/columna.schema';
import type { Tablero } from '@/features/kanban/schemas/tablero.schema';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const COLUMNA_ID = 'c1111111-cccc-1111-cccc-111111111111';
const TABLERO_ID = 'f1111111-ffff-1111-ffff-111111111111';

const COLUMNA_FIXTURE: Columna = {
  id: COLUMNA_ID,
  nombre: 'En Revisión',
  color: '#3b82f6',
  tipoTablero: 'TRATOS',
  tipoColumna: 'PERSONALIZADA',
};

const TABLERO_FIXTURE: Tablero = {
  id: TABLERO_ID,
  nombre: 'Pipeline de Tratos',
  descripcion: null,
  tipoTablero: 'TRATOS',
  columnas: [
    {
      id: COLUMNA_ID,
      nombre: 'En Revisión',
      color: '#3b82f6',
      limiteWip: 5,
      nota: null,
      estadoTarea: null,
      estadoTrato: 'ABIERTO',
      totalValorEstimado: 0,
    },
  ],
  creadoEn: '2026-04-01T08:00:00',
};

const CREATE_PAYLOAD: ColumnaCreateInput = {
  nombre: 'En Revisión',
  color: '#3b82f6',
  tipoTablero: 'TRATOS',
  tipoColumna: 'PERSONALIZADA',
};

const EDIT_PAYLOAD: ColumnaEditInput = {
  nombre: 'En Revisión v2',
  color: '#22c55e',
};

// ---------------------------------------------------------------------------
// useCreateColumna — POST /columnas/create, invalida ['columnas']
// ---------------------------------------------------------------------------

describe('useCreateColumna', () => {
  it('invoca POST /api/columnas/create con el payload correcto', async () => {
    let capturedBody: unknown = null;
    server.use(
      http.post('/api/columnas/create', async ({ request }) => {
        capturedBody = await request.json();
        return HttpResponse.json(COLUMNA_FIXTURE, { status: 201 });
      }),
    );

    const { Wrapper } = setupTestWrapper();
    const { useCreateColumna } = await import('../hooks/useCreateColumna');
    const { result } = renderHook(() => useCreateColumna(), { wrapper: Wrapper });

    await act(async () => {
      result.current.mutate(CREATE_PAYLOAD);
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(capturedBody).toMatchObject({
      nombre: 'En Revisión',
      color: '#3b82f6',
      tipoTablero: 'TRATOS',
      tipoColumna: 'PERSONALIZADA',
    });
  });

  it('retorna la Columna creada en result.current.data', async () => {
    server.use(
      http.post('/api/columnas/create', () =>
        HttpResponse.json(COLUMNA_FIXTURE, { status: 201 }),
      ),
    );

    const { Wrapper } = setupTestWrapper();
    const { useCreateColumna } = await import('../hooks/useCreateColumna');
    const { result } = renderHook(() => useCreateColumna(), { wrapper: Wrapper });

    await act(async () => {
      result.current.mutate(CREATE_PAYLOAD);
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.id).toBe(COLUMNA_ID);
    expect(result.current.data?.nombre).toBe('En Revisión');
  });

  it('invalida queryKey ["columnas"] en onSuccess', async () => {
    server.use(
      http.post('/api/columnas/create', () =>
        HttpResponse.json(COLUMNA_FIXTURE, { status: 201 }),
      ),
      http.get('/api/columnas/get-all', () => HttpResponse.json([COLUMNA_FIXTURE])),
    );

    const { Wrapper, queryClient } = setupTestWrapper();
    const { useCreateColumna } = await import('../hooks/useCreateColumna');
    const { result } = renderHook(() => useCreateColumna(), { wrapper: Wrapper });

    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    await act(async () => {
      result.current.mutate(CREATE_PAYLOAD);
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ['columnas'] }),
    );
  });

  it('muestra toast de éxito en onSuccess', async () => {
    const { toast } = await import('sonner');
    const toastSuccessSpy = vi.spyOn(toast, 'success');

    server.use(
      http.post('/api/columnas/create', () =>
        HttpResponse.json(COLUMNA_FIXTURE, { status: 201 }),
      ),
    );

    const { Wrapper } = setupTestWrapper();
    const { useCreateColumna } = await import('../hooks/useCreateColumna');
    const { result } = renderHook(() => useCreateColumna(), { wrapper: Wrapper });

    await act(async () => {
      result.current.mutate(CREATE_PAYLOAD);
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(toastSuccessSpy).toHaveBeenCalledWith('Columna creada');
  });

  it('422 no muestra toast de error (silencioso)', async () => {
    const { toast } = await import('sonner');
    const toastErrorSpy = vi.spyOn(toast, 'error');

    server.use(
      http.post('/api/columnas/create', () =>
        HttpResponse.json(
          { status: 422, error: 'UNPROCESSABLE_ENTITY', message: 'Datos inválidos' },
          { status: 422 },
        ),
      ),
    );

    const { Wrapper } = setupTestWrapper();
    const { useCreateColumna } = await import('../hooks/useCreateColumna');
    const { result } = renderHook(() => useCreateColumna(), { wrapper: Wrapper });

    await act(async () => {
      result.current.mutate(CREATE_PAYLOAD);
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(toastErrorSpy).not.toHaveBeenCalled();
  });

  it('error genérico muestra toast de error', async () => {
    const { toast } = await import('sonner');
    const toastErrorSpy = vi.spyOn(toast, 'error');

    server.use(
      http.post('/api/columnas/create', () =>
        HttpResponse.json(
          { status: 500, error: 'INTERNAL_SERVER_ERROR', message: 'Error interno' },
          { status: 500 },
        ),
      ),
    );

    const { Wrapper } = setupTestWrapper();
    const { useCreateColumna } = await import('../hooks/useCreateColumna');
    const { result } = renderHook(() => useCreateColumna(), { wrapper: Wrapper });

    await act(async () => {
      result.current.mutate(CREATE_PAYLOAD);
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(toastErrorSpy).toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// useUpdateColumna — PUT /columnas/edit?id=, invalida ['columnas'] Y ['tableros']
// ---------------------------------------------------------------------------

describe('useUpdateColumna', () => {
  it('invoca PUT /api/columnas/edit?id= con el id correcto', async () => {
    let capturedUrl: string | null = null;
    server.use(
      http.put('/api/columnas/edit', ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json({ ...COLUMNA_FIXTURE, nombre: 'En Revisión v2' });
      }),
    );

    const { Wrapper } = setupTestWrapper();
    const { useUpdateColumna } = await import('../hooks/useUpdateColumna');
    const { result } = renderHook(() => useUpdateColumna(), { wrapper: Wrapper });

    await act(async () => {
      result.current.mutate({ id: COLUMNA_ID, data: EDIT_PAYLOAD });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(capturedUrl).toContain(`/columnas/edit?id=${COLUMNA_ID}`);
  });

  it('invalida queryKey ["columnas"] en onSuccess', async () => {
    server.use(
      http.put('/api/columnas/edit', () =>
        HttpResponse.json({ ...COLUMNA_FIXTURE, nombre: 'En Revisión v2' }),
      ),
      http.get('/api/columnas/get-all', () => HttpResponse.json([COLUMNA_FIXTURE])),
    );

    const { Wrapper, queryClient } = setupTestWrapper();
    const { useUpdateColumna } = await import('../hooks/useUpdateColumna');
    const { result } = renderHook(() => useUpdateColumna(), { wrapper: Wrapper });

    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    await act(async () => {
      result.current.mutate({ id: COLUMNA_ID, data: EDIT_PAYLOAD });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ['columnas'] }),
    );
  });

  it('invalida queryKey ["tableros"] en onSuccess (doble invalidación)', async () => {
    server.use(
      http.put('/api/columnas/edit', () =>
        HttpResponse.json({ ...COLUMNA_FIXTURE, nombre: 'En Revisión v2' }),
      ),
      http.get('/api/tableros/get-all', () => HttpResponse.json([])),
    );

    const { Wrapper, queryClient } = setupTestWrapper();
    const { useUpdateColumna } = await import('../hooks/useUpdateColumna');
    const { result } = renderHook(() => useUpdateColumna(), { wrapper: Wrapper });

    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    await act(async () => {
      result.current.mutate({ id: COLUMNA_ID, data: EDIT_PAYLOAD });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Ambas invalidaciones deben ocurrir
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ['columnas'] }),
    );
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ['tableros'] }),
    );
  });

  it('retorna la Columna actualizada en result.current.data', async () => {
    server.use(
      http.put('/api/columnas/edit', () =>
        HttpResponse.json({ ...COLUMNA_FIXTURE, nombre: 'En Revisión v2' }),
      ),
    );

    const { Wrapper } = setupTestWrapper();
    const { useUpdateColumna } = await import('../hooks/useUpdateColumna');
    const { result } = renderHook(() => useUpdateColumna(), { wrapper: Wrapper });

    await act(async () => {
      result.current.mutate({ id: COLUMNA_ID, data: EDIT_PAYLOAD });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.nombre).toBe('En Revisión v2');
  });

  it('404 muestra toast de error específico', async () => {
    const { toast } = await import('sonner');
    const toastErrorSpy = vi.spyOn(toast, 'error');

    server.use(
      http.put('/api/columnas/edit', () =>
        HttpResponse.json(
          { status: 404, error: 'NOT_FOUND', message: 'Columna no encontrada' },
          { status: 404 },
        ),
      ),
    );

    const { Wrapper } = setupTestWrapper();
    const { useUpdateColumna } = await import('../hooks/useUpdateColumna');
    const { result } = renderHook(() => useUpdateColumna(), { wrapper: Wrapper });

    await act(async () => {
      result.current.mutate({ id: COLUMNA_ID, data: EDIT_PAYLOAD });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(toastErrorSpy).toHaveBeenCalledWith('Columna no encontrada');
  });

  it('422 no muestra toast de error (silencioso)', async () => {
    const { toast } = await import('sonner');
    const toastErrorSpy = vi.spyOn(toast, 'error');

    server.use(
      http.put('/api/columnas/edit', () =>
        HttpResponse.json(
          { status: 422, error: 'UNPROCESSABLE_ENTITY', message: 'Datos inválidos' },
          { status: 422 },
        ),
      ),
    );

    const { Wrapper } = setupTestWrapper();
    const { useUpdateColumna } = await import('../hooks/useUpdateColumna');
    const { result } = renderHook(() => useUpdateColumna(), { wrapper: Wrapper });

    await act(async () => {
      result.current.mutate({ id: COLUMNA_ID, data: EDIT_PAYLOAD });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(toastErrorSpy).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// useCrearColumnaEnTablero — UNA llamada: POST /tableros/agregar-columna?id=
// El back crea la columna del catálogo Y la agrega al tablero en una operación.
// Invalida ['columnas'] + ['tableros'] en éxito.
// ---------------------------------------------------------------------------

describe('useCrearColumnaEnTablero', () => {
  const ASIGNAR_DATA = {
    tableroId: TABLERO_ID,
    limiteWip: 5,
    estadoTrato: 'ABIERTO' as const,
    totalValorEstimado: 0,
  };

  it('hace UNA sola llamada a POST /tableros/agregar-columna con el body combinado', async () => {
    let createCalled = false;
    let agregarUrl: string | null = null;
    let agregarBody: Record<string, unknown> | null = null;

    server.use(
      http.post('/api/columnas/create', () => {
        createCalled = true;
        return HttpResponse.json(COLUMNA_FIXTURE, { status: 201 });
      }),
      http.post('/api/tableros/agregar-columna', async ({ request }) => {
        agregarUrl = request.url;
        agregarBody = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json(TABLERO_FIXTURE, { status: 201 });
      }),
    );

    const { Wrapper } = setupTestWrapper();
    const { useCrearColumnaEnTablero } = await import('../hooks/useCrearColumnaEnTablero');
    const { result } = renderHook(() => useCrearColumnaEnTablero(), { wrapper: Wrapper });

    await act(async () => {
      result.current.mutate({ columna: CREATE_PAYLOAD, asignacion: ASIGNAR_DATA });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Ya NO se llama al endpoint viejo de catálogo
    expect(createCalled).toBe(false);
    expect(agregarUrl).toContain(`id=${TABLERO_ID}`);
    expect(agregarBody).toMatchObject({
      nombre: CREATE_PAYLOAD.nombre,
      tipoColumna: CREATE_PAYLOAD.tipoColumna,
      limiteWip: 5,
      estadoTrato: 'ABIERTO',
      totalValorEstimado: 0,
    });
    // tipoTablero NO se envía (el back lo deriva del tablero)
    expect(agregarBody).not.toHaveProperty('tipoTablero');
  });

  it('invalida ["columnas"] y ["tableros"] en onSuccess', async () => {
    server.use(
      http.post('/api/tableros/agregar-columna', () =>
        HttpResponse.json(TABLERO_FIXTURE, { status: 201 }),
      ),
    );

    const { Wrapper, queryClient } = setupTestWrapper();
    const { useCrearColumnaEnTablero } = await import('../hooks/useCrearColumnaEnTablero');
    const { result } = renderHook(() => useCrearColumnaEnTablero(), { wrapper: Wrapper });

    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    await act(async () => {
      result.current.mutate({ columna: CREATE_PAYLOAD, asignacion: ASIGNAR_DATA });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ['columnas'] }),
    );
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ['tableros'] }),
    );
  });

  it('muestra toast de éxito en onSuccess', async () => {
    const { toast } = await import('sonner');
    const toastSuccessSpy = vi.spyOn(toast, 'success');

    server.use(
      http.post('/api/tableros/agregar-columna', () =>
        HttpResponse.json(TABLERO_FIXTURE, { status: 201 }),
      ),
    );

    const { Wrapper } = setupTestWrapper();
    const { useCrearColumnaEnTablero } = await import('../hooks/useCrearColumnaEnTablero');
    const { result } = renderHook(() => useCrearColumnaEnTablero(), { wrapper: Wrapper });

    await act(async () => {
      result.current.mutate({ columna: CREATE_PAYLOAD, asignacion: ASIGNAR_DATA });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(toastSuccessSpy).toHaveBeenCalledWith('Columna creada y agregada al tablero');
  });

  it('si agregar falla → isError, toast de error y NO marca success', async () => {
    const { toast } = await import('sonner');
    const toastErrorSpy = vi.spyOn(toast, 'error');

    server.use(
      http.post('/api/tableros/agregar-columna', () =>
        HttpResponse.json(
          { status: 409, error: 'CONFLICT', message: 'Conflicto al agregar' },
          { status: 409 },
        ),
      ),
    );

    const { Wrapper } = setupTestWrapper();
    const { useCrearColumnaEnTablero } = await import('../hooks/useCrearColumnaEnTablero');
    const { result } = renderHook(() => useCrearColumnaEnTablero(), { wrapper: Wrapper });

    await act(async () => {
      result.current.mutate({ columna: CREATE_PAYLOAD, asignacion: ASIGNAR_DATA });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.isSuccess).toBe(false);
    expect(toastErrorSpy).toHaveBeenCalledWith('Conflicto al agregar');
  });
});
