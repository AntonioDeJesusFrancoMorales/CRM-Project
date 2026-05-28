import { describe, it, expect } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';

import { useTrato } from '../hooks/useTrato';
import { setupTestWrapper } from '@/test/wrappers';
import { server } from '@/test/server';

const TRATO_ID = 'd2222222-dddd-2222-dddd-222222222222';

describe('useTrato', () => {
  it('devuelve el trato por id desde el endpoint', async () => {
    const { Wrapper } = setupTestWrapper();
    const { result } = renderHook(() => useTrato(TRATO_ID), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.id).toBe(TRATO_ID);
    expect(result.current.data?.nombre).toBeDefined();
  });

  it('reporta error 404 cuando el trato no existe', async () => {
    server.use(
      http.get('/api/tratos/:id', () =>
        HttpResponse.json(
          { status: 404, error: 'NOT_FOUND', message: 'Trato no encontrado' },
          { status: 404 },
        ),
      ),
    );

    const { Wrapper } = setupTestWrapper();
    const { result } = renderHook(
      () => useTrato('ffffffff-ffff-ffff-ffff-ffffffffffff'),
      { wrapper: Wrapper },
    );

    await waitFor(() => expect(result.current.isError).toBe(true));

    const error = result.current.error as Error & { status?: number };
    expect(error.status).toBe(404);
  });
});

