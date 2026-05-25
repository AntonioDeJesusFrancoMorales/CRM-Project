import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';

import { useCreateTarea } from '../hooks/useCreateTarea';
import { tareasKeys } from '../hooks/useTareas';
import { setupTestWrapper } from '@/test/wrappers';
import { server } from '@/test/server';
import type { TareaCreateInput } from '../schemas/tarea.schema';

const TRATO_ID = 'd1111111-dddd-1111-dddd-111111111111';

describe('useCreateTarea', () => {
  it('POST a /tratos/:trato_id/tareas (trato_id en PATH) e invalida tareasKeys.all', async () => {
    let endpointCalled: string | null = null;
    let capturedBody: Record<string, unknown> | null = null;

    server.use(
      http.post(`/api/v1/tratos/${TRATO_ID}/tareas`, async ({ request }) => {
        endpointCalled = request.url;
        capturedBody = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json(
          {
            id: 'nueva-tarea-id',
            trato_id: TRATO_ID,
            responsable_id: capturedBody['responsable_id'],
            titulo: capturedBody['titulo'],
            descripcion: null,
            tipo: 'llamada',
            estado: 'pendiente',
            prioridad: 2,
            fecha_limite: null,
            fecha_completada: null,
            creado_en: '2026-05-24T00:00:00.000Z',
            actualizado_en: '2026-05-24T00:00:00.000Z',
          },
          { status: 201 },
        );
      }),
    );

    const { Wrapper, queryClient } = setupTestWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useCreateTarea(), { wrapper: Wrapper });

    const input: TareaCreateInput = {
      trato_id: TRATO_ID,
      responsable_id: '11111111-1111-1111-1111-111111111111',
      titulo: 'Demo con CTO',
      tipo: 'llamada',
      prioridad: 2,
      descripcion: null,
      fecha_limite: null,
    };

    result.current.mutate(input);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // trato_id va en el PATH, no en el body
    expect(endpointCalled).toContain(`/tratos/${TRATO_ID}/tareas`);
    expect(capturedBody).not.toHaveProperty('trato_id');
    expect(capturedBody!['titulo']).toBe('Demo con CTO');
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: tareasKeys.all });
  });
});
