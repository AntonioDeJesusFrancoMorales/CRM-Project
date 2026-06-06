// Tests unitarios para deriveEstadoTarea — función pura.
// Strict TDD: RED escrito ANTES de crear el archivo de producción.
// Layer: Unit (función pura, sin hooks, sin React, sin MSW).

import { describe, it, expect } from 'vitest';
import { deriveEstadoTarea } from '../lib/deriveEstadoTarea';
import type { Ficha } from '../schemas/ficha.schema';
import type { ColumnaTablero } from '../schemas/tablero.schema';

// ---------------------------------------------------------------------------
// Fixtures de prueba
// ---------------------------------------------------------------------------

const columnas: ColumnaTablero[] = [
  {
    id: 'col-pendiente',
    nombre: 'Por hacer',
    color: '#94A3B8',
    limiteWip: null,
    nota: null,
    estadoTarea: 'PENDIENTE',
    estadoTrato: null,
    totalValorEstimado: 0,
  },
  {
    id: 'col-en-curso',
    nombre: 'En progreso',
    color: '#3B82F6',
    limiteWip: null,
    nota: null,
    estadoTarea: 'EN_CURSO',
    estadoTrato: null,
    totalValorEstimado: 0,
  },
  {
    id: 'col-finalizada',
    nombre: 'Hecho',
    color: '#22C55E',
    limiteWip: null,
    nota: null,
    estadoTarea: 'FINALIZADA',
    estadoTrato: null,
    totalValorEstimado: 0,
  },
];

const fichaBase: Ficha = {
  id: 'ficha-tarea-1',
  columnaId: 'col-pendiente',
  tipoFicha: 'TAREA',
  tratoId: null,
  tareaId: 'tarea-1',
  actualizadoEn: '2026-01-01T00:00:00Z',
};

// ---------------------------------------------------------------------------
// Tests — estados derivados (triangulación de los 3 estados)
// ---------------------------------------------------------------------------

describe('deriveEstadoTarea', () => {
  describe('estados válidos', () => {
    it('retorna PENDIENTE cuando la ficha de la tarea está en columna con estadoTarea PENDIENTE', () => {
      const fichas: Ficha[] = [{ ...fichaBase, tareaId: 'ta1', columnaId: 'col-pendiente' }];
      const resultado = deriveEstadoTarea('ta1', fichas, columnas);
      expect(resultado).toBe('PENDIENTE');
    });

    it('retorna EN_CURSO cuando la ficha de la tarea está en columna con estadoTarea EN_CURSO', () => {
      const fichas: Ficha[] = [{ ...fichaBase, tareaId: 'ta2', columnaId: 'col-en-curso' }];
      const resultado = deriveEstadoTarea('ta2', fichas, columnas);
      expect(resultado).toBe('EN_CURSO');
    });

    it('retorna FINALIZADA cuando la ficha de la tarea está en columna con estadoTarea FINALIZADA', () => {
      const fichas: Ficha[] = [{ ...fichaBase, tareaId: 'ta3', columnaId: 'col-finalizada' }];
      const resultado = deriveEstadoTarea('ta3', fichas, columnas);
      expect(resultado).toBe('FINALIZADA');
    });
  });

  // ---------------------------------------------------------------------------
  // Edge cases
  // ---------------------------------------------------------------------------

  describe('edge cases — retorna null', () => {
    it('retorna null cuando la tarea no tiene ninguna ficha', () => {
      const fichas: Ficha[] = [];
      const resultado = deriveEstadoTarea('ta99', fichas, columnas);
      expect(resultado).toBeNull();
    });

    it('retorna null cuando el array de fichas está vacío', () => {
      const resultado = deriveEstadoTarea('ta1', [], columnas);
      expect(resultado).toBeNull();
    });

    it('retorna null cuando la ficha tiene columnaId que no corresponde a ninguna columna del tablero', () => {
      const fichas: Ficha[] = [
        { ...fichaBase, tareaId: 'ta-huerfana', columnaId: 'col-inexistente' },
      ];
      const resultado = deriveEstadoTarea('ta-huerfana', fichas, columnas);
      expect(resultado).toBeNull();
    });

    it('ignora fichas de tipo TRATO aunque tengan el mismo tareaId (defensivo)', () => {
      const fichas: Ficha[] = [
        {
          ...fichaBase,
          tipoFicha: 'TRATO',
          tareaId: 'ta1',
          columnaId: 'col-pendiente',
        },
      ];
      const resultado = deriveEstadoTarea('ta1', fichas, columnas);
      // No hay ficha de tipo TAREA para esta tarea → null
      expect(resultado).toBeNull();
    });
  });
});
