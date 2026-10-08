import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { TooltipProvider } from '@/components/ui/tooltip';
import { server } from '@/test/server';
import { DashboardPage, normalizeProgress } from '../pages/DashboardPage';

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

  it('organiza el resumen comercial en KPIs, cartera, acciones, cierres, alertas y ranking', async () => {
    renderPage();

    await screen.findByRole('link', { name: /demo presencial con cto/i });

    expect(screen.getByText('Resumen ejecutivo')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Resumen comercial' })).toBeInTheDocument();
    expect(screen.getByText('Ganado este mes')).toBeInTheDocument();
    expect(screen.getByText('Conversión')).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Cartera comercial' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Próximas acciones' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /ver tareas/i })).toHaveAttribute(
      'href',
      '/tareas?tab=lista',
    );
    expect(screen.getByRole('heading', { name: 'Próximos cierres' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Alertas accionables' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Salud del CRM' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Ranking de agentes' })).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /exportar tratos/i })).toBeEnabled(),
    );
  });

  it('incluye links accionables a tareas y tratos', async () => {
    renderPage();

    const taskLink = await screen.findByRole('link', { name: /demo presencial con cto/i });
    expect(taskLink).toHaveAttribute('href', '/tareas/e1111111-eeee-1111-eeee-111111111111');

    const matchingLinks = await screen.findAllByRole('link', {
      name: /implementación crm innovatech/i,
    });
    expect(
      matchingLinks.some(
        (link) => link.getAttribute('href') === '/tratos/d1111111-dddd-1111-dddd-111111111111',
      ),
    ).toBe(true);
  });

  it('conserva el orden y los campos reales de los cierres y acciones', async () => {
    renderPage();

    const close = (
      await screen.findAllByRole('link', { name: /implementación crm innovatech/i })
    ).find((link) => link.getAttribute('href') === '/tratos/d1111111-dddd-1111-dddd-111111111111');
    expect(close).toBeDefined();
    if (!close) throw new Error('Expected the upcoming-close link');
    await waitFor(() => {
      expect(close).toHaveTextContent('Carlos');
      expect(close).toHaveTextContent('María González');
    });
    expect(close).toHaveAttribute('href', '/tratos/d1111111-dddd-1111-dddd-111111111111');
    expect(close).toHaveTextContent('Carlos');
    expect(close).toHaveTextContent('María González');
    expect(close).toHaveTextContent('70%');
    expect(close).toHaveTextContent('$250,000');

    await screen.findByRole('link', { name: /demo presencial con cto/i });
    const actionLinks = screen
      .getAllByRole('link')
      .filter((link) => link.getAttribute('href')?.startsWith('/tareas/'));
    expect(actionLinks.map((link) => link.getAttribute('href'))).toEqual([
      '/tareas/e1111111-eeee-1111-eeee-111111111111',
      '/tareas/e6666666-eeee-6666-eeee-666666666666',
      '/tareas/e2222222-eeee-2222-eeee-222222222222',
      '/tareas/e4444444-eeee-4444-eeee-444444444444',
      '/tareas/e5555555-eeee-5555-eeee-555555555555',
    ]);
  });

  it('expone ratios de progreso finitos y acotados sin tendencias', async () => {
    renderPage();

    await waitFor(() =>
      expect(screen.getAllByRole('progressbar').length).toBeGreaterThanOrEqual(4),
    );
    const progressbars = screen.getAllByRole('progressbar');
    for (const progressbar of progressbars) {
      const value = Number(progressbar.getAttribute('aria-valuenow'));
      expect(Number.isFinite(value)).toBe(true);
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(100);
      const width = Number(
        progressbar.firstElementChild?.getAttribute('style')?.match(/[\d.]+/)?.[0],
      );
      expect(Number.isFinite(width)).toBe(true);
      expect(width).toBeGreaterThanOrEqual(0);
      expect(width).toBeLessThanOrEqual(100);
    }
  });

  it.each([
    [-1, 100, 0],
    [120, 100, 100],
    [10, 0, 0],
    [Number.NaN, 100, 0],
    [Number.POSITIVE_INFINITY, 100, 0],
    [10, Number.NEGATIVE_INFINITY, 0],
  ])('normaliza %s/%s como %s', (numerator, denominator, expected) => {
    expect(normalizeProgress(numerator, denominator)).toBe(expected);
  });

  it('retiene controles con nombre y orden de lectura al navegar con teclado', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderPage();

    await screen.findByRole('link', { name: /demo presencial con cto/i });
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /exportar tratos/i })).toBeEnabled(),
    );
    const exportButton = screen.getByRole('button', { name: /exportar tratos/i });
    await user.tab();
    expect(exportButton).toHaveFocus();
    expect(screen.getAllByRole('heading').map((heading) => heading.textContent?.trim())).toEqual(
      expect.arrayContaining([
        'Resumen comercial',
        'Próximas acciones',
        'Próximos cierres',
        'Alertas accionables',
      ]),
    );
  });

  it('preserva el aviso parcial, el primer uso y la explicación del CSV deshabilitado', async () => {
    server.use(
      http.get('/api/tratos/get-all', () => HttpResponse.json([], { status: 500 })),
      http.get('/api/contactos/get-all', () => HttpResponse.json([])),
      http.get('/api/tareas/get-all', () => HttpResponse.json([])),
      http.get('/api/empresas/get-all', () => HttpResponse.json([])),
      http.get('/api/usuarios/get-all', () => HttpResponse.json([])),
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
