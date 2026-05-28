import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';

import { useUpdateTrato } from '../hooks/useUpdateTrato';
import { tratosKeys } from '../hooks/useTratos';
import { setupTestWrapper } from '@/test/wrappers';
import { server } from '@/test/server';

const TRATO_ID = 'd2222222-dddd-2222-dddd-222222222222';

describe('useUpdateTrato', () => {
  it('actualiza el trato e invalida la lista y el detalle', async () => {
    server.use(
      http.patch(`/api/tratos/${TRATO_ID}`, async ({ request }) => {
        const body = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({
          id: TRATO_ID,
          nombre: body['nombre'] ?? 'sin nombre',
          estado: 'abierto',
        });
      }),
    );

    const { Wrapper, queryClient } = setupTestWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useUpdateTrato(), { wrapper: Wrapper });

    result.current.mutate({ id: TRATO_ID, data: { nombre: 'Demo CTO v2' } });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: tratosKeys.all });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: tratosKeys.detail(TRATO_ID) });
  });
});

