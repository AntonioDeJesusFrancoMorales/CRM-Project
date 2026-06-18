import { useMutation, useQuery, useQueryClient, type UseQueryResult } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '@/api/client';
import { endpoints } from '@/api/endpoints';

export interface Plantilla {
  id: string;
  titulo: string;
  contenido: string;
}

const plantillasKey = ['wa-plantillas'] as const;

export function usePlantillas(): UseQueryResult<Plantilla[]> {
  return useQuery<Plantilla[]>({
    queryKey: plantillasKey,
    queryFn: () => apiClient.get<Plantilla[]>(endpoints.wa.plantillas.getAll()),
  });
}

export function useCrearPlantilla() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { titulo: string; contenido: string }) =>
      apiClient.post<Plantilla>(endpoints.wa.plantillas.create(), payload),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: plantillasKey }); toast.success('Plantilla creada'); },
    onError: () => toast.error('No se pudo crear la plantilla'),
  });
}

export function useEliminarPlantilla() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete<void>(endpoints.wa.plantillas.delete(id)),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: plantillasKey }); toast.success('Plantilla eliminada'); },
  });
}
