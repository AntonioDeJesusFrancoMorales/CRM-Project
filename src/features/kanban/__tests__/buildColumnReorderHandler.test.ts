// Tests de la función pura buildColumnReorderHandler — Fase 5 (Reordenar columnas).
// Estrategia: jsdom NO soporta arrastre real → testeamos la lógica pura aislada.
// Casos cubiertos:
//   - Permutación correcta: llama reordenar con nuevoOrden calculado por arrayMove.
//   - No-op si active.id === over.id (misma posición).
//   - No-op si over es null (drag cancelado).
//   - No-op si active.id no pertenece a las columnas (id ajeno).
//   - Verifica que tableroId e idsActuales se pasan correctamente.

import { describe, it, expect, vi } from 'vitest';
import type { DragEndEvent } from '@dnd-kit/core';
import { buildColumnReorderHandler } from '../components/KanbanBoard';
import type { ColumnaTablero } from '../schemas/tablero.schema';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const COL_A: ColumnaTablero = {
  id: 'col-a',
  nombre: 'Por contactar',
  color: '#94a3b8',
  limiteWip: null,
  nota: null,
  totalValorEstimado: 0,
};

const COL_B: ColumnaTablero = {
  id: 'col-b',
  nombre: 'En negociación',
  color: '#fbbf24',
  limiteWip: null,
  nota: null,
  totalValorEstimado: 0,
};

const COL_C: ColumnaTablero = {
  id: 'col-c',
  nombre: 'Cerrado',
  color: '#34d399',
  limiteWip: null,
  nota: null,
  totalValorEstimado: 0,
};

const TABLERO_ID = 'f1111111-ffff-1111-ffff-111111111111';
const COLUMNAS = [COL_A, COL_B, COL_C];

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('buildColumnReorderHandler — lógica pura de reordenamiento', () => {
  it('(cr-a) mover col-a a la posición de col-c llama reordenar con arrayMove correcto', () => {
    const reordenar = vi.fn();
    const handler = buildColumnReorderHandler({
      columnas: COLUMNAS,
      tableroId: TABLERO_ID,
      reordenar,
    });

    handler({
      active: { id: 'col-a', data: { current: { type: 'columna' } } },
      over: { id: 'col-c' },
    } as unknown as DragEndEvent);

    expect(reordenar).toHaveBeenCalledTimes(1);
    expect(reordenar).toHaveBeenCalledWith({
      tableroId: TABLERO_ID,
      // arrayMove(['col-a','col-b','col-c'], 0, 2) → ['col-b','col-c','col-a']
      nuevoOrden: ['col-b', 'col-c', 'col-a'],
      idsActuales: ['col-a', 'col-b', 'col-c'],
    });
  });

  it('(cr-b) mover col-c a la posición de col-a llama reordenar con arrayMove correcto', () => {
    const reordenar = vi.fn();
    const handler = buildColumnReorderHandler({
      columnas: COLUMNAS,
      tableroId: TABLERO_ID,
      reordenar,
    });

    handler({
      active: { id: 'col-c', data: { current: { type: 'columna' } } },
      over: { id: 'col-a' },
    } as unknown as DragEndEvent);

    expect(reordenar).toHaveBeenCalledTimes(1);
    expect(reordenar).toHaveBeenCalledWith({
      tableroId: TABLERO_ID,
      // arrayMove(['col-a','col-b','col-c'], 2, 0) → ['col-c','col-a','col-b']
      nuevoOrden: ['col-c', 'col-a', 'col-b'],
      idsActuales: ['col-a', 'col-b', 'col-c'],
    });
  });

  it('(cr-c) misma posición (active.id === over.id) NO llama reordenar (no-op)', () => {
    const reordenar = vi.fn();
    const handler = buildColumnReorderHandler({
      columnas: COLUMNAS,
      tableroId: TABLERO_ID,
      reordenar,
    });

    handler({
      active: { id: 'col-b', data: { current: { type: 'columna' } } },
      over: { id: 'col-b' },
    } as unknown as DragEndEvent);

    expect(reordenar).not.toHaveBeenCalled();
  });

  it('(cr-d) over=null (drag cancelado) NO llama reordenar (no-op)', () => {
    const reordenar = vi.fn();
    const handler = buildColumnReorderHandler({
      columnas: COLUMNAS,
      tableroId: TABLERO_ID,
      reordenar,
    });

    handler({
      active: { id: 'col-a', data: { current: { type: 'columna' } } },
      over: null,
    } as unknown as DragEndEvent);

    expect(reordenar).not.toHaveBeenCalled();
  });

  it('(cr-e) active.id no pertenece a las columnas NO llama reordenar (no-op)', () => {
    const reordenar = vi.fn();
    const handler = buildColumnReorderHandler({
      columnas: COLUMNAS,
      tableroId: TABLERO_ID,
      reordenar,
    });

    handler({
      active: { id: 'col-inexistente', data: { current: { type: 'columna' } } },
      over: { id: 'col-b' },
    } as unknown as DragEndEvent);

    expect(reordenar).not.toHaveBeenCalled();
  });

  it('(cr-f) tableroId se pasa correctamente a reordenar', () => {
    const reordenar = vi.fn();
    const otroTableroId = 'otro-tablero-id-9999';
    const handler = buildColumnReorderHandler({
      columnas: COLUMNAS,
      tableroId: otroTableroId,
      reordenar,
    });

    handler({
      active: { id: 'col-a', data: { current: { type: 'columna' } } },
      over: { id: 'col-b' },
    } as unknown as DragEndEvent);

    expect(reordenar).toHaveBeenCalledWith(
      expect.objectContaining({ tableroId: otroTableroId }),
    );
  });

  it('(cr-g) idsActuales refleja el orden ACTUAL de las columnas (no el nuevo)', () => {
    const reordenar = vi.fn();
    const handler = buildColumnReorderHandler({
      columnas: COLUMNAS,
      tableroId: TABLERO_ID,
      reordenar,
    });

    handler({
      active: { id: 'col-b', data: { current: { type: 'columna' } } },
      over: { id: 'col-a' },
    } as unknown as DragEndEvent);

    const llamada = reordenar.mock.calls[0]![0] as { idsActuales: string[] };
    // idsActuales debe ser el orden ORIGINAL, no el nuevo
    expect(llamada.idsActuales).toEqual(['col-a', 'col-b', 'col-c']);
  });
});
