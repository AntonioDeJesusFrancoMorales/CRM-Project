import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import { isHttpError } from '@/api/http-error';
import { etiquetasKeys } from './useEtiquetas';
import { fichasKeys } from '@/features/kanban/hooks/useFichas';
import { permissionsKeys, usePermissions } from '@/features/permissions/context';

export interface DeleteEtiquetaVars {
  id: string;
  /** Cuando la etiqueta está en uso, el back exige confirm=true para borrarla. */
  confirm?: boolean;
}

// El back responde 409 cuando la etiqueta está en uso y NO se pasó confirm=true
// (EtiquetaRequiresConfirmationException). El dialog detecta este 409 para pedir confirmación.
export const ETIQUETA_EN_USO_STATUS = 409;

export function useDeleteEtiqueta(): UseMutationResult<void, Error, DeleteEtiquetaVars> {
  const queryClient = useQueryClient();
  const permissions = usePermissions();
  const canDelete = permissions.allows('ETIQUETA', 'ELIMINAR');

  return useMutation<void, Error, DeleteEtiquetaVars>({
    mutationFn: ({ id, confirm = false }) => {
      if (!canDelete) return Promise.reject(new Error('Etiqueta delete permission denied'));
      return apiClient.delete<void>(endpoints.etiquetas.delete(id, confirm));
    },
    onSuccess: (_void, { id }) => {
      queryClient.removeQueries({ queryKey: etiquetasKeys.detail(id) });
      void queryClient.invalidateQueries({ queryKey: etiquetasKeys.all });
      void queryClient.invalidateQueries({ queryKey: permissionsKeys.all });
      // Al confirmar el borrado, el back desasocia la etiqueta de las fichas → refrescar kanban.
      void queryClient.invalidateQueries({ queryKey: fichasKeys.all });
      toast.success('Etiqueta eliminada');
    },
    onError: (error) => {
      if (isHttpError(error)) {
        // 409 = en uso: el dialog lo maneja pidiendo confirmación. No mostramos toast acá.
        if (error.status === ETIQUETA_EN_USO_STATUS) return;
        if (error.status === 404) {
          toast.message('La etiqueta ya fue eliminada');
          void queryClient.invalidateQueries({ queryKey: etiquetasKeys.all });
          return;
        }
        toast.error(error.message);
      } else {
        toast.error('No fue posible eliminar la etiqueta');
      }
    },
  });
}
