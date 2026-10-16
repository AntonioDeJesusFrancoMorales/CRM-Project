/**
 * Tests de integración para UsuariosListPage.
 * T5.1 RED → T5.2 GREEN (Strict TDD — Lote C)
 *
 * Fixtures:
 *  - usr_admin: id='b2000000-0000-4000-8000-000000000001', nombre='Ana Torres', rol_sistema='admin', activo=true
 *  - usr_consulta: id='b2000000-0000-4000-8000-000000000002', nombre='Laura Méndez', rol_sistema='usuario', activo=true
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor, within, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router';
import type { ReactNode } from 'react';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useAuthStore } from '@/store/authStore';
import { server } from '@/test/server';

import { UsuariosListPage } from '../pages/UsuariosListPage';

// ─── IDs de los fixtures ──────────────────────────────────────────────────────

const ADMIN_ID = 'b2000000-0000-4000-8000-000000000001';

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
      subject: 'sub-admin',
      username: 'Ana Torres',
      email: 'admin@pipely.local',
      usuario_id: ADMIN_ID,
      super_usuario_id: 'super-uuid-001',
      roles: ['SUPER_USUARIO'],
    },
  });
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('UsuariosListPage', () => {
  it('renderiza la tabla con los usuarios del fixture', async () => {
    const Wrapper = makeWrapper();
    render(<UsuariosListPage />, { wrapper: Wrapper });

    await waitFor(() => expect(screen.getByText('Ana Torres')).toBeInTheDocument());
    expect(screen.getByText('Laura Méndez')).toBeInTheDocument();
  });

  it('filtra usuarios al escribir en el campo de búsqueda', async () => {
    const user = userEvent.setup();
    const Wrapper = makeWrapper();
    render(<UsuariosListPage />, { wrapper: Wrapper });

    await waitFor(() => expect(screen.getByText('Ana Torres')).toBeInTheDocument());

    const input = screen.getByPlaceholderText(/buscar por nombre/i);
    await user.type(input, 'ana torres');

    expect(screen.getByText('Ana Torres')).toBeInTheDocument();
    expect(screen.queryByText('Laura Méndez')).not.toBeInTheDocument();
  });

  it('filtra por rol al cambiar el select de filtro a "Administrador"', async () => {
    const Wrapper = makeWrapper();
    render(<UsuariosListPage />, { wrapper: Wrapper });

    await waitFor(() => expect(screen.getByText('Ana Torres')).toBeInTheDocument());

    // El Select de Radix no soporta userEvent.click en jsdom (hasPointerCapture no disponible).
    // Disparamos el evento de cambio directamente sobre el botón del select usando fireEvent.
    const selectTrigger = screen.getByRole('combobox', { name: /filtrar por rol/i });

    // Usamos fireEvent.keyDown para abrir el select y luego seleccionamos la opción vía aria
    // Esta es la forma recomendada para Radix Select en jsdom
    fireEvent.keyDown(selectTrigger, { key: 'ArrowDown' });

    // El select muestra las opciones con nombres reales del fixture de roles:
    //   'Administrador' (rolId de Ana) y 'Consulta' (rolId de Laura)
    const adminOption = await screen.findByRole('option', { name: /^administrador$/i });
    fireEvent.click(adminOption);

    // Solo debe quedar Ana (Administrador); Laura (Consulta) debe desaparecer
    await waitFor(() => expect(screen.queryByText('Laura Méndez')).not.toBeInTheDocument());
    expect(screen.getByText('Ana Torres')).toBeInTheDocument();
  });

  it('abre el diálogo "Nuevo usuario" al hacer click en el botón', async () => {
    const user = userEvent.setup();
    const Wrapper = makeWrapper();
    render(<UsuariosListPage />, { wrapper: Wrapper });

    await waitFor(() => expect(screen.getByText('Ana Torres')).toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: /nuevo usuario/i }));

    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByRole('heading', { name: /nuevo usuario/i })).toBeInTheDocument();
  });

  it('abre el diálogo "Editar usuario" con datos precargados', async () => {
    const user = userEvent.setup();
    const Wrapper = makeWrapper();
    render(<UsuariosListPage />, { wrapper: Wrapper });

    await waitFor(() => expect(screen.getByText('Laura Méndez')).toBeInTheDocument());

    // Abre el DropdownMenu de la fila de Laura Méndez
    const actionButtons = screen.getAllByRole('button', { name: /acciones/i });
    // La segunda fila es Laura Méndez (índice 1)
    await user.click(actionButtons[1]!);

    // Click en "Editar"
    const editarItem = await screen.findByRole('menuitem', { name: /^editar$/i });
    await user.click(editarItem);

    // Debe aparecer el dialog de edición con datos precargados
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByRole('heading', { name: /editar usuario/i })).toBeInTheDocument();

    // El input nombre debe tener el valor de Laura Méndez
    const nombreInput = within(dialog).getByLabelText(/nombre completo/i);
    expect(nombreInput).toHaveValue('Laura Méndez');
  });

  it('bloquea "Eliminar" en la fila de la cuenta propia (no hay Desactivar/Reactivar)', async () => {
    const user = userEvent.setup();
    const Wrapper = makeWrapper();
    render(<UsuariosListPage />, { wrapper: Wrapper });

    await waitFor(() => expect(screen.getByText('Ana Torres')).toBeInTheDocument());

    // La primera fila es Ana Torres (cuenta propia — ADMIN_ID)
    const actionButtons = screen.getAllByRole('button', { name: /acciones/i });
    await user.click(actionButtons[0]!);

    // Verificar que "Eliminar" está deshabilitado (Radix pone data-disabled="")
    const eliminarItem = await screen.findByRole('menuitem', { name: /^eliminar$/i });
    expect(eliminarItem).toHaveAttribute('data-disabled');

    // No debe existir "Desactivar" ni "Reactivar" (eliminados del contrato RPC)
    expect(screen.queryByRole('menuitem', { name: /desactivar/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('menuitem', { name: /reactivar/i })).not.toBeInTheDocument();
  });

  // W1 — empty state: handler retorna [] → muestra texto real del componente
  it('muestra empty state cuando el listado está vacío', async () => {
    server.use(http.get('/api/usuarios/get-all', () => HttpResponse.json([], { status: 200 })));

    const Wrapper = makeWrapper();
    render(<UsuariosListPage />, { wrapper: Wrapper });

    await waitFor(() =>
      expect(screen.getByText('Aún no hay usuarios registrados.')).toBeInTheDocument(),
    );
    expect(screen.getByRole('button', { name: /crear primer usuario/i })).toBeInTheDocument();
  });

  // W2 — error 500: muestra estado de error con botón "Reintentar"
  it('muestra error y botón "Reintentar" cuando el endpoint responde 500', async () => {
    server.use(
      http.get('/api/usuarios/get-all', () =>
        HttpResponse.json(
          { status: 500, error: 'INTERNAL_SERVER_ERROR', message: 'Error interno' },
          { status: 500 },
        ),
      ),
    );

    const Wrapper = makeWrapper();
    render(<UsuariosListPage />, { wrapper: Wrapper });

    await waitFor(() =>
      expect(screen.getByRole('button', { name: /reintentar/i })).toBeInTheDocument(),
    );
    // La tabla NO debe renderizarse en estado de error
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });
});
