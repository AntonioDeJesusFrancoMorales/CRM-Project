// Tests de TareasTable — Strict TDD Lote D (T_D.1).
// Cubre: render de filas, título clickeable navega, estado inline con TareaEstadoMenu.

import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Routes, Route } from 'react-router';

import { TareasTable } from '../components/TareasTable';
import type { Tarea } from '@/api/types';

const TAREA_PENDIENTE: Tarea = {
  id: 'e1111111-eeee-1111-eeee-111111111111',
  tratoId: 'd1111111-dddd-1111-dddd-111111111111',
  responsableId: '22222222-2222-2222-2222-222222222222',
  titulo: 'Demo presencial con CTO',
  descripcion: null,
  tipo: 'CIERRE',
  prioridad: 'URGENTE',
  fechaLimite: '2026-05-28T00:00:00.000Z',
  fechaCompletada: null,
  creadoEn: '2026-05-01T10:00:00.000Z',
  actualizadoEn: '2026-05-01T10:00:00.000Z',
};

const TAREA_COMPLETADA: Tarea = {
  id: 'e3333333-eeee-3333-eeee-333333333333',
  tratoId: 'd2222222-dddd-2222-dddd-222222222222',
  responsableId: '11111111-1111-1111-1111-111111111111',
  titulo: 'Análisis de requerimientos inicial',
  descripcion: null,
  tipo: 'GENERAL',
  prioridad: 'BAJA',
  fechaLimite: '2026-05-10T00:00:00.000Z',
  fechaCompletada: '2026-05-09T14:00:00.000Z',
  creadoEn: '2026-04-25T09:00:00.000Z',
  actualizadoEn: '2026-05-09T14:00:00.000Z',
};

function renderTable(tareas: Tarea[]) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/tareas']}>
        <Routes>
          <Route
            path="/tareas"
            element={<TareasTable tareas={tareas} />}
          />
          <Route path="/tareas/:id" element={<div>Detalle de la tarea</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('TareasTable', () => {
  it('(a) renderiza filas con titulo y estado', () => {
    renderTable([TAREA_PENDIENTE, TAREA_COMPLETADA]);

    expect(screen.getByText('Demo presencial con CTO')).toBeInTheDocument();
    expect(screen.getByText('Análisis de requerimientos inicial')).toBeInTheDocument();
  });

  it('(b) título clickeable navega a /tareas/:id', async () => {
    const user = userEvent.setup();
    renderTable([TAREA_PENDIENTE]);

    const tituloBtn = screen.getByRole('button', { name: /demo presencial con cto/i });
    await user.click(tituloBtn);

    await waitFor(() => {
      expect(screen.getByText('Detalle de la tarea')).toBeInTheDocument();
    });
  });

  it('(c) muestra TareaEstadoMenu (botón de cambio de estado) por cada fila', async () => {
    renderTable([TAREA_PENDIENTE, TAREA_COMPLETADA]);

    // Dos botones de menú de estado (uno por fila)
    const menuBtns = screen.getAllByRole('button', { name: /cambiar estado de la tarea/i });
    expect(menuBtns).toHaveLength(2);
  });

  it('(d) muestra mensaje cuando no hay tareas', () => {
    renderTable([]);

    expect(screen.getByText(/no hay tareas/i)).toBeInTheDocument();
  });

  it('(e) renderiza la lista filtrada recibida desde la página', () => {
    renderTable([TAREA_COMPLETADA]);

    expect(screen.queryByText('Demo presencial con CTO')).not.toBeInTheDocument();
    expect(screen.getByText('Análisis de requerimientos inicial')).toBeInTheDocument();
  });
});
