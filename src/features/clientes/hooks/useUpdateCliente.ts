import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '@/api/client';
import { isHttpError } from '@/api/http-error';
import { stringsToNulls } from '@/lib/form-utils';
import type { Cliente } from '@/api/types';
import type { ClienteUpdateInput } from '../schemas/cliente.schema';
import { clientesKeys } from './useClientes';

interface UpdateClienteVars {
  id: string;
  data: ClienteUpdateInput;
}

export function useUpdateCliente(): UseMutationResult<Cliente, Error, UpdateClienteVars> {
  const queryClient = useQueryClient();

  return useMutation<Cliente, Error, UpdateClienteVars>({
    mutationFn: ({ id, data }) =>
      apiClient.patch<Cliente>(`/clientes/${id}`, stringsToNulls(data as Record<string, unknown>)),
    onSuccess: (updated, { id }) => {
      void queryClient.invalidateQueries({ queryKey: clientesKeys.all });
      void queryClient.invalidateQueries({ queryKey: clientesKeys.detail(id) });
      toast.success(`Cliente "${updated.nombre_contacto}" actualizado`);
    },
    onError: (error) => {
      if (isHttpError(error)) {
        if (error.status === 422) return;
        toast.error(error.message);
      } else {
        toast.error('No fue posible actualizar el cliente');
      }
    },
  });
}
