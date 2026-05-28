import { describe, it, expect } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';

import { useTareas, tareasKeys } from '../hooks/useTareas';
import { useTarea } from '../hooks/useTarea';
import { setupTestWrapper } from '@/test/wrappers';
import { server } from '@/test/server';

describe('useTareas', () => {
  it('(a) devuelve lista desde GET /tareas/get-all SIN query params', async () => {
    let capturedUrl: string | null = null;

    server.use(
      http.get('/api/tareas/get-all', ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json([]);
      }),
    );

    const { Wrapper } = setupTestWrapper();
    const { result } = renderHook(() => useTareas(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // La URL debe ser exactamente /api/tareas/get-all sin query params
    expect(capturedUrl).toBeDefined();
    const url = new URL(capturedUrl!);
    expect(url.search).toBe('');
    expect(Array.isArray(result.current.data)).toBe(true);
  });

  it('(b) la queryKey es exactamente ["tareas"] (plano, sin filtros embebidos)', () => {
    expect(tareasKeys.all).toEqual(['tareas']);
    expect(tareasKeys.list()).toEqual(['tareas']);
    // byTrato también retorna ['tareas'] — sin embeber el tratoId
    expect(tareasKeys.byTrato('d1111111-dddd-1111-dddd-111111111111')).toEqual(['tareas']);
  });

  it('(c) el fixture de tareas devuelve datos con camelCase del back', async () => {
    const { Wrapper } = setupTestWrapper();
    const { result } = renderHook(() => useTareas(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const data = result.current.data ?? [];
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);
    const primera = data[0];
    expect(primera).toHaveProperty('titulo');
    expect(primera).toHaveProperty('tratoId');
    expect(primera).toHaveProperty('prioridad');
    // prioridad debe ser string enum del back, NO número
    expect(typeof primera?.prioridad).toBe('string');
  });
});

describe('useTarea (individual)', () => {
  it('devuelve la tarea por id desde GET /tareas/get-by-id?id=', async () => {
    const TAREA_ID = 'e1111111-eeee-1111-eeee-111111111111';
    const { Wrapper } = setupTestWrapper();
    const { result } = renderHook(() => useTarea(TAREA_ID), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.id).toBe(TAREA_ID);
    expect(result.current.data?.titulo).toBeDefined();
  });

  it('reporta error 404 cuando la tarea no existe', async () => {
    server.use(
      http.get('/api/tareas/get-by-id', () =>
        HttpResponse.json(
          { status: 404, error: 'NOT_FOUND', message: 'Tarea no encontrada' },
          { status: 404 },
        ),
      ),
    );

    const { Wrapper } = setupTestWrapper();
    const { result } = renderHook(
      () => useTarea('ffffffff-ffff-ffff-ffff-ffffffffffff'),
      { wrapper: Wrapper },
    );

    await waitFor(() => expect(result.current.isError).toBe(true));

    const error = result.current.error as Error & { status?: number };
    expect(error.status).toBe(404);
  });
});
