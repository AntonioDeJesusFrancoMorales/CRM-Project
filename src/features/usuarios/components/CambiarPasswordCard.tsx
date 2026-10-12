// CambiarPasswordCard — sección de "Seguridad" para la pantalla de Configuración.
// Un único botón que solicita el cambio de contraseña del usuario autenticado. NO es un
// formulario de contraseña: el back delega en Keycloak (email con link). Ver back
// UsuarioController.requestPasswordChange y el hook useRequestPasswordChange.

import { KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useRequestPasswordChange } from '../hooks/useRequestPasswordChange';

export function CambiarPasswordCard() {
  const { mutate, isPending } = useRequestPasswordChange();

  return (
    <Card className="rounded-lg shadow-none">
      <CardHeader className="p-5 pb-0">
        <CardTitle className="flex items-center gap-2">
          <KeyRound className="h-4 w-4" aria-hidden="true" />
          Seguridad
        </CardTitle>
        <CardDescription>
          Cambia la contraseña de tu cuenta. Recibirás un correo con un enlace seguro para
          definir una nueva contraseña.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-5 pt-4">
        <Button
          variant="outline"
          onClick={() => mutate()}
          disabled={isPending}
        >
          <KeyRound className="mr-2 h-4 w-4" aria-hidden="true" />
          {isPending ? 'Enviando...' : 'Cambiar contraseña'}
        </Button>
      </CardContent>
    </Card>
  );
}
