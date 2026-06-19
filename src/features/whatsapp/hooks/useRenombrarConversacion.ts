import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import { isHttpError } from '@/api/http-error';
import type { Conversacion } from '@/api/types';
import { conversacionesKeys } from './useConversaciones';

interface RenombrarVars {
  conversacionId: string;
  nombre: string;
  empresaId: string;
}

export function useRenombrarConversacion(): UseMutationResult<Conversacion, Error, RenombrarVars> {
  const queryClient = useQueryClient();

  return useMutation<Conversacion, Error, RenombrarVars>({
    mutationFn: ({ conversacionId, nombre }) =>
      apiClient.put<Conversacion>(endpoints.wa.conversaciones.renombrar(conversacionId), { nombre }),
    onSuccess: (_, { empresaId }) => {
      void queryClient.invalidateQueries({ queryKey: conversacionesKeys.list(empresaId) });
      toast.success('Nombre actualizado');
    },
    onError: (error) => {
      toast.error(isHttpError(error) ? error.message : 'No fue posible renombrar el contacto');
    },
  });
}
