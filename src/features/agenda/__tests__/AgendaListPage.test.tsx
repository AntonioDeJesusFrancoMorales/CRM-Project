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

  it('places "Recargar agenda" immediately before "Nuevo evento"', async () => {
    renderPage();
    await waitFor(() => {
      const refresh = screen.getByRole('button', { name: /recarg(?:ar|ando) agenda/i });
      const create = screen.getByRole('button', { name: 'Nuevo evento' });
      const actionButtons = within(refresh.parentElement!).getAllByRole('button');

      expect(actionButtons).toEqual([refresh, create]);
    });
  });

  it('(b) carga y muestra los eventos de la fixture', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByRole('tab', { name: /lista/i }));
    expect(
      await screen.findByText('Llamada de seguimiento con Innovatech'),
    ).toBeInTheDocument();
    expect(screen.getByText('Demo de producto — equipo de TI')).toBeInTheDocument();
  });

  it('(c) muestra la hora de inicio del evento', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByRole('tab', { name: /lista/i }));
    await screen.findByText('Llamada de seguimiento con Innovatech');
    // El evento de las 09:00 debe mostrar su hora
    expect(screen.getByText('09:00')).toBeInTheDocument();
  });

  it('(d) el botón "Nuevo evento" abre el dialog de creación', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: /nuevo evento/i }));

    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText('Nuevo evento')).toBeInTheDocument();
    expect(within(dialog).getByLabelText('Asunto')).toBeInTheDocument();
  });

  it('(e) cada evento expone acciones de editar y eliminar', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByRole('tab', { name: /lista/i }));
    await screen.findByText('Llamada de seguimiento con Innovatech');

    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: /editar evento/i }).length).toBeGreaterThan(0);
      expect(screen.getAllByRole('button', { name: /eliminar evento/i }).length).toBeGreaterThan(0);
    });
  });

  it('(f) permite alternar entre calendario y lista', async () => {
    const user = userEvent.setup();
    renderPage();

    expect(screen.getByRole('tab', { name: /calendario/i })).toHaveAttribute('data-state', 'active');
    await user.click(screen.getByRole('tab', { name: /lista/i }));
    expect(screen.getByRole('tab', { name: /lista/i })).toHaveAttribute('data-state', 'active');
    expect(await screen.findByText('Llamada de seguimiento con Innovatech')).toBeInTheDocument();
  });
});
