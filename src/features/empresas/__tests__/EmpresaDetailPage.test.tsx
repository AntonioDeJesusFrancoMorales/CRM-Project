import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Routes, Route } from 'react-router';

import { EmpresaDetailPage } from '../pages/EmpresaDetailPage';
import { server } from '@/test/server';

function renderWithRouter(initialPath: string) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
          <Route path="/empresas" element={<div>Listado de empresas</div>} />
          <Route path="/empresas/:id" element={<EmpresaDetailPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('EmpresaDetailPage', () => {
  it('renderiza el nombre y el tab Contactos con un id válido', async () => {
    renderWithRouter('/empresas/a1111111-aaaa-1111-aaaa-111111111111');

    await waitFor(() =>
      expect(screen.getByText('Innovatech Solutions')).toBeInTheDocument(),
    );
    expect(screen.getByRole('tab', { name: /información/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /contactos/i })).toBeInTheDocument();
    // Tabs legacy eliminados
    expect(screen.queryByRole('tab', { name: /prospectos/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: /clientes/i })).not.toBeInTheDocument();
  });

  it('muestra contactos de la empresa en el tab Contactos', async () => {
    const user = userEvent.setup();
    renderWithRouter('/empresas/a1111111-aaaa-1111-aaaa-111111111111');

    // Esperar que cargue la empresa
    await waitFor(() =>
      expect(screen.getByText('Innovatech Solutions')).toBeInTheDocument(),
    );

    // Activar el tab Contactos
    await user.click(screen.getByRole('tab', { name: /contactos/i }));

    // Lucía y Sofía son de Innovatech (contactosFixture — sin apellido)
    await waitFor(() =>
      expect(screen.getByText('Lucía')).toBeInTheDocument(),
    );
    expect(screen.getByText('Sofía')).toBeInTheDocument();
  });

  it('redirige a /empresas cuando el id devuelve 404', async () => {
    // Con useEmpresa resuelto desde cache del get-all, un id inexistente
    // devuelve undefined → el componente redirige a /empresas.
    server.use(
      http.get('/api/empresas/get-all', () => HttpResponse.json([])),
    );

    renderWithRouter('/empresas/inexistente');

    await waitFor(
      () => expect(screen.getByText('Listado de empresas')).toBeInTheDocument(),
      { timeout: 3000 },
    );
  });
});
