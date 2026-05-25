// ADR-045 — Sincroniza un tab activo con el query param ?tab=.
// Si tab === fallback, el param se elimina (URL limpia).
// Si tab no está en `allowed` o falta, devuelve el fallback.
// History `replace: true` evita ensuciar el botón atrás del navegador.
// ADR-057 — Tercer argumento opcional `paramKey` (default: 'tab') para
// usar un query param distinto (ej: ?vista=) sin romper callers existentes.

import { useCallback } from 'react';
import { useSearchParams } from 'react-router';

export function useTabSync(
  allowed: readonly string[],
  fallback: string,
  paramKey: string = 'tab',
): readonly [string, (next: string) => void] {
  const [params, setParams] = useSearchParams();
  const raw = params.get(paramKey);
  const active = raw && allowed.includes(raw) ? raw : fallback;

  const setTab = useCallback(
    (next: string) => {
      const newParams = new URLSearchParams(params);
      if (next === fallback) {
        newParams.delete(paramKey);
      } else {
        newParams.set(paramKey, next);
      }
      setParams(newParams, { replace: true });
    },
    [params, setParams, fallback, paramKey],
  );

  return [active, setTab] as const;
}
