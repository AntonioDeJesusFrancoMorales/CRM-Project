import { describe, it, expect } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';

import { useContactos, contactosKeys } from '../hooks/useContactos';
import { setupTestWrapper } from '@/test/wrappers';
import { server } from '@/test/server';

describe('useContactos', () => {
  it('retorna la lista de contactos desde GET /contactos/get-all', async () => {
    const { Wrapper } = setupTestWrapper();
    const { result } = renderHook(() => useContactos(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(Array.isArray(result.current.data)).toBe(true);
    expect(result.current.data!.length).toBeGreaterThan(0);
    expect(result.current.data![0]).toHaveProperty('estadoRelacion');
  });

  it('usa queryKey ["contactos"]', () => {
    expect(contactosKeys.list()).toEqual(['contactos']);
  });

  it('reporta isLoading mientras la petición está pendiente', () => {
    const { Wrapper } = setupTestWrapper();
    const { result } = renderHook(() => useContactos(), { wrapper: Wrapper });

    // Justo después de montar, antes del await, la query está loading
    expect(result.current.isLoading).toBe(true);
  });

  it('reporta isError cuando el endpoint falla con 500', async () => {
    server.use(
      http.get('/api/contactos/get-all', () =>
        HttpResponse.json(
          { status: 500, error: 'INTERNAL_SERVER_ERROR', message: 'Boom' },
          { status: 500 },
        ),
      ),
    );

    const { Wrapper } = setupTestWrapper();
    const { result } = renderHook(() => useContactos(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeDefined();
  });

  it('retorna array vacío si el endpoint devuelve []', async () => {
    server.use(
      http.get('/api/contactos/get-all', () => HttpResponse.json([], { status: 200 })),
    );

    const { Wrapper } = setupTestWrapper();
    const { result } = renderHook(() => useContactos(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([]);
  });
});
