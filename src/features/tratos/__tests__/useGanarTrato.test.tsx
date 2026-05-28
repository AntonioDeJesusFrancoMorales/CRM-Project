import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';

import { useGanarTrato } from '../hooks/useGanarTrato';
import { tratosKeys } from '../hooks/useTratos';
import { setupTestWrapper } from '@/test/wrappers';
import { server } from '@/test/server';

const TRATO_ID = 'd2222222-dddd-2222-dddd-222222222222';

describe('useGanarTrato', () => {
  it('invoca PATCH /tratos/:id/ganar e invalida lista + detalle', async () => {
    let endpointCalled: string | null = null;
    server.use(
      http.patch(`/api/tratos/${TRATO_ID}/ganar`, ({ request }) => {
        endpointCalled = request.url;
        return HttpResponse.json({ id: TRATO_ID, estado: 'ganado', nombre: 'X' });
      }),
    );

    const { Wrapper, queryClient } = setupTestWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useGanarTrato(), { wrapper: Wrapper });

    result.current.mutate(TRATO_ID);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(endpointCalled).toContain(`/tratos/${TRATO_ID}/ganar`);
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: tratosKeys.all });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: tratosKeys.detail(TRATO_ID) });
  });
});

