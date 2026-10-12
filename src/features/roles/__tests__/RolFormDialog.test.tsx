/**
 * Tests de componente para RolFormDialog (create + edit).
 * Usa MSW global (setupTests.ts lo monta). QueryClientProvider envuelve para las mutaciones.
 */

import { describe, it, expect } from 'vitest';
import userEvent from '@testing-library/user-event';
import { render, screen, waitFor, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router';
import type { ReactNode } from 'react';
import { http, HttpResponse } from 'msw';
import type { Rol } from '@/api/types';
import { tableroTratosFixture } from '@/mocks/fixtures/tableros';
import { server } from '@/test/server';
import { RolFormDialog } from '../components/RolFormDialog';

// ── Fixture ───────────────────────────────────────────────────────────────────

const rolFixture: Rol = {
  id: 'rol-admin-uuid-1111-111111111111',
  nombre: 'Administrador',
  descripcion: 'Acceso total al sistema',
  activo: true,
  permisos: [],
};

const rolWithSelectedBoard: Rol = {
  ...rolFixture,
  permisos: [
    {
      recurso: 'TABLERO',
      acciones: ['LEER'],
      alcance: 'TABLEROS_PERMITIDOS',
      idsPermitidos: [tableroTratosFixture.id],
      gruposLectura: [],
      gruposEscritura: [],
    },
  ],
};

const VALID_BOARD_ID = '11111111-1111-4111-8111-111111111111';

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
        <MemoryRouter>{children}</MemoryRouter>
      </QueryClientProvider>
    );
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('RolFormDialog — mode=create', () => {
  it('renderiza título "Nuevo rol"', () => {
    const Wrapper = makeWrapper();
    render(
      <RolFormDialog mode="create" open={true} onOpenChange={() => {}} />,
      { wrapper: Wrapper },
    );

    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByRole('heading', { name: /nuevo rol/i })).toBeInTheDocument();
  });

  it('renderiza el campo Nombre', () => {
    const Wrapper = makeWrapper();
    render(
      <RolFormDialog mode="create" open={true} onOpenChange={() => {}} />,
      { wrapper: Wrapper },
    );

    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByPlaceholderText(/nombre del rol/i)).toBeInTheDocument();
  });

  it('renderiza el botón "Crear rol"', () => {
    const Wrapper = makeWrapper();
    render(
      <RolFormDialog mode="create" open={true} onOpenChange={() => {}} />,
      { wrapper: Wrapper },
    );

    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByRole('button', { name: /crear rol/i })).toBeInTheDocument();
  });

  it('NO renderiza cuando open=false', () => {
    const Wrapper = makeWrapper();
    render(
      <RolFormDialog mode="create" open={false} onOpenChange={() => {}} />,
      { wrapper: Wrapper },
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});

describe('RolFormDialog — mode=edit', () => {
  it('renderiza título "Editar rol"', () => {
    const Wrapper = makeWrapper();
    render(
      <RolFormDialog mode="edit" open={true} onOpenChange={() => {}} rol={rolFixture} />,
      { wrapper: Wrapper },
    );

    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByRole('heading', { name: /editar rol/i })).toBeInTheDocument();
  });

  it('renderiza el botón "Guardar cambios"', () => {
    const Wrapper = makeWrapper();
    render(
      <RolFormDialog mode="edit" open={true} onOpenChange={() => {}} rol={rolFixture} />,
      { wrapper: Wrapper },
    );

    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByRole('button', { name: /guardar cambios/i })).toBeInTheDocument();
  });

  it('el input Nombre tiene el valor precargado del rol', () => {
    const Wrapper = makeWrapper();
    render(
      <RolFormDialog mode="edit" open={true} onOpenChange={() => {}} rol={rolFixture} />,
      { wrapper: Wrapper },
    );

    const dialog = screen.getByRole('dialog');
    const input = within(dialog).getByPlaceholderText(/nombre del rol/i);
    expect(input).toHaveValue(rolFixture.nombre);
  });

  it('preselecciona el tablero nombrado para un UUID permitido existente', async () => {
    const Wrapper = makeWrapper();
    render(
      <RolFormDialog mode="edit" open={true} onOpenChange={() => {}} rol={rolWithSelectedBoard} />,
      { wrapper: Wrapper },
    );

    const dialog = screen.getByRole('dialog');
    const checkbox = await within(dialog).findByRole('checkbox', {
      name: `Permitir tablero ${tableroTratosFixture.nombre}`,
    });
    expect(checkbox).toBeChecked();
  });

  it('conserva idsPermitidos como UUIDs al enviar un tablero seleccionado', async () => {
    let requestBody: Record<string, unknown> | undefined;
    server.use(
      http.get('/api/tableros/get-all', () =>
        HttpResponse.json([{ ...tableroTratosFixture, id: VALID_BOARD_ID }]),
      ),
      http.post('/api/roles/create', async ({ request }) => {
        requestBody = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({
          id: 'rol-created-uuid-3333-333333333333',
          nombre: 'Vendedor',
          descripcion: null,
          activo: true,
          permisos: [],
        });
      }),
    );

    const user = userEvent.setup();
    const Wrapper = makeWrapper();
    render(
      <RolFormDialog mode="create" open={true} onOpenChange={() => {}} />,
      { wrapper: Wrapper },
    );

    const dialog = screen.getByRole('dialog');
    await user.type(within(dialog).getByPlaceholderText('Nombre del rol'), 'Vendedor');
    await user.selectOptions(
      within(dialog).getByRole('combobox', { name: 'Alcance de Tableros' }),
      'TABLEROS_PERMITIDOS',
    );
    await user.click(
      await within(dialog).findByRole('checkbox', {
        name: `Permitir tablero ${tableroTratosFixture.nombre}`,
      }),
    );
    await user.click(within(dialog).getByRole('button', { name: 'Crear rol' }));

    await waitFor(() => expect(requestBody).toBeDefined());
    const permisos = requestBody?.['permisos'] as Array<{
      recurso: string;
      idsPermitidos: string[] | null;
    }>;
    expect(permisos.find((permiso) => permiso.recurso === 'TABLERO')?.idsPermitidos).toEqual([
      VALID_BOARD_ID,
    ]);
  });
});
