import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { TooltipProvider } from '@/components/ui/tooltip';
import { server } from '@/test/server';
import { DashboardPage } from '../pages/DashboardPage';

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <MemoryRouter initialEntries={['/']}>
          <DashboardPage />
        </MemoryRouter>
      </TooltipProvider>
    </QueryClientProvider>,
  );
}

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(new Date('2026-06-29T12:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renderiza el Inicio ejecutivo con KPIs y secciones accionables', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Pipeline abierto')).toBeInTheDocument();
    });

    expect(screen.getByText('Alertas accionables')).toBeInTheDocument();
    expect(screen.getByText('Próximas acciones')).toBeInTheDocument();
    expect(screen.getByText('Próximos cierres')).toBeInTheDocument();
    expect(screen.getByText('Salud del CRM')).toBeInTheDocument();
  });

  it('incluye links accionables a tareas y tratos', async () => {
    renderPage();

    const taskLink = await screen.findByRole('link', { name: /demo presencial con cto/i });
    expect(taskLink).toHaveAttribute('href', '/tareas/e1111111-eeee-1111-eeee-111111111111');

    const matchingLinks = await screen.findAllByRole('link', { name: /implementación crm innovatech/i });
    expect(matchingLinks.some((link) => link.getAttribute('href') === '/tratos/d1111111-dddd-1111-dddd-111111111111')).toBe(true);
  });

  it('preserva el aviso parcial, el primer uso y la explicación del CSV deshabilitado', async () => {
    server.use(
      http.get('/api/tratos/get-all', () => HttpResponse.json([], { status: 500 })),
      http.get('/api/contactos/get-all', () => HttpResponse.json([])),
      http.get('/api/tareas/get-all', () => HttpResponse.json([])),
      http.get('/api/empresas/get-all', () => HttpResponse.json([])),
      http.get('/api/usuarios/get-all', () => HttpResponse.json([])),
      http.get('/api/wa/conversaciones/csat-resumen', () =>
        HttpResponse.json({ promedio: null, total: 0 }),
      ),
    );
    renderPage();

    expect(
      await screen.findByText(/algunas métricas pueden estar incompletas/i),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /crea una empresa/i })).toHaveAttribute(
      'href',
      '/empresas',
    );
    expect(screen.getByRole('link', { name: /agrega contactos/i })).toHaveAttribute(
      'href',
      '/contactos',
    );
    expect(screen.getByRole('link', { name: /crea una oportunidad/i })).toHaveAttribute(
      'href',
      '/tratos',
    );
    expect(screen.getByRole('button', { name: /exportar tratos/i })).toBeDisabled();
  });
});
