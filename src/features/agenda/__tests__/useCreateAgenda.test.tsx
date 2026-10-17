import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';

import { useCreateAgenda } from '../hooks/useCreateAgenda';
import { agendasKeys } from '../hooks/useAgendas';
import { setupTestWrapper } from '@/test/wrappers';
import { server } from '@/test/server';
import type { AgendaCreateInput } from '../schemas/agenda.schema';

describe('useCreateAgenda', () => {
  it('waits for agenda refresh before closing a successful creation', async () => {
    const { Wrapper, queryClient } = setupTestWrapper();
    let finishRefresh!: () => void;
    vi.spyOn(queryClient, 'invalidateQueries').mockImplementationOnce(() => new Promise<void>((resolve) => { finishRefresh = resolve; }));
    const { result } = renderHook(() => useCreateAgenda(), { wrapper: Wrapper });
    result.current.mutate({
      tipo: 'REUNION', asunto: 'Refresh before close', fecha: '2026-10-20', horaInicio: '09:00',
      recordatorioHabilitado: false, minutosAntes: null,
    });
    await waitFor(() => expect(finishRefresh).toBeTypeOf('function'));
    expect(result.current.isPending).toBe(true);
    finishRefresh();
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

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
            creadoPor: 'b2000000-0000-4000-8000-000000000001',
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
