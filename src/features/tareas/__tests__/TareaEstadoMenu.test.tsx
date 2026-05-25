// ADR-050 — TareaEstadoMenu: DropdownMenu con 3 ítems siempre visibles, disabled-by-state.
// Tests RED (Strict TDD): verifican disabled por estado y que las mutaciones correctas se invocan.

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { TareaEstadoMenu } from '../components/TareaEstadoMenu';
import { server } from '@/test/server';
import type { Tarea } from '@/api/types';

const TAREA_PENDIENTE: Tarea = {
  id: 'e1111111-eeee-1111-eeee-111111111111',
  trato_id: 'd1111111-dddd-1111-dddd-111111111111',
  responsable_id: '22222222-2222-2222-2222-222222222222',
  titulo: 'Demo presencial con CTO',
  descripcion: null,
  tipo: 'demo',
  estado: 'pendiente',
  prioridad: 1,
  fecha_limite: null,
  fecha_completada: null,
  creado_en: '2026-05-01T10:00:00.000Z',
  actualizado_en: '2026-05-01T10:00:00.000Z',
};

const TAREA_EN_PROGRESO: Tarea = {
  ...TAREA_PENDIENTE,
  estado: 'en_progreso',
};

const TAREA_COMPLETADA: Tarea = {
  ...TAREA_PENDIENTE,
  estado: 'completada',
  fecha_completada: '2026-05-20T12:00:00.000Z',
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

describe('TareaEstadoMenu — invocación de mutations', () => {
  beforeEach(() => {
    // Handlers de éxito para las mutaciones
    server.use(
      http.patch(`/api/v1/tareas/${TAREA_PENDIENTE.id}`, async ({ request }) => {
        const body = await request.json() as Record<string, unknown>;
        return HttpResponse.json({
          ...TAREA_PENDIENTE,
          estado: body.estado ?? TAREA_PENDIENTE.estado,
        });
      }),
      http.patch(`/api/v1/tareas/${TAREA_PENDIENTE.id}/completar`, () => {
        return HttpResponse.json({
          ...TAREA_PENDIENTE,
          estado: 'completada',
          fecha_completada: '2026-05-24T12:00:00.000Z',
        });
      }),
    );
  });

  it('(d) clic "Iniciar" invoca PATCH /tareas/:id con { estado: "en_progreso" }', async () => {
    const user = userEvent.setup();
    const patchSpy = vi.fn();

    server.use(
      http.patch(`/api/v1/tareas/${TAREA_PENDIENTE.id}`, async ({ request }) => {
        const body = await request.json();
        patchSpy(body);
        return HttpResponse.json({ ...TAREA_PENDIENTE, estado: 'en_progreso' });
      }),
    );

    renderMenu(TAREA_PENDIENTE);
    await openMenu(user);

    await waitFor(() => expect(screen.getByRole('menuitem', { name: /iniciar/i })).toBeInTheDocument());
    await user.click(screen.getByRole('menuitem', { name: /iniciar/i }));

    await waitFor(() => {
      expect(patchSpy).toHaveBeenCalledWith(expect.objectContaining({ estado: 'en_progreso' }));
    });
  });

  it('(e) clic "Completar" invoca PATCH /tareas/:id/completar', async () => {
    const user = userEvent.setup();
    const completarSpy = vi.fn();

    server.use(
      http.patch(`/api/v1/tareas/${TAREA_PENDIENTE.id}/completar`, () => {
        completarSpy();
        return HttpResponse.json({
          ...TAREA_PENDIENTE,
          estado: 'completada',
          fecha_completada: '2026-05-24T12:00:00.000Z',
        });
      }),
    );

    renderMenu(TAREA_PENDIENTE);
    await openMenu(user);

    await waitFor(() => expect(screen.getByRole('menuitem', { name: /completar/i })).toBeInTheDocument());
    await user.click(screen.getByRole('menuitem', { name: /completar/i }));

    await waitFor(() => {
      expect(completarSpy).toHaveBeenCalledTimes(1);
    });
  });

  it('(f) clic "Reabrir" invoca PATCH /tareas/:id con { estado: "pendiente", fecha_completada: null }', async () => {
    const user = userEvent.setup();
    const patchSpy = vi.fn();

    server.use(
      http.patch(`/api/v1/tareas/${TAREA_COMPLETADA.id}`, async ({ request }) => {
        const body = await request.json();
        patchSpy(body);
        return HttpResponse.json({ ...TAREA_COMPLETADA, estado: 'pendiente', fecha_completada: null });
      }),
    );

    renderMenu(TAREA_COMPLETADA);
    await openMenu(user);

    await waitFor(() => expect(screen.getByRole('menuitem', { name: /reabrir/i })).toBeInTheDocument());
    await user.click(screen.getByRole('menuitem', { name: /reabrir/i }));

    await waitFor(() => {
      expect(patchSpy).toHaveBeenCalledWith(
        expect.objectContaining({ estado: 'pendiente', fecha_completada: null }),
      );
    });
  });
});
