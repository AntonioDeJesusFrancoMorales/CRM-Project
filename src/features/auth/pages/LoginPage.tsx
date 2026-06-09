import { useEffect } from 'react';
import { loginWithKeycloak } from '@/lib/keycloak';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export function LoginPage() {
  // Lógica de auth intacta: redirige a Keycloak al montar la pantalla.
  useEffect(() => {
    void loginWithKeycloak();
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center text-center">
          <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-lg font-bold text-primary-foreground shadow">
            CRM
          </div>
          <CardTitle className="text-2xl">Bienvenido</CardTitle>
          <CardDescription>Tu plataforma de gestión comercial</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4 pb-8 pt-2">
          <div
            className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"
            role="status"
            aria-label="Cargando"
          />
          <p className="text-sm text-muted-foreground">
            Redirigiendo a Keycloak...
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
