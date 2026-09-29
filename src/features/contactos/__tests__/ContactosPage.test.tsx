import { beforeEach, describe, it, expect, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Routes, Route } from 'react-router';

import { ContactosPage } from '../pages/ContactosPage';
import { server } from '@/test/server';
import { contactosFixture } from '@/mocks/fixtures/contactos';

const PRESETS_STORAGE_KEY = 'crm:list-presets:contactos';

beforeEach(() => {
  localStorage.removeItem(PRESETS_STORAGE_KEY);
  vi.restoreAllMocks();
});

function renderWithRouter(initialPath: string = '/contactos') {
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
          <Route path="/contactos" element={<ContactosPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('ContactosPage', () => {
  it('muestra por defecto el tab PROSPECTO con sus contactos', async () => {
    renderWithRouter('/contactos');

    // Espera a que carguen los datos del fixture (solo nombre — no hay apellido)
    await waitFor(() => expect(screen.getByText('Lucía')).toBeInTheDocument());

    // Martín también es PROSPECTO
    expect(screen.getByText('Martín')).toBeInTheDocument();

    // Sofía y Diego son ACTIVO → no deben aparecer
    expect(screen.queryByText('Sofía')).not.toBeInTheDocument();
    expect(screen.queryByText('Diego Torres')).not.toBeInTheDocument();
  });

  it('cambia al tab ACTIVO y filtra correctamente', async () => {
    const user = userEvent.setup();
    renderWithRouter('/contactos');

    await waitFor(() => expect(screen.getByText('Lucía')).toBeInTheDocument());

    await user.click(screen.getByRole('tab', { name: 'Activo' }));

    await waitFor(() => expect(screen.getByText('Sofía')).toBeInTheDocument());

    // Dos contactos "Diego" en el fixture (ACTIVO) — usar getAllByText
    expect(screen.getAllByText('Diego').length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByText('Lucía')).not.toBeInTheDocument();
  });

  it('el tab state se sincroniza con ?tab= en la URL', async () => {
    const user = userEvent.setup();
    renderWithRouter('/contactos');

    await waitFor(() => expect(screen.getByText('Lucía')).toBeInTheDocument());

    // Cambiar al tab INACTIVO
    await user.click(screen.getByRole('tab', { name: 'Inactivo' }));

    await waitFor(() => expect(screen.getByText('Valeria')).toBeInTheDocument());

    // El tab INACTIVO debe estar activo (aria-selected)
    const tabInactivo = screen.getByRole('tab', { name: /inactivo/i });
    expect(tabInactivo).toHaveAttribute('data-state', 'active');
  });

  it('tab PROSPECTO sin datos muestra mensaje de vacío', async () => {
    server.use(http.get('/api/contactos/get-all', () => HttpResponse.json([])));

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, gcTime: 0 },
        mutations: { retry: false },
      },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/contactos']}>
          <Routes>
            <Route path="/contactos" element={<ContactosPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    await waitFor(() =>
      expect(screen.getByText(/no hay contactos que coincidan/i)).toBeInTheDocument(),
    );
  });

  it('el botón "Nuevo contacto" abre el diálogo de creación', async () => {
    const user = userEvent.setup();
    renderWithRouter('/contactos');

    await waitFor(() => expect(screen.getByText('Lucía')).toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: /nuevo contacto/i }));

    const dialog = await screen.findByRole('dialog');
    expect(dialog).toBeInTheDocument();
  });

  it('filtra contactos por empresa sin pedir datos al back nuevamente', async () => {
    const user = userEvent.setup();
    let requestCount = 0;
    let lastUrl = '';

    server.use(
      http.get('/api/contactos/get-all', ({ request }) => {
        requestCount++;
        lastUrl = request.url;
        return HttpResponse.json(contactosFixture);
      }),
    );

    renderWithRouter('/contactos');

    await waitFor(() => expect(screen.getByText('Lucía')).toBeInTheDocument());
    const initialCount = requestCount;

    await user.click(screen.getByRole('button', { name: /mostrar filtros/i }));
    await user.click(screen.getByRole('combobox', { name: /empresa/i }));
    await user.click(await screen.findByRole('option', { name: /corporativo maya/i }));

    await waitFor(() => expect(screen.queryByText('Lucía')).not.toBeInTheDocument());
    expect(screen.getByText('Martín')).toBeInTheDocument();
    expect(screen.getByText(/mostrando 1 de 8 contactos/i)).toBeInTheDocument();
    expect(requestCount).toBe(initialCount);
    expect(new URL(lastUrl).search).toBe('');
  });

  it('guarda, aplica y elimina presets locales', async () => {
    const user = userEvent.setup();
    renderWithRouter('/contactos');

    await waitFor(() => expect(screen.getByText('Lucía')).toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: /mostrar filtros/i }));
    await user.type(screen.getByPlaceholderText(/buscar por nombre/i), 'gerente');
    await waitFor(() => expect(screen.queryByText('Lucía')).not.toBeInTheDocument());
    expect(screen.getByText('Martín')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /guardar vista/i }));
    const dialog = await screen.findByRole('dialog');
    await user.type(within(dialog).getByLabelText(/nombre de la vista/i), 'Gerentes');
    await user.click(within(dialog).getByRole('button', { name: /guardar vista/i }));

    expect(localStorage.getItem(PRESETS_STORAGE_KEY)).toContain('Gerentes');

    await user.click(screen.getByRole('button', { name: /limpiar filtros/i }));
    await waitFor(() => expect(screen.getByText('Lucía')).toBeInTheDocument());

    await user.click(screen.getByRole('combobox', { name: /vistas guardadas/i }));
    await user.click(await screen.findByRole('option', { name: /gerentes/i }));

    await waitFor(() => expect(screen.queryByText('Lucía')).not.toBeInTheDocument());
    expect(screen.getByText('Martín')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /eliminar vista gerentes/i }));
    expect(localStorage.getItem(PRESETS_STORAGE_KEY)).toBe('[]');
  });

  it('storage corrupto de presets no rompe la página', async () => {
    const user = userEvent.setup();
    localStorage.setItem(PRESETS_STORAGE_KEY, '{bad-json');

    renderWithRouter('/contactos');

    await waitFor(() => expect(screen.getByText('Lucía')).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: /mostrar filtros/i }));
    expect(screen.getByRole('combobox', { name: /vistas guardadas/i })).toBeInTheDocument();
  });

  // W-02 — R3: error state debe mostrar botón "Reintentar" que dispara refetch
  it('estado de error muestra botón "Reintentar" que permite reintentar la carga', async () => {
    const user = userEvent.setup();

    server.use(
      http.get('/api/contactos/get-all', () =>
        HttpResponse.json(
          { status: 500, error: 'INTERNAL_SERVER_ERROR', message: 'Error' },
          { status: 500 },
        ),
      ),
    );

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, gcTime: 0 },
        mutations: { retry: false },
      },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/contactos']}>
          <Routes>
            <Route path="/contactos" element={<ContactosPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    // Esperar a que el error state sea visible
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /reintentar/i })).toBeInTheDocument(),
    );

    // El botón debe estar presente y ser clickeable
    const reintentarBtn = screen.getByRole('button', { name: /reintentar/i });
    expect(reintentarBtn).toBeInTheDocument();

    // Hacer click no debe lanzar excepción (aunque el endpoint siga fallando)
    await user.click(reintentarBtn);
  });

  it('muestra el estado real de recarga en el botón de Contactos', async () => {
    const user = userEvent.setup();
    let requestCount = 0;
    let releaseRefresh!: () => void;
    const refreshPending = new Promise<void>((resolve) => {
      releaseRefresh = resolve;
    });

    server.use(
      http.get('/api/contactos/get-all', async () => {
        requestCount += 1;
        if (requestCount > 2) await refreshPending;
        return HttpResponse.json(contactosFixture);
      }),
    );

    renderWithRouter('/contactos');
    await waitFor(() => expect(screen.getByText('Lucía')).toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: /recargar contactos/i }));

    const refreshingButton = await screen.findByRole('button', { name: /recargando contactos/i });
    expect(refreshingButton).toBeDisabled();
    expect(refreshingButton).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByRole('status')).toHaveTextContent('Recargando contactos...');

    releaseRefresh();
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /recargar contactos/i })).toBeEnabled(),
    );
  });

  it('envía una sola creación ante dos submits síncronos', async () => {
    const user = userEvent.setup();
    const rows = [...contactosFixture];
    const createdContact = {
      ...rows[0]!,
      id: 'contacto-race',
      nombre: 'Contacto de carrera',
      correo: 'carrera@example.com',
    };
    let postCount = 0;
    let releasePost!: () => void;
    const postPending = new Promise<void>((resolve) => {
      releasePost = resolve;
    });

    server.use(
      http.get('/api/contactos/get-all', () => HttpResponse.json(rows)),
      http.post('/api/contactos/create', async () => {
        postCount += 1;
        rows.push(createdContact);
        await postPending;
        return HttpResponse.json(createdContact, { status: 201 });
      }),
    );

    renderWithRouter('/contactos');
    await waitFor(() => expect(screen.getByText('Lucía')).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: /nuevo contacto/i }));

    const dialog = await screen.findByRole('dialog');
    await user.type(within(dialog).getByLabelText(/^nombre/i), createdContact.nombre);
    await user.click(within(dialog).getByRole('combobox', { name: 'Empresa' }));
    await user.click(await screen.findByRole('option', { name: /innovatech solutions/i }));

    const form = within(dialog)
      .getByRole('button', { name: /crear contacto/i })
      .closest('form');
    if (!form) throw new Error('Expected the submit button to belong to a form');

    act(() => {
      fireEvent.submit(form);
      fireEvent.submit(form);
    });

    await waitFor(() => expect(postCount).toBe(1));
    expect(within(dialog).getByRole('button', { name: /guardando/i })).toBeDisabled();

    await user.click(within(dialog).getByRole('button', { name: /close/i }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    releasePost();
    await waitFor(() => expect(screen.getByText(createdContact.nombre)).toBeInTheDocument());
    expect(postCount).toBe(1);
  });

  it('bloquea un nombre duplicado usando el caché actualizado después de crear', async () => {
    const user = userEvent.setup();
    const rows = [...contactosFixture];
    const createdContact = {
      ...rows[0]!,
      id: 'contacto-cache-guard',
      nombre: 'Contacto protegido por cache',
      correo: 'cache@example.com',
    };
    let postCount = 0;

    server.use(
      http.get('/api/contactos/get-all', () => HttpResponse.json(rows)),
      http.post('/api/contactos/create', () => {
        postCount += 1;
        rows.push(createdContact);
        return HttpResponse.json(createdContact, { status: 201 });
      }),
    );

    renderWithRouter('/contactos');
    await waitFor(() => expect(screen.getByText('Lucía')).toBeInTheDocument());

    async function submitContact(nombre: string) {
      await user.click(screen.getByRole('button', { name: /nuevo contacto/i }));
      const dialog = await screen.findByRole('dialog');
      await user.type(within(dialog).getByLabelText(/^nombre/i), nombre);
      await user.click(within(dialog).getByRole('combobox', { name: 'Empresa' }));
      await user.click(await screen.findByRole('option', { name: /innovatech solutions/i }));
      await user.click(within(dialog).getByRole('button', { name: /crear contacto/i }));
      return dialog;
    }

    await submitContact(createdContact.nombre);
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());

    const dialog = await submitContact(` ${createdContact.nombre.toUpperCase()} `);
    expect(await within(dialog).findByText('Ya existe un contacto con este nombre.')).toBeInTheDocument();
    expect(postCount).toBe(1);
  });
});
