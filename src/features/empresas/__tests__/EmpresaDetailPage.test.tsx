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
  it('renderiza el nombre y los tabs con un id válido', async () => {
    renderWithRouter('/empresas/a1111111-aaaa-1111-aaaa-111111111111');

    await waitFor(() =>
      expect(screen.getByText('Innovatech Solutions')).toBeInTheDocument(),
    );
    expect(screen.getByRole('tab', { name: /información/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /prospectos/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /clientes/i })).toBeInTheDocument();
  });

  it('muestra badge "Convertido" en tab Prospectos para prospecto con estado convertido', async () => {
    const user = userEvent.setup();
    renderWithRouter('/empresas/a1111111-aaaa-1111-aaaa-111111111111');

    // Esperar que cargue la empresa
    await waitFor(() =>
      expect(screen.getByText('Innovatech Solutions')).toBeInTheDocument(),
    );

    // Activar el tab Prospectos
    await user.click(screen.getByRole('tab', { name: /prospectos/i }));

    // Valentina Cruz está en empresa a1111111 con estado 'convertido'
    await waitFor(() =>
      expect(screen.getByText('Valentina Cruz')).toBeInTheDocument(),
    );

    // El badge "Convertido" debe aparecer en la fila de Valentina Cruz
    expect(screen.getByText('Convertido')).toBeInTheDocument();
  });

  it('redirige a /empresas cuando el id devuelve 404', async () => {
    server.use(
      http.get('/api/v1/empresas/:id', () =>
        HttpResponse.json(
          { status: 404, error: 'NOT_FOUND', message: 'Empresa no encontrada' },
          { status: 404 },
        ),
      ),
    );

    renderWithRouter('/empresas/inexistente');

    await waitFor(
      () => expect(screen.getByText('Listado de empresas')).toBeInTheDocument(),
      { timeout: 3000 },
    );
  });
});
