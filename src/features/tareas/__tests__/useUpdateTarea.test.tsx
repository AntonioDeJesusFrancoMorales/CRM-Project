import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';

import { useUpdateTarea } from '../hooks/useUpdateTarea';
import { tareasKeys } from '../hooks/useTareas';
import { setupTestWrapper } from '@/test/wrappers';
import { server } from '@/test/server';

const TAREA_ID = 'e1111111-eeee-1111-eeee-111111111111';

describe('useUpdateTarea', () => {
  it('PATCH /tareas/:id e invalida tareasKeys.all + tareasKeys.detail(id)', async () => {
    server.use(
      http.patch(`/api/v1/tareas/${TAREA_ID}`, async ({ request }) => {
        const body = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({
          id: TAREA_ID,
          titulo: body['titulo'] ?? 'Título actualizado',
          estado: body['estado'] ?? 'en_progreso',
          trato_id: 'd1111111-dddd-1111-dddd-111111111111',
          responsable_id: '22222222-2222-2222-2222-222222222222',
          tipo: 'llamada',
          prioridad: 2,
          descripcion: null,
          fecha_limite: null,
          fecha_completada: null,
          creado_en: '2026-05-01T10:00:00.000Z',
          actualizado_en: '2026-05-24T10:00:00.000Z',
        });
      }),
    );

    const { Wrapper, queryClient } = setupTestWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useUpdateTarea(), { wrapper: Wrapper });

    result.current.mutate({ id: TAREA_ID, data: { estado: 'en_progreso' } });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: tareasKeys.all });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: tareasKeys.detail(TAREA_ID) });
  });
});
