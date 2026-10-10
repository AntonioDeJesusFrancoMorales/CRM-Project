import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Routes, Route } from 'react-router';

import { EmpresaDetailPage } from '../pages/EmpresaDetailPage';
import { server } from '@/test/server';

vi.mock('@/features/permissions/context', () => ({
  usePermissions: () => ({
    status: 'resolved',
    error: undefined,
    usuario: undefined,
    rol: undefined,
    permisos: [],
    can: () => true,
    canAny: () => true,
    canAll: () => true,
    allowsAll: () => true,
    canReadGroup: () => true,
    canWriteGroup: () => true,
    allows: () => true,
    refetch: vi.fn(),
    providerActive: true,
  }),
}));

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

    await waitFor(() => expect(screen.getByText('Innovatech Solutions')).toBeInTheDocument());
    expect(screen.getByRole('tab', { name: /resumen 360/i })).toBeInTheDocument();
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
    await waitFor(() => expect(screen.getByText('Innovatech Solutions')).toBeInTheDocument());

    // Activar el tab Contactos
    await user.click(screen.getByRole('tab', { name: /contactos/i }));

    // Lucía y Sofía son de Innovatech (contactosFixture — sin apellido)
    await waitFor(() => expect(screen.getByText('Lucía')).toBeInTheDocument());
    expect(screen.getByText('Sofía')).toBeInTheDocument();
  });

  it('renders website and social values as safe external links', async () => {
    const user = userEvent.setup();
    renderWithRouter('/empresas/a1111111-aaaa-1111-aaaa-111111111111');

    await waitFor(() => expect(screen.getByText('Innovatech Solutions')).toBeInTheDocument());
    await user.click(screen.getByRole('tab', { name: /información/i }));

    expect(screen.getByRole('link', { name: /innovatech\.example\.com/i })).toHaveAttribute(
      'href',
      'https://innovatech.example.com/',
    );
    const socialLinks = screen.getAllByRole('link', { name: '@innovatech' });
    expect(socialLinks).toHaveLength(2);
    expect(socialLinks.map((link) => link.getAttribute('href'))).toContain(
      'https://instagram.com/innovatech',
    );
    expect(socialLinks[0]).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('el tab Resumen 360 muestra relaciones de la empresa', async () => {
    renderWithRouter('/empresas/a1111111-aaaa-1111-aaaa-111111111111');

    await waitFor(() => expect(screen.getByText('Innovatech Solutions')).toBeInTheDocument());

    await waitFor(() => expect(screen.getByText('Lucía')).toBeInTheDocument());
    expect(screen.getByText('Renovación licencia anual Innovatech')).toBeInTheDocument();
    expect(screen.getByText('Preparar propuesta de renovación')).toBeInTheDocument();
  });

  it('redirige a /empresas cuando el id devuelve 404', async () => {
    // Con useEmpresa resuelto desde cache del get-all, un id inexistente
    // devuelve undefined → el componente redirige a /empresas.
    server.use(http.get('/api/empresas/get-all', () => HttpResponse.json([])));

    renderWithRouter('/empresas/inexistente');

    await waitFor(() => expect(screen.getByText('Listado de empresas')).toBeInTheDocument(), {
      timeout: 3000,
    });
  });

  it('muestra un error general sin tratarlo como empresa inexistente', async () => {
    server.use(
      http.get('/api/empresas/get-all', () =>
        HttpResponse.json(
          { status: 500, error: 'INTERNAL_SERVER_ERROR', message: 'Boom' },
          { status: 500 },
        ),
      ),
    );

    renderWithRouter('/empresas/a1111111-aaaa-1111-aaaa-111111111111');

    await waitFor(() =>
      expect(screen.getByText('No fue posible cargar la empresa.')).toBeInTheDocument(),
    );
    expect(screen.getByRole('button', { name: /volver al listado/i })).toBeInTheDocument();
  });

  it('wraps a very long company name in the detail header', async () => {
    const longName = 'Empresa con un nombre extraordinariamente largo para validar el detalle';
    server.use(
      http.get('/api/empresas/get-all', () =>
        HttpResponse.json([
          {
            id: 'empresa-larga',
            nombre: longName,
            sector: null,
            telefono: null,
            paginaWeb: null,
            facebook: null,
            instagram: null,
            twitter: null,
            estadoRelacion: 'ACTIVO',
            responsableId: null,
            creadoPor: null,
            notas: null,
            creadoEn: '2026-01-20T11:00:00.000Z',
            actualizadoEn: '2026-04-12T15:22:00.000Z',
          },
        ]),
      ),
    );

    renderWithRouter('/empresas/empresa-larga');

    await waitFor(() => expect(screen.getByRole('heading', { name: longName })).toBeInTheDocument());
    expect(screen.getByRole('heading', { name: longName })).toHaveClass('[overflow-wrap:anywhere]');
  });
});
