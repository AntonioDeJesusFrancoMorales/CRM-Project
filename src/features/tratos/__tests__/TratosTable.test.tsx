import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';

import { TratosTable } from '../components/TratosTable';
import type { Trato } from '@/api/types';

const trato: Trato = {
  id: 'd1111111-dddd-1111-dddd-111111111111',
  contactoId: 'c1',
  responsableId: 'u1',
  nombre: 'Trato Demo',
  valorEstimado: 1000,
  probabilidad: 50,
  fechaCierreEsperada: null,
  tipoContrato: 'SERVICIO',
  motivoPerdida: null,
  creadoEn: '2026-01-01T00:00:00.000Z',
  actualizadoEn: null,
};

function renderTable(props: Partial<React.ComponentProps<typeof TratosTable>> = {}) {
  return render(
    <MemoryRouter>
      <TratosTable tratos={[trato]} {...props} />
    </MemoryRouter>,
  );
}

describe('TratosTable — menú de acciones', () => {
  it('no muestra el menú de acciones si no se pasan onEdit/onDelete', () => {
    renderTable();
    expect(screen.queryByRole('button', { name: /acciones/i })).not.toBeInTheDocument();
  });

  it('muestra el kebab y dispara onEdit al elegir Editar', async () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    const user = userEvent.setup();
    renderTable({ onEdit, onDelete });

    await user.click(screen.getByRole('button', { name: /acciones/i }));
    await user.click(await screen.findByText('Editar'));

    expect(onEdit).toHaveBeenCalledWith(trato);
    expect(onDelete).not.toHaveBeenCalled();
  });

  it('dispara onDelete al elegir Eliminar', async () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    const user = userEvent.setup();
    renderTable({ onEdit, onDelete });

    await user.click(screen.getByRole('button', { name: /acciones/i }));
    await user.click(await screen.findByText('Eliminar'));

    expect(onDelete).toHaveBeenCalledWith(trato);
  });
});
