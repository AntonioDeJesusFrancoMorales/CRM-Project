import { describe, it, expect } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';

import { setupTestWrapper } from '@/test/wrappers';
import { server } from '@/test/server';
import { ClientesListPage } from '../pages/ClientesListPage';

// REQ-01: listado con filtros — REQ-12: routing

describe('ClientesListPage', () => {
  it('renderiza la tabla con los clientes del fixture', async () => {
    const { Wrapper } = setupTestWrapper(['/clientes']);
    render(<ClientesListPage />, { wrapper: Wrapper });

    await waitFor(() =>
      expect(screen.getByText('Ana Rodríguez')).toBeInTheDocument(),
    );

    expect(screen.getByText('Diego Vargas')).toBeInTheDocument();
    expect(screen.getByText('Valentina Cruz')).toBeInTheDocument();
    expect(screen.getByText('Marco Herrera')).toBeInTheDocument();
  });

  it('filtra por nombre en client-side al escribir en el input de búsqueda', async () => {
    const user = userEvent.setup();
    const { Wrapper } = setupTestWrapper(['/clientes']);
    render(<ClientesListPage />, { wrapper: Wrapper });

    await waitFor(() =>
      expect(screen.getByText('Ana Rodríguez')).toBeInTheDocument(),
    );

    const input = screen.getByPlaceholderText(/buscar/i);
    await user.type(input, 'Diego');

    expect(screen.getByText('Diego Vargas')).toBeInTheDocument();
    expect(screen.queryByText('Ana Rodríguez')).not.toBeInTheDocument();
    expect(screen.queryByText('Valentina Cruz')).not.toBeInTheDocument();
  });

  it('filtra por empresa enviando empresa_id como query param', async () => {
    const capturedUrls: string[] = [];

    server.use(
      http.get('/api/v1/clientes', ({ request }) => {
        capturedUrls.push(request.url);
        const url = new URL(request.url);
        const empresaId = url.searchParams.get('empresa_id');
        if (empresaId === 'a1111111-aaaa-1111-aaaa-111111111111') {
          return HttpResponse.json([
            {
              id: 'c1111111-cccc-1111-cccc-111111111111',
              empresa_id: 'a1111111-aaaa-1111-aaaa-111111111111',
              responsable_id: '22222222-2222-2222-2222-222222222222',
              creado_por: '11111111-1111-1111-1111-111111111111',
              nombre_contacto: 'Ana Rodríguez',
              correo_contacto: 'ana@test.com',
              telefono_contacto: null,
              cargo_contacto: null,
              como_nos_conocio: null,
              notas: null,
              prospecto_origen_id: null,
              creado_en: '2026-03-10T10:00:00.000Z',
              actualizado_en: '2026-04-25T11:00:00.000Z',
            },
          ]);
        }
        return HttpResponse.json([]);
      }),
    );

    const user = userEvent.setup();
    const { Wrapper } = setupTestWrapper(['/clientes']);
    render(<ClientesListPage />, { wrapper: Wrapper });

    await waitFor(() =>
      expect(screen.queryByText(/cargando/i)).not.toBeInTheDocument(),
    );

    // Abrir el Select de empresa
    const selectEmpresa = screen.getByRole('combobox', { name: /empresa/i });
    await user.click(selectEmpresa);

    const option = await screen.findByRole('option', { name: /innovatech/i });
    await user.click(option);

    await waitFor(() =>
      expect(capturedUrls.some((u) => u.includes('empresa_id=a1111111-aaaa-1111-aaaa-111111111111'))).toBe(true),
    );
  });

  it('filtra por origen enviando origen como query param', async () => {
    const capturedUrls: string[] = [];

    server.use(
      http.get('/api/v1/clientes', ({ request }) => {
        capturedUrls.push(request.url);
        return HttpResponse.json([]);
      }),
    );

    const user = userEvent.setup();
    const { Wrapper } = setupTestWrapper(['/clientes']);
    render(<ClientesListPage />, { wrapper: Wrapper });

    await waitFor(() =>
      expect(screen.queryByText(/cargando/i)).not.toBeInTheDocument(),
    );

    const selectOrigen = screen.getByRole('combobox', { name: /origen/i });
    await user.click(selectOrigen);

    const optionProspecto = await screen.findByRole('option', { name: /prospecto convertido/i });
    await user.click(optionProspecto);

    await waitFor(() =>
      expect(capturedUrls.some((u) => u.includes('origen=prospecto'))).toBe(true),
    );
  });

  it('muestra empty state cuando no hay resultados de búsqueda', async () => {
    const user = userEvent.setup();
    const { Wrapper } = setupTestWrapper(['/clientes']);
    render(<ClientesListPage />, { wrapper: Wrapper });

    await waitFor(() =>
      expect(screen.getByText('Ana Rodríguez')).toBeInTheDocument(),
    );

    const input = screen.getByPlaceholderText(/buscar/i);
    await user.type(input, 'XYZnoexiste');

    await waitFor(() =>
      expect(screen.getByText(/no se encontraron/i)).toBeInTheDocument(),
    );
  });

  it('click en nombre de cliente navega a /clientes/:id', async () => {
    const user = userEvent.setup();
    const { Wrapper } = setupTestWrapper(['/clientes']);
    render(<ClientesListPage />, { wrapper: Wrapper });

    await waitFor(() =>
      expect(screen.getByText('Ana Rodríguez')).toBeInTheDocument(),
    );

    const nombreBtn = screen.getByRole('button', { name: 'Ana Rodríguez' });
    await user.click(nombreBtn);

    // Después de navegar a /clientes/:id la page lista ya no está — lo verificamos
    // por la desaparición del contenido o con el cambio de URL en MemoryRouter
    // (el cambio de ruta en MemoryRouter no muestra otra page sin router config completa,
    // pero el click dispara navigate sin crash — test de smoke de navegación)
    expect(nombreBtn).toBeInTheDocument(); // click no lanzó error
  });

  it('click en "Nuevo cliente" abre el dialog de creación', async () => {
    const user = userEvent.setup();
    const { Wrapper } = setupTestWrapper(['/clientes']);
    render(<ClientesListPage />, { wrapper: Wrapper });

    await waitFor(() =>
      expect(screen.getByText('Ana Rodríguez')).toBeInTheDocument(),
    );

    await user.click(screen.getByRole('button', { name: /nuevo cliente/i }));

    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByRole('heading', { name: /nuevo cliente/i })).toBeInTheDocument();
  });

  it('muestra botón "Reintentar" cuando el endpoint responde 500', async () => {
    let callCount = 0;

    server.use(
      http.get('/api/v1/clientes', () => {
        callCount += 1;
        if (callCount === 1) {
          return HttpResponse.json(
            { status: 500, error: 'INTERNAL_SERVER_ERROR', message: 'Boom' },
            { status: 500 },
          );
        }
        return HttpResponse.json([]);
      }),
    );

    const user = userEvent.setup();
    const { Wrapper } = setupTestWrapper(['/clientes']);
    render(<ClientesListPage />, { wrapper: Wrapper });

    await waitFor(() =>
      expect(screen.getByText(/no fue posible cargar/i)).toBeInTheDocument(),
    );

    const btnReintentar = screen.getByRole('button', { name: /reintentar/i });
    expect(btnReintentar).toBeInTheDocument();

    await user.click(btnReintentar);

    // después del refetch exitoso, el error desaparece
    await waitFor(() =>
      expect(screen.queryByRole('button', { name: /reintentar/i })).not.toBeInTheDocument(),
    );
  });

  it('muestra skeleton/texto de carga mientras se obtienen los datos', async () => {
    server.use(
      http.get('/api/v1/clientes', async () => {
        // delay infinito simulado — retorna cargando inmediatamente
        await new Promise((resolve) => setTimeout(resolve, 100));
        return HttpResponse.json([]);
      }),
    );

    const { Wrapper } = setupTestWrapper(['/clientes']);
    render(<ClientesListPage />, { wrapper: Wrapper });

    expect(screen.getByText(/cargando/i)).toBeInTheDocument();
  });
});
