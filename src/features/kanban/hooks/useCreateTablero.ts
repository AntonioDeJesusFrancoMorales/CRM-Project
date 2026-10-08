// useCreateTablero — POST /tableros/create (201).
// El back sintetiza las columnas por defecto; el payload solo contiene los tres campos
// soportados por el contrato actual.

import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import { isHttpError } from '@/api/http-error';
import type {
  Tablero,
  TableroCreateInput,
  TableroCreatePayload,
} from '@/features/kanban/schemas/tablero.schema';
import { tablerosKeys } from './useTableros';

export function useCreateTablero(): UseMutationResult<Tablero, Error, TableroCreateInput> {
  const queryClient = useQueryClient();

  return useMutation<Tablero, Error, TableroCreateInput>({
    mutationFn: ({ nombre, descripcion, tipoTablero }: TableroCreateInput) => {
      const payload: TableroCreatePayload = { nombre, descripcion, tipoTablero };
      return apiClient.post<Tablero>(endpoints.tableros.create(), payload);
    },
    onSuccess: (created) => {
      queryClient.setQueryData<Tablero[]>(tablerosKeys.list(), (current) =>
        current ? [...current, created] : [created],
      );
      queryClient.setQueryData(tablerosKeys.detail(created.id), created);
      void queryClient.invalidateQueries({ queryKey: tablerosKeys.all });
      toast.success(`Tablero "${created.nombre}" creado`);
    },
    onError: (error) => {
      if (isHttpError(error)) {
        if (error.status === 422) return;
        toast.error(error.message);
      } else {
        toast.error('No fue posible crear el tablero');
      }
    },
  });
}
