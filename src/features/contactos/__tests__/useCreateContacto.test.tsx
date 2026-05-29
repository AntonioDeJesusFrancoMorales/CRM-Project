import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';

import { useCreateContacto } from '../hooks/useCreateContacto';
import { contactosKeys } from '../hooks/useContactos';
import { setupTestWrapper } from '@/test/wrappers';
import { server } from '@/test/server';

const PAYLOAD = {
  nombre: 'Nuevo',
  estadoRelacion: 'PROSPECTO' as const,
  correo: null,
  telefono: null,
  empresaId: 'a1111111-aaaa-1111-aaaa-111111111111',
  comoNosConocio: null,
  responsableId: null,
};

describe('useCreateContacto', () => {
  it('crea un contacto y retorna 201 con el objeto creado', async () => {
    const { Wrapper } = setupTestWrapper();
    const { result } = renderHook(() => useCreateContacto(), { wrapper: Wrapper });

    result.current.mutate(PAYLOAD);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toBeDefined();
    expect(result.current.data?.nombre).toBe('Nuevo');
  });

  it('invalida contactosKeys.list() tras éxito', async () => {
    const { Wrapper, queryClient } = setupTestWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useCreateContacto(), { wrapper: Wrapper });

    result.current.mutate(PAYLOAD);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: contactosKeys.list() });
  });

  it('reporta isError cuando el endpoint falla', async () => {
    server.use(
      http.post('/api/contactos/create', () =>
        HttpResponse.json(
          { status: 500, error: 'INTERNAL_SERVER_ERROR', message: 'Error del servidor' },
          { status: 500 },
        ),
      ),
    );

    const { Wrapper } = setupTestWrapper();
    const { result } = renderHook(() => useCreateContacto(), { wrapper: Wrapper });

    result.current.mutate(PAYLOAD);

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeDefined();
  });
});
