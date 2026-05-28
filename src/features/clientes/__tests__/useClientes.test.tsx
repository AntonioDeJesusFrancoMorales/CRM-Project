import { describe, it, expect } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';

import { useClientes } from '../hooks/useClientes';
import { setupTestWrapper } from '@/test/wrappers';
import { server } from '@/test/server';

describe('useClientes', () => {
  it('devuelve la lista de clientes desde el endpoint', async () => {
    const { Wrapper } = setupTestWrapper();
    const { result } = renderHook(() => useClientes(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toBeDefined();
    expect(Array.isArray(result.current.data)).toBe(true);
    expect(result.current.data!.length).toBeGreaterThan(0);
    expect(result.current.data![0]).toHaveProperty('nombre_contacto');
  });

  it('pasa el filtro empresa_id como query param al endpoint', async () => {
    let capturedUrl: string | null = null;

    server.use(
      http.get('/api/clientes', ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json([]);
      }),
    );

    const { Wrapper } = setupTestWrapper();
    const { result } = renderHook(
      () => useClientes({ empresa_id: 'a1111111-aaaa-1111-aaaa-111111111111' }),
      { wrapper: Wrapper },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(capturedUrl).toContain('empresa_id=a1111111-aaaa-1111-aaaa-111111111111');
  });

  it('pasa el filtro origen=prospecto como query param al endpoint', async () => {
    let capturedUrl: string | null = null;

    server.use(
      http.get('/api/clientes', ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json([]);
      }),
    );

    const { Wrapper } = setupTestWrapper();
    const { result } = renderHook(
      () => useClientes({ origen: 'prospecto' }),
      { wrapper: Wrapper },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(capturedUrl).toContain('origen=prospecto');
  });

  it('reporta error cuando el endpoint responde 500', async () => {
    server.use(
      http.get('/api/clientes', () =>
        HttpResponse.json(
          { status: 500, error: 'INTERNAL_SERVER_ERROR', message: 'Error interno' },
          { status: 500 },
        ),
      ),
    );

    const { Wrapper } = setupTestWrapper();
    const { result } = renderHook(() => useClientes(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeDefined();
  });
});

