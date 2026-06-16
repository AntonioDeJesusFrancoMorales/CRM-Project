import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import { isHttpError } from '@/api/http-error';
import type { Conversacion } from '@/api/types';
import { conversacionesKeys } from './useConversaciones';

interface AsignarVars {
  conversacionId: string;
  agenteId: string;
  empresaId: string;
}

export function useAsignarAgente(): UseMutationResult<Conversacion, Error, AsignarVars> {
  const queryClient = useQueryClient();

  return useMutation<Conversacion, Error, AsignarVars>({
    mutationFn: ({ conversacionId, agenteId }) =>
      apiClient.put<Conversacion>(endpoints.wa.conversaciones.asignar(conversacionId, agenteId)),
    onSuccess: (_, { empresaId }) => {
      void queryClient.invalidateQueries({ queryKey: conversacionesKeys.list(empresaId) });
      toast.success('Agente asignado');
    },
    onError: (error) => {
      if (isHttpError(error)) {
        toast.error(error.message);
      } else {
        toast.error('No fue posible asignar el agente');
      }
    },
  });
}
