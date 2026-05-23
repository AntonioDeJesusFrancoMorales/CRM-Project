import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '@/api/client';
import { isHttpError } from '@/api/http-error';
import { stringsToNulls } from '@/lib/form-utils';
import type { Cliente } from '@/api/types';
import type { ClienteCreateInput } from '../schemas/cliente.schema';
import { clientesKeys } from './useClientes';

export function useCreateCliente(): UseMutationResult<Cliente, Error, ClienteCreateInput> {
  const queryClient = useQueryClient();

  return useMutation<Cliente, Error, ClienteCreateInput>({
    mutationFn: (input) => apiClient.post<Cliente>('/clientes', stringsToNulls(input)),
    onSuccess: (created) => {
      void queryClient.invalidateQueries({ queryKey: clientesKeys.all });
      toast.success(`Cliente "${created.nombre_contacto}" creado`);
    },
    onError: (error) => {
      if (isHttpError(error)) {
        if (error.status === 422) return; // El form mapea details inline.
        toast.error(error.message);
      } else {
        toast.error('No fue posible crear el cliente');
      }
    },
  });
}
