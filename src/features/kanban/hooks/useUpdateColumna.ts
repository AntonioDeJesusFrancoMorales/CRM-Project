// useUpdateColumna — PUT /columnas/edit?id= con ColumnaEditInput.
// Edita una columna del catálogo (nombre, color, tipo).
// onSuccess: invalida ['columnas'] Y ['tableros'] — el board proyecta nombre/color
// del catálogo, por lo que ambas caches deben refrescarse.
// onError: 404 toast con mensaje del servidor; 422 silencioso; otros → toast genérico.

import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import { isHttpError } from '@/api/http-error';
import type { Columna, ColumnaEditInput } from '@/features/kanban/schemas/columna.schema';
import { columnasKeys } from './useColumnas';
import { tablerosKeys } from './useTableros';

interface UpdateColumnaVars {
  id: string;
  data: ColumnaEditInput;
}

export function useUpdateColumna(): UseMutationResult<Columna, Error, UpdateColumnaVars> {
  const queryClient = useQueryClient();

  return useMutation<Columna, Error, UpdateColumnaVars>({
    mutationFn: ({ id, data }) => apiClient.put<Columna>(endpoints.columnas.edit(id), data),
    onSuccess: () => {
      // Doble invalidación: el catálogo y todos los tableros (proyectan nombre/color)
      void queryClient.invalidateQueries({ queryKey: columnasKeys.all });
      void queryClient.invalidateQueries({ queryKey: tablerosKeys.all });
      toast.success('Columna actualizada');
    },
    onError: (error) => {
      if (isHttpError(error)) {
        if (error.status === 422) return;
        toast.error(error.message);
      } else {
        toast.error('No fue posible actualizar la columna');
      }
    },
  });
}
