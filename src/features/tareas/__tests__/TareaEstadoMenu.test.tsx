// ADR-050 — TareaEstadoMenu: DropdownMenu con 3 ítems siempre visibles, disabled-by-state.
// Estado es client-only (localStorage). Los tests verifican disabled por estado
// y que los clics persisten el estado correcto en localStorage.

import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { TareaEstadoMenu } from '../components/TareaEstadoMenu';
import { getTareaEstado, setTareaEstado } from '../hooks/useTareaEstado';
import type { Tarea } from '@/api/types';

const TAREA_PENDIENTE: Tarea = {
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

const TAREA_EN_PROGRESO: Tarea = {
  ...TAREA_PENDIENTE,
  id: 'e2222222-eeee-2222-eeee-222222222222',
};

const TAREA_COMPLETADA: Tarea = {
  ...TAREA_PENDIENTE,
  id: 'e3333333-eeee-3333-eeee-333333333333',
  fechaCompletada: '2026-05-20T12:00:00.000Z',
};

function renderMenu(tarea: Tarea) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <TareaEstadoMenu tarea={tarea} />
    </QueryClientProvider>,
  );
}

async function openMenu(user: ReturnType<typeof userEvent.setup>) {
  const trigger = screen.getByRole('button', { name: /cambiar estado de la tarea/i });
  await user.click(trigger);
}

describe('TareaEstadoMenu — disabled-by-state', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('(a) estado pendiente: Iniciar habilitado, Completar habilitado, Reabrir deshabilitado', async () => {
    const user = userEvent.setup();
    renderMenu(TAREA_PENDIENTE);
    await openMenu(user);

    await waitFor(() => {
      expect(screen.getByRole('menuitem', { name: /iniciar/i })).not.toBeDisabled();
      expect(screen.getByRole('menuitem', { name: /completar/i })).not.toBeDisabled();
    });

    // Reabrir debe estar deshabilitado en pendiente
    const reabrir = screen.getByRole('menuitem', { name: /reabrir/i });
    expect(reabrir).toHaveAttribute('data-disabled');
  });

  it('(b) estado en_progreso: Iniciar deshabilitado, Completar habilitado, Reabrir deshabilitado', async () => {
    // Precargar estado en_progreso para este id
    setTareaEstado(TAREA_EN_PROGRESO.id, 'en_progreso');

    const user = userEvent.setup();
    renderMenu(TAREA_EN_PROGRESO);
    await openMenu(user);

    await waitFor(() => {
      expect(screen.getByRole('menuitem', { name: /completar/i })).not.toBeDisabled();
    });

    const iniciar = screen.getByRole('menuitem', { name: /iniciar/i });
    const reabrir = screen.getByRole('menuitem', { name: /reabrir/i });
    expect(iniciar).toHaveAttribute('data-disabled');
    expect(reabrir).toHaveAttribute('data-disabled');
  });

  it('(c) estado completada: Iniciar deshabilitado, Completar deshabilitado, Reabrir habilitado', async () => {
    // Precargar estado completada para este id
    setTareaEstado(TAREA_COMPLETADA.id, 'completada');

    const user = userEvent.setup();
    renderMenu(TAREA_COMPLETADA);
    await openMenu(user);

    await waitFor(() => {
      expect(screen.getByRole('menuitem', { name: /reabrir/i })).not.toBeDisabled();
    });

    const iniciar = screen.getByRole('menuitem', { name: /iniciar/i });
    const completar = screen.getByRole('menuitem', { name: /completar/i });
    expect(iniciar).toHaveAttribute('data-disabled');
    expect(completar).toHaveAttribute('data-disabled');
  });
});

describe('TareaEstadoMenu — persistencia en localStorage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('(d) clic "Iniciar" persiste estado "en_progreso" en localStorage', async () => {
    const user = userEvent.setup();
    renderMenu(TAREA_PENDIENTE);
    await openMenu(user);

    await waitFor(() => expect(screen.getByRole('menuitem', { name: /iniciar/i })).toBeInTheDocument());
    await user.click(screen.getByRole('menuitem', { name: /iniciar/i }));

    expect(getTareaEstado(TAREA_PENDIENTE.id)).toBe('en_progreso');
  });

  it('(e) clic "Completar" persiste estado "completada" en localStorage', async () => {
    const user = userEvent.setup();
    renderMenu(TAREA_PENDIENTE);
    await openMenu(user);

    await waitFor(() => expect(screen.getByRole('menuitem', { name: /completar/i })).toBeInTheDocument());
    await user.click(screen.getByRole('menuitem', { name: /completar/i }));

    expect(getTareaEstado(TAREA_PENDIENTE.id)).toBe('completada');
  });

  it('(f) clic "Reabrir" persiste estado "pendiente" en localStorage', async () => {
    setTareaEstado(TAREA_COMPLETADA.id, 'completada');

    const user = userEvent.setup();
    renderMenu(TAREA_COMPLETADA);
    await openMenu(user);

    await waitFor(() => expect(screen.getByRole('menuitem', { name: /reabrir/i })).toBeInTheDocument());
    await user.click(screen.getByRole('menuitem', { name: /reabrir/i }));

    expect(getTareaEstado(TAREA_COMPLETADA.id)).toBe('pendiente');
  });
});
