import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';

import { usePerderTrato } from '../hooks/usePerderTrato';
import { tratosKeys } from '../hooks/useTratos';
import { setupTestWrapper } from '@/test/wrappers';

const TRATO_ID = 'd2222222-dddd-2222-dddd-222222222222';

describe('usePerderTrato', () => {
  it('invoca PATCH /tratos/:id/perder con motivo_perdida e invalida queries', async () => {
    const { Wrapper, queryClient } = setupTestWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => usePerderTrato(), { wrapper: Wrapper });

    result.current.mutate({ id: TRATO_ID, motivo_perdida: 'precio fuera de presupuesto' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: tratosKeys.all });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: tratosKeys.detail(TRATO_ID) });
  });

  it('expone error 422 cuando motivo_perdida está vacío (handler ya valida)', async () => {
    const { Wrapper } = setupTestWrapper();
    const { result } = renderHook(() => usePerderTrato(), { wrapper: Wrapper });

    result.current.mutate({ id: TRATO_ID, motivo_perdida: '' });

    await waitFor(() => expect(result.current.isError).toBe(true));

    const error = result.current.error as Error & { status?: number };
    expect(error.status).toBe(422);
  });
});
