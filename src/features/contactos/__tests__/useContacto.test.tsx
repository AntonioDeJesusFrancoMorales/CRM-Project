import { describe, it, expect } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';

import { useContacto } from '../hooks/useContacto';
import { contactosKeys } from '../hooks/useContactos';
import { setupTestWrapper } from '@/test/wrappers';
import { server } from '@/test/server';
import type { Contacto } from '@/api/types';

const EXISTING_ID = 'c0111111-cccc-0001-cccc-000000000001';
const KNOWN_CONTACTO: Contacto = {
  id: EXISTING_ID,
  nombre: 'Lucía',
  correo: null,
  telefono: '+52 961 111 0001',
  empresaId: 'a1111111-aaaa-1111-aaaa-111111111111',
  estadoRelacion: 'PROSPECTO',
  cargo: null,
  comoNosConocio: null,
  responsableId: null,
  creadoPor: null,
  creadoEn: '2026-01-15T09:00:00.000Z',
  actualizadoEn: '2026-01-15T09:00:00.000Z',
};

describe('useContacto', () => {
  it('resuelve desde la cache de lista cuando ya está cargada (sin petición HTTP extra)', async () => {
    const { Wrapper, queryClient } = setupTestWrapper();
    // Precarga la lista en cache
    queryClient.setQueryData(contactosKeys.list(), [KNOWN_CONTACTO]);

    const { result } = renderHook(() => useContacto(EXISTING_ID), { wrapper: Wrapper });

    // Con initialData la data debe estar disponible sincrónicamente
    await waitFor(() => expect(result.current.data).toBeDefined());
    expect(result.current.data?.id).toBe(EXISTING_ID);
    expect(result.current.data?.nombre).toBe('Lucía');
  });

  it('llama GET /contactos/get-by-id?id= cuando no hay cache', async () => {
    const { Wrapper } = setupTestWrapper();
    const { result } = renderHook(() => useContacto(EXISTING_ID), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toBeDefined();
    expect(result.current.data?.id).toBe(EXISTING_ID);
  });

  it('retorna undefined / error cuando el id no existe en el back', async () => {
    server.use(
      http.get('/api/contactos/get-by-id', () =>
        HttpResponse.json(
          { status: 404, error: 'NOT_FOUND', message: 'Contacto no encontrado' },
          { status: 404 },
        ),
      ),
    );

    const { Wrapper } = setupTestWrapper();
    const { result } = renderHook(() => useContacto('id-inexistente'), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.data).toBeUndefined();
  });
});
