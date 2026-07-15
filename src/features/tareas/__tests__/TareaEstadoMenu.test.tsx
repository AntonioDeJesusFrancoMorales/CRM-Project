import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { TareaEstadoMenu } from '../components/TareaEstadoMenu';
import { TareaEstadoBadge } from '../components/TareaEstadoBadge';
import type { Tarea } from '@/api/types';
import type { ColumnaTablero } from '@/features/kanban/schemas/tablero.schema';

const mutateMock = vi.fn();

vi.mock('@/features/kanban/hooks/useMoverFicha', () => ({
  useMoverFicha: () => ({ mutate: mutateMock, isPending: false }),
}));

const TAREA: Tarea = {
  id: 'e1111111-eeee-1111-eeee-111111111111',
  tratoId: 'd1111111-dddd-1111-dddd-111111111111',
  responsableId: '22222222-2222-2222-2222-222222222222',
  titulo: 'Demo presencial con CTO',
  descripcion: null,
  tipo: 'CIERRE',
  prioridad: 'ALTA',
  fechaLimite: '2026-05-15T00:00:00.000Z',
  fechaCompletada: null,
  creadoEn: '2026-05-01T10:00:00.000Z',
  actualizadoEn: '2026-05-01T10:00:00.000Z',
};

const COLUMNAS: ColumnaTablero[] = [
  { id: 'col-pendiente', nombre: 'Pendiente', color: '#64748B', limiteWip: 5, nota: null, totalValorEstimado: 0 },
  { id: 'col-en-curso', nombre: 'En Curso', color: '#2563EB', limiteWip: 3, nota: null, totalValorEstimado: 0 },
  { id: 'col-finalizada', nombre: 'Finalizada', color: '#16A34A', limiteWip: 5, nota: null, totalValorEstimado: 0 },
];

const WORKFLOW = {
  tareaId: TAREA.id,
  fichaId: 'ficha-1',
  columnaId: 'col-pendiente',
  nombre: 'Pendiente',
  color: '#64748B',
};

async function openMenu(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: /cambiar estado de la tarea/i }));
}

describe('TareaEstadoMenu — Kanban workflow', () => {
  beforeEach(() => {
    mutateMock.mockClear();
    localStorage.clear();
  });

  it('lista columnas del tablero TAREAS como destinos de estado operativo', async () => {
    const user = userEvent.setup();
    render(
      <TareaEstadoMenu
        tarea={TAREA}
        workflowState={WORKFLOW}
        workflowColumns={COLUMNAS}
      />,
    );

    await openMenu(user);

    expect(screen.getByRole('menuitem', { name: /mover a pendiente/i })).toHaveAttribute('data-disabled');
    expect(screen.getByRole('menuitem', { name: /mover a en curso/i })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /mover a finalizada/i })).toBeInTheDocument();
  });

  it('mueve la ficha a la columna elegida y no escribe localStorage', async () => {
    const user = userEvent.setup();
    render(
      <TareaEstadoMenu
        tarea={TAREA}
        workflowState={WORKFLOW}
        workflowColumns={COLUMNAS}
      />,
    );

    await openMenu(user);
    await user.click(screen.getByRole('menuitem', { name: /mover a en curso/i }));

    expect(mutateMock).toHaveBeenCalledWith({ id: 'ficha-1', targetColumnaId: 'col-en-curso' });
    expect(localStorage.getItem(`tarea-estado-${TAREA.id}`)).toBeNull();
  });

  it('deshabilita destinos cuando la tarea no tiene ficha Kanban', async () => {
    const user = userEvent.setup();
    render(
      <TareaEstadoMenu
        tarea={TAREA}
        workflowState={{ ...WORKFLOW, fichaId: null, columnaId: null, nombre: 'Sin columna' }}
        workflowColumns={COLUMNAS}
      />,
    );

    await openMenu(user);

    expect(screen.getByRole('menuitem', { name: /mover a pendiente/i })).toHaveAttribute('data-disabled');
    expect(screen.getByRole('menuitem', { name: /mover a en curso/i })).toHaveAttribute('data-disabled');
  });
});

describe('TareaEstadoBadge — Kanban workflow', () => {
  it('muestra el nombre de la columna actual', () => {
    render(<TareaEstadoBadge workflowState={WORKFLOW} />);

    expect(screen.getByText('Pendiente')).toBeInTheDocument();
  });

  it('muestra fallback si no hay ficha o columna resuelta', () => {
    render(<TareaEstadoBadge />);

    expect(screen.getByText('Sin columna')).toBeInTheDocument();
  });
});
