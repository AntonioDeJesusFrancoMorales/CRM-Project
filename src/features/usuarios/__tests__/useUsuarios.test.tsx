import { describe, it, expect } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';

import { useUsuarios } from '../hooks/useUsuarios';
import { setupTestWrapper } from '@/test/wrappers';
import { server } from '@/test/server';

describe('useUsuarios', () => {
  it('invoca GET /api/usuarios/get-all y retorna lista tipificada como Usuario[]', async () => {
    const { Wrapper } = setupTestWrapper();
    const { result } = renderHook(() => useUsuarios(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toBeDefined();
    expect(Array.isArray(result.current.data)).toBe(true);
    expect(result.current.data!.length).toBeGreaterThan(0);
    // Campos del back (no rol_sistema ni rol_empresa)
    expect(result.current.data![0]).toHaveProperty('rolId');
    expect(result.current.data![0]).toHaveProperty('creadoEn');
    expect(result.current.data![0]).toHaveProperty('keycloakId');
    expect(result.current.data![0]).not.toHaveProperty('rol_sistema');
    expect(result.current.data![0]).not.toHaveProperty('rol_empresa');
  });

  it('la queryKey es ["usuarios"]', async () => {
    const { Wrapper, queryClient } = setupTestWrapper();
    const { result } = renderHook(() => useUsuarios(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const cachedData = queryClient.getQueryData(['usuarios']);
    expect(cachedData).toBeDefined();
  });

  it('reporta error cuando el endpoint responde 500', async () => {
    server.use(
      http.get('/api/usuarios/get-all', () =>
        HttpResponse.json(
          { status: 500, error: 'INTERNAL_SERVER_ERROR', message: 'Error interno' },
          { status: 500 },
        ),
      ),
    );

    const { Wrapper } = setupTestWrapper();
    const { result } = renderHook(() => useUsuarios(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeDefined();
  });
});
