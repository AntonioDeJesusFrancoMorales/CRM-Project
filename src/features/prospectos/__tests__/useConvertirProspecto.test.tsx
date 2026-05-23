import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';

import { useConvertirProspecto } from '../hooks/useConvertirProspecto';
import { prospectosKeys } from '../hooks/useProspectos';
import { setupTestWrapper } from '@/test/wrappers';
import { server } from '@/test/server';

// Prospecto de fixture existente (no convertido aún — usamos uno activo)
const PROSPECTO_ID = 'b1111111-bbbb-1111-bbbb-111111111111';
const EMPRESA_ID = 'a1111111-aaaa-1111-aaaa-111111111111';

describe('useConvertirProspecto', () => {
  it('invalida las 5 query keys tras conversión exitosa (R5 del design)', async () => {
    const { Wrapper, queryClient } = setupTestWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
    const { result } = renderHook(() => useConvertirProspecto(), { wrapper: Wrapper });

    result.current.mutate({ id: PROSPECTO_ID, empresa_id: EMPRESA_ID });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // 5 invalidaciones obligatorias (ADR-025, R5):
    // 1. ['prospectos'] — lista general
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: prospectosKeys.list() }),
    );
    // 2. ['prospectos', id] — detalle del prospecto convertido
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: prospectosKeys.detail(PROSPECTO_ID) }),
    );
    // 3. ['clientes'] — lista general de clientes
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ['clientes'] }),
    );
    // 4. ['empresa-clientes', empresaId] — tab clientes de EmpresaDetailPage
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: prospectosKeys.empresaClientes(EMPRESA_ID) }),
    );
    // 5. ['empresa-prospectos', empresaId] — tab prospectos de EmpresaDetailPage
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: prospectosKeys.empresaProspectos(EMPRESA_ID) }),
    );
  });

  it('maneja error 500 sin romper el estado del cache', async () => {
    server.use(
      http.post('/api/v1/prospectos/:id/convertir', () =>
        HttpResponse.json(
          { status: 500, error: 'INTERNAL_SERVER_ERROR', message: 'Error al convertir' },
          { status: 500 },
        ),
      ),
    );

    const { Wrapper } = setupTestWrapper();
    const { result } = renderHook(() => useConvertirProspecto(), { wrapper: Wrapper });

    result.current.mutate({ id: PROSPECTO_ID, empresa_id: EMPRESA_ID });

    await waitFor(() => expect(result.current.isError).toBe(true));

    const error = result.current.error as Error & { status?: number };
    expect(error.status).toBe(500);
  });
});
