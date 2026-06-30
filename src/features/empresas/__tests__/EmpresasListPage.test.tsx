import { beforeEach, describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';

import { EmpresasListPage } from '../pages/EmpresasListPage';
import { setupTestWrapper } from '@/test/wrappers';
import { server } from '@/test/server';
import { empresasFixture } from '@/mocks/fixtures/empresas';

const PRESETS_STORAGE_KEY = 'crm:list-presets:empresas';

beforeEach(() => {
  localStorage.removeItem(PRESETS_STORAGE_KEY);
  vi.restoreAllMocks();
});

describe('EmpresasListPage', () => {
  it('renderiza la tabla con las empresas del fixture', async () => {
    const { Wrapper } = setupTestWrapper(['/empresas']);
    render(<EmpresasListPage />, { wrapper: Wrapper });

    await waitFor(() =>
      expect(screen.getByText('Innovatech Solutions')).toBeInTheDocument(),
    );
    expect(screen.getByText('Corporativo Maya')).toBeInTheDocument();
    expect(screen.getByText('Distribuidora del Sur')).toBeInTheDocument();
  });

  it('filtra las empresas con la búsqueda', async () => {
    const user = userEvent.setup();
    const { Wrapper } = setupTestWrapper(['/empresas']);
    render(<EmpresasListPage />, { wrapper: Wrapper });

    await waitFor(() =>
      expect(screen.getByText('Innovatech Solutions')).toBeInTheDocument(),
    );

    const input = screen.getByPlaceholderText(/buscar/i);
    await user.type(input, 'Maya');

    expect(screen.getByText('Corporativo Maya')).toBeInTheDocument();
    expect(screen.queryByText('Innovatech Solutions')).not.toBeInTheDocument();
    expect(screen.queryByText('Distribuidora del Sur')).not.toBeInTheDocument();
    expect(screen.getByText(/mostrando 1 de 3 empresas/i)).toBeInTheDocument();
  });

  it('filtra por estado y sector sin pedir datos al back nuevamente', async () => {
    const user = userEvent.setup();
    let requestCount = 0;
    let lastUrl = '';

    server.use(
      http.get('/api/empresas/get-all', ({ request }) => {
        requestCount++;
        lastUrl = request.url;
        return HttpResponse.json(empresasFixture);
      }),
    );

    const { Wrapper } = setupTestWrapper(['/empresas']);
    render(<EmpresasListPage />, { wrapper: Wrapper });

    await waitFor(() =>
      expect(screen.getByText('Innovatech Solutions')).toBeInTheDocument(),
    );
    const initialCount = requestCount;

    await user.click(screen.getByRole('combobox', { name: /estado/i }));
    await user.click(await screen.findByRole('option', { name: /prospecto/i }));

    await waitFor(() =>
      expect(screen.queryByText('Innovatech Solutions')).not.toBeInTheDocument(),
    );
    expect(screen.getByText('Corporativo Maya')).toBeInTheDocument();

    await user.click(screen.getByRole('combobox', { name: /sector/i }));
    await user.click(await screen.findByRole('option', { name: /consultoría/i }));

    expect(screen.getByText('Corporativo Maya')).toBeInTheDocument();
    expect(requestCount).toBe(initialCount);
    expect(new URL(lastUrl).search).toBe('');
  });

  it('guarda, aplica y elimina presets locales', async () => {
    const user = userEvent.setup();
    const { Wrapper } = setupTestWrapper(['/empresas']);
    render(<EmpresasListPage />, { wrapper: Wrapper });

    await waitFor(() =>
      expect(screen.getByText('Innovatech Solutions')).toBeInTheDocument(),
    );

    await user.type(screen.getByPlaceholderText(/buscar por nombre/i), 'maya');
    await waitFor(() =>
      expect(screen.queryByText('Innovatech Solutions')).not.toBeInTheDocument(),
    );
    expect(screen.getByText('Corporativo Maya')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /guardar vista/i }));
    const dialog = await screen.findByRole('dialog');
    await user.type(within(dialog).getByLabelText(/nombre de la vista/i), 'Vista Maya');
    await user.click(within(dialog).getByRole('button', { name: /guardar vista/i }));

    expect(localStorage.getItem(PRESETS_STORAGE_KEY)).toContain('Vista Maya');

    await user.click(screen.getByRole('button', { name: /limpiar filtros/i }));
    await waitFor(() =>
      expect(screen.getByText('Innovatech Solutions')).toBeInTheDocument(),
    );

    await user.click(screen.getByRole('combobox', { name: /vistas guardadas/i }));
    await user.click(await screen.findByRole('option', { name: /vista maya/i }));

    await waitFor(() =>
      expect(screen.queryByText('Innovatech Solutions')).not.toBeInTheDocument(),
    );
    expect(screen.getByText('Corporativo Maya')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /eliminar vista vista maya/i }));
    expect(localStorage.getItem(PRESETS_STORAGE_KEY)).toBe('[]');
  });

  it('storage corrupto de presets no rompe la página', async () => {
    localStorage.setItem(PRESETS_STORAGE_KEY, '{bad-json');
    const { Wrapper } = setupTestWrapper(['/empresas']);
    render(<EmpresasListPage />, { wrapper: Wrapper });

    await waitFor(() =>
      expect(screen.getByText('Innovatech Solutions')).toBeInTheDocument(),
    );
    expect(screen.getByRole('combobox', { name: /vistas guardadas/i })).toBeInTheDocument();
  });

  it('abre el diálogo de creación al hacer click en "Nueva empresa"', async () => {
    const user = userEvent.setup();
    const { Wrapper } = setupTestWrapper(['/empresas']);
    render(<EmpresasListPage />, { wrapper: Wrapper });

    await waitFor(() =>
      expect(screen.getByText('Innovatech Solutions')).toBeInTheDocument(),
    );

    await user.click(screen.getByRole('button', { name: /nueva empresa/i }));

    const dialog = await screen.findByRole('dialog');
    expect(
      within(dialog).getByRole('heading', { name: /nueva empresa/i }),
    ).toBeInTheDocument();
    expect(within(dialog).getByLabelText(/nombre/i)).toBeInTheDocument();
  });
});
