// Tests para useColumnasKanban — seam de columnas del tablero kanban (ADR-059).
// Strict TDD: RED primero, GREEN después.

import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';

import { useColumnasKanban } from '../hooks/useColumnasKanban';

describe('useColumnasKanban', () => {
  it('retorna exactamente 3 columnas con ids abierto, ganado, perdido', () => {
    const { result } = renderHook(() => useColumnasKanban());
    const columnas = result.current;

    expect(columnas).toHaveLength(3);
    const ids = columnas.map((c) => c.id);
    expect(ids).toContain('abierto');
    expect(ids).toContain('ganado');
    expect(ids).toContain('perdido');
  });

  it('columna perdido tiene requiereModal=true y ganado tiene requiereModal=false', () => {
    const { result } = renderHook(() => useColumnasKanban());
    const columnas = result.current;

    const perdido = columnas.find((c) => c.id === 'perdido');
    const ganado = columnas.find((c) => c.id === 'ganado');
    const abierto = columnas.find((c) => c.id === 'abierto');

    expect(perdido?.requiereModal).toBe(true);
    expect(ganado?.requiereModal).toBe(false);
    expect(abierto?.requiereModal).toBe(false);
  });

  it('ganado y perdido tienen esTerminal=true, abierto tiene esTerminal=false', () => {
    const { result } = renderHook(() => useColumnasKanban());
    const columnas = result.current;

    const perdido = columnas.find((c) => c.id === 'perdido');
    const ganado = columnas.find((c) => c.id === 'ganado');
    const abierto = columnas.find((c) => c.id === 'abierto');

    expect(ganado?.esTerminal).toBe(true);
    expect(perdido?.esTerminal).toBe(true);
    expect(abierto?.esTerminal).toBe(false);
  });

  it('cada columna tiene label y color definidos', () => {
    const { result } = renderHook(() => useColumnasKanban());
    const columnas = result.current;

    for (const columna of columnas) {
      expect(typeof columna.label).toBe('string');
      expect(columna.label.length).toBeGreaterThan(0);
      expect(typeof columna.color).toBe('string');
      expect(columna.color.length).toBeGreaterThan(0);
    }
  });
});
