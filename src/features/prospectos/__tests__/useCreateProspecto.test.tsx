import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';

import { useCreateProspecto } from '../hooks/useCreateProspecto';
import { prospectosKeys } from '../hooks/useProspectos';
import { setupTestWrapper } from '@/test/wrappers';
import { server } from '@/test/server';

const newProspecto = {
  nombre_contacto: 'Pedro Gómez',
  empresa_id: 'a1111111-aaaa-1111-aaaa-111111111111',
  responsable_id: 'u1111111',
  correo_contacto: '',
  telefono_contacto: '',
  cargo_contacto: '',
  como_nos_conocio: undefined,
  estado_posible_cliente: 'frio' as const,
  notas: '',
};

describe('useCreateProspecto', () => {
  it('crea un prospecto e invalida la query de lista', async () => {
    const { Wrapper, queryClient } = setupTestWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
    const { result } = renderHook(() => useCreateProspecto(), { wrapper: Wrapper });

    result.current.mutate(newProspecto);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.nombre_contacto).toBe('Pedro Gómez');
    // Verifica que se invalidó la query key de la lista de prospectos.
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: prospectosKeys.list() }),
    );
  });

  it('propaga errores 422 con details para field errors', async () => {
    server.use(
      http.post('/api/prospectos', () =>
        HttpResponse.json(
          {
            status: 422,
            error: 'VALIDATION_ERROR',
            message: 'Datos inválidos',
            details: [{ field: 'nombre_contacto', message: 'ya existe' }],
          },
          { status: 422 },
        ),
      ),
    );

    const { Wrapper } = setupTestWrapper();
    const { result } = renderHook(() => useCreateProspecto(), { wrapper: Wrapper });

    result.current.mutate(newProspecto);

    await waitFor(() => expect(result.current.isError).toBe(true));

    const error = result.current.error as Error & {
      status?: number;
      details?: Array<{ field: string; message: string }>;
    };
    expect(error.status).toBe(422);
    expect(error.details?.[0]?.field).toBe('nombre_contacto');
  });
});

