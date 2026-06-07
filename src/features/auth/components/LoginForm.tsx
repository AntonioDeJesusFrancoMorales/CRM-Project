import { LogIn } from 'lucide-react';
import { loginWithKeycloak } from '@/lib/keycloak';
import { Button } from '@/components/ui/button';

export function LoginForm() {
  return (
    <Button className="w-full" onClick={() => loginWithKeycloak()}>
      <LogIn />
      Iniciar sesión con Keycloak
    </Button>
  );
}
