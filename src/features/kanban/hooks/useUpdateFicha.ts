// useUpdateFicha — PUT /fichas/edit?id= con FichaEditInput.
// Reenvía el estado COMPLETO de la ficha (sin creadoPor — inmutable en el back).
// Usado tanto para ediciones generales como para MOVER ficha (cambiar columnaId).
// Sin optimistic update en v1: invalidación simple tras éxito.

import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import { isHttpError } from '@/api/http-error';
import type { Ficha, FichaEditInput } from '@/features/kanban/schemas/ficha.schema';
import { fichasKeys } from './useFichas';

interface UpdateFichaVars {
  id: string;
  data: FichaEditInput;
}

export function useUpdateFicha(): UseMutationResult<Ficha, Error, UpdateFichaVars> {
  const queryClient = useQueryClient();

  return useMutation<Ficha, Error, UpdateFichaVars>({
    mutationFn: ({ id, data }) => apiClient.put<Ficha>(endpoints.fichas.edit(id), data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: fichasKeys.all });
      toast.success('Ficha actualizada');
    },
    onError: (error) => {
      if (isHttpError(error)) {
        if (error.status === 422) return;
        toast.error(error.message);
      } else {
        toast.error('No fue posible actualizar la ficha');
      }
    },
  });
}
