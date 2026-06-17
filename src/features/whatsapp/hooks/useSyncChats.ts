import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import { conversacionesKeys } from './useConversaciones';

export function useSyncChats() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (canalId: string) =>
      apiClient.post<{ imported: number }>(endpoints.wa.canales.syncChats(canalId), {}),
    onSuccess: (data, _canalId) => {
      void queryClient.invalidateQueries({ queryKey: conversacionesKeys.all });
      if (data.imported > 0) {
        toast.success(`Historial cargado: ${data.imported} mensajes importados`);
      }
    },
    onError: () => {
      toast.error('No se pudo cargar el historial de WhatsApp');
    },
  });
}
