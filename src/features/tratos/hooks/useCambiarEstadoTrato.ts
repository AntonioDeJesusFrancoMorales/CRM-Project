// Hooks para cerrar una oportunidad: ganar o perder (con motivo).
// El back marca el estado del trato; invalidamos tratos + fichas (el kanban muestra la insignia).

import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import { isHttpError } from '@/api/http-error';
import type { Trato } from '@/api/types';
import { tratosKeys } from './useTratos';
import { fichasKeys } from '@/features/kanban/hooks/useFichas';

function invalidar(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: tratosKeys.all });
  void queryClient.invalidateQueries({ queryKey: fichasKeys.all });
}

export function useGanarTrato(): UseMutationResult<Trato, Error, string> {
  const queryClient = useQueryClient();
  return useMutation<Trato, Error, string>({
    mutationFn: (id) => apiClient.put<Trato>(endpoints.tratos.ganar(id), {}),
    onSuccess: (t) => {
      invalidar(queryClient);
      toast.success(`"${t.nombre}" marcado como ganado 🎉`);
    },
    onError: (e) => toast.error(isHttpError(e) ? e.message : 'No se pudo marcar como ganado'),
  });
}

export function usePerderTrato(): UseMutationResult<Trato, Error, { id: string; motivo: string }> {
  const queryClient = useQueryClient();
  return useMutation<Trato, Error, { id: string; motivo: string }>({
    mutationFn: ({ id, motivo }) => apiClient.put<Trato>(endpoints.tratos.perder(id), { motivo }),
    onSuccess: (t) => {
      invalidar(queryClient);
      toast.success(`"${t.nombre}" marcado como perdido`);
    },
    onError: (e) => toast.error(isHttpError(e) ? e.message : 'No se pudo marcar como perdido'),
  });
}
