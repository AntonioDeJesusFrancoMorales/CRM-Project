/**
 * F6.1 RED — Tests para UsuarioForm con select de roles dinámico.
 *
 * Fixtures de roles de MSW:
 *  - 'rol-admin-uuid-1111-111111111111' → 'Administrador'
 *  - 'rol-user-uuid-2222-222222222222'  → 'Usuario'
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TooltipProvider } from '@/components/ui/tooltip';

import { UsuarioForm } from '../components/UsuarioForm';
import type { UsuarioCreateInput } from '../schemas/usuario.schema';

function renderForm(props: Partial<Parameters<typeof UsuarioForm>[0]> = {}) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });

  const defaults: Parameters<typeof UsuarioForm>[0] = {
    mode: 'create',
    onSubmit: vi.fn(),
    ...props,
  };

  return render(
    <QueryClientProvider client={queryClient}>
      <TooltipProvider delayDuration={0}>
        <UsuarioForm {...defaults} />
      </TooltipProvider>
    </QueryClientProvider>,
  );
}

describe('UsuarioForm', () => {
  it('en mode=create renderiza el campo initialPassword', async () => {
    renderForm({ mode: 'create' });

    await waitFor(() => {
      expect(screen.getByLabelText(/contrasena inicial|contraseña inicial/i)).toBeInTheDocument();
    });
  });

  it('en mode=edit NO renderiza el campo initialPassword', async () => {
    renderForm({
      mode: 'edit',
      defaultValues: {
        nombre: 'Test User',
        correo: 'test@crm.test',
        rolId: 'rol-admin-uuid-1111-111111111111',
      } as Partial<UsuarioCreateInput>,
    });

    await waitFor(() => {
      expect(screen.getByLabelText(/nombre completo/i)).toBeInTheDocument();
    });

    expect(screen.queryByLabelText(/contrasena inicial|contraseña inicial/i)).not.toBeInTheDocument();
  });

  it('puebla el select de roles con datos de useRoles (GET /api/roles/get-all)', async () => {
    renderForm({ mode: 'create' });

    // El select de rol debe aparecer con las opciones del fixture
    await waitFor(() => {
      expect(screen.getByRole('combobox', { name: /rol/i })).toBeInTheDocument();
    });
  });

  it('en mode=create NO hay campos rol_sistema ni rol_empresa', async () => {
    renderForm({ mode: 'create' });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /crear usuario/i })).toBeInTheDocument();
    });

    expect(screen.queryByLabelText(/rol del sistema/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/rol en la empresa/i)).not.toBeInTheDocument();
  });

  it('en mode=create renderiza el botón "Crear usuario"', async () => {
    renderForm({ mode: 'create' });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /crear usuario/i })).toBeInTheDocument();
    });
  });

  it('en mode=edit renderiza el botón "Guardar cambios"', async () => {
    renderForm({ mode: 'edit' });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /guardar cambios/i })).toBeInTheDocument();
    });
  });

  it('muestra error de servidor cuando serverErrors incluye un campo', async () => {
    const serverErrors = [{ field: 'correo', message: 'Correo ya registrado' }];

    renderForm({
      mode: 'create',
      serverErrors,
    });

    await waitFor(() => {
      expect(screen.getByText('Correo ya registrado')).toBeInTheDocument();
    });
  });
});
