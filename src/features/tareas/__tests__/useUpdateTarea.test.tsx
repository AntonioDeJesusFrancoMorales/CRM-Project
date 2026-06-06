import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';

import { useUpdateTarea } from '../hooks/useUpdateTarea';
import { tareasKeys } from '../hooks/useTareas';
import { setupTestWrapper } from '@/test/wrappers';
import { server } from '@/test/server';

const TAREA_ID = 'e1111111-eeee-1111-eeee-111111111111';

describe('useUpdateTarea', () => {
  it('PUT /tareas/edit?id= e invalida tareasKeys.all + tareasKeys.detail(id)', async () => {
    server.use(
      http.put('/api/tareas/edit', async ({ request }) => {
        const url = new URL(request.url);
        const id = url.searchParams.get('id');
        const body = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({
          id: id ?? TAREA_ID,
          titulo: body['titulo'] ?? 'Título actualizado',
          tratoId: 'd1111111-dddd-1111-dddd-111111111111',
          responsableId: '22222222-2222-2222-2222-222222222222',
          tipo: 'GENERAL',
          prioridad: 'MEDIA',
          descripcion: null,
          fechaLimite: '2026-06-01T00:00:00.000Z',
          fechaCompletada: null,
          creadoEn: '2026-05-01T10:00:00.000Z',
          actualizadoEn: '2026-05-24T10:00:00.000Z',
        });
      }),
    );

    const { Wrapper, queryClient } = setupTestWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useUpdateTarea(), { wrapper: Wrapper });

    result.current.mutate({
      id: TAREA_ID,
      data: {
        responsableId: '22222222-2222-2222-2222-222222222222',
        titulo: 'Título actualizado',
        tipo: 'GENERAL',
        prioridad: 'MEDIA',
        fechaLimite: '2026-06-01T00:00:00.000Z',
      },
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: tareasKeys.all });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: tareasKeys.detail(TAREA_ID) });
  });

  it('el body de update NO incluye estado ni tratoId', async () => {
    let capturedBody: Record<string, unknown> | null = null;

    server.use(
      http.put('/api/tareas/edit', async ({ request }) => {
        capturedBody = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({
          id: TAREA_ID,
          titulo: capturedBody['titulo'] ?? 'Actualizado',
          tratoId: 'd1111111-dddd-1111-dddd-111111111111',
          responsableId: '22222222-2222-2222-2222-222222222222',
          tipo: 'SEGUIMIENTO',
          prioridad: 'ALTA',
          descripcion: null,
          fechaLimite: '2026-06-01T00:00:00.000Z',
          fechaCompletada: null,
          creadoEn: '2026-05-01T10:00:00.000Z',
          actualizadoEn: '2026-05-24T10:00:00.000Z',
        });
      }),
    );

    const { Wrapper } = setupTestWrapper();
    const { result } = renderHook(() => useUpdateTarea(), { wrapper: Wrapper });

    result.current.mutate({
      id: TAREA_ID,
      data: {
        responsableId: '22222222-2222-2222-2222-222222222222',
        titulo: 'Tarea actualizada',
        tipo: 'SEGUIMIENTO',
        prioridad: 'ALTA',
        fechaLimite: '2026-06-01T00:00:00.000Z',
      },
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // El body NO debe incluir estado ni tratoId
    expect(capturedBody).not.toHaveProperty('estado');
    expect(capturedBody).not.toHaveProperty('tratoId');
    // Sí debe incluir los campos editables
    expect(capturedBody).toHaveProperty('titulo', 'Tarea actualizada');
    expect(capturedBody).toHaveProperty('tipo', 'SEGUIMIENTO');
    expect(capturedBody).toHaveProperty('prioridad', 'ALTA');
  });
});
