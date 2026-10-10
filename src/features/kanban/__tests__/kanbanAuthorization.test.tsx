import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/server';
import { setupTestWrapper } from '@/test/wrappers';
import type { Ficha } from '../schemas/ficha.schema';
import { KANBAN_MOVE_FICHA_CHECKS, KANBAN_REORDER_COLUMN_CHECKS } from '../lib/kanbanPermissions';
import { useMoverFicha } from '../hooks/useMoverFicha';
import { useReordenarColumnas } from '../hooks/useReordenarColumnas';
import { useEliminarTarjeta } from '../hooks/useEliminarTarjeta';

const permissionTestState = vi.hoisted(() => {
  const granted = new Set<string>();
  const allowsAll = vi.fn(
    (checks: readonly { resource: string; action: string }[]) =>
      checks.every((check) => granted.has(`${check.resource}:${check.action}`)),
  );

  return { granted, allowsAll };
});

vi.mock('@/features/permissions/context', () => ({
  usePermissions: () => ({ allowsAll: permissionTestState.allowsAll }),
}));

function grant(...checks: string[]) {
  permissionTestState.granted.clear();
  for (const check of checks) permissionTestState.granted.add(check);
  permissionTestState.allowsAll.mockClear();
}

const FICHA: Ficha = {
  id: 'ficha-1',
  columnaId: 'columna-1',
  tipoFicha: 'TAREA',
  tratoId: null,
  tareaId: 'tarea-1',
  actualizadoEn: '2026-04-10T08:00:00Z',
};

describe('Kanban imperative authorization', () => {
  it('blocks ficha movement when either composite permission is missing', async () => {
    grant('FICHA:ACTUALIZAR');
    let requestSent = false;
    server.use(
      http.put('/api/fichas/mover-columna', () => {
        requestSent = true;
        return HttpResponse.json(FICHA);
      }),
    );

    const { Wrapper } = setupTestWrapper();
    const { result } = renderHook(() => useMoverFicha(), { wrapper: Wrapper });

    await act(async () => {
      result.current.mutate({ id: FICHA.id, targetColumnaId: 'columna-2' });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(requestSent).toBe(false);
    expect(permissionTestState.allowsAll).toHaveBeenCalledWith(KANBAN_MOVE_FICHA_CHECKS);
  });

  it('blocks column reorder when either composite permission is missing', async () => {
    grant('TABLERO:ACTUALIZAR');
    let requestSent = false;
    server.use(
      http.put('/api/tableros/reordenar-columnas', () => {
        requestSent = true;
        return HttpResponse.json({ id: 'tablero-1', columnas: [] });
      }),
    );

    const { Wrapper } = setupTestWrapper();
    const { result } = renderHook(() => useReordenarColumnas(), { wrapper: Wrapper });

    await act(async () => {
      result.current.mutate({
        tableroId: 'tablero-1',
        nuevoOrden: ['columna-2', 'columna-1'],
        idsActuales: ['columna-1', 'columna-2'],
      });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(requestSent).toBe(false);
    expect(permissionTestState.allowsAll).toHaveBeenCalledWith(KANBAN_REORDER_COLUMN_CHECKS);
  });

  it('blocks card deletion when the ficha cleanup permission is missing', async () => {
    grant('TAREA:ELIMINAR');
    let requestSent = false;
    server.use(
      http.delete('/api/tareas/delete', () => {
        requestSent = true;
        return new HttpResponse(null, { status: 204 });
      }),
      http.delete('/api/fichas/delete', () => {
        requestSent = true;
        return new HttpResponse(null, { status: 204 });
      }),
    );

    const { Wrapper } = setupTestWrapper();
    const { result } = renderHook(() => useEliminarTarjeta(FICHA), { wrapper: Wrapper });

    await act(async () => {
      await result.current.eliminar();
    });

    expect(requestSent).toBe(false);
    expect(permissionTestState.allowsAll).toHaveBeenCalledWith([
      { resource: 'TAREA', action: 'ELIMINAR' },
      { resource: 'FICHA', action: 'ELIMINAR' },
    ]);
  });
});
