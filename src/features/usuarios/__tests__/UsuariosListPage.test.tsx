/**
 * Tests de integración para UsuariosListPage.
 * T5.1 RED → T5.2 GREEN (Strict TDD — Lote C)
 *
 * Fixtures:
 *  - usr_admin: id='11111111-1111-1111-1111-111111111111', nombre='Antonio Franco', rol_sistema='admin', activo=true
 *  - usr_vendedor: id='22222222-2222-2222-2222-222222222222', nombre='María González', rol_sistema='usuario', activo=true
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor, within, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router';
import type { ReactNode } from 'react';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useAuthStore } from '@/store/authStore';

import { UsuariosListPage } from '../pages/UsuariosListPage';

// ─── IDs de los fixtures ──────────────────────────────────────────────────────

const ADMIN_ID = '11111111-1111-1111-1111-111111111111';

// ─── Wrapper con TooltipProvider ─────────────────────────────────────────────

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
        <TooltipProvider delayDuration={0}>
          <MemoryRouter initialEntries={['/usuarios']}>{children}</MemoryRouter>
        </TooltipProvider>
      </QueryClientProvider>
    );
  };
}

// ─── Setup: inicializar authStore como admin antes de cada test ───────────────

beforeEach(() => {
  useAuthStore.setState({
    token: 'fake-token',
    usuario: {
      id: ADMIN_ID,
      nombre: 'Antonio Franco',
      correo: 'admin@crm.test',
      rol_sistema: 'admin',
      rol_empresa: 'Director Comercial',
    },
  });
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('UsuariosListPage', () => {
  it('renderiza la tabla con los usuarios del fixture', async () => {
    const Wrapper = makeWrapper();
    render(<UsuariosListPage />, { wrapper: Wrapper });

    await waitFor(() =>
      expect(screen.getByText('Antonio Franco')).toBeInTheDocument(),
    );
    expect(screen.getByText('María González')).toBeInTheDocument();
  });

  it('filtra usuarios al escribir en el campo de búsqueda', async () => {
    const user = userEvent.setup();
    const Wrapper = makeWrapper();
    render(<UsuariosListPage />, { wrapper: Wrapper });

    await waitFor(() =>
      expect(screen.getByText('Antonio Franco')).toBeInTheDocument(),
    );

    const input = screen.getByPlaceholderText(/buscar por nombre o correo/i);
    await user.type(input, 'antonio');

    expect(screen.getByText('Antonio Franco')).toBeInTheDocument();
    expect(screen.queryByText('María González')).not.toBeInTheDocument();
  });

  it('filtra por rol al cambiar el select de filtro a "admin"', async () => {
    const Wrapper = makeWrapper();
    render(<UsuariosListPage />, { wrapper: Wrapper });

    await waitFor(() =>
      expect(screen.getByText('Antonio Franco')).toBeInTheDocument(),
    );

    // El Select de Radix no soporta userEvent.click en jsdom (hasPointerCapture no disponible).
    // Disparamos el evento de cambio directamente sobre el botón del select usando fireEvent.
    // Alternativa más robusta: dispara el change via el valor del atributo data-value del trigger.
    const selectTrigger = screen.getByRole('combobox', { name: /filtrar por rol/i });

    // Usamos fireEvent.keyDown para abrir el select y luego seleccionamos la opción vía aria
    // Esta es la forma recomendada para Radix Select en jsdom
    fireEvent.keyDown(selectTrigger, { key: 'ArrowDown' });

    // El select debería abrirse y mostrar las opciones
    const adminOption = await screen.findByRole('option', { name: /^admin$/i });
    fireEvent.click(adminOption);

    // Solo debe quedar Antonio (admin); María (usuario) debe desaparecer
    await waitFor(() =>
      expect(screen.queryByText('María González')).not.toBeInTheDocument(),
    );
    expect(screen.getByText('Antonio Franco')).toBeInTheDocument();
  });

  it('abre el diálogo "Nuevo usuario" al hacer click en el botón', async () => {
    const user = userEvent.setup();
    const Wrapper = makeWrapper();
    render(<UsuariosListPage />, { wrapper: Wrapper });

    await waitFor(() =>
      expect(screen.getByText('Antonio Franco')).toBeInTheDocument(),
    );

    await user.click(screen.getByRole('button', { name: /nuevo usuario/i }));

    const dialog = await screen.findByRole('dialog');
    expect(
      within(dialog).getByRole('heading', { name: /nuevo usuario/i }),
    ).toBeInTheDocument();
  });

  it('abre el diálogo "Editar usuario" con datos precargados', async () => {
    const user = userEvent.setup();
    const Wrapper = makeWrapper();
    render(<UsuariosListPage />, { wrapper: Wrapper });

    await waitFor(() =>
      expect(screen.getByText('María González')).toBeInTheDocument(),
    );

    // Abre el DropdownMenu de la fila de María González
    const actionButtons = screen.getAllByRole('button', { name: /acciones/i });
    // La segunda fila es María González (índice 1)
    await user.click(actionButtons[1]!);

    // Click en "Editar"
    const editarItem = await screen.findByRole('menuitem', { name: /^editar$/i });
    await user.click(editarItem);

    // Debe aparecer el dialog de edición con datos precargados
    const dialog = await screen.findByRole('dialog');
    expect(
      within(dialog).getByRole('heading', { name: /editar usuario/i }),
    ).toBeInTheDocument();

    // El input nombre debe tener el valor de María González
    const nombreInput = within(dialog).getByLabelText(/nombre completo/i);
    expect(nombreInput).toHaveValue('María González');
  });

  it('bloquea "Desactivar" y "Eliminar" en la fila de la cuenta propia', async () => {
    const user = userEvent.setup();
    const Wrapper = makeWrapper();
    render(<UsuariosListPage />, { wrapper: Wrapper });

    await waitFor(() =>
      expect(screen.getByText('Antonio Franco')).toBeInTheDocument(),
    );

    // La primera fila es Antonio Franco (cuenta propia — ADMIN_ID)
    const actionButtons = screen.getAllByRole('button', { name: /acciones/i });
    await user.click(actionButtons[0]!);

    // Verificar que "Desactivar" está deshabilitado (Radix pone data-disabled="")
    const desactivarItem = await screen.findByRole('menuitem', { name: /desactivar/i });
    expect(desactivarItem).toHaveAttribute('data-disabled');

    // Verificar que "Eliminar" también está deshabilitado
    const eliminarItem = screen.getByRole('menuitem', { name: /^eliminar$/i });
    expect(eliminarItem).toHaveAttribute('data-disabled');
  });
});
