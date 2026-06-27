import { describe, expect, it, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { GlobalSearch } from '../components/GlobalSearch';

const navigateMock = vi.fn();

vi.mock('react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router')>();
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

vi.mock('@/features/empresas/hooks/useEmpresas', () => ({
  useEmpresas: () => ({ data: [{ id: 'emp-1', nombre: 'Comercial Ámbar', sector: 'Retail', telefono: null, paginaWeb: null, facebook: null, instagram: null, twitter: null, estadoRelacion: 'ACTIVO', responsableId: null, creadoPor: null, notas: null, creadoEn: '', actualizadoEn: '' }], isLoading: false, isError: false }),
}));

vi.mock('@/features/contactos/hooks/useContactos', () => ({
  useContactos: () => ({ data: [{ id: 'con-1', nombre: 'María Pérez', correo: 'maria@test.com', telefono: '555', empresaId: 'emp-1', estadoRelacion: 'PROSPECTO', cargo: 'Gerente', comoNosConocio: null, responsableId: null, creadoPor: null, creadoEn: '', actualizadoEn: '' }], isLoading: false, isError: false }),
}));

vi.mock('@/features/tratos/hooks/useTratos', () => ({
  useTratos: () => ({ data: [{ id: 'tra-1', contactoId: 'con-1', responsableId: 'usr-1', nombre: 'Renovación anual', valorEstimado: 1000, probabilidad: 70, fechaCierreEsperada: null, tipoContrato: 'SUSCRIPCION', estado: 'ABIERTO', motivoPerdida: null, creadoEn: '', actualizadoEn: null }], isLoading: false, isError: false }),
}));

vi.mock('@/features/tareas/hooks/useTareas', () => ({
  useTareas: () => ({ data: [{ id: 'tar-1', tratoId: 'tra-1', responsableId: 'usr-1', titulo: 'Llamar por seguimiento', descripcion: 'Confirmar demo', tipo: 'SEGUIMIENTO', prioridad: 'ALTA', fechaLimite: '', fechaCompletada: null, creadoEn: '', actualizadoEn: '' }], isLoading: false, isError: false }),
}));

function renderGlobalSearch() {
  return render(
    <MemoryRouter>
      <GlobalSearch />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  navigateMock.mockClear();
});

describe('GlobalSearch', () => {
  it('abre el diálogo al hacer click', async () => {
    const user = userEvent.setup();
    renderGlobalSearch();

    await user.click(screen.getByRole('button', { name: /abrir búsqueda global/i }));

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /búsqueda global/i })).toBeInTheDocument();
  });

  it('abre el diálogo con Ctrl+K', async () => {
    const user = userEvent.setup();
    renderGlobalSearch();

    await user.keyboard('{Control>}k{/Control}');

    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('muestra resultados agrupados al escribir', async () => {
    const user = userEvent.setup();
    renderGlobalSearch();

    await user.click(screen.getByRole('button', { name: /abrir búsqueda global/i }));
    await user.type(screen.getByLabelText(/buscar en todo pipely/i), 're');

    expect(screen.getByRole('region', { name: /empresas/i })).toBeInTheDocument();
    expect(screen.getByText('Comercial Ámbar')).toBeInTheDocument();
    expect(screen.getByText('Renovación anual')).toBeInTheDocument();
  });

  it('navega y cierra al seleccionar un resultado', async () => {
    const user = userEvent.setup();
    renderGlobalSearch();

    await user.click(screen.getByRole('button', { name: /abrir búsqueda global/i }));
    await user.type(screen.getByLabelText(/buscar en todo pipely/i), 'ambar');
    await user.click(screen.getByRole('button', { name: /comercial ámbar/i }));

    expect(navigateMock).toHaveBeenCalledWith('/empresas/emp-1');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('muestra empty state sin resultados', async () => {
    const user = userEvent.setup();
    renderGlobalSearch();

    await user.click(screen.getByRole('button', { name: /abrir búsqueda global/i }));
    await user.type(screen.getByLabelText(/buscar en todo pipely/i), 'zzzz');

    expect(screen.getByText(/no se encontraron resultados/i)).toBeInTheDocument();
  });
});
