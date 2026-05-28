import { describe, it, expect } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';

import { useDeleteProspecto } from '../hooks/useDeleteProspecto';
import { prospectosKeys } from '../hooks/useProspectos';
import { setupTestWrapper } from '@/test/wrappers';
import { server } from '@/test/server';

// Prospecto de fixture existente (ID completo)
const EXISTING_ID = 'b1111111-bbbb-1111-bbbb-111111111111';

describe('useDeleteProspecto', () => {
  it('elimina el prospecto, limpia el cache del detalle e invalida la lista', async () => {
    const { Wrapper, queryClient } = setupTestWrapper();
    const { result } = renderHook(() => useDeleteProspecto(), { wrapper: Wrapper });

    // Precarga el detalle para verificar removeQueries.
    queryClient.setQueryData(prospectosKeys.detail(EXISTING_ID), { id: EXISTING_ID });

    result.current.mutate(EXISTING_ID);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // El detalle debe haberse eliminado del cache.
    expect(queryClient.getQueryData(prospectosKeys.detail(EXISTING_ID))).toBeUndefined();
  });

  it('maneja 404 cuando el prospecto ya fue eliminado', async () => {
    server.use(
      http.delete('/api/prospectos/:id', () =>
        HttpResponse.json(
          { status: 404, error: 'NOT_FOUND', message: 'No existe' },
          { status: 404 },
        ),
      ),
    );

    const { Wrapper } = setupTestWrapper();
    const { result } = renderHook(() => useDeleteProspecto(), { wrapper: Wrapper });

    result.current.mutate('id-inexistente');

    await waitFor(() => expect(result.current.isError).toBe(true));

    const error = result.current.error as Error & { status?: number };
    expect(error.status).toBe(404);
  });
});

