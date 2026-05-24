import { describe, it, expect } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';

import { useTratos } from '../hooks/useTratos';
import { setupTestWrapper } from '@/test/wrappers';
import { server } from '@/test/server';

describe('useTratos', () => {
  it('devuelve la lista de tratos desde el endpoint cuando no hay filtros', async () => {
    const { Wrapper } = setupTestWrapper();
    const { result } = renderHook(() => useTratos(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toBeDefined();
    expect(Array.isArray(result.current.data)).toBe(true);
    expect(result.current.data!.length).toBeGreaterThan(0);
    expect(result.current.data![0]).toHaveProperty('nombre');
    expect(result.current.data![0]).toHaveProperty('estado');
  });

  it('pasa cliente_id como query param al endpoint', async () => {
    let capturedUrl: string | null = null;
    server.use(
      http.get('/api/v1/tratos', ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json([]);
      }),
    );

    const { Wrapper } = setupTestWrapper();
    const { result } = renderHook(
      () => useTratos({ cliente_id: 'c1111111-cccc-1111-cccc-111111111111' }),
      { wrapper: Wrapper },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(capturedUrl).toContain('cliente_id=c1111111-cccc-1111-cccc-111111111111');
  });

  it('combina filtros estado + cliente_id en la query string', async () => {
    let capturedUrl: string | null = null;
    server.use(
      http.get('/api/v1/tratos', ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json([]);
      }),
    );

    const { Wrapper } = setupTestWrapper();
    const { result } = renderHook(
      () =>
        useTratos({
          estado: 'abierto',
          cliente_id: 'c1111111-cccc-1111-cccc-111111111111',
        }),
      { wrapper: Wrapper },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(capturedUrl).toContain('estado=abierto');
    expect(capturedUrl).toContain('cliente_id=c1111111-cccc-1111-cccc-111111111111');
  });
});
