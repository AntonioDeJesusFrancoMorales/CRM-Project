import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '@/api/client';
import { isHttpError } from '@/api/http-error';
import { stringsToNulls } from '@/lib/form-utils';
import type { Empresa } from '@/api/types';
import type { EmpresaCreateInput } from '../schemas/empresa.schema';
import { empresasKeys } from './useEmpresas';

export function useCreateEmpresa(): UseMutationResult<Empresa, Error, EmpresaCreateInput> {
  const queryClient = useQueryClient();

  return useMutation<Empresa, Error, EmpresaCreateInput>({
    mutationFn: (input) => apiClient.post<Empresa>('/empresas', stringsToNulls(input)),
    onSuccess: (created) => {
      void queryClient.invalidateQueries({ queryKey: empresasKeys.list() });
      toast.success(`Empresa "${created.nombre}" creada`);
    },
    onError: (error) => {
      if (isHttpError(error)) {
        if (error.status === 422) return; // El form mapea details inline.
        toast.error(error.message);
      } else {
        toast.error('No fue posible crear la empresa');
      }
    },
  });
}
