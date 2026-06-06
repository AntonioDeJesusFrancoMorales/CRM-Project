import { describe, it, expect } from 'vitest';
import { getTableroPrincipal } from '../lib/getTableroPrincipal';
import type { Tablero } from '../schemas/tablero.schema';

function tablero(over: Partial<Tablero>): Tablero {
  return {
    id: 'x',
    nombre: 'T',
    descripcion: null,
    tipoTablero: 'TRATOS',
    columnas: [],
    creadoEn: '2026-01-01T00:00:00',
    ...over,
  };
}

describe('getTableroPrincipal', () => {
  it('devuelve undefined si no hay tableros del tipo', () => {
    const tableros = [tablero({ id: 'a', tipoTablero: 'TAREAS' })];
    expect(getTableroPrincipal(tableros, 'TRATOS')).toBeUndefined();
  });

  it('devuelve el único tablero del tipo', () => {
    const t = tablero({ id: 'a', tipoTablero: 'TRATOS' });
    expect(getTableroPrincipal([t], 'TRATOS')?.id).toBe('a');
  });

  it('elige el PRIMERO por fecha de creación, ignorando el orden del array', () => {
    const nuevo = tablero({ id: 'nuevo', tipoTablero: 'TRATOS', creadoEn: '2026-05-01T08:00:00' });
    const viejo = tablero({ id: 'viejo', tipoTablero: 'TRATOS', creadoEn: '2026-04-01T08:00:00' });
    // El más nuevo viene primero en el array; igual debe ganar el más viejo.
    expect(getTableroPrincipal([nuevo, viejo], 'TRATOS')?.id).toBe('viejo');
  });

  it('filtra por tipo: ignora tableros de otro tipo aunque sean más antiguos', () => {
    const tareaVieja = tablero({ id: 'tarea', tipoTablero: 'TAREAS', creadoEn: '2020-01-01T00:00:00' });
    const trato = tablero({ id: 'trato', tipoTablero: 'TRATOS', creadoEn: '2026-04-01T08:00:00' });
    expect(getTableroPrincipal([tareaVieja, trato], 'TRATOS')?.id).toBe('trato');
  });
});
