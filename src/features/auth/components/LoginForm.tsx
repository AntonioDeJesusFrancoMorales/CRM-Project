import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useLocation, useNavigate } from 'react-router';
import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useLogin } from '@/features/auth/hooks/useLogin';
import { loginSchema, type LoginInput } from '@/features/auth/schemas/login.schema';
import { isHttpError } from '@/api/http-error';

const showMockHints = import.meta.env.DEV && import.meta.env.VITE_ENABLE_MSW === 'true';

interface LocationState {
  from?: { pathname: string };
}

export function LoginForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const login = useLogin();

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = (data: LoginInput): void => {
    login.mutate(data, {
      onSuccess: () => {
        const from = (location.state as LocationState | null)?.from?.pathname ?? '/empresas';
        navigate(from, { replace: true });
      },
      onError: (error) => {
        // Errores de validación del backend → mapear a campos del form
        if (isHttpError(error) && error.status === 422 && error.details) {
          for (const detail of error.details) {
            form.setError(detail.field as keyof LoginInput, { message: detail.message });
          }
        }
      },
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Correo</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  autoComplete="email"
                  placeholder={showMockHints ? 'admin@crm.test' : 'tu@correo.com'}
                  disabled={login.isPending}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contraseña</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  autoComplete="current-password"
                  placeholder={showMockHints ? 'Admin123!' : '••••••••'}
                  disabled={login.isPending}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={login.isPending}>
          {login.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Iniciando sesión...
            </>
          ) : (
            'Iniciar sesión'
          )}
        </Button>

        {showMockHints && (
          <p className="text-[11px] text-muted-foreground text-center pt-2 border-t">
            <span className="font-medium">Credenciales de prueba</span>
            <br />
            <code>admin@crm.test / Admin123!</code>
            <br />
            <code>vendedor@crm.test / Vendedor123!</code>
          </p>
        )}
      </form>
    </Form>
  );
}
