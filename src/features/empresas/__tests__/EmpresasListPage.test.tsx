import { describe, it, expect } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { EmpresasListPage } from '../pages/EmpresasListPage';
import { setupTestWrapper } from '@/test/wrappers';

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
