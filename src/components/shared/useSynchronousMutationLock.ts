import { useCallback, useRef, useState } from 'react';

export function useSynchronousMutationLock() {
  const lockRef = useRef(false);
  const [isLocked, setIsLocked] = useState(false);

  const acquire = useCallback(() => {
    if (lockRef.current) return false;
    lockRef.current = true;
    setIsLocked(true);
    return true;
  }, []);

  const release = useCallback(() => {
    lockRef.current = false;
    setIsLocked(false);
  }, []);

  return { acquire, release, isLocked, lockRef };
}
