// ADR-049 — useCompletarTarea: DOBLE invalidación tareasKeys.all + tareasKeys.byTrato(trato_id).
// Verifica que PATCH /tareas/:id/completar se llama y que ambas keys son invalidadas.

import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';

import { useCompletarTarea } from '../hooks/useCompletarTarea';
import { tareasKeys } from '../hooks/useTareas';
import { setupTestWrapper } from '@/test/wrappers';
import { server } from '@/test/server';

const TAREA_ID = 'e1111111-eeee-1111-eeee-111111111111';
const TRATO_ID = 'd1111111-dddd-1111-dddd-111111111111';

describe('useCompletarTarea', () => {
  it('PATCH /tareas/:id/completar e invalida tareasKeys.all Y tareasKeys.byTrato(trato_id) — ADR-049', async () => {
    let endpointCalled: string | null = null;

    server.use(
      http.patch(`/api/v1/tareas/${TAREA_ID}/completar`, ({ request }) => {
        endpointCalled = request.url;
        return HttpResponse.json({
          id: TAREA_ID,
          trato_id: TRATO_ID,
          responsable_id: '22222222-2222-2222-2222-222222222222',
          titulo: 'Demo presencial con CTO',
          descripcion: null,
          tipo: 'demo',
          estado: 'completada',
          prioridad: 3,
          fecha_limite: '2026-05-15',
          fecha_completada: '2026-05-24T19:00:00.000Z',
          creado_en: '2026-05-01T10:00:00.000Z',
          actualizado_en: '2026-05-24T19:00:00.000Z',
        });
      }),
    );

    const { Wrapper, queryClient } = setupTestWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useCompletarTarea(), { wrapper: Wrapper });

    // Mutate recibe { tareaId, tratoId } para poder hacer doble invalidación
    result.current.mutate({ tareaId: TAREA_ID, tratoId: TRATO_ID });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Verificar que se llamó al endpoint correcto
    expect(endpointCalled).toContain(`/tareas/${TAREA_ID}/completar`);

    // ADR-049: DOBLE invalidación
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: tareasKeys.all });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: tareasKeys.byTrato(TRATO_ID) });

    // También verifica que la tarea completada tiene fecha_completada
    expect(result.current.data?.fecha_completada).not.toBeNull();
    expect(result.current.data?.estado).toBe('completada');
  });
});
