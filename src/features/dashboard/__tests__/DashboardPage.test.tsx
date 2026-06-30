import { describe, expect, it } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TooltipProvider } from '@/components/ui/tooltip';
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
});
