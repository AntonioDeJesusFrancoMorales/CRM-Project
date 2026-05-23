import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '@/api/client';
import { isHttpError } from '@/api/http-error';
import type { Cliente } from '@/api/types';
import { prospectosKeys } from './useProspectos';

export interface ConvertirProspectoInput {
  id: string;
  empresa_id: string;
}

export function useConvertirProspecto(): UseMutationResult<
  Cliente,
  Error,
  ConvertirProspectoInput
> {
  const queryClient = useQueryClient();

  return useMutation<Cliente, Error, ConvertirProspectoInput>({
    mutationFn: ({ id }) => apiClient.post<Cliente>(`/prospectos/${id}/convertir`, {}),
    onSuccess: (_cliente, { id, empresa_id }) => {
      // Invalidación de las 5 query keys — R5 del design (ADR-025)
      // 1. Lista general de prospectos
      void queryClient.invalidateQueries({ queryKey: prospectosKeys.list() });
      // 2. Detalle del prospecto que fue convertido
      void queryClient.invalidateQueries({ queryKey: prospectosKeys.detail(id) });
      // 3. Lista general de clientes
      void queryClient.invalidateQueries({ queryKey: ['clientes'] });
      // 4. Tab clientes de EmpresaDetailPage (para que muestre el nuevo cliente)
      void queryClient.invalidateQueries({
        queryKey: prospectosKeys.empresaClientes(empresa_id),
      });
      // 5. Tab prospectos de EmpresaDetailPage (para reflejar el cambio de estado)
      void queryClient.invalidateQueries({
        queryKey: prospectosKeys.empresaProspectos(empresa_id),
      });
      toast.success('Prospecto convertido a cliente exitosamente');
    },
    onError: (error) => {
      if (isHttpError(error)) {
        toast.error(error.message);
      } else {
        toast.error('No fue posible convertir el prospecto');
      }
    },
  });
}
