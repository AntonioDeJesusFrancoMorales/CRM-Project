import { describe, it, expect } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';

import { useDeleteTarea } from '../hooks/useDeleteTarea';
import { tareasKeys } from '../hooks/useTareas';
import { setupTestWrapper } from '@/test/wrappers';
import { server } from '@/test/server';

const TAREA_ID = 'e1111111-eeee-1111-eeee-111111111111';
const TAREA_ID_INEXISTENTE = 'ffffffff-ffff-ffff-ffff-ffffffffffff';

describe('useDeleteTarea', () => {
  it('(a) DELETE 204 — elimina la entrada del cache de detalle e invalida la lista', async () => {
    server.use(
      http.delete(`/api/v1/tareas/${TAREA_ID}`, () =>
        new HttpResponse(null, { status: 204 }),
      ),
    );

    const { Wrapper, queryClient } = setupTestWrapper();
    // Pre-cargar datos en cache para verificar que se limpian
    queryClient.setQueryData(tareasKeys.detail(TAREA_ID), { id: TAREA_ID, titulo: 'Demo' });

    const { result } = renderHook(() => useDeleteTarea(), { wrapper: Wrapper });

    result.current.mutate(TAREA_ID);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // removeQueries limpia el detalle
    expect(queryClient.getQueryData(tareasKeys.detail(TAREA_ID))).toBeUndefined();
  });

  it('(b) DELETE 404 — expone error con el status del backend', async () => {
    server.use(
      http.delete(`/api/v1/tareas/${TAREA_ID_INEXISTENTE}`, () =>
        HttpResponse.json(
          { status: 404, error: 'NOT_FOUND', message: 'Tarea no encontrada' },
          { status: 404 },
        ),
      ),
    );

    const { Wrapper } = setupTestWrapper();
    const { result } = renderHook(() => useDeleteTarea(), { wrapper: Wrapper });

    result.current.mutate(TAREA_ID_INEXISTENTE);

    await waitFor(() => expect(result.current.isError).toBe(true));

    const error = result.current.error as Error & { status?: number };
    expect(error.status).toBe(404);
  });
});
