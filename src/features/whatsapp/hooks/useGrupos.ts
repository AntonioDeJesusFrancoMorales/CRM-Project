import { useMutation, useQuery, useQueryClient, type UseQueryResult } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import type { Grupo, MensajeGrupo } from '@/api/types';

export const gruposKeys = {
  all: ['wa-grupos'] as const,
  mensajes: (grupoId: string) => ['wa-grupos', 'mensajes', grupoId] as const,
};

export function useGrupos(): UseQueryResult<Grupo[]> {
  return useQuery<Grupo[]>({
    queryKey: gruposKeys.all,
    queryFn: () => apiClient.get<Grupo[]>(endpoints.wa.grupos.getAll()),
    refetchInterval: 30_000,
  });
}

export function useMensajesGrupo(grupoId: string | null): UseQueryResult<MensajeGrupo[]> {
  return useQuery<MensajeGrupo[]>({
    queryKey: gruposKeys.mensajes(grupoId ?? ''),
    queryFn: () => apiClient.get<MensajeGrupo[]>(endpoints.wa.grupos.mensajes(grupoId!)),
    enabled: !!grupoId,
  });
}

export function useImportarGrupos() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (canalId: string) =>
      apiClient.post<{ imported: number }>(endpoints.wa.grupos.importar(canalId), {}),
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: gruposKeys.all });
      toast.success(`Grupos sincronizados (${data.imported} mensajes nuevos)`);
    },
    onError: () => toast.error('No se pudieron importar los grupos'),
  });
}

export function useMarcarGrupoLeido() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (grupoId: string) =>
      apiClient.post<Grupo>(endpoints.wa.grupos.marcarLeido(grupoId), {}),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: gruposKeys.all }),
    onError: () => toast.error('No se pudo marcar el grupo como leído'),
  });
}
