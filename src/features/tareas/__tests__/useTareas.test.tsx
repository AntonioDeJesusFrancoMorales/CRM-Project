import { describe, it, expect } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';

import { useTareas, tareasKeys } from '../hooks/useTareas';
import { useTarea } from '../hooks/useTarea';
import { setupTestWrapper } from '@/test/wrappers';
import { server } from '@/test/server';

describe('useTareas', () => {
  it('(a) sin filtros devuelve lista desde GET /tareas', async () => {
    const { Wrapper } = setupTestWrapper();
    const { result } = renderHook(() => useTareas(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(Array.isArray(result.current.data)).toBe(true);
    expect(result.current.data!.length).toBeGreaterThan(0);
    expect(result.current.data![0]).toHaveProperty('titulo');
    expect(result.current.data![0]).toHaveProperty('estado');
  });

  it('(b) con filtros responsable_id y prioridad pasa los query params correctos', async () => {
    let capturedUrl: string | null = null;
    server.use(
      http.get('/api/v1/tareas', ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json([]);
      }),
    );

    const { Wrapper } = setupTestWrapper();
    const { result } = renderHook(
      () => useTareas({ responsable_id: '11111111-1111-1111-1111-111111111111', prioridad: 1 }),
      { wrapper: Wrapper },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(capturedUrl).toContain('responsable_id=11111111-1111-1111-1111-111111111111');
    expect(capturedUrl).toContain('prioridad=1');
  });

  it('(c) tareasKeys.byTrato produce la misma key que tareasKeys.list({ trato_id })', () => {
    const tratoId = 'd1111111-dddd-1111-dddd-111111111111';
    expect(tareasKeys.byTrato(tratoId)).toEqual(tareasKeys.list({ trato_id: tratoId }));
  });
});

describe('useTarea (individual)', () => {
  it('devuelve la tarea por id desde GET /tareas/:id', async () => {
    const TAREA_ID = 'e1111111-eeee-1111-eeee-111111111111';
    const { Wrapper } = setupTestWrapper();
    const { result } = renderHook(() => useTarea(TAREA_ID), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.id).toBe(TAREA_ID);
    expect(result.current.data?.titulo).toBeDefined();
  });

  it('reporta error 404 cuando la tarea no existe', async () => {
    server.use(
      http.get('/api/v1/tareas/:id', () =>
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
