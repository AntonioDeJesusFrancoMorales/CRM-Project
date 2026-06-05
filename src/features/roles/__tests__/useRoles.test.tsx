import { describe, it, expect } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';

import { useRoles, rolesKeys } from '../hooks/useRoles';
import { setupTestWrapper } from '@/test/wrappers';
import { server } from '@/test/server';

describe('useRoles', () => {
  it('invoca GET /api/roles/get-all y retorna lista tipificada como Rol[]', async () => {
    const { Wrapper } = setupTestWrapper();
    const { result } = renderHook(() => useRoles(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toBeDefined();
    expect(Array.isArray(result.current.data)).toBe(true);
    expect(result.current.data!.length).toBeGreaterThanOrEqual(2);
    expect(result.current.data![0]).toHaveProperty('id');
    expect(result.current.data![0]).toHaveProperty('nombre');
    expect(result.current.data![0]).toHaveProperty('descripcion');
    expect(result.current.data![0]).toHaveProperty('activo');
  });

  it('usa rolesKeys.list() === ["roles"] como query key', async () => {
    expect(rolesKeys.list()).toEqual(['roles']);

    const { Wrapper, queryClient } = setupTestWrapper();
    const { result } = renderHook(() => useRoles(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(queryClient.getQueryData(rolesKeys.list())).toBeDefined();
  });

  it('reporta error cuando el endpoint responde 500', async () => {
    server.use(
      http.get('/api/roles/get-all', () =>
        HttpResponse.json(
          { status: 500, error: 'INTERNAL_SERVER_ERROR', message: 'Error interno' },
          { status: 500 },
        ),
      ),
    );

    const { Wrapper } = setupTestWrapper();
    const { result } = renderHook(() => useRoles(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeDefined();
  });
});
