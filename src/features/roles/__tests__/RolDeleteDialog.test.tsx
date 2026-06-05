/**
 * Tests de componente para RolDeleteDialog.
 * Cubre: renderizado con open=true, muestra nombre del rol,
 * al click "Eliminar" la mutación dispara y cierra en éxito.
 *
 * GOTCHA: Ambos roles del fixture tienen usuarios asignados (→ 409).
 * Para el happy-path usamos un override MSW que responde 204 siempre.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import type { Rol } from '@/api/types';
import { server } from '@/test/server';
import { RolDeleteDialog } from '../components/RolDeleteDialog';

// ── Fixture ───────────────────────────────────────────────────────────────────

const rolParaEliminar: Rol = {
  id: 'rol-user-uuid-2222-222222222222',
  nombre: 'Usuario',
  descripcion: 'Acceso estándar de ventas',
  activo: true,
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
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('RolDeleteDialog', () => {
  it('con open=true y un rol, muestra "¿Eliminar rol?"', () => {
    const Wrapper = makeWrapper();
    render(
      <RolDeleteDialog open={true} onOpenChange={() => {}} rol={rolParaEliminar} />,
      { wrapper: Wrapper },
    );

    expect(screen.getByText('¿Eliminar rol?')).toBeInTheDocument();
  });

  it('muestra el nombre del rol en el cuerpo del diálogo', () => {
    const Wrapper = makeWrapper();
    render(
      <RolDeleteDialog open={true} onOpenChange={() => {}} rol={rolParaEliminar} />,
      { wrapper: Wrapper },
    );

    expect(screen.getByText(rolParaEliminar.nombre)).toBeInTheDocument();
  });

  it('NO renderiza cuando open=false', () => {
    const Wrapper = makeWrapper();
    render(
      <RolDeleteDialog open={false} onOpenChange={() => {}} rol={rolParaEliminar} />,
      { wrapper: Wrapper },
    );

    expect(screen.queryByText('¿Eliminar rol?')).not.toBeInTheDocument();
  });

  it('al click "Eliminar" llama onOpenChange(false) tras éxito (204)', async () => {
    // Override: el back responde 204 independientemente de usuarios asignados
    server.use(
      http.delete('/api/roles/delete', () => new HttpResponse(null, { status: 204 })),
    );

    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    const Wrapper = makeWrapper();

    render(
      <RolDeleteDialog open={true} onOpenChange={onOpenChange} rol={rolParaEliminar} />,
      { wrapper: Wrapper },
    );

    const eliminarBtn = screen.getByRole('button', { name: /^eliminar$/i });
    await user.click(eliminarBtn);

    await waitFor(() => {
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });
});
