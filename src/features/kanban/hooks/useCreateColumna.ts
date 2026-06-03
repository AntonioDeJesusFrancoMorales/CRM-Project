// useCreateColumna — POST /columnas/create con ColumnaCreateInput.
// Agrega una nueva columna al catálogo (tipoColumna='PERSONALIZADA').
// Devuelve la Columna creada — el orquestador useCrearColumnaEnTablero la usa
// para encadenar inmediatamente la asignación al tablero.
// onSuccess: invalida ['columnas'] + toast.
// onError: 422 silencioso (serverErrors del form); otros → toast genérico.

import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import { isHttpError } from '@/api/http-error';
import type { Columna, ColumnaCreateInput } from '@/features/kanban/schemas/columna.schema';
import { columnasKeys } from './useColumnas';

export function useCreateColumna(): UseMutationResult<Columna, Error, ColumnaCreateInput> {
  const queryClient = useQueryClient();

  return useMutation<Columna, Error, ColumnaCreateInput>({
    mutationFn: (payload) => apiClient.post<Columna>(endpoints.columnas.create(), payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: columnasKeys.all });
      toast.success('Columna creada');
    },
    onError: (error) => {
      if (isHttpError(error)) {
        if (error.status === 422) return;
        toast.error(error.message);
      } else {
        toast.error('No fue posible crear la columna');
      }
    },
  });
}
