import { beforeEach, describe, it, expect, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';

import type { Empresa } from '@/api/types';
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

    await waitFor(() => expect(screen.getByText('Innovatech Solutions')).toBeInTheDocument());
    expect(screen.getByText('Corporativo Maya')).toBeInTheDocument();
    expect(screen.getByText('Distribuidora del Sur')).toBeInTheDocument();
  });

  it('filtra las empresas con la búsqueda', async () => {
    const user = userEvent.setup();
    const { Wrapper } = setupTestWrapper(['/empresas']);
    render(<EmpresasListPage />, { wrapper: Wrapper });

    await waitFor(() => expect(screen.getByText('Innovatech Solutions')).toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: /mostrar filtros/i }));
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

    await waitFor(() => expect(screen.getByText('Innovatech Solutions')).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: /mostrar filtros/i }));
    const initialCount = requestCount;

    await user.click(screen.getByRole('combobox', { name: /estado/i }));
    await user.click(await screen.findByRole('option', { name: /prospecto/i }));

    await waitFor(() => expect(screen.queryByText('Innovatech Solutions')).not.toBeInTheDocument());
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

    await waitFor(() => expect(screen.getByText('Innovatech Solutions')).toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: /mostrar filtros/i }));
    await user.type(screen.getByPlaceholderText(/buscar por nombre/i), 'maya');
    await waitFor(() => expect(screen.queryByText('Innovatech Solutions')).not.toBeInTheDocument());
    expect(screen.getByText('Corporativo Maya')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /guardar vista/i }));
    const dialog = await screen.findByRole('dialog');
    await user.type(within(dialog).getByLabelText(/nombre de la vista/i), 'Vista Maya');
    await user.click(within(dialog).getByRole('button', { name: /guardar vista/i }));

    expect(localStorage.getItem(PRESETS_STORAGE_KEY)).toContain('Vista Maya');

    await user.click(screen.getByRole('button', { name: /limpiar filtros/i }));
    await waitFor(() => expect(screen.getByText('Innovatech Solutions')).toBeInTheDocument());

    await user.click(screen.getByRole('combobox', { name: /vistas guardadas/i }));
    await user.click(await screen.findByRole('option', { name: /vista maya/i }));

    await waitFor(() => expect(screen.queryByText('Innovatech Solutions')).not.toBeInTheDocument());
    expect(screen.getByText('Corporativo Maya')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /eliminar vista vista maya/i }));
    expect(localStorage.getItem(PRESETS_STORAGE_KEY)).toBe('[]');
  });

  it('storage corrupto de presets no rompe la página', async () => {
    const user = userEvent.setup();
    localStorage.setItem(PRESETS_STORAGE_KEY, '{bad-json');
    const { Wrapper } = setupTestWrapper(['/empresas']);
    render(<EmpresasListPage />, { wrapper: Wrapper });

    await waitFor(() => expect(screen.getByText('Innovatech Solutions')).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: /mostrar filtros/i }));
    expect(screen.getByRole('combobox', { name: /vistas guardadas/i })).toBeInTheDocument();
  });

  it('abre el diálogo de creación al hacer click en "Nueva empresa"', async () => {
    const user = userEvent.setup();
    const { Wrapper } = setupTestWrapper(['/empresas']);
    render(<EmpresasListPage />, { wrapper: Wrapper });

    await waitFor(() => expect(screen.getByText('Innovatech Solutions')).toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: /nueva empresa/i }));

    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByRole('heading', { name: /nueva empresa/i })).toBeInTheDocument();
    expect(within(dialog).getByLabelText(/nombre/i)).toBeInTheDocument();
  });

  it('blocks a duplicate company name before creating', async () => {
    const user = userEvent.setup();
    let postCount = 0;
    server.use(
      http.post('/api/empresas/create', () => {
        postCount += 1;
        return HttpResponse.json({}, { status: 201 });
      }),
    );

    const { Wrapper } = setupTestWrapper(['/empresas']);
    render(<EmpresasListPage />, { wrapper: Wrapper });

    await waitFor(() => expect(screen.getByText('Innovatech Solutions')).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: /nueva empresa/i }));

    const dialog = await screen.findByRole('dialog');
    await user.type(within(dialog).getByLabelText(/nombre/i), ' innovatech solutions ');
    await user.click(within(dialog).getByRole('button', { name: /crear empresa/i }));

    expect(await within(dialog).findByText('Ya existe una empresa con este nombre.')).toBeInTheDocument();
    expect(postCount).toBe(0);
  });

  it('allows only one synchronous submit and renders one created row', async () => {
    const user = userEvent.setup();
    const createdEmpresa: Empresa = {
      ...empresasFixture[0]!,
      id: 'empresa-race',
      nombre: 'Empresa de carrera',
    };
    const rows = [...empresasFixture];
    let postCount = 0;
    let releasePost!: () => void;
    const postPending = new Promise<void>((resolve) => {
      releasePost = resolve;
    });

    server.use(
      http.get('/api/empresas/get-all', () => HttpResponse.json(rows)),
      http.post('/api/empresas/create', async () => {
        postCount += 1;
        rows.push(createdEmpresa);
        await postPending;
        return HttpResponse.json(createdEmpresa, { status: 201 });
      }),
    );

    const { Wrapper } = setupTestWrapper(['/empresas']);
    render(<EmpresasListPage />, { wrapper: Wrapper });

    await waitFor(() => expect(screen.getByText('Innovatech Solutions')).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: /nueva empresa/i }));

    const dialog = await screen.findByRole('dialog');
    await user.type(within(dialog).getByLabelText(/nombre/i), createdEmpresa.nombre);
    const form = within(dialog)
      .getByRole('button', { name: /crear empresa/i })
      .closest('form');
    if (!form) throw new Error('Expected the submit button to belong to a form');

    act(() => {
      fireEvent.submit(form);
      fireEvent.submit(form);
    });

    await waitFor(() => expect(postCount).toBe(1));
    await waitFor(() =>
      expect(within(dialog).getByRole('button', { name: /guardando/i })).toBeDisabled(),
    );
    await user.click(within(dialog).getByRole('button', { name: /close/i }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    releasePost();
    await waitFor(() =>
      expect(screen.getAllByRole('button', { name: createdEmpresa.nombre })).toHaveLength(1),
    );
    expect(postCount).toBe(1);
  });

  it('blocks a duplicate name after a successful create from the updated cache', async () => {
    const user = userEvent.setup();
    const createdEmpresa: Empresa = {
      ...empresasFixture[0]!,
      id: 'empresa-cache-guard',
      nombre: 'Empresa protegida por cache',
    };
    const rows = [...empresasFixture];
    let postCount = 0;

    server.use(
      http.get('/api/empresas/get-all', () => HttpResponse.json(rows)),
      http.post('/api/empresas/create', () => {
        postCount += 1;
        rows.push(createdEmpresa);
        return HttpResponse.json(createdEmpresa, { status: 201 });
      }),
    );

    const { Wrapper } = setupTestWrapper(['/empresas']);
    render(<EmpresasListPage />, { wrapper: Wrapper });

    await waitFor(() => expect(screen.getByText('Innovatech Solutions')).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: /nueva empresa/i }));

    let dialog = await screen.findByRole('dialog');
    await user.type(within(dialog).getByLabelText(/nombre/i), createdEmpresa.nombre);
    await user.click(within(dialog).getByRole('button', { name: /crear empresa/i }));

    await waitFor(() => expect(postCount).toBe(1));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: /nueva empresa/i }));
    dialog = await screen.findByRole('dialog');
    await user.type(
      within(dialog).getByLabelText(/nombre/i),
      ` ${createdEmpresa.nombre.toUpperCase()} `,
    );
    await user.click(within(dialog).getByRole('button', { name: /crear empresa/i }));

    expect(await within(dialog).findByText('Ya existe una empresa con este nombre.')).toBeInTheDocument();
    expect(postCount).toBe(1);
  });

  it('shows the real refetch loading state on the Empresas refresh button', async () => {
    const user = userEvent.setup();
    let requestCount = 0;
    let releaseRefetch!: () => void;
    const refetchDone = new Promise<void>((resolve) => {
      releaseRefetch = resolve;
    });

    server.use(
      http.get('/api/empresas/get-all', async () => {
        requestCount += 1;
        if (requestCount > 2) await refetchDone;
        return HttpResponse.json(empresasFixture);
      }),
    );

    const { Wrapper } = setupTestWrapper(['/empresas']);
    render(<EmpresasListPage />, { wrapper: Wrapper });

    await waitFor(() => expect(screen.getByText('Innovatech Solutions')).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: /recargar empresas/i }));

    const refreshingButton = await screen.findByRole('button', { name: /recargando empresas/i });
    expect(refreshingButton).toBeDisabled();
    expect(refreshingButton).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByRole('status')).toHaveTextContent('Recargando empresas...');

    releaseRefetch();
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /recargar empresas/i })).toBeEnabled(),
    );
  });
});
