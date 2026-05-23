import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '@/api/client';
import { isHttpError } from '@/api/http-error';
import { clientesKeys } from './useClientes';

export function useDeleteCliente(): UseMutationResult<void, Error, string> {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: (id) => apiClient.delete<void>(`/clientes/${id}`),
    onSuccess: (_void, id) => {
      // ADR-031: 204 → remover detalle del cache + invalidar lista.
      queryClient.removeQueries({ queryKey: clientesKeys.detail(id) });
      void queryClient.invalidateQueries({ queryKey: clientesKeys.all });
      toast.success('Cliente eliminado');
    },
    onError: (error) => {
      if (isHttpError(error)) {
        if (error.status === 409) {
          // ADR-031: 409 → NO invalidar (cliente sigue existiendo).
          // Propagar error con el mensaje del backend para el toast del host.
          // El mensaje ya contiene el conteo de tratos (ej: "El cliente tiene 2 tratos asociados").
          return; // El componente host lee error.message del useMutation result.
        }
        toast.error(error.message);
      } else {
        toast.error('No fue posible eliminar el cliente');
      }
    },
  });
}
