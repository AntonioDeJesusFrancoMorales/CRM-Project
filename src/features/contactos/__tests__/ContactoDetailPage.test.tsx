import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Routes, Route } from 'react-router';
import { TooltipProvider } from '@/components/ui/tooltip';

import { ContactoDetailPage } from '../pages/ContactoDetailPage';
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
      <TooltipProvider>
        <MemoryRouter initialEntries={[initialPath]}>
          <Routes>
            <Route path="/contactos" element={<div>Listado de contactos</div>} />
            <Route path="/contactos/:id" element={<ContactoDetailPage />} />
          </Routes>
        </MemoryRouter>
      </TooltipProvider>
    </QueryClientProvider>,
  );
}

describe('ContactoDetailPage', () => {
  it('muestra nombre y datos del contacto con id válido', async () => {
    // c0222222 = Martín PROSPECTO
    renderWithRouter('/contactos/c0222222-cccc-0002-cccc-000000000002');

    await waitFor(() =>
      expect(
        screen.getByRole('heading', { name: /martín/i }),
      ).toBeInTheDocument(),
    );

    // Tab Info debe existir
    expect(screen.getByRole('tab', { name: /info/i })).toBeInTheDocument();
  });

  it('el tab Info renderiza los campos del contacto', async () => {
    renderWithRouter('/contactos/c0222222-cccc-0002-cccc-000000000002');

    await waitFor(() =>
      expect(
        screen.getByRole('heading', { name: /martín/i }),
      ).toBeInTheDocument(),
    );

    // Correo visible en tab Info (activo por defecto)
    expect(
      screen.getByText('martin.gutierrez@example.com'),
    ).toBeInTheDocument();
  });

  it('el tab Tratos muestra tratos del contacto', async () => {
    const user = userEvent.setup();
    // c0333333 = Sofía ACTIVO con empresa Innovatech
    renderWithRouter('/contactos/c0333333-cccc-0003-cccc-000000000003');

    await waitFor(() =>
      expect(
        screen.getByRole('heading', { name: /sofía/i }),
      ).toBeInTheDocument(),
    );

    const tabTratos = screen.getByRole('tab', { name: /tratos/i });
    expect(tabTratos).toBeInTheDocument();
    await user.click(tabTratos);

    // El tab Tratos debe renderizarse (puede estar vacío o con tratos)
    await waitFor(() =>
      expect(
        screen.getByRole('tabpanel', { name: /tratos/i }),
      ).toBeInTheDocument(),
    );
  });

  it('redirige a /contactos cuando el id devuelve 404', async () => {
    server.use(
      http.get('/api/contactos/get-all', () => HttpResponse.json([])),
    );

    renderWithRouter('/contactos/id-inexistente');

    await waitFor(
      () =>
        expect(
          screen.getByText('Listado de contactos'),
        ).toBeInTheDocument(),
      { timeout: 3000 },
    );
  });
});
