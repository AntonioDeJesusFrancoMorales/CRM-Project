import { useMutation, type UseMutationResult } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import { isHttpError } from '@/api/http-error';

// Solicita el cambio de contraseña del usuario AUTENTICADO. No recibe input: el back deriva
// el usuarioId del token (ActorContext) y dispara un email de Keycloak para cambiarla en su
// página hosteada. El back nunca ve la contraseña en texto plano. Responde 202 sin cuerpo,
// por eso el tipo de retorno es void. Ver back UsuarioController.requestPasswordChange.
export function useRequestPasswordChange(): UseMutationResult<void, Error, void> {
  return useMutation<void, Error, void>({
    mutationFn: () => apiClient.post<void>(endpoints.usuarios.requestPasswordChange()),
    onSuccess: () => {
      toast.success('Te enviamos un correo para cambiar tu contraseña.');
    },
    onError: (error) => {
      if (isHttpError(error)) {
        toast.error(error.message);
      } else {
        toast.error('No fue posible solicitar el cambio de contraseña');
      }
    },
  });
}
