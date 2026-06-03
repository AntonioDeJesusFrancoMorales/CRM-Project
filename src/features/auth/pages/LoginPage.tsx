import { useEffect } from 'react';
import { loginWithKeycloak } from '@/lib/keycloak';

export function LoginPage() {
  useEffect(() => {
    void loginWithKeycloak();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-sm text-muted-foreground">Redirigiendo a Keycloak...</p>
      </div>
    </div>
  );
}
