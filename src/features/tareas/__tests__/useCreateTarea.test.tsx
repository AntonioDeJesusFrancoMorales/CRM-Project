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
  it('POST a /tareas/create con enums del back (tratoId en body) e invalida tareasKeys.all', async () => {
    let capturedBody: Record<string, unknown> | null = null;

    server.use(
      http.post('/api/tareas/create', async ({ request }) => {
        capturedBody = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json(
          {
            id: 'nueva-tarea-id',
            tratoId: capturedBody['tratoId'],
            responsableId: capturedBody['responsableId'],
            titulo: capturedBody['titulo'],
            descripcion: null,
            tipo: 'GENERAL',
            prioridad: 'MEDIA',
            fechaLimite: '2026-06-01T00:00:00.000Z',
            fechaCompletada: null,
            creadoEn: '2026-05-24T00:00:00.000Z',
            actualizadoEn: '2026-05-24T00:00:00.000Z',
          },
          { status: 201 },
        );
      }),
    );

    const { Wrapper, queryClient } = setupTestWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useCreateTarea(), { wrapper: Wrapper });

    const input: TareaCreateInput = {
      tratoId: TRATO_ID,
      responsableId: '11111111-1111-1111-1111-111111111111',
      titulo: 'Demo con CTO',
      tipo: 'GENERAL',
      prioridad: 'MEDIA',
      descripcion: null,
      fechaLimite: '2026-06-01T00:00:00.000Z',
    };

    result.current.mutate(input);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // tratoId va en el body (no en el path), con enums del back
    expect(capturedBody).toHaveProperty('tratoId', TRATO_ID);
    expect(capturedBody!['titulo']).toBe('Demo con CTO');
    expect(capturedBody!['tipo']).toBe('GENERAL');
    expect(capturedBody!['prioridad']).toBe('MEDIA');
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: tareasKeys.all });
  });

  it('el body NO incluye trato_id (snake_case) ni valores numéricos de prioridad', async () => {
    let capturedBody: Record<string, unknown> | null = null;

    server.use(
      http.post('/api/tareas/create', async ({ request }) => {
        capturedBody = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json(
          {
            id: 'otra-tarea-id',
            tratoId: capturedBody['tratoId'],
            responsableId: capturedBody['responsableId'],
            titulo: capturedBody['titulo'],
            descripcion: null,
            tipo: 'SEGUIMIENTO',
            prioridad: 'ALTA',
            fechaLimite: '2026-06-15T00:00:00.000Z',
            fechaCompletada: null,
            creadoEn: '2026-05-24T00:00:00.000Z',
            actualizadoEn: '2026-05-24T00:00:00.000Z',
          },
          { status: 201 },
        );
      }),
    );

    const { Wrapper } = setupTestWrapper();
    const { result } = renderHook(() => useCreateTarea(), { wrapper: Wrapper });

    const input: TareaCreateInput = {
      tratoId: TRATO_ID,
      responsableId: '11111111-1111-1111-1111-111111111111',
      titulo: 'Seguimiento post-demo',
      tipo: 'SEGUIMIENTO',
      prioridad: 'ALTA',
      descripcion: null,
      fechaLimite: '2026-06-15T00:00:00.000Z',
    };

    result.current.mutate(input);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // NO debe haber campos snake_case ni numéricos
    expect(capturedBody).not.toHaveProperty('trato_id');
    expect(capturedBody).not.toHaveProperty('responsable_id');
    expect(capturedBody).not.toHaveProperty('fecha_limite');
    expect(typeof capturedBody!['prioridad']).toBe('string');
  });
});
