import { describe, it, expect } from 'vitest';
import { huboArrastre } from '../lib/huboArrastre';

describe('huboArrastre', () => {
  it('devuelve false si no hay posición inicial (click limpio sin pointerdown registrado)', () => {
    expect(huboArrastre(null, { x: 100, y: 100 })).toBe(false);
  });

  it('devuelve false si el puntero no se movió (mismo punto)', () => {
    expect(huboArrastre({ x: 10, y: 10 }, { x: 10, y: 10 })).toBe(false);
  });

  it('devuelve false si el movimiento está dentro del umbral (<= 5px)', () => {
    expect(huboArrastre({ x: 0, y: 0 }, { x: 5, y: 5 })).toBe(false);
    expect(huboArrastre({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(false);
  });

  it('devuelve true si se movió más del umbral en X', () => {
    expect(huboArrastre({ x: 0, y: 0 }, { x: 50, y: 0 })).toBe(true);
  });

  it('devuelve true si se movió más del umbral en Y', () => {
    expect(huboArrastre({ x: 0, y: 0 }, { x: 0, y: 6 })).toBe(true);
  });

  it('considera el movimiento absoluto (negativo también cuenta)', () => {
    expect(huboArrastre({ x: 50, y: 50 }, { x: 0, y: 50 })).toBe(true);
  });

  it('respeta un umbral personalizado', () => {
    expect(huboArrastre({ x: 0, y: 0 }, { x: 8, y: 0 }, 10)).toBe(false);
    expect(huboArrastre({ x: 0, y: 0 }, { x: 11, y: 0 }, 10)).toBe(true);
  });
});
