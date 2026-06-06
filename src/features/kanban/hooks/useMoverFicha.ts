// useMoverFicha — PUT /fichas/mover-columna?id= con { targetColumnaId }.
// Usa optimistic update para mover la ficha en la cache inmediatamente.
// Rollback automático si el servidor falla (onError devuelve el contexto previo).
// Invalida ['fichas'] tras éxito para sincronizar con el servidor.

import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import { isHttpError } from '@/api/http-error';
import { toast } from 'sonner';
import type { Ficha } from '@/features/kanban/schemas/ficha.schema';
import { fichasKeys } from './useFichas';

export interface MoverFichaVars {
  id: string;
  targetColumnaId: string;
}

interface MoverFichaContext {
  previousFichas: Ficha[] | undefined;
}

export function useMoverFicha(): UseMutationResult<Ficha, Error, MoverFichaVars, MoverFichaContext> {
  const queryClient = useQueryClient();

  return useMutation<Ficha, Error, MoverFichaVars, MoverFichaContext>({
    mutationFn: ({ id, targetColumnaId }) =>
      apiClient.put<Ficha>(endpoints.fichas.moverColumna(id), { targetColumnaId }),

    // Optimistic update: actualiza columnaId en cache antes de que responda el servidor
    onMutate: async ({ id, targetColumnaId }) => {
      // Cancelar refetches en vuelo para evitar sobrescribir el optimistic update
      await queryClient.cancelQueries({ queryKey: fichasKeys.all });

      // Snapshot del estado previo (para rollback)
      const previousFichas = queryClient.getQueryData<Ficha[]>(fichasKeys.all);

      // Aplicar cambio optimista en cache
      queryClient.setQueryData<Ficha[]>(fichasKeys.all, (old) =>
        old?.map((f) => (f.id === id ? { ...f, columnaId: targetColumnaId } : f)) ?? [],
      );

      return { previousFichas };
    },

    // En caso de error: rollback al estado previo
    onError: (_error, _vars, context) => {
      if (context?.previousFichas !== undefined) {
        queryClient.setQueryData<Ficha[]>(fichasKeys.all, context.previousFichas);
      }
      if (isHttpError(_error)) {
        if (_error.status !== 422) {
          toast.error(_error.message);
        }
      } else {
        toast.error('No fue posible mover la ficha');
      }
    },

    // Tras éxito: invalidar para sincronizar con el servidor
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: fichasKeys.all });
    },
  });
}
