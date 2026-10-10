/**
 * Tests de componente para RolesTable.
 * Cubre: renderizado de filas, filtro por nombre, empty state, dropdown de acciones.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Rol } from '@/api/types';
import { RolesTable } from '../components/RolesTable';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const roles: Rol[] = [
  {
    id: 'rol-admin-uuid-1111-111111111111',
    nombre: 'Administrador',
    descripcion: 'Acceso total al sistema',
    activo: true,
    permisos: [],
  },
  {
    id: 'rol-user-uuid-2222-222222222222',
    nombre: 'Usuario',
    descripcion: 'Acceso estándar de ventas',
    activo: true,
    permisos: [],
  },
];

// ── Helper ────────────────────────────────────────────────────────────────────

function renderTable(
  overrideRoles: Rol[] = roles,
  onEdit = vi.fn(),
  onDelete = vi.fn(),
) {
  return render(
    <RolesTable roles={overrideRoles} onEdit={onEdit} onDelete={onDelete} />,
  );
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('RolesTable', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renderiza las filas con los roles pasados por props', () => {
    renderTable();
    expect(screen.getByText('Administrador')).toBeInTheDocument();
    expect(screen.getByText('Usuario')).toBeInTheDocument();
  });

  it('el input de búsqueda filtra por nombre', async () => {
    const user = userEvent.setup();
    renderTable();

    const input = screen.getByPlaceholderText(/buscar por nombre/i);
    await user.type(input, 'admin');

    expect(screen.getByText('Administrador')).toBeInTheDocument();
    expect(screen.queryByText('Usuario')).not.toBeInTheDocument();
  });

  it('muestra empty state cuando no hay match en la búsqueda', async () => {
    const user = userEvent.setup();
    renderTable();

    const input = screen.getByPlaceholderText(/buscar por nombre/i);
    await user.type(input, 'xxxxxxxxxxx');

    expect(
      screen.getByText('No se encontraron roles con esos filtros'),
    ).toBeInTheDocument();
  });

  it('el dropdown de acciones tiene "Editar" y "Eliminar"', async () => {
    const user = userEvent.setup();
    renderTable();

    // Abre el dropdown de la primera fila
    const actionButtons = screen.getAllByRole('button', { name: /acciones/i });
    await user.click(actionButtons[0]!);

    expect(await screen.findByRole('menuitem', { name: /^editar$/i })).toBeInTheDocument();
    expect(await screen.findByRole('menuitem', { name: /^eliminar$/i })).toBeInTheDocument();
  });

  it('"Editar" llama onEdit con el rol correcto', async () => {
    const onEdit = vi.fn();
    const user = userEvent.setup();
    renderTable(roles, onEdit);

    const actionButtons = screen.getAllByRole('button', { name: /acciones/i });
    await user.click(actionButtons[0]!);

    const editarItem = await screen.findByRole('menuitem', { name: /^editar$/i });
    await user.click(editarItem);

    expect(onEdit).toHaveBeenCalledOnce();
    expect(onEdit).toHaveBeenCalledWith(roles[0]);
  });

  it('"Eliminar" llama onDelete con el rol correcto', async () => {
    const onDelete = vi.fn();
    const user = userEvent.setup();
    renderTable(roles, vi.fn(), onDelete);

    const actionButtons = screen.getAllByRole('button', { name: /acciones/i });
    await user.click(actionButtons[0]!);

    const eliminarItem = await screen.findByRole('menuitem', { name: /^eliminar$/i });
    await user.click(eliminarItem);

    expect(onDelete).toHaveBeenCalledOnce();
    expect(onDelete).toHaveBeenCalledWith(roles[0]);
  });

  it('muestra empty state cuando se pasa roles=[]', () => {
    renderTable([]);
    expect(
      screen.getByText('No se encontraron roles con esos filtros'),
    ).toBeInTheDocument();
  });
});
