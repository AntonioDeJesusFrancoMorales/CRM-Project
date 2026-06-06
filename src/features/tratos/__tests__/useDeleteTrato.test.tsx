import { describe, it, expect } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';

import { useDeleteTrato } from '../hooks/useDeleteTrato';
import { tratosKeys } from '../hooks/useTratos';
import { setupTestWrapper } from '@/test/wrappers';
import { server } from '@/test/server';

const TRATO_ID_SIN_TAREAS = 'd3333333-dddd-3333-dddd-333333333333';
const TRATO_ID_CON_TAREAS = 'd1111111-dddd-1111-dddd-111111111111';

describe('useDeleteTrato', () => {
  it('invoca DELETE /api/tratos/delete?id= (no DELETE /:id)', async () => {
    let capturedUrl: string | null = null;
    server.use(
      http.delete('/api/tratos/delete', ({ request }) => {
        capturedUrl = request.url;
        return new HttpResponse(null, { status: 204 });
      }),
    );

    const { Wrapper } = setupTestWrapper();
    const { result } = renderHook(() => useDeleteTrato(), { wrapper: Wrapper });

    result.current.mutate(TRATO_ID_SIN_TAREAS);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(capturedUrl).toContain(`/tratos/delete?id=${TRATO_ID_SIN_TAREAS}`);
  });

  it('elimina (204) y limpia el cache del detalle + invalida la lista', async () => {
    server.use(
      http.delete('/api/tratos/delete', () => new HttpResponse(null, { status: 204 })),
    );

    const { Wrapper, queryClient } = setupTestWrapper();
    queryClient.setQueryData(tratosKeys.detail(TRATO_ID_SIN_TAREAS), { id: TRATO_ID_SIN_TAREAS });

    const { result } = renderHook(() => useDeleteTrato(), { wrapper: Wrapper });

    result.current.mutate(TRATO_ID_SIN_TAREAS);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(queryClient.getQueryData(tratosKeys.detail(TRATO_ID_SIN_TAREAS))).toBeUndefined();
  });

  it('borra TAMBIÉN la ficha asociada (el back no cascadea)', async () => {
    const FICHA_ID = 'f-trato-3333';
    let fichaDeleteUrl: string | null = null;

    server.use(
      http.get('/api/fichas/get-all', () =>
        HttpResponse.json([
          {
            id: FICHA_ID,
            columnaId: 'col-1',
            tipoFicha: 'TRATO',
            tratoId: TRATO_ID_SIN_TAREAS,
            tareaId: null,
            actualizadoEn: '2026-01-01T00:00:00.000Z',
          },
        ]),
      ),
      http.delete('/api/tratos/delete', () => new HttpResponse(null, { status: 204 })),
      http.delete('/api/fichas/delete', ({ request }) => {
        fichaDeleteUrl = request.url;
        return new HttpResponse(null, { status: 204 });
      }),
    );

    const { Wrapper } = setupTestWrapper();
    const { result } = renderHook(() => useDeleteTrato(), { wrapper: Wrapper });

    result.current.mutate(TRATO_ID_SIN_TAREAS);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(fichaDeleteUrl).toContain(`/fichas/delete?id=${FICHA_ID}`);
  });

  it('NO borra ficha si el trato falla con 409 (no se llega a la cascada)', async () => {
    let fichaDeleteCalled = false;
    server.use(
      http.get('/api/fichas/get-all', () => HttpResponse.json([])),
      http.delete('/api/tratos/delete', () =>
        HttpResponse.json(
          { status: 409, error: 'CONFLICT', message: 'El trato tiene 2 tareas asociadas' },
          { status: 409 },
        ),
      ),
      http.delete('/api/fichas/delete', () => {
        fichaDeleteCalled = true;
        return new HttpResponse(null, { status: 204 });
      }),
    );

    const { Wrapper } = setupTestWrapper();
    const { result } = renderHook(() => useDeleteTrato(), { wrapper: Wrapper });

    result.current.mutate(TRATO_ID_CON_TAREAS);

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(fichaDeleteCalled).toBe(false);
  });

  it('DELETE responde 409 cuando el trato tiene tareas — expone error con mensaje', async () => {
    // El handler MSW real de B4 enviará 409 para d1111111 que tiene tareas.
    // Aquí mockeamos directamente para que el test sea independiente de B4.
    server.use(
      http.delete('/api/tratos/delete', () =>
        HttpResponse.json(
          {
            status: 409,
            error: 'CONFLICT',
            message: 'El trato tiene 2 tareas asociadas',
            details: [{ field: 'trato_id', message: 'tareas_vinculadas' }],
          },
          { status: 409 },
        ),
      ),
    );

    const { Wrapper } = setupTestWrapper();
    const { result } = renderHook(() => useDeleteTrato(), { wrapper: Wrapper });

    result.current.mutate(TRATO_ID_CON_TAREAS);

    await waitFor(() => expect(result.current.isError).toBe(true));

    const error = result.current.error as Error & { status?: number };
    expect(error.status).toBe(409);
    expect(error.message).toContain('tarea');
  });
});
