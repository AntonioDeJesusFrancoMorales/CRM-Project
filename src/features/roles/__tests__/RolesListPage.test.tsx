/**
 * Tests de integración para RolesListPage.
 * Cubre: header, botón "Nuevo rol", lista de roles desde MSW,
 * y apertura del diálogo de creación.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router';
import type { ReactNode } from 'react';
import { useAuthStore } from '@/store/authStore';
import { RolesListPage } from '../pages/RolesListPage';

// ── Wrapper ───────────────────────────────────────────────────────────────────

function makeWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });

  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/configuracion']}>{children}</MemoryRouter>
      </QueryClientProvider>
    );
  };
}

// ── Setup ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  useAuthStore.setState({
    token: 'fake-token',
    usuario: {
      subject: 'sub-admin',
      username: 'admin_user',
      email: 'admin@crm.test',
      usuario_id: '11111111-1111-1111-1111-111111111111',
      super_usuario_id: 'super-uuid-001',
      roles: ['SUPER_USUARIO'],
    },
  });
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('RolesListPage', () => {
  it('renderiza el header "Roles"', () => {
    const Wrapper = makeWrapper();
    render(<RolesListPage />, { wrapper: Wrapper });

    expect(screen.getByRole('heading', { name: /^roles$/i })).toBeInTheDocument();
  });

  it('renderiza el botón "Nuevo rol"', () => {
    const Wrapper = makeWrapper();
    render(<RolesListPage />, { wrapper: Wrapper });

    expect(screen.getByRole('button', { name: /nuevo rol/i })).toBeInTheDocument();
  });

  it('lista los roles del fixture MSW (espera "Administrador")', async () => {
    const Wrapper = makeWrapper();
    render(<RolesListPage />, { wrapper: Wrapper });

    // MSW responde con rolesFixture → 'Administrador' y 'Usuario'
    await waitFor(() =>
      expect(screen.getByText('Administrador')).toBeInTheDocument(),
    );
    expect(screen.getByText('Usuario')).toBeInTheDocument();
  });

  it('al click en "Nuevo rol" abre el diálogo con heading "Nuevo rol"', async () => {
    const user = userEvent.setup();
    const Wrapper = makeWrapper();
    render(<RolesListPage />, { wrapper: Wrapper });

    // Esperar que carguen los datos antes de interactuar
    await waitFor(() =>
      expect(screen.getByText('Administrador')).toBeInTheDocument(),
    );

    await user.click(screen.getByRole('button', { name: /nuevo rol/i }));

    const dialog = await screen.findByRole('dialog');
    expect(
      screen.getByRole('heading', { name: /nuevo rol/i }),
    ).toBeInTheDocument();
    expect(dialog).toBeInTheDocument();
  });
});
