// crearManejadorDragEnd.test.ts
// Unit tests para la fábrica del manejador drag-end (ADR-061, ADR-058).
// La fábrica recibe dependencias inyectadas y devuelve un handler puro+testeable.
// Cubre TODAS las ramas: ignorar (×4 casos), ganar, reabrir, abrir-modal-perder.

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { DragEndEvent } from '@dnd-kit/core';

import { crearManejadorDragEnd } from '../hooks/crearManejadorDragEnd';
import { useColumnasKanban } from '../hooks/useColumnasKanban';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const COLUMNAS = useColumnasKanban(); // columnas estáticas — sin React

function makeEvent(activeId: string, overId: string | null): DragEndEvent {
  return {
    active: {
      id: activeId,
      data: { current: undefined },
      rect: { current: { initial: null, translated: null } },
    },
    over: overId
      ? {
          id: overId,
          rect: { width: 200, height: 400, top: 0, left: 0, bottom: 400, right: 200 },
          data: { current: undefined },
          disabled: false,
        }
      : null,
    activatorEvent: new MouseEvent('mousedown'),
    collisions: null,
    delta: { x: 0, y: 0, scaleX: 1, scaleY: 1 },
  } as unknown as DragEndEvent;
}

// Lookup: retorna { estadoOrigen, nombre } dado un tratoId
type LookupFn = (tratoId: string) => { estadoOrigen: import('@/api/types').EstadoTrato; nombre: string } | undefined;

// ─── Suite ───────────────────────────────────────────────────────────────────

describe('crearManejadorDragEnd', () => {
  let onGanar: ReturnType<typeof vi.fn>;
  let onReabrir: ReturnType<typeof vi.fn>;
  let onPedirMotivoPerder: ReturnType<typeof vi.fn>;
  let lookup: LookupFn;

  beforeEach(() => {
    onGanar = vi.fn();
    onReabrir = vi.fn();
    onPedirMotivoPerder = vi.fn();
  });

  // ── Casos IGNORAR ──────────────────────────────────────────────────────────

  it('ignora cuando over es null (drop fuera de columna)', () => {
    lookup = () => ({ estadoOrigen: 'abierto', nombre: 'Trato A' });
    const handler = crearManejadorDragEnd({ columnas: COLUMNAS, lookup, onGanar, onReabrir, onPedirMotivoPerder });

    handler(makeEvent('t1', null));

    expect(onGanar).not.toHaveBeenCalled();
    expect(onReabrir).not.toHaveBeenCalled();
    expect(onPedirMotivoPerder).not.toHaveBeenCalled();
  });

  it('ignora cuando el tratoId no se encuentra en el lookup', () => {
    lookup = () => undefined;
    const handler = crearManejadorDragEnd({ columnas: COLUMNAS, lookup, onGanar, onReabrir, onPedirMotivoPerder });

    handler(makeEvent('inexistente', 'ganado'));

    expect(onGanar).not.toHaveBeenCalled();
    expect(onReabrir).not.toHaveBeenCalled();
    expect(onPedirMotivoPerder).not.toHaveBeenCalled();
  });

  it('ignora cuando estadoOrigen === estadoDestino (drop en la misma columna)', () => {
    lookup = () => ({ estadoOrigen: 'abierto', nombre: 'Trato A' });
    const handler = crearManejadorDragEnd({ columnas: COLUMNAS, lookup, onGanar, onReabrir, onPedirMotivoPerder });

    handler(makeEvent('t1', 'abierto'));

    expect(onGanar).not.toHaveBeenCalled();
    expect(onReabrir).not.toHaveBeenCalled();
    expect(onPedirMotivoPerder).not.toHaveBeenCalled();
  });

  it('ignora transición terminal→terminal sin modal (ganado→abierto no, pero perdido→ganado sí)', () => {
    // perdido (terminal) → ganado (terminal, sin modal) = IGNORAR
    lookup = () => ({ estadoOrigen: 'perdido', nombre: 'Trato P' });
    const handler = crearManejadorDragEnd({ columnas: COLUMNAS, lookup, onGanar, onReabrir, onPedirMotivoPerder });

    handler(makeEvent('t1', 'ganado'));

    expect(onGanar).not.toHaveBeenCalled();
    expect(onReabrir).not.toHaveBeenCalled();
    expect(onPedirMotivoPerder).not.toHaveBeenCalled();
  });

  // ── Caso GANAR ─────────────────────────────────────────────────────────────

  it('llama onGanar cuando abierto→ganado', () => {
    lookup = () => ({ estadoOrigen: 'abierto', nombre: 'Trato G' });
    const handler = crearManejadorDragEnd({ columnas: COLUMNAS, lookup, onGanar, onReabrir, onPedirMotivoPerder });

    handler(makeEvent('trato-id-g', 'ganado'));

    expect(onGanar).toHaveBeenCalledOnce();
    expect(onGanar).toHaveBeenCalledWith('trato-id-g');
    expect(onReabrir).not.toHaveBeenCalled();
    expect(onPedirMotivoPerder).not.toHaveBeenCalled();
  });

  // ── Caso REABRIR ───────────────────────────────────────────────────────────

  it('llama onReabrir cuando ganado→abierto', () => {
    lookup = () => ({ estadoOrigen: 'ganado', nombre: 'Trato R' });
    const handler = crearManejadorDragEnd({ columnas: COLUMNAS, lookup, onGanar, onReabrir, onPedirMotivoPerder });

    handler(makeEvent('trato-id-r', 'abierto'));

    expect(onReabrir).toHaveBeenCalledOnce();
    expect(onReabrir).toHaveBeenCalledWith('trato-id-r');
    expect(onGanar).not.toHaveBeenCalled();
    expect(onPedirMotivoPerder).not.toHaveBeenCalled();
  });

  it('llama onReabrir cuando perdido→abierto (triangulación: reabrir desde distinto terminal)', () => {
    lookup = () => ({ estadoOrigen: 'perdido', nombre: 'Trato P' });
    const handler = crearManejadorDragEnd({ columnas: COLUMNAS, lookup, onGanar, onReabrir, onPedirMotivoPerder });

    handler(makeEvent('trato-id-p', 'abierto'));

    expect(onReabrir).toHaveBeenCalledOnce();
    expect(onReabrir).toHaveBeenCalledWith('trato-id-p');
    expect(onGanar).not.toHaveBeenCalled();
    expect(onPedirMotivoPerder).not.toHaveBeenCalled();
  });

  // ── Caso ABRIR-MODAL-PERDER ────────────────────────────────────────────────

  it('llama onPedirMotivoPerder cuando cualquiera→perdido', () => {
    lookup = () => ({ estadoOrigen: 'abierto', nombre: 'Trato M' });
    const handler = crearManejadorDragEnd({ columnas: COLUMNAS, lookup, onGanar, onReabrir, onPedirMotivoPerder });

    handler(makeEvent('trato-id-m', 'perdido'));

    expect(onPedirMotivoPerder).toHaveBeenCalledOnce();
    expect(onPedirMotivoPerder).toHaveBeenCalledWith('trato-id-m', 'Trato M');
    expect(onGanar).not.toHaveBeenCalled();
    expect(onReabrir).not.toHaveBeenCalled();
  });

  it('llama onPedirMotivoPerder cuando ganado→perdido (triangulación: también desde terminal)', () => {
    lookup = () => ({ estadoOrigen: 'ganado', nombre: 'Trato GaP' });
    const handler = crearManejadorDragEnd({ columnas: COLUMNAS, lookup, onGanar, onReabrir, onPedirMotivoPerder });

    handler(makeEvent('trato-id-gap', 'perdido'));

    expect(onPedirMotivoPerder).toHaveBeenCalledOnce();
    expect(onPedirMotivoPerder).toHaveBeenCalledWith('trato-id-gap', 'Trato GaP');
    expect(onGanar).not.toHaveBeenCalled();
    expect(onReabrir).not.toHaveBeenCalled();
  });
});
