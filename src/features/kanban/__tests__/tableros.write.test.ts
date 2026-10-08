import { describe, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { setupTestWrapper } from '@/test/wrappers';
import { server } from '@/test/server';
import type { Tablero, TableroCreateInput } from '../schemas/tablero.schema';
import { tablerosKeys } from '../hooks/useTableros';

const TABLERO_ID = 'f1111111-ffff-1111-ffff-111111111111';

const TABLERO: Tablero = {
  id: TABLERO_ID,
  nombre: 'Pipeline de Tratos',
  descripcion: 'Descripción original',
  tipoTablero: 'TRATOS',
  columnas: [],
  creadoEn: '2024-01-01T00:00:00Z',
};

describe('tablero mutation hooks', () => {
  it('create sends only the supported fields and accepts 201', async () => {
    let capturedBody: unknown;
    server.use(
      http.post('/api/tableros/create', async ({ request }) => {
        capturedBody = await request.json();
        return HttpResponse.json(TABLERO, { status: 201 });
      }),
    );

    const { Wrapper } = setupTestWrapper();
    const { useCreateTablero } = await import('../hooks/useCreateTablero');
    const { result } = renderHook(() => useCreateTablero(), { wrapper: Wrapper });
    const input: TableroCreateInput = {
      nombre: 'Nuevo tablero',
      descripcion: 'Descripción nueva',
      tipoTablero: 'TAREAS',
      columnasPredeterminadas: true,
    };

    await act(async () => {
      await result.current.mutateAsync(input);
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(capturedBody).toEqual({
      nombre: input.nombre,
      descripcion: input.descripcion,
      tipoTablero: input.tipoTablero,
    });
    expect(result.current.data).toEqual(TABLERO);
  });

  it('update sends only name and description, updates detail cache, and accepts 200', async () => {
    let capturedBody: unknown;
    let capturedUrl = '';
    const updated = {
      ...TABLERO,
      nombre: 'Pipeline actualizado',
      descripcion: 'Descripción actualizada',
    };
    server.use(
      http.put('/api/tableros/edit', async ({ request }) => {
        capturedUrl = request.url;
        capturedBody = await request.json();
        return HttpResponse.json(updated, { status: 200 });
      }),
    );

    const { Wrapper, queryClient } = setupTestWrapper();
    queryClient.setQueryData(tablerosKeys.detail(TABLERO_ID), TABLERO);
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
    const { useUpdateTablero } = await import('../hooks/useUpdateTablero');
    const { result } = renderHook(() => useUpdateTablero(), { wrapper: Wrapper });

    await act(async () => {
      await result.current.mutateAsync({
        id: TABLERO_ID,
        data: { nombre: updated.nombre, descripcion: `  ${updated.descripcion}  ` },
      });
    });

    expect(capturedUrl).toContain(`/tableros/edit?id=${TABLERO_ID}`);
    expect(capturedBody).toEqual({ nombre: updated.nombre, descripcion: updated.descripcion });
    expect(queryClient.getQueryData(tablerosKeys.detail(TABLERO_ID))).toEqual(updated);
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: tablerosKeys.all }),
    );
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: tablerosKeys.detail(TABLERO_ID) }),
    );
  });

  it('delete accepts 204, returns undefined, removes detail cache, and invalidates the list', async () => {
    let capturedUrl = '';
    server.use(
      http.delete('/api/tableros/delete', ({ request }) => {
        capturedUrl = request.url;
        return new HttpResponse(null, { status: 204 });
      }),
    );

    const { Wrapper, queryClient } = setupTestWrapper();
    queryClient.setQueryData(tablerosKeys.list(), [TABLERO]);
    queryClient.setQueryData(tablerosKeys.detail(TABLERO_ID), TABLERO);
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
    const { useDeleteTablero } = await import('../hooks/useDeleteTablero');
    const { result } = renderHook(() => useDeleteTablero(), { wrapper: Wrapper });

    await act(async () => {
      await result.current.mutateAsync(TABLERO_ID);
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(capturedUrl).toContain(`/tableros/delete?id=${TABLERO_ID}`);
    expect(result.current.data).toBeUndefined();
    expect(queryClient.getQueryData(tablerosKeys.detail(TABLERO_ID))).toBeUndefined();
    await waitFor(() => expect(queryClient.getQueryData(tablerosKeys.list()) ?? []).toEqual([]));
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: tablerosKeys.all }),
    );
  });
});
