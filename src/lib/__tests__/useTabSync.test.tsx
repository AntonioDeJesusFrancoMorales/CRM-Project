// Tests del hook useTabSync — sincroniza un tab activo con el query param ?tab=.
// ADR-045 — Helper reutilizable. Usado por ClienteDetailPage en Lote E.

import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router';
import type { ReactNode } from 'react';
import { useTabSync } from '../useTabSync';

function makeWrapper(initialEntry: string) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route path="*" element={<>{children}</>} />
        </Routes>
      </MemoryRouter>
    );
  };
}

// Hook compuesto que combina useTabSync y useLocation para inspeccionar la URL en assertions.
function useTabSyncWithLocation(allowed: readonly string[], fallback: string) {
  const [tab, setTab] = useTabSync(allowed, fallback);
  const location = useLocation();
  return { tab, setTab, search: location.search };
}

describe('useTabSync', () => {
  it('lee ?tab=tratos cuando está en allowed', () => {
    const { result } = renderHook(
      () => useTabSync(['info', 'tratos'], 'info'),
      { wrapper: makeWrapper('/clientes/c1?tab=tratos') },
    );

    expect(result.current[0]).toBe('tratos');
  });

  it('devuelve fallback cuando no hay ?tab en la URL', () => {
    const { result } = renderHook(
      () => useTabSync(['info', 'tratos'], 'info'),
      { wrapper: makeWrapper('/clientes/c1') },
    );

    expect(result.current[0]).toBe('info');
  });

  it('devuelve fallback cuando ?tab tiene un valor no permitido', () => {
    const { result } = renderHook(
      () => useTabSync(['info', 'tratos'], 'info'),
      { wrapper: makeWrapper('/clientes/c1?tab=invalido') },
    );

    expect(result.current[0]).toBe('info');
  });

  it('setTab("tratos") agrega ?tab=tratos a la URL', () => {
    const { result } = renderHook(
      () => useTabSyncWithLocation(['info', 'tratos'], 'info'),
      { wrapper: makeWrapper('/clientes/c1') },
    );

    expect(result.current.search).toBe('');

    act(() => {
      result.current.setTab('tratos');
    });

    expect(result.current.search).toBe('?tab=tratos');
    expect(result.current.tab).toBe('tratos');
  });

  it('setTab(fallback) elimina ?tab de la URL (URL limpia)', () => {
    const { result } = renderHook(
      () => useTabSyncWithLocation(['info', 'tratos'], 'info'),
      { wrapper: makeWrapper('/clientes/c1?tab=tratos') },
    );

    expect(result.current.search).toBe('?tab=tratos');

    act(() => {
      result.current.setTab('info');
    });

    expect(result.current.search).toBe('');
    expect(result.current.tab).toBe('info');
  });
});
