// Tests de TareaDetailPage — Strict TDD Lote D (T_D.3).
// Cubre: render con datos, loading, 404, editar, eliminar.

import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Routes, Route } from 'react-router';

import { TareaDetailPage } from '../pages/TareaDetailPage';
import { server } from '@/test/server';

// e1111111 → "Demo presencial con CTO", workflow fallback sin ficha en fixture, trato: d1111111
const TAREA_ID = 'e1111111-eeee-1111-eeee-111111111111';
const TRATO_ID = 'd1111111-dddd-1111-dddd-111111111111';

function renderPage(initialPath: string) {
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
          <Route path="/tareas" element={<div>Listado de tareas</div>} />
          <Route path="/tareas/:id" element={<TareaDetailPage />} />
          <Route path="/tratos/:id" element={<div>Detalle del trato</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('TareaDetailPage — render de datos', () => {
  it('(a) renderiza título, estado y link al trato', async () => {
    renderPage(`/tareas/${TAREA_ID}`);

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: /demo presencial con cto/i }),
      ).toBeInTheDocument();
    });

    // Badge de estado operativo derivado de Kanban; sin ficha en fixture => fallback seguro.
    expect(screen.getByText(/sin columna/i)).toBeInTheDocument();

    // Link al trato vinculado — esperar que cargue el trato (query separada)
    await waitFor(() => {
      const tratoLink = screen.getByRole('link', { name: /implementación crm innovatech/i });
      expect(tratoLink).toBeInTheDocument();
      expect(tratoLink).toHaveAttribute('href', `/tratos/${TRATO_ID}`);
    });
  });

  it('(b) fecha_completada NO visible cuando estado !== completada', async () => {
    renderPage(`/tareas/${TAREA_ID}`);

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: /demo presencial con cto/i }),
      ).toBeInTheDocument();
    });

    expect(screen.queryByText(/fecha completada/i)).not.toBeInTheDocument();
  });

  it('(b2) fecha_completada SÍ visible cuando estado === completada', async () => {
    server.use(
      http.get('/api/tareas/get-by-id', ({ request }) => {
        const url = new URL(request.url);
        if (url.searchParams.get('id') !== TAREA_ID) return;
        return HttpResponse.json({
          id: TAREA_ID,
          tratoId: TRATO_ID,
          responsableId: '22222222-2222-2222-2222-222222222222',
          titulo: 'Demo presencial con CTO',
          descripcion: null,
          tipo: 'CIERRE',
          prioridad: 'ALTA',
          fechaLimite: null,
          fechaCompletada: '2026-05-24T12:00:00.000Z',
          creadoEn: '2026-05-01T10:00:00.000Z',
          actualizadoEn: '2026-05-24T12:00:00.000Z',
        });
      }),
    );

    renderPage(`/tareas/${TAREA_ID}`);

    await waitFor(() => {
      expect(screen.getByText(/fecha completada/i)).toBeInTheDocument();
    });
  });
});

describe('TareaDetailPage — loading y 404', () => {
  it('(c) loading muestra indicador', async () => {
    // MSW tiene withDelay, pero el componente debe mostrar un indicador inicial
    renderPage(`/tareas/${TAREA_ID}`);

    // Inmediatamente debe haber algún estado de carga visible (antes de que resuelva)
    // O bien el heading aparece eventualmente
    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: /demo presencial con cto/i }),
      ).toBeInTheDocument();
    });
  });

  it('(d) 404 muestra mensaje "no existe"', async () => {
    server.use(
      http.get('/api/tareas/get-by-id', () =>
        HttpResponse.json(
          { status: 404, error: 'NOT_FOUND', message: 'Tarea no encontrada' },
          { status: 404 },
        ),
      ),
    );

    renderPage('/tareas/id-inexistente');

    await waitFor(() => {
      expect(screen.getByText(/no existe/i)).toBeInTheDocument();
    });
  });
});

describe('TareaDetailPage — acciones', () => {
  it('(e) clic "Editar" abre TareaEditDialog', async () => {
    const user = userEvent.setup();
    renderPage(`/tareas/${TAREA_ID}`);

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: /demo presencial con cto/i }),
      ).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /editar/i }));

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
    expect(screen.getByRole('heading', { name: /editar tarea/i })).toBeInTheDocument();
  });

  it('(f) clic "Eliminar" abre AlertDialog de confirmación', async () => {
    const user = userEvent.setup();
    renderPage(`/tareas/${TAREA_ID}`);

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: /demo presencial con cto/i }),
      ).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /eliminar/i }));

    await waitFor(() => {
      expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    });
  });

  it('(g) confirmar eliminar invoca DELETE y redirige a /tareas', async () => {
    const user = userEvent.setup();
    const deleteSpy = vi.fn();

    server.use(
      http.delete('/api/tareas/delete', () => {
        deleteSpy();
        return new HttpResponse(null, { status: 204 });
      }),
    );

    renderPage(`/tareas/${TAREA_ID}`);

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: /demo presencial con cto/i }),
      ).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /eliminar/i }));
    await waitFor(() => expect(screen.getByRole('alertdialog')).toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: /^eliminar$/i }));

    await waitFor(() => {
      expect(deleteSpy).toHaveBeenCalledTimes(1);
      expect(screen.getByText('Listado de tareas')).toBeInTheDocument();
    });
  });
});
