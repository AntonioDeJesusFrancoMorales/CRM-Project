import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import { isHttpError } from '@/api/http-error';
import { stringsToNulls } from '@/lib/form-utils';
import type { Empresa } from '@/api/types';
import { normalizeEmpresaValues } from '../lib/empresaValues';
import { mapEmpresaServerError } from '../lib/empresaValidation';
import type { EmpresaCreateInput } from '../schemas/empresa.schema';
import { empresasKeys } from './useEmpresas';

export function useCreateEmpresa(): UseMutationResult<Empresa, Error, EmpresaCreateInput> {
  const queryClient = useQueryClient();

  return useMutation<Empresa, Error, EmpresaCreateInput>({
    mutationFn: (input) =>
      apiClient.post<Empresa>(
        endpoints.empresas.create(),
        stringsToNulls(normalizeEmpresaValues(input) as Record<string, unknown>),
      ),
    onSuccess: (created) => {
      queryClient.setQueryData<Empresa[]>(empresasKeys.list(), (current) => {
        if (!current) return [created];

        const existingIndex = current.findIndex((empresa) => empresa.id === created.id);
        if (existingIndex === -1) return [...current, created];

        const next = [...current];
        next[existingIndex] = created;
        return next;
      });
      void queryClient.invalidateQueries({ queryKey: empresasKeys.list() });
      toast.success(`Empresa "${created.nombre}" creada`);
    },
    onError: (error) => {
      if (isHttpError(error)) {
        if (error.status === 422) return; // The form renders 422 validation inline.
        const detail = error.details?.[0];
        toast.error(
          mapEmpresaServerError(detail ?? { field: '', message: error.message }).message,
        );
      } else {
        toast.error('No fue posible crear la empresa');
      }
    },
  });
}
