import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '@/api/client';
import { endpoints } from '@/api/endpoints';

// Re-registra el webhook de Evolution para un canal ya conectado, para que
// lleguen los mensajes entrantes en vivo (usar tras configurar WA_WEBHOOK_BASE_URL).
export function useReconfigurarWebhook() {
  return useMutation({
    mutationFn: (canalId: string) =>
      apiClient.post<void>(endpoints.wa.canales.reconfigurarWebhook(canalId), {}),
    onSuccess: () => {
      toast.success('Webhook reconfigurado: los mensajes nuevos deberían llegar en vivo');
    },
    onError: () => {
      toast.error('No se pudo reconfigurar el webhook');
    },
  });
}
