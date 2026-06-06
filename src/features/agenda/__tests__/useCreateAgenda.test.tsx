import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';

import { useCreateAgenda } from '../hooks/useCreateAgenda';
import { agendasKeys } from '../hooks/useAgendas';
import { setupTestWrapper } from '@/test/wrappers';
import { server } from '@/test/server';
import type { AgendaCreateInput } from '../schemas/agenda.schema';

describe('useCreateAgenda', () => {
  it('POST a /agendas/create con camelCase e invalida agendasKeys.all', async () => {
    let capturedBody: Record<string, unknown> | null = null;

    server.use(
      http.post('/api/agendas/create', async ({ request }) => {
        capturedBody = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json(
          {
            id: 'nuevo-evento-id',
            tipo: capturedBody['tipo'],
            asunto: capturedBody['asunto'],
            descripcion: null,
            fecha: capturedBody['fecha'],
            horaInicio: capturedBody['horaInicio'],
            horaFin: null,
            tareaId: null,
            tratoId: null,
            ubicacion: null,
            linkVideollamada: null,
            creadoPor: '550e8400-e29b-41d4-a716-446655440001',
            creadoEn: '2026-06-06T00:00:00.000Z',
            actualizadoEn: '2026-06-06T00:00:00.000Z',
            recordatorioHabilitado: true,
            minutosAntes: 15,
            recordatorioEstado: 'PENDIENTE',
            recordatorioEnviadoEn: null,
            ultimoIntentoEn: null,
          },
          { status: 201 },
        );
      }),
    );

    const { Wrapper, queryClient } = setupTestWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useCreateAgenda(), { wrapper: Wrapper });

    const input: AgendaCreateInput = {
      tipo: 'REUNION',
      asunto: 'Demo con CTO',
      descripcion: null,
      fecha: '2026-06-10',
      horaInicio: '09:00',
      horaFin: '10:00',
      tareaId: null,
      tratoId: null,
      ubicacion: null,
      linkVideollamada: null,
      recordatorioHabilitado: true,
      minutosAntes: 15,
    };

    result.current.mutate(input);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(capturedBody).toHaveProperty('asunto', 'Demo con CTO');
    expect(capturedBody!['tipo']).toBe('REUNION');
    expect(capturedBody!['horaInicio']).toBe('09:00');
    // NO debe haber snake_case
    expect(capturedBody).not.toHaveProperty('hora_inicio');
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: agendasKeys.all });
  });
});
