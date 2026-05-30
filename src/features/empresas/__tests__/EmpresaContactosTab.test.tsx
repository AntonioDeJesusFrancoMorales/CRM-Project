import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { setupTestWrapper } from '@/test/wrappers';
import { EmpresaContactosTab } from '../components/EmpresaContactosTab';

// Empresa Innovatech Solutions tiene 2 contactos en contactosFixture:
//   c0111111 — Lucía (PROSPECTO)
//   c0333333 — Sofía (ACTIVO)
// Empresa Corporativo Maya (a2222222) tiene:
//   c0222222 — Martín (PROSPECTO)
//   b1111111 — Carlos (INACTIVO)

const EMPRESA_ID = 'a1111111-aaaa-1111-aaaa-111111111111';
const OTRA_EMPRESA_ID = 'a2222222-aaaa-2222-aaaa-222222222222';

describe('EmpresaContactosTab', () => {
  it('muestra los contactos filtrados por empresaId', async () => {
    const { Wrapper } = setupTestWrapper();
    render(<EmpresaContactosTab empresaId={EMPRESA_ID} />, { wrapper: Wrapper });

    await waitFor(() =>
      expect(screen.getByText('Lucía')).toBeInTheDocument(),
    );
    expect(screen.getByText('Sofía')).toBeInTheDocument();
  });

  it('no muestra contactos de otra empresa', async () => {
    const { Wrapper } = setupTestWrapper();
    render(<EmpresaContactosTab empresaId={EMPRESA_ID} />, { wrapper: Wrapper });

    await waitFor(() =>
      expect(screen.getByText('Lucía')).toBeInTheDocument(),
    );

    // Martín es de a2222222, no debe aparecer
    expect(screen.queryByText('Martín')).not.toBeInTheDocument();
  });

  it('muestra estadoRelacion como badge', async () => {
    const { Wrapper } = setupTestWrapper();
    render(<EmpresaContactosTab empresaId={EMPRESA_ID} />, { wrapper: Wrapper });

    await waitFor(() =>
      expect(screen.getByText('Lucía')).toBeInTheDocument(),
    );

    // Lucía es PROSPECTO, Sofía y Ana son ACTIVO
    expect(screen.getAllByText('Prospecto').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Activo').length).toBeGreaterThanOrEqual(1);
  });

  it('muestra mensaje cuando la empresa no tiene contactos', async () => {
    const { Wrapper } = setupTestWrapper();
    // Empresa sin contactos en la fixture
    render(
      <EmpresaContactosTab empresaId="a9999999-aaaa-9999-aaaa-999999999999" />,
      { wrapper: Wrapper },
    );

    await waitFor(() =>
      expect(
        screen.getByText(/no tiene contactos vinculados/i),
      ).toBeInTheDocument(),
    );
  });

  it('los nombres enlazan a /contactos/:id', async () => {
    const { Wrapper } = setupTestWrapper();
    render(<EmpresaContactosTab empresaId={EMPRESA_ID} />, { wrapper: Wrapper });

    await waitFor(() =>
      expect(screen.getByText('Lucía')).toBeInTheDocument(),
    );

    const link = screen.getByRole('link', { name: 'Lucía' });
    expect(link).toHaveAttribute('href', '/contactos/c0111111-cccc-0001-cccc-000000000001');
  });

  it('no muestra nada de la otra empresa cuando se filtra correctamente', async () => {
    const { Wrapper } = setupTestWrapper();
    render(<EmpresaContactosTab empresaId={OTRA_EMPRESA_ID} />, { wrapper: Wrapper });

    await waitFor(() =>
      expect(screen.getByText('Martín')).toBeInTheDocument(),
    );
    expect(screen.getByText('Carlos')).toBeInTheDocument();

    // Los contactos de Innovatech no deben aparecer
    expect(screen.queryByText('Lucía')).not.toBeInTheDocument();
    expect(screen.queryByText('Sofía')).not.toBeInTheDocument();
  });
});
