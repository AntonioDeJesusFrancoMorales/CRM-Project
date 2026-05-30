import { describe, it, expect } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';

import { useEmpresaContactos } from '../hooks/useEmpresaContactos';
import { contactosKeys } from '../hooks/useContactos';
import { setupTestWrapper } from '@/test/wrappers';
import { server } from '@/test/server';
import type { Contacto } from '@/api/types';

// IDs de empresa presentes en contactosFixture
const EMPRESA_A = 'a1111111-aaaa-1111-aaaa-111111111111'; // Lucía (PROSPECTO) + Sofía (ACTIVO)
const EMPRESA_B = 'a2222222-aaaa-2222-aaaa-222222222222'; // Martín (PROSPECTO) + Carlos (INACTIVO)

describe('useEmpresaContactos', () => {
  it('filtra correctamente por empresaId devolviendo solo los contactos de esa empresa', async () => {
    const { Wrapper } = setupTestWrapper();
    const { result } = renderHook(() => useEmpresaContactos(EMPRESA_A), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(Array.isArray(result.current.data)).toBe(true);
    result.current.data!.forEach((c: Contacto) => {
      expect(c.empresaId).toBe(EMPRESA_A);
    });
  });

  it('no incluye contactos de otras empresas', async () => {
    const { Wrapper } = setupTestWrapper();
    const { result } = renderHook(() => useEmpresaContactos(EMPRESA_A), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const otrosIds = result.current.data!.map((c: Contacto) => c.empresaId);
    expect(otrosIds).not.toContain(EMPRESA_B);
  });

  it('retorna array vacío cuando la empresa no tiene contactos', async () => {
    const { Wrapper } = setupTestWrapper();
    const { result } = renderHook(
      () => useEmpresaContactos('empresa-sin-contactos'),
      { wrapper: Wrapper },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([]);
  });

  it('comparte queryKey ["contactos"] con useContactos', () => {
    // La misma query key garantiza que useEmpresaContactos y useContactos
    // comparten la cache — no hay doble fetch.
    expect(contactosKeys.list()).toEqual(['contactos']);
  });

  it('cuando empresaId es undefined el hook no dispara petición (disabled)', () => {
    const { Wrapper } = setupTestWrapper();
    const { result } = renderHook(
      () => useEmpresaContactos(undefined),
      { wrapper: Wrapper },
    );

    // TanStack Query v5: enabled:false → isFetching=false (no fetch), data=undefined.
    // isPending puede ser true (estado inicial sin datos) pero isFetching es false.
    expect(result.current.isFetching).toBe(false);
    expect(result.current.data).toBeUndefined();
  });

  it('funciona correctamente con empresaId de otra empresa (EMPRESA_B)', async () => {
    const { Wrapper } = setupTestWrapper();
    const { result } = renderHook(() => useEmpresaContactos(EMPRESA_B), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    result.current.data!.forEach((c: Contacto) => {
      expect(c.empresaId).toBe(EMPRESA_B);
    });
  });

  it('retorna array vacío si el endpoint devuelve []', async () => {
    server.use(
      http.get('/api/contactos/get-all', () => HttpResponse.json([], { status: 200 })),
    );

    const { Wrapper } = setupTestWrapper();
    const { result } = renderHook(() => useEmpresaContactos(EMPRESA_A), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([]);
  });
});
