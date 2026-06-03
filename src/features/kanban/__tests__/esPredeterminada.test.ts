// Tests unitarios para esPredeterminada — helper de clasificación de columnas.
// Verifica: predeterminada→true, personalizada→false, id ausente→false.

import { describe, it, expect } from 'vitest';
import { esPredeterminada } from '../lib/esPredeterminada';
import type { Columna } from '../schemas/columna.schema';

const CATALOGO: Columna[] = [
  {
    id: 'id-predeterminada',
    nombre: 'Por contactar',
    color: '#94a3b8',
    tipoTablero: 'TRATOS',
    tipoColumna: 'PREDETERMINADA',
  },
  {
    id: 'id-personalizada',
    nombre: 'Bloqueado',
    color: '#f87171',
    tipoTablero: 'TRATOS',
    tipoColumna: 'PERSONALIZADA',
  },
];

describe('esPredeterminada', () => {
  it('devuelve true cuando la columna es PREDETERMINADA en el catálogo', () => {
    expect(esPredeterminada('id-predeterminada', CATALOGO)).toBe(true);
  });

  it('devuelve false cuando la columna es PERSONALIZADA en el catálogo', () => {
    expect(esPredeterminada('id-personalizada', CATALOGO)).toBe(false);
  });

  it('devuelve false cuando el id no existe en el catálogo', () => {
    expect(esPredeterminada('id-inexistente', CATALOGO)).toBe(false);
  });

  it('devuelve false con catálogo vacío', () => {
    expect(esPredeterminada('cualquier-id', [])).toBe(false);
  });

  it('no muta el catálogo al llamarse', () => {
    const copia = [...CATALOGO];
    esPredeterminada('id-predeterminada', CATALOGO);
    expect(CATALOGO).toEqual(copia);
  });
});
