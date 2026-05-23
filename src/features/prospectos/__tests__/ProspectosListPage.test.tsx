import { describe, it, expect } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { setupTestWrapper } from '@/test/wrappers';
import { ProspectosListPage } from '../pages/ProspectosListPage';

// REQ-PROS-LISTADO-001..003, REQ-PROS-FILTROS-001..004, REQ-CONV-TAB-001..004
// REQ-PROS-ROUTING-001

describe('ProspectosListPage', () => {
  it('renderiza el Kanban con los prospectos activos del fixture', async () => {
    const { Wrapper } = setupTestWrapper(['/prospectos']);
    render(<ProspectosListPage />, { wrapper: Wrapper });

    // Esperar a que cargue la lista
    await waitFor(() =>
      expect(screen.getByText('Carlos Méndez')).toBeInTheDocument(),
    );

    // Columnas del Kanban presentes (getAllByText porque el label puede coincidir con el Select inline)
    expect(screen.getAllByText('Frío').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Tibio').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Caliente').length).toBeGreaterThanOrEqual(1);

    // Prospectos activos visibles (no convertidos)
    expect(screen.getByText('Lucía Pérez')).toBeInTheDocument();
    expect(screen.getByText('Roberto Sánchez')).toBeInTheDocument();

    // Los prospectos convertidos NO aparecen en el Kanban activo
    expect(screen.queryByText('Valentina Cruz')).not.toBeInTheDocument();
    expect(screen.queryByText('Marco Herrera')).not.toBeInTheDocument();
  });

  it('filtra los prospectos con el campo de búsqueda', async () => {
    const user = userEvent.setup();
    const { Wrapper } = setupTestWrapper(['/prospectos']);
    render(<ProspectosListPage />, { wrapper: Wrapper });

    await waitFor(() =>
      expect(screen.getByText('Carlos Méndez')).toBeInTheDocument(),
    );

    // Buscar por nombre parcial
    const input = screen.getByPlaceholderText(/buscar/i);
    await user.type(input, 'Carlos');

    // Solo Carlos aparece en el Kanban
    expect(screen.getByText('Carlos Méndez')).toBeInTheDocument();
    expect(screen.queryByText('Lucía Pérez')).not.toBeInTheDocument();
    expect(screen.queryByText('Roberto Sánchez')).not.toBeInTheDocument();
  });

  it('muestra el tab Convertidos con Valentina Cruz en "este mes"', async () => {
    const user = userEvent.setup();
    const { Wrapper } = setupTestWrapper(['/prospectos']);
    render(<ProspectosListPage />, { wrapper: Wrapper });

    // Esperar carga inicial
    await waitFor(() =>
      expect(screen.getByText('Carlos Méndez')).toBeInTheDocument(),
    );

    // Cambiar al tab Convertidos
    const tabConvertidos = screen.getByRole('tab', { name: /convertidos/i });
    await user.click(tabConvertidos);

    // Sección "este mes" visible
    await waitFor(() =>
      expect(screen.getByText('Convertidos este mes')).toBeInTheDocument(),
    );

    // Valentina Cruz (convertida en mayo 2026 = este mes según el fixture y la fecha del test 2026-05-22)
    expect(screen.getByText('Valentina Cruz')).toBeInTheDocument();
  });

  it('abre el dialog "Nuevo prospecto" al hacer click en el botón', async () => {
    const user = userEvent.setup();
    const { Wrapper } = setupTestWrapper(['/prospectos']);
    render(<ProspectosListPage />, { wrapper: Wrapper });

    await waitFor(() =>
      expect(screen.getByText('Carlos Méndez')).toBeInTheDocument(),
    );

    await user.click(screen.getByRole('button', { name: /nuevo prospecto/i }));

    const dialog = await screen.findByRole('dialog');
    expect(
      within(dialog).getByRole('heading', { name: /nuevo prospecto/i }),
    ).toBeInTheDocument();
  });
});
