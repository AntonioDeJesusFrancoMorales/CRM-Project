/**
 * Tests de componente para RolFormDialog (create + edit).
 * Usa MSW global (setupTests.ts lo monta). QueryClientProvider envuelve para las mutaciones.
 */

import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router';
import type { ReactNode } from 'react';
import type { Rol } from '@/api/types';
import { RolFormDialog } from '../components/RolFormDialog';

// ── Fixture ───────────────────────────────────────────────────────────────────

const rolFixture: Rol = {
  id: 'rol-admin-uuid-1111-111111111111',
  nombre: 'Administrador',
  descripcion: 'Acceso total al sistema',
  activo: true,
  permisos: [],
};

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
});
