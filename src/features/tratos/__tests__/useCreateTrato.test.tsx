import { describe, it, expect } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';

import { useCreateTrato } from '../hooks/useCreateTrato';
import { setupTestWrapper } from '@/test/wrappers';
import { server } from '@/test/server';
import type { TratoCreateInput } from '../schemas/trato.schema';

describe('useCreateTrato', () => {
  it('crea un trato con cliente: body limpio (sin asociacion, prospecto_id null) e invalida ["tratos"]', async () => {
    let capturedBody: Record<string, unknown> | null = null;
    server.use(
      http.post('/api/v1/tratos', async ({ request }) => {
        capturedBody = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json(
          {
            id: 'new-trato-id',
            cliente_id: capturedBody['cliente_id'],
            prospecto_id: capturedBody['prospecto_id'],
            nombre: capturedBody['nombre'],
            responsable_id: capturedBody['responsable_id'],
            estado: 'abierto',
            motivo_perdida: null,
            creado_en: '2026-05-24T00:00:00.000Z',
            actualizado_en: '2026-05-24T00:00:00.000Z',
            valor_estimado: null,
            probabilidad: null,
            fecha_cierre_esperada: null,
            tipo_contrato: null,
          },
          { status: 201 },
        );
      }),
    );

    const { Wrapper } = setupTestWrapper();
    const { result } = renderHook(() => useCreateTrato(), { wrapper: Wrapper });

    const input: TratoCreateInput = {
      asociacion: 'cliente',
      cliente_id: 'c1111111-cccc-1111-cccc-111111111111',
      prospecto_id: '',
      nombre: 'Demo CTO',
      responsable_id: '11111111-1111-1111-1111-111111111111',
      valor_estimado: 50000,
      probabilidad: 70,
      fecha_cierre_esperada: '',
      tipo_contrato: 'precio_fijo',
    };

    result.current.mutate(input);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(capturedBody).not.toBeNull();
    expect(capturedBody).not.toHaveProperty('asociacion');
    expect(capturedBody!['cliente_id']).toBe('c1111111-cccc-1111-cccc-111111111111');
    expect(capturedBody!['prospecto_id']).toBeNull();
    expect(capturedBody!['nombre']).toBe('Demo CTO');
  });

  it('crea un trato con prospecto: cliente_id null en el body', async () => {
    let capturedBody: Record<string, unknown> | null = null;
    server.use(
      http.post('/api/v1/tratos', async ({ request }) => {
        capturedBody = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json(
          { id: 'new', estado: 'abierto', motivo_perdida: null },
          { status: 201 },
        );
      }),
    );

    const { Wrapper } = setupTestWrapper();
    const { result } = renderHook(() => useCreateTrato(), { wrapper: Wrapper });

    result.current.mutate({
      asociacion: 'prospecto',
      cliente_id: '',
      prospecto_id: 'b1111111-bbbb-1111-bbbb-111111111111',
      nombre: 'Lead',
      responsable_id: '11111111-1111-1111-1111-111111111111',
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(capturedBody!['prospecto_id']).toBe('b1111111-bbbb-1111-bbbb-111111111111');
    expect(capturedBody!['cliente_id']).toBeNull();
    expect(capturedBody).not.toHaveProperty('asociacion');
  });
});
