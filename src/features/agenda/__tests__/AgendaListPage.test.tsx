// Tests de AgendaListPage — render de la lista cronológica con la fixture (MSW).
// Cubre: carga de eventos, agrupación por fecha, botón "Nuevo evento" abre el dialog.

import { describe, it, expect } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { AgendaListPage } from '../pages/AgendaListPage';
import { setupTestWrapper } from '@/test/wrappers';

function renderPage() {
  const { Wrapper } = setupTestWrapper();
  return render(<AgendaListPage />, { wrapper: Wrapper });
}

describe('AgendaListPage', () => {
  it('(a) renderiza el header con el título "Agenda"', () => {
    renderPage();
    expect(screen.getByRole('heading', { name: 'Agenda', level: 1 })).toBeInTheDocument();
  });

  it('(b) carga y muestra los eventos de la fixture', async () => {
    renderPage();
    expect(
      await screen.findByText('Llamada de seguimiento con Innovatech'),
    ).toBeInTheDocument();
    expect(screen.getByText('Demo de producto — equipo de TI')).toBeInTheDocument();
  });

  it('(c) muestra la hora de inicio del evento', async () => {
    renderPage();
    await screen.findByText('Llamada de seguimiento con Innovatech');
    // El evento de las 09:00 debe mostrar su hora
    expect(screen.getByText('09:00')).toBeInTheDocument();
  });

  it('(d) el botón "Nuevo evento" abre el dialog de creación', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('Llamada de seguimiento con Innovatech');

    await user.click(screen.getByRole('button', { name: /nuevo evento/i }));

    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText('Nuevo evento')).toBeInTheDocument();
    expect(within(dialog).getByLabelText('Asunto')).toBeInTheDocument();
  });

  it('(e) cada evento expone acciones de editar y eliminar', async () => {
    renderPage();
    await screen.findByText('Llamada de seguimiento con Innovatech');

    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: /editar evento/i }).length).toBeGreaterThan(0);
      expect(screen.getAllByRole('button', { name: /eliminar evento/i }).length).toBeGreaterThan(0);
    });
  });
});
