import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { render, screen } from '@testing-library/react';
import type { Tablero } from '@/features/kanban/schemas/tablero.schema';
import type { PermisoRecursoInput } from '../schemas/rol.schema';
import { PermissionMatrix } from '../components/PermissionMatrix';

const TABLEROS: Tablero[] = [
  {
    id: '11111111-1111-4111-8111-111111111111',
    nombre: 'Pipeline de Tratos',
    descripcion: null,
    tipoTablero: 'TRATOS',
    columnas: [],
    creadoEn: '2026-01-01T00:00:00',
  },
  {
    id: '22222222-2222-4222-8222-222222222222',
    nombre: 'Pipeline de Tareas',
    descripcion: null,
    tipoTablero: 'TAREAS',
    columnas: [],
    creadoEn: '2026-01-01T00:00:00',
  },
];

const UNKNOWN_ID = '99999999-9999-4999-8999-999999999999';

function boardPermission(idsPermitidos: string[] = []): PermisoRecursoInput {
  return {
    recurso: 'TABLERO',
    acciones: [],
    alcance: 'TABLEROS_PERMITIDOS',
    idsPermitidos,
    gruposLectura: [],
    gruposEscritura: [],
  };
}

interface MatrixQueryProps {
  tableros?: Tablero[];
  isLoading?: boolean;
  isError?: boolean;
  refetch?: () => Promise<unknown> | unknown;
}

function renderControlledMatrix(
  idsPermitidos: string[] = [],
  query: MatrixQueryProps = {},
) {
  const onChangeSpy = vi.fn();

  function Harness() {
    const [value, setValue] = useState<PermisoRecursoInput[]>([boardPermission(idsPermitidos)]);
    return (
      <PermissionMatrix
        value={value}
        onChange={(nextValue) => {
          onChangeSpy(nextValue);
          setValue(nextValue);
        }}
        tableros={TABLEROS}
        {...query}
      />
    );
  }

  render(<Harness />);
  return { onChangeSpy };
}

describe('PermissionMatrix — tableros permitidos', () => {
  it('renderiza nombres y tipos de tableros sin input de UUID', () => {
    renderControlledMatrix();

    const fieldset = screen.getByRole('group', { name: 'Tableros permitidos para Tableros' });
    expect(fieldset).toHaveTextContent('Pipeline de Tratos');
    expect(fieldset).toHaveTextContent('Pipeline de Tareas');
    expect(fieldset).toHaveTextContent('Tratos');
    expect(fieldset).toHaveTextContent('Tareas');
    expect(screen.queryByPlaceholderText(/uuid/i)).not.toBeInTheDocument();
  });

  it('agrega y quita el UUID al seleccionar y deseleccionar un tablero nombrado', async () => {
    const user = userEvent.setup();
    const { onChangeSpy } = renderControlledMatrix();
    const checkbox = screen.getByRole('checkbox', { name: 'Permitir tablero Pipeline de Tratos' });

    await user.click(checkbox);
    expect(checkbox).toBeChecked();
    expect(onChangeSpy.mock.lastCall?.[0]).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ recurso: 'TABLERO', idsPermitidos: [TABLEROS[0]!.id] }),
      ]),
    );

    await user.click(checkbox);
    expect(checkbox).not.toBeChecked();
    expect(onChangeSpy.mock.lastCall?.[0]).toEqual(
      expect.arrayContaining([expect.objectContaining({ recurso: 'TABLERO', idsPermitidos: [] })]),
    );
  });

  it('conserva un UUID seleccionado no disponible y permite quitarlo', async () => {
    const user = userEvent.setup();
    const { onChangeSpy } = renderControlledMatrix([UNKNOWN_ID]);

    expect(screen.getByText('Tablero seleccionado no disponible')).toBeInTheDocument();
    const checkbox = screen.getByRole('checkbox', {
      name: `Permitir tablero seleccionado no disponible ${UNKNOWN_ID}`,
    });
    expect(checkbox).toBeChecked();

    await user.click(checkbox);

    expect(checkbox).not.toBeChecked();
    expect(onChangeSpy.mock.lastCall?.[0]).toEqual(
      expect.arrayContaining([expect.objectContaining({ recurso: 'TABLERO', idsPermitidos: [] })]),
    );
  });

  it('expone el estado de carga', () => {
    renderControlledMatrix([], { isLoading: true });
    expect(screen.getByRole('status')).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByRole('status')).toHaveTextContent('Cargando tableros…');
  });

  it('expone el error y permite reintentar', async () => {
    const refetch = vi.fn();
    renderControlledMatrix([UNKNOWN_ID], { isError: true, refetch });
    expect(screen.getByRole('alert')).toHaveTextContent('No fue posible cargar los tableros.');
    expect(
      screen.getByRole('checkbox', {
        name: `Permitir tablero seleccionado no disponible ${UNKNOWN_ID}`,
      }),
    ).toBeChecked();
    await userEvent.setup().click(screen.getByRole('button', { name: 'Reintentar' }));
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it('expone el estado de lista vacía', () => {
    renderControlledMatrix([], { tableros: [] });
    expect(screen.getByText('No hay tableros disponibles')).toBeInTheDocument();
  });

  it('respeta disabled en los checkboxes y en el reintento', () => {
    const refetch = vi.fn();
    render(
      <PermissionMatrix
        value={[boardPermission()]}
        onChange={vi.fn()}
        tableros={TABLEROS}
        isError
        refetch={refetch}
        disabled
      />,
    );

    expect(screen.getByRole('checkbox', { name: 'Permitir tablero Pipeline de Tratos' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeDisabled();
  });
});
