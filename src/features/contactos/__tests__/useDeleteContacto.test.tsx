import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';

import { useDeleteContacto } from '../hooks/useDeleteContacto';
import { getContactoDeleteErrorMessage } from '../lib/contactoErrors';
import { contactosKeys } from '../hooks/useContactos';
import { setupTestWrapper } from '@/test/wrappers';
import { server } from '@/test/server';
import { tratosFixture } from '@/mocks/fixtures/tratos';
import { HttpError } from '@/api/http-error';

// Sin tratos abiertos → DELETE 204 ok
const SAFE_ID = 'c0555555-cccc-0005-cccc-000000000005';
// Con trato abierto → DELETE 409
const BLOCKED_ID = 'b1111111-bbbb-1111-bbbb-111111111111';

describe('useDeleteContacto', () => {
  it('elimina con 204 e invalida la lista', async () => {
    const { Wrapper, queryClient } = setupTestWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useDeleteContacto(), { wrapper: Wrapper });

    result.current.mutate(SAFE_ID);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: contactosKeys.list() });
  });

  it('retorna isError con status 409 cuando el contacto tiene tratos activos', async () => {
    const { Wrapper } = setupTestWrapper();
    const { result } = renderHook(() => useDeleteContacto(), { wrapper: Wrapper });

    result.current.mutate(BLOCKED_ID);

    await waitFor(() => expect(result.current.isError).toBe(true));

    const error = result.current.error as Error & { status?: number };
    expect(error.status).toBe(409);
  });

  it('no invalida la lista cuando hay error 409', async () => {
    const { Wrapper, queryClient } = setupTestWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useDeleteContacto(), { wrapper: Wrapper });

    result.current.mutate(BLOCKED_ID);

    await waitFor(() => expect(result.current.isError).toBe(true));

    // No debe invalidar la lista en error
    expect(invalidateSpy).not.toHaveBeenCalledWith({ queryKey: contactosKeys.list() });
  });

  it('el mensaje del error 409 corresponde al del back', async () => {
    server.use(
      http.delete('/api/contactos/delete', () =>
        HttpResponse.json(
          {
            status: 409,
            error: 'CONFLICT',
            message: 'El contacto tiene tratos activos',
          },
          { status: 409 },
        ),
      ),
    );

    const { Wrapper } = setupTestWrapper();
    const { result } = renderHook(() => useDeleteContacto(), { wrapper: Wrapper });

    result.current.mutate(BLOCKED_ID);

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error?.message).toBe('El contacto tiene tratos activos');
  });

  it('normaliza el identificador del trato a su nombre con fallback seguro', () => {
    const error = new HttpError({
      status: 409,
      error: 'CONFLICT',
      message: 'El contacto tiene tratos activos',
      details: [{ field: 'trato_id', message: tratosFixture[0]!.id }],
    });

    const message = getContactoDeleteErrorMessage(error, tratosFixture);
    expect(message).toContain('Implementación CRM Innovatech');
    expect(message).not.toContain(tratosFixture[0]!.id);
    expect(getContactoDeleteErrorMessage(error)).toBe('El contacto tiene tratos activos');

    const unmappedError = new HttpError({
      status: 409,
      error: 'CONFLICT',
      message: `El trato ${tratosFixture[0]!.id} bloquea la eliminación`,
    });
    expect(getContactoDeleteErrorMessage(unmappedError)).toContain(tratosFixture[0]!.id);
  });
});
