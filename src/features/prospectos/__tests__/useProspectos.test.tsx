import { describe, it, expect } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';

import { useProspectos, prospectosKeys } from '../hooks/useProspectos';
import { setupTestWrapper } from '@/test/wrappers';
import { server } from '@/test/server';

describe('useProspectos', () => {
  it('devuelve la lista completa de prospectos desde el endpoint', async () => {
    const { Wrapper } = setupTestWrapper();
    const { result } = renderHook(() => useProspectos(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toBeDefined();
    expect(Array.isArray(result.current.data)).toBe(true);
    expect(result.current.data!.length).toBeGreaterThan(0);
    expect(result.current.data![0]).toHaveProperty('nombre_contacto');
  });

  it('pasa responsable_id como query param al endpoint cuando se provee', async () => {
    const RESPONSABLE_ID = 'u1111111';
    let capturedUrl = '';

    server.use(
      http.get('/api/prospectos', ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json([]);
      }),
    );

    const { Wrapper } = setupTestWrapper();
    renderHook(() => useProspectos({ responsable_id: RESPONSABLE_ID }), { wrapper: Wrapper });

    await waitFor(() => expect(capturedUrl).toContain(`responsable_id=${RESPONSABLE_ID}`));
  });

  it('la query key incluye el filtro responsable_id', () => {
    const RESPONSABLE_ID = 'u2222222';
    expect(prospectosKeys.list({ responsable_id: RESPONSABLE_ID })).toContain(
      `responsable_id=${RESPONSABLE_ID}`,
    );
  });

  it('reporta error cuando el endpoint responde 500', async () => {
    server.use(
      http.get('/api/prospectos', () =>
        HttpResponse.json(
          { status: 500, error: 'INTERNAL_SERVER_ERROR', message: 'Boom' },
          { status: 500 },
        ),
      ),
    );

    const { Wrapper } = setupTestWrapper();
    const { result } = renderHook(() => useProspectos(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeDefined();
  });
});

