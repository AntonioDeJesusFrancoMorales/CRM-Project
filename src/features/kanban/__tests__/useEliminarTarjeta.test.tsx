// useEliminarTarjeta — Strict TDD Lote 7 (RED → GREEN)
// Cubre los tres escenarios del hook de orquestación:
//   1. TAREA → DELETE /tareas/delete + DELETE /fichas/delete (en ese orden)
//   2. TRATO sin tareas → DELETE /tratos/delete + DELETE /fichas/delete
//   3. TRATO con tareas → bloqueado=true, cantidadTareas correcta, NINGÚN DELETE

import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/server';
import { setupTestWrapper } from '@/test/wrappers';
import type { Ficha } from '@/features/kanban/schemas/ficha.schema';

import { useEliminarTarjeta } from '../hooks/useEliminarTarjeta';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const FICHA_TAREA: Ficha = {
  id: 'h-tarea-001',
  columnaId: 'col-001',
  tipoFicha: 'TAREA',
  tratoId: null,
  tareaId: 'e1111111-eeee-1111-eeee-111111111111', // existe en tareasFixture
  actualizadoEn: '2026-04-10T08:00:00Z',
};

// d3333333 NO tiene tareas (invariante del fixture de tareas)
const FICHA_TRATO_SIN_TAREAS: Ficha = {
  id: 'h-trato-001',
  columnaId: 'col-001',
  tipoFicha: 'TRATO',
  tratoId: 'd3333333-dddd-3333-dddd-333333333333',
  tareaId: null,
  actualizadoEn: '2026-04-10T08:00:00Z',
};

// d1111111 tiene EXACTAMENTE 2 tareas (invariante del fixture de tareas)
const FICHA_TRATO_CON_TAREAS: Ficha = {
  id: 'h-trato-002',
  columnaId: 'col-001',
  tipoFicha: 'TRATO',
  tratoId: 'd1111111-dddd-1111-dddd-111111111111',
  tareaId: null,
  actualizadoEn: '2026-04-10T08:00:00Z',
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useEliminarTarjeta — TAREA', () => {
  it('(a) eliminar() llama DELETE /tareas/delete y luego DELETE /fichas/delete', async () => {
    const deletesCalled: string[] = [];

    server.use(
      http.delete('/api/tareas/delete', () => {
        deletesCalled.push('tarea');
        return new HttpResponse(null, { status: 204 });
      }),
      http.delete('/api/fichas/delete', () => {
        deletesCalled.push('ficha');
        return new HttpResponse(null, { status: 204 });
      }),
    );

    const { Wrapper } = setupTestWrapper();
    const { result } = renderHook(() => useEliminarTarjeta(FICHA_TAREA), {
      wrapper: Wrapper,
    });

    // No bloqueado
    expect(result.current.bloqueado).toBe(false);

    await act(async () => {
      await result.current.eliminar();
    });

    await waitFor(() => {
      expect(deletesCalled).toContain('tarea');
      expect(deletesCalled).toContain('ficha');
    });

    // Orden: tarea primero, luego ficha
    expect(deletesCalled.indexOf('tarea')).toBeLessThan(deletesCalled.indexOf('ficha'));
  });

  it('(b) bloqueado es siempre false para TAREA', () => {
    const { Wrapper } = setupTestWrapper();
    const { result } = renderHook(() => useEliminarTarjeta(FICHA_TAREA), {
      wrapper: Wrapper,
    });
    expect(result.current.bloqueado).toBe(false);
  });
});

describe('useEliminarTarjeta — TRATO sin tareas', () => {
  it('(c) eliminar() llama DELETE /tratos/delete y luego DELETE /fichas/delete', async () => {
    const deletesCalled: string[] = [];

    server.use(
      http.delete('/api/tratos/delete', () => {
        deletesCalled.push('trato');
        return new HttpResponse(null, { status: 204 });
      }),
      http.delete('/api/fichas/delete', () => {
        deletesCalled.push('ficha');
        return new HttpResponse(null, { status: 204 });
      }),
    );

    const { Wrapper } = setupTestWrapper();
    const { result } = renderHook(() => useEliminarTarjeta(FICHA_TRATO_SIN_TAREAS), {
      wrapper: Wrapper,
    });

    // Esperar a que cargue la lista de tareas (sin tareas asociadas → no bloqueado)
    await waitFor(() => {
      expect(result.current.bloqueado).toBe(false);
    });

    await act(async () => {
      await result.current.eliminar();
    });

    await waitFor(() => {
      expect(deletesCalled).toContain('trato');
      expect(deletesCalled).toContain('ficha');
    });

    // Orden: trato primero, luego ficha
    expect(deletesCalled.indexOf('trato')).toBeLessThan(deletesCalled.indexOf('ficha'));
  });

  it('(d) cantidadTareas es 0 para TRATO sin tareas', async () => {
    const { Wrapper } = setupTestWrapper();
    const { result } = renderHook(() => useEliminarTarjeta(FICHA_TRATO_SIN_TAREAS), {
      wrapper: Wrapper,
    });

    await waitFor(() => {
      expect(result.current.cantidadTareas).toBe(0);
    });
  });
});

describe('useEliminarTarjeta — TRATO con tareas (bloqueado)', () => {
  it('(e) bloqueado=true cuando el trato tiene tareas asociadas', async () => {
    const { Wrapper } = setupTestWrapper();
    const { result } = renderHook(() => useEliminarTarjeta(FICHA_TRATO_CON_TAREAS), {
      wrapper: Wrapper,
    });

    await waitFor(() => {
      expect(result.current.bloqueado).toBe(true);
    });
  });

  it('(f) cantidadTareas=2 para d1111111 (invariante del fixture)', async () => {
    const { Wrapper } = setupTestWrapper();
    const { result } = renderHook(() => useEliminarTarjeta(FICHA_TRATO_CON_TAREAS), {
      wrapper: Wrapper,
    });

    await waitFor(() => {
      expect(result.current.cantidadTareas).toBe(2);
    });
  });

  it('(g) eliminar() NO llama ningún DELETE cuando bloqueado=true', async () => {
    const deleteCalled = vi.fn();

    server.use(
      http.delete('/api/tratos/delete', () => {
        deleteCalled();
        return new HttpResponse(null, { status: 204 });
      }),
      http.delete('/api/fichas/delete', () => {
        deleteCalled();
        return new HttpResponse(null, { status: 204 });
      }),
      http.delete('/api/tareas/delete', () => {
        deleteCalled();
        return new HttpResponse(null, { status: 204 });
      }),
    );

    const { Wrapper } = setupTestWrapper();
    const { result } = renderHook(() => useEliminarTarjeta(FICHA_TRATO_CON_TAREAS), {
      wrapper: Wrapper,
    });

    // Esperar a que se confirme el bloqueo
    await waitFor(() => {
      expect(result.current.bloqueado).toBe(true);
    });

    await act(async () => {
      await result.current.eliminar();
    });

    // Dar tiempo para posibles fetches
    await new Promise((r) => setTimeout(r, 50));
    expect(deleteCalled).not.toHaveBeenCalled();
  });
});
