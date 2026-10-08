// useUpdateTablero — PUT /tableros/edit?id= (200).
// El tipo del tablero es inmutable en el back: solo se envían nombre y descripcion.

import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import { isHttpError } from '@/api/http-error';
import type { Tablero, TableroEditInput } from '@/features/kanban/schemas/tablero.schema';
import { tablerosKeys } from './useTableros';

export interface UpdateTableroVars {
  id: string;
  data: TableroEditInput;
}

export function useUpdateTablero(): UseMutationResult<Tablero, Error, UpdateTableroVars> {
  const queryClient = useQueryClient();

  return useMutation<Tablero, Error, UpdateTableroVars>({
    mutationFn: ({ id, data }) => {
      const payload: TableroEditInput = {
        nombre: data.nombre,
        descripcion: data.descripcion.trim(),
      };
      return apiClient.put<Tablero>(endpoints.tableros.edit(id), payload);
    },
    onSuccess: (updated, { id }) => {
      queryClient.setQueryData<Tablero[]>(tablerosKeys.list(), (current) => {
        if (!current) return current;
        return current.map((tablero) => (tablero.id === updated.id ? updated : tablero));
      });
      queryClient.setQueryData(tablerosKeys.detail(id), updated);
      void queryClient.invalidateQueries({ queryKey: tablerosKeys.all });
      void queryClient.invalidateQueries({ queryKey: tablerosKeys.detail(id) });
      toast.success('Tablero actualizado');
    },
    onError: (error) => {
      if (isHttpError(error)) {
        if (error.status === 422) return;
        toast.error(error.message);
      } else {
        toast.error('No fue posible actualizar el tablero');
      }
    },
  });
}
