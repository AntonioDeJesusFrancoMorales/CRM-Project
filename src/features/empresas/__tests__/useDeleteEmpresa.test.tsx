import { describe, it, expect } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';

import { useDeleteEmpresa } from '../hooks/useDeleteEmpresa';
import { empresasKeys } from '../hooks/useEmpresas';
import { setupTestWrapper } from '@/test/wrappers';
import { server } from '@/test/server';

const EXISTING_ID = 'a1111111-aaaa-1111-aaaa-111111111111';

describe('useDeleteEmpresa', () => {
  it('elimina y limpia el cache del detalle + invalida la lista', async () => {
    const { Wrapper, queryClient } = setupTestWrapper();
    const { result } = renderHook(() => useDeleteEmpresa(), { wrapper: Wrapper });

    // Precarga detail para verificar removeQueries.
    queryClient.setQueryData(empresasKeys.detail(EXISTING_ID), { id: EXISTING_ID });

    result.current.mutate(EXISTING_ID);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(queryClient.getQueryData(empresasKeys.detail(EXISTING_ID))).toBeUndefined();
  });

  it('maneja 404 graciosamente cuando la empresa ya fue eliminada', async () => {
    server.use(
      http.delete('/api/empresas/delete', () =>
        HttpResponse.json(
          { status: 404, error: 'NOT_FOUND', message: 'No existe' },
          { status: 404 },
        ),
      ),
    );

    const { Wrapper } = setupTestWrapper();
    const { result } = renderHook(() => useDeleteEmpresa(), { wrapper: Wrapper });

    result.current.mutate('id-inexistente');

    await waitFor(() => expect(result.current.isError).toBe(true));

    const error = result.current.error as Error & { status?: number };
    expect(error.status).toBe(404);
  });
});
