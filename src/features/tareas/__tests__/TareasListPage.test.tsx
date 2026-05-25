// Tests de TareasListPage — Strict TDD Lote D (T_D.2).
// Cubre: render, filtros, búsqueda client-side, error, creación.
// DEUDA LOTE C: incluye test de submit COMPLETO (creación con payload correcto).

import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Routes, Route } from 'react-router';

import { TareasListPage } from '../pages/TareasListPage';
import { server } from '@/test/server';

function renderPage(initialPath = '/tareas') {
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
          <Route path="/tareas" element={<TareasListPage />} />
          <Route path="/tareas/:id" element={<div>Detalle de la tarea</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('TareasListPage — render y tabla', () => {
  it('(a) renderiza filas con tareas del fixture', async () => {
    renderPage();

    // El fixture tiene 7 tareas; comprobamos algunas
    await waitFor(() => {
      expect(screen.getByText('Demo presencial con CTO')).toBeInTheDocument();
    });
    expect(screen.getByText('Llamada de seguimiento post-demo')).toBeInTheDocument();
  });

  it('(b) título clickeable navega a /tareas/:id', async () => {
    const user = userEvent.setup();
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Demo presencial con CTO')).toBeInTheDocument();
    });

    const tituloBtn = screen.getByRole('button', { name: /demo presencial con cto/i });
    await user.click(tituloBtn);

    await waitFor(() => {
      expect(screen.getByText('Detalle de la tarea')).toBeInTheDocument();
    });
  });
});

describe('TareasListPage — filtros server-side', () => {
  it('(c) filtro estado pasa query param ?estado=completada', async () => {
    const user = userEvent.setup();
    let capturedUrl = '';

    server.use(
      http.get('/api/v1/tareas', ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json([]);
      }),
    );

    renderPage();

    // Esperar que cargue
    await waitFor(() => expect(capturedUrl).toContain('/api/v1/tareas'));

    // Cambiar filtro estado
    const selectEstado = screen.getByRole('combobox', { name: /estado/i });
    await user.click(selectEstado);
    const opcionCompletada = await screen.findByRole('option', { name: /completada/i });
    await user.click(opcionCompletada);

    await waitFor(() => {
      expect(capturedUrl).toContain('estado=completada');
    });
  });

  it('(d) filtro prioridad pasa query param ?prioridad=1', async () => {
    const user = userEvent.setup();
    let capturedUrl = '';

    server.use(
      http.get('/api/v1/tareas', ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json([]);
      }),
    );

    renderPage();

    await waitFor(() => expect(capturedUrl).toContain('/api/v1/tareas'));

    const selectPrioridad = screen.getByRole('combobox', { name: /prioridad/i });
    await user.click(selectPrioridad);
    const opcionAlta = await screen.findByRole('option', { name: /alta/i });
    await user.click(opcionAlta);

    await waitFor(() => {
      expect(capturedUrl).toContain('prioridad=1');
    });
  });

  it('(e) filtro responsable pasa query param ?responsable_id=...', async () => {
    const user = userEvent.setup();
    let capturedUrl = '';

    server.use(
      http.get('/api/v1/tareas', ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json([]);
      }),
    );

    renderPage();

    await waitFor(() => expect(capturedUrl).toContain('/api/v1/tareas'));

    const selectResponsable = screen.getByRole('combobox', { name: /responsable/i });
    await user.click(selectResponsable);
    // Esperamos a que carguen los usuarios (fixture) — el primer usuario del fixture es "Antonio Franco"
    const opcionAdmin = await screen.findByRole('option', { name: /antonio franco/i });
    await user.click(opcionAdmin);

    await waitFor(() => {
      expect(capturedUrl).toContain('responsable_id=');
    });
  });
});

describe('TareasListPage — búsqueda client-side', () => {
  it('(f) búsqueda por título filtra client-side', async () => {
    const user = userEvent.setup();
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Demo presencial con CTO')).toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText(/buscar por título/i);
    await user.type(input, 'llamada');

    await waitFor(() => {
      expect(screen.queryByText('Demo presencial con CTO')).not.toBeInTheDocument();
    });
    expect(screen.getByText('Llamada de seguimiento post-demo')).toBeInTheDocument();
  });
});

describe('TareasListPage — error y estados de carga', () => {
  it('(g) error 500 muestra mensaje y botón "Reintentar"', async () => {
    server.use(
      http.get('/api/v1/tareas', () =>
        HttpResponse.json(
          { status: 500, error: 'INTERNAL_SERVER_ERROR', message: 'Error interno' },
          { status: 500 },
        ),
      ),
    );

    renderPage();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /reintentar/i })).toBeInTheDocument();
    });
  });
});

describe('TareasListPage — creación (DEUDA LOTE C)', () => {
  it('(h) botón "Nueva tarea" abre TareaCreateDialog con Select de trato editable', async () => {
    const user = userEvent.setup();
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Demo presencial con CTO')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /nueva tarea/i }));

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
    expect(screen.getByRole('heading', { name: /nueva tarea/i })).toBeInTheDocument();

    // El Select de trato NO debe estar disabled (modo global = editable)
    await waitFor(() => {
      const selectTrato = screen.getByRole('combobox', { name: /trato/i });
      expect(selectTrato).not.toBeDisabled();
    });
  });

  it('(i) DEUDA LOTE C: submit completo de creación invoca POST con payload correcto', async () => {
    // Este test CIERRA la deuda pendiente del Lote C:
    // verifica que el submit llega al endpoint con los datos correctos.
    const user = userEvent.setup();
    const postSpy = vi.fn();

    server.use(
      http.post('/api/v1/tratos/:trato_id/tareas', async ({ request, params }) => {
        const body = await request.json();
        postSpy({ tratoId: params['trato_id'], body });
        return HttpResponse.json(
          {
            id: 'new-tarea-id',
            trato_id: params['trato_id'],
            ...(body as object),
            estado: 'pendiente',
            fecha_completada: null,
            creado_en: '2026-05-24T00:00:00.000Z',
            actualizado_en: '2026-05-24T00:00:00.000Z',
          },
          { status: 201 },
        );
      }),
    );

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Demo presencial con CTO')).toBeInTheDocument();
    });

    // Abrir dialog
    await user.click(screen.getByRole('button', { name: /nueva tarea/i }));
    await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());

    // Esperar que los Selects de datos carguen
    await waitFor(() => {
      const selectTrato = screen.getByRole('combobox', { name: /trato/i });
      expect(selectTrato).not.toBeDisabled();
    });

    // Seleccionar trato via fireEvent en el trigger (patrón MSW+Radix en JSDOM)
    const selectTrato = screen.getByRole('combobox', { name: /trato/i });
    await user.click(selectTrato);
    const tratoOption = await screen.findByRole('option', { name: /implementación crm innovatech/i });
    await user.click(tratoOption);

    // Completar título
    await user.type(screen.getByLabelText(/título/i), 'Demo con cliente');

    // Seleccionar tipo
    const selectTipo = screen.getByRole('combobox', { name: /tipo/i });
    await user.click(selectTipo);
    const tipoOption = await screen.findByRole('option', { name: /demo/i });
    await user.click(tipoOption);

    // Seleccionar prioridad
    const selectPrioridad = screen.getByRole('combobox', { name: /prioridad/i });
    await user.click(selectPrioridad);
    const prioridadOption = await screen.findByRole('option', { name: /alta/i });
    await user.click(prioridadOption);

    // Seleccionar responsable — el fixture tiene "Antonio Franco" como primer usuario
    await waitFor(() => {
      expect(screen.getByRole('combobox', { name: /responsable/i })).not.toBeDisabled();
    });
    const selectResponsable = screen.getByRole('combobox', { name: /responsable/i });
    await user.click(selectResponsable);
    const responsableOption = await screen.findByRole('option', { name: /antonio franco/i });
    await user.click(responsableOption);

    // Submit
    await user.click(screen.getByRole('button', { name: /crear tarea/i }));

    await waitFor(() => {
      expect(postSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          body: expect.objectContaining({
            titulo: 'Demo con cliente',
            tipo: 'demo',
            prioridad: 1,
          }),
        }),
      );
    });
  });
});
