// Hook derivado: retorna los tratos que NO tienen ficha activa.
// Cruza useTratos() + useFichas() y filtra: tratos donde ninguna ficha
// tiene ese tratoId. Sin petición extra al back — filtrado client-side.
// Reutilizable: FichaCreateDialog necesita mostrar solo tratos disponibles.

import { useTratos } from '@/features/tratos/hooks/useTratos';
import { useFichas } from '../hooks/useFichas';
import type { Trato } from '@/api/types';

export interface TratosSinFichaResult {
  data: Trato[] | undefined;
  isSuccess: boolean;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
}

export function useTratosSinFicha(): TratosSinFichaResult {
  const tratos = useTratos();
  const fichas = useFichas();

  const isSuccess = tratos.isSuccess && fichas.isSuccess;
  const isLoading = tratos.isLoading || fichas.isLoading;
  const isError = tratos.isError || fichas.isError;
  const error = tratos.error ?? fichas.error ?? null;

  const data = isSuccess
    ? tratos.data!.filter(
        (t) => !fichas.data!.some((f) => f.tratoId === t.id),
      )
    : undefined;

  return { data, isSuccess, isLoading, isError, error };
}
