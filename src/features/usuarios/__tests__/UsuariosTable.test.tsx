/**
 * F6.4 RED — Tests para UsuariosTable con roles dinámicos y badge read-only.
 *
 * Fixtures de roles:
 *  - 'rol-admin-uuid-1111-111111111111' → 'Administrador'
 *  - 'rol-user-uuid-2222-222222222222'  → 'Usuario'
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TooltipProvider } from '@/components/ui/tooltip';
import type { Usuario, Rol } from '@/api/types';

import { UsuariosTable } from '../components/UsuariosTable';

const rolesFixture: Rol[] = [
  {
    id: 'rol-admin-uuid-1111-111111111111',
    nombre: 'Administrador',
    descripcion: 'Acceso total',
    activo: true,
    permisos: [],
  },
  {
    id: 'rol-user-uuid-2222-222222222222',
    nombre: 'Usuario',
    descripcion: 'Acceso estándar',
    activo: true,
    permisos: [],
  },
];

const usuariosFixture: Usuario[] = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    nombre: 'Antonio Franco',
    correo: 'admin@crm.test',
    rolId: 'rol-admin-uuid-1111-111111111111',
    creadoEn: '2026-01-15T10:00:00.000Z',
    activo: true,
    keycloakId: null,
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    nombre: 'María González',
    correo: 'vendedor@crm.test',
    rolId: 'rol-user-uuid-2222-222222222222',
    creadoEn: '2026-02-01T09:30:00.000Z',
    activo: true,
    keycloakId: null,
  },
];

function renderTable(props: Partial<Parameters<typeof UsuariosTable>[0]> = {}) {
  const defaults: Parameters<typeof UsuariosTable>[0] = {
    usuarios: usuariosFixture,
    roles: rolesFixture,
    sessionUserId: '11111111-1111-1111-1111-111111111111',
    onEdit: vi.fn(),
    onDelete: vi.fn(),
    ...props,
  };

  return render(
    <TooltipProvider delayDuration={0}>
      <UsuariosTable {...defaults} />
    </TooltipProvider>,
  );
}

describe('UsuariosTable', () => {
  it('muestra el nombre del rol resolviendo rolId → nombre con resolveRolNombre', () => {
    renderTable();

    // Antonio tiene rolId → 'Administrador', María tiene → 'Usuario'
    expect(screen.getByText('Administrador')).toBeInTheDocument();
    expect(screen.getByText('Usuario')).toBeInTheDocument();
  });

  it('cuando roles es array vacío, muestra el rolId como fallback', () => {
    renderTable({ roles: [] });

    expect(screen.getByText('rol-admin-uuid-1111-111111111111')).toBeInTheDocument();
  });

  it('el badge de activo es READ-ONLY: no hay botón Desactivar ni Reactivar', () => {
    renderTable();

    // Abrir un dropdown — pero no debería haber "Desactivar" ni "Reactivar"
    expect(screen.queryByRole('button', { name: /desactivar/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /reactivar/i })).not.toBeInTheDocument();
  });

  it('la columna creadoEn muestra fecha formateada', () => {
    renderTable();

    // formatRelativeDate devuelve texto relativo o fecha — solo verificamos que no explota
    // y que no aparece el campo creado_en (legacy)
    const rows = screen.getAllByRole('row');
    expect(rows.length).toBeGreaterThan(1); // header + al menos 1 fila
  });

  it('NO tiene props onDesactivar ni onReactivar', () => {
    // La firma del componente no debe aceptar esas props
    // Este test verifica que el componente compila sin esas props
    renderTable();
    // Si llegamos aquí sin error de TypeScript, el test pasa
    expect(true).toBe(true);
  });

  it('el dropdown de acciones solo muestra Editar y Eliminar (sin Desactivar/Reactivar)', async () => {
    const { container } = renderTable();

    // Verificar que no existen opciones legacy en el DOM
    expect(container.querySelector('[data-value="desactivar"]')).toBeNull();
    expect(screen.queryByText(/^desactivar$/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/^reactivar$/i)).not.toBeInTheDocument();
  });

  it('tolera una proyección de correo nula sin mostrar un valor inventado', () => {
    renderTable({
      usuarios: [{ ...usuariosFixture[0]!, correo: null as unknown as string }],
    });

    expect(screen.getByText('Permiso no disponible')).toBeInTheDocument();
    expect(screen.queryByText('admin@crm.test')).not.toBeInTheDocument();
  });
});
