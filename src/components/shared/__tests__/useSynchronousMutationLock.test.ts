import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { useSynchronousMutationLock } from '../useSynchronousMutationLock';

describe('useSynchronousMutationLock', () => {
  it('rechaza una segunda adquisición síncrona hasta liberar el lock', () => {
    const { result } = renderHook(() => useSynchronousMutationLock());

    let firstAcquisition = false;
    let secondAcquisition = false;
    act(() => {
      firstAcquisition = result.current.acquire();
      secondAcquisition = result.current.acquire();
    });

    expect(firstAcquisition).toBe(true);
    expect(secondAcquisition).toBe(false);
    expect(result.current.isLocked).toBe(true);

    act(() => result.current.release());
    expect(result.current.isLocked).toBe(false);
    let reacquisition = false;
    act(() => {
      reacquisition = result.current.acquire();
    });
    expect(reacquisition).toBe(true);
  });
});
