import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/store/authStore';
import { LoginForm } from '../components/LoginForm';

export function LoginPage() {
  const navigate = useNavigate();
  const token = useAuthStore((s) => s.token);

  // Si ya hay sesión activa, evitar mostrar el login.
  useEffect(() => {
    if (token) navigate('/empresas', { replace: true });
  }, [token, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center space-y-1">
          <CardTitle className="text-2xl">Iniciar sesión</CardTitle>
          <CardDescription>Ingresa tus credenciales para entrar a Pipely</CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm />
        </CardContent>
      </Card>
    </div>
  );
}
