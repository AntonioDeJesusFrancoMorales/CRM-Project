import { describe, it, expect } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';

import { useDeleteTrato } from '../hooks/useDeleteTrato';
import { tratosKeys } from '../hooks/useTratos';
import { setupTestWrapper } from '@/test/wrappers';
import { server } from '@/test/server';

// d1111111 tiene 2 tareas en el fixture (e1111111 + e2222222) → 409
const ID_CON_TAREAS = 'd1111111-dddd-1111-dddd-111111111111';

describe('useDeleteTrato', () => {
  it('elimina (204) y limpia el cache del detalle + invalida la lista', async () => {
    const ID_SIN_TAREAS = 'aaaa1111-aaaa-1111-aaaa-111111111111';
    server.use(
      http.delete(`/api/tratos/${ID_SIN_TAREAS}`, () =>
        new HttpResponse(null, { status: 204 }),
      ),
    );

    const { Wrapper, queryClient } = setupTestWrapper();
    queryClient.setQueryData(tratosKeys.detail(ID_SIN_TAREAS), { id: ID_SIN_TAREAS });

    const { result } = renderHook(() => useDeleteTrato(), { wrapper: Wrapper });

    result.current.mutate(ID_SIN_TAREAS);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(queryClient.getQueryData(tratosKeys.detail(ID_SIN_TAREAS))).toBeUndefined();
  });

  it('DELETE 409 — expone error con el mensaje del backend (incluye conteo de tareas)', async () => {
    const { Wrapper } = setupTestWrapper();
    const { result } = renderHook(() => useDeleteTrato(), { wrapper: Wrapper });

    result.current.mutate(ID_CON_TAREAS);

    await waitFor(() => expect(result.current.isError).toBe(true));

    const error = result.current.error as Error & { status?: number };
    expect(error.status).toBe(409);
    expect(error.message).toContain('tarea');
  });
});

