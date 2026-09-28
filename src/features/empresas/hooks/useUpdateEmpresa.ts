import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import { isHttpError } from '@/api/http-error';
import { stringsToNulls } from '@/lib/form-utils';
import type { Empresa } from '@/api/types';
import { normalizeEmpresaValues } from '../lib/empresaValues';
import { mapEmpresaServerError } from '../lib/empresaValidation';
import type { EmpresaUpdateInput } from '../schemas/empresa.schema';
import { empresasKeys } from './useEmpresas';

export function useUpdateEmpresa(id: string): UseMutationResult<Empresa, Error, EmpresaUpdateInput> {
  const queryClient = useQueryClient();

  return useMutation<Empresa, Error, EmpresaUpdateInput>({
    mutationFn: (input) =>
      apiClient.put<Empresa>(
        endpoints.empresas.edit(id),
        stringsToNulls(normalizeEmpresaValues(input) as Record<string, unknown>),
      ),
    onSuccess: (updated) => {
      queryClient.setQueryData<Empresa[]>(empresasKeys.list(), (current) => {
        if (!current) return current;

        const existingIndex = current.findIndex((empresa) => empresa.id === updated.id);
        if (existingIndex === -1) return current;

        const next = [...current];
        next[existingIndex] = updated;
        return next;
      });
      void queryClient.invalidateQueries({ queryKey: empresasKeys.list() });
      void queryClient.invalidateQueries({ queryKey: empresasKeys.detail(id) });
      toast.success(`Empresa "${updated.nombre}" actualizada`);
    },
    onError: (error) => {
      if (isHttpError(error)) {
        if (error.status === 422) return; // The form renders 422 validation inline.
        const detail = error.details?.[0];
        toast.error(
          mapEmpresaServerError(detail ?? { field: '', message: error.message }).message,
        );
      } else {
        toast.error('No fue posible actualizar la empresa');
      }
    },
  });
}
