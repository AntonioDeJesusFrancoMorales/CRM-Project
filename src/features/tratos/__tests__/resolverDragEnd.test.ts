// Tests unitarios para resolverDragEnd — lógica pura de drag-and-drop (ADR-061).
// 9 casos que cubren todas las transiciones del tablero kanban.
// Sin render, sin efectos secundarios, entrada directa a la función pura.

import { describe, it, expect } from 'vitest';

import { resolverDragEnd } from '../hooks/resolverDragEnd';
import type { AccionDrag } from '../hooks/resolverDragEnd';
import type { ColumnaKanban } from '../hooks/useColumnasKanban';

// Columnas de prueba — misma estructura que useColumnasKanban v1.
const COLUMNAS: ColumnaKanban[] = [
  { id: 'abierto', label: 'Abierto', color: 'blue', esTerminal: false, requiereModal: false },
  { id: 'ganado', label: 'Ganado', color: 'green', esTerminal: true, requiereModal: false },
  { id: 'perdido', label: 'Perdido', color: 'red', esTerminal: true, requiereModal: true },
];

const TRATO_ID = 'd1111111-dddd-1111-dddd-111111111111';
const NOMBRE = 'Trato de prueba';

describe('resolverDragEnd', () => {
  // Caso 1: estadoDestino null → ignorar (drop fuera de cualquier columna)
  it('retorna ignorar cuando estadoDestino es null (over=null)', () => {
    const resultado = resolverDragEnd(TRATO_ID, 'abierto', null, COLUMNAS, NOMBRE);
    expect(resultado).toEqual<AccionDrag>({ accion: 'ignorar' });
  });

  // Caso 2: mismo estado abierto→abierto → ignorar
  it('retorna ignorar cuando el trato se suelta en la misma columna (abierto→abierto)', () => {
    const resultado = resolverDragEnd(TRATO_ID, 'abierto', 'abierto', COLUMNAS, NOMBRE);
    expect(resultado).toEqual<AccionDrag>({ accion: 'ignorar' });
  });

  // Caso 3: mismo estado ganado→ganado → ignorar
  it('retorna ignorar cuando el trato se suelta en la misma columna (ganado→ganado)', () => {
    const resultado = resolverDragEnd(TRATO_ID, 'ganado', 'ganado', COLUMNAS, NOMBRE);
    expect(resultado).toEqual<AccionDrag>({ accion: 'ignorar' });
  });

  // Caso 4: mismo estado perdido→perdido → ignorar
  it('retorna ignorar cuando el trato se suelta en la misma columna (perdido→perdido)', () => {
    const resultado = resolverDragEnd(TRATO_ID, 'perdido', 'perdido', COLUMNAS, NOMBRE);
    expect(resultado).toEqual<AccionDrag>({ accion: 'ignorar' });
  });

  // Caso 5: terminal→terminal prohibido (perdido→ganado) → ignorar (ADR-060)
  it('retorna ignorar en transición terminal→terminal (perdido→ganado)', () => {
    const resultado = resolverDragEnd(TRATO_ID, 'perdido', 'ganado', COLUMNAS, NOMBRE);
    expect(resultado).toEqual<AccionDrag>({ accion: 'ignorar' });
  });

  // Caso 6: abierto→ganado → ganar
  it('retorna ganar cuando el trato pasa de abierto a ganado', () => {
    const resultado = resolverDragEnd(TRATO_ID, 'abierto', 'ganado', COLUMNAS, NOMBRE);
    expect(resultado).toEqual<AccionDrag>({ accion: 'ganar', tratoId: TRATO_ID });
  });

  // Caso 7: ganado→abierto → reabrir
  it('retorna reabrir cuando el trato pasa de ganado a abierto', () => {
    const resultado = resolverDragEnd(TRATO_ID, 'ganado', 'abierto', COLUMNAS, NOMBRE);
    expect(resultado).toEqual<AccionDrag>({ accion: 'reabrir', tratoId: TRATO_ID });
  });

  // Caso 8: perdido→abierto → reabrir
  it('retorna reabrir cuando el trato pasa de perdido a abierto', () => {
    const resultado = resolverDragEnd(TRATO_ID, 'perdido', 'abierto', COLUMNAS, NOMBRE);
    expect(resultado).toEqual<AccionDrag>({ accion: 'reabrir', tratoId: TRATO_ID });
  });

  // Caso 9: cualquier estado→perdido → abrir-modal-perder (requiereModal se lee de columnas)
  it('retorna abrir-modal-perder cuando el destino es perdido (lee requiereModal de columnas)', () => {
    const resultado = resolverDragEnd(TRATO_ID, 'abierto', 'perdido', COLUMNAS, NOMBRE);
    expect(resultado).toEqual<AccionDrag>({
      accion: 'abrir-modal-perder',
      tratoId: TRATO_ID,
      nombre: NOMBRE,
    });
  });

  // Triangulación: ganado→perdido también abre modal (no solo abierto→perdido)
  it('retorna abrir-modal-perder cuando ganado se arrastra a perdido (ganado→perdido)', () => {
    const resultado = resolverDragEnd(TRATO_ID, 'ganado', 'perdido', COLUMNAS, NOMBRE);
    expect(resultado).toEqual<AccionDrag>({
      accion: 'abrir-modal-perder',
      tratoId: TRATO_ID,
      nombre: NOMBRE,
    });
  });
});
