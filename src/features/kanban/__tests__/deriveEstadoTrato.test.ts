// Tests unitarios para deriveEstadoTrato — función pura.
// Strict TDD: RED escrito ANTES de crear el archivo de producción.
// Layer: Unit (función pura, sin hooks, sin React, sin MSW).

import { describe, it, expect } from 'vitest';
import { deriveEstadoTrato } from '../lib/deriveEstadoTrato';
import type { Ficha } from '../schemas/ficha.schema';
import type { ColumnaTablero } from '../schemas/tablero.schema';

// ---------------------------------------------------------------------------
// Fixtures de prueba
// ---------------------------------------------------------------------------

const columnas: ColumnaTablero[] = [
  {
    id: 'col-abierto-1',
    nombre: 'En curso',
    color: '#3B82F6',
    limiteWip: null,
    nota: null,
    estadoTarea: null,
    estadoTrato: 'ABIERTO',
    totalValorEstimado: 0,
  },
  {
    id: 'col-ganado',
    nombre: 'Ganado',
    color: '#22C55E',
    limiteWip: null,
    nota: null,
    estadoTarea: null,
    estadoTrato: 'GANADO',
    totalValorEstimado: 0,
  },
  {
    id: 'col-perdido',
    nombre: 'Perdido',
    color: '#EF4444',
    limiteWip: null,
    nota: null,
    estadoTarea: null,
    estadoTrato: 'PERDIDO',
    totalValorEstimado: 0,
  },
];

const fichaBase: Ficha = {
  id: 'ficha-1',
  columnaId: 'col-abierto-1',
  tipoFicha: 'TRATO',
  tratoId: 'trato-1',
  tareaId: null,
  responsableId: 'user-1',
  creadoPor: 'user-1',
  creadoEn: '2026-01-01T00:00:00Z',
  actualizadoEn: '2026-01-01T00:00:00Z',
};

// ---------------------------------------------------------------------------
// Tests — happy paths (triangulación de los 3 estados)
// ---------------------------------------------------------------------------

describe('deriveEstadoTrato', () => {
  describe('estados válidos', () => {
    it('retorna ABIERTO cuando la ficha del trato está en columna con estadoTrato ABIERTO', () => {
      const fichas: Ficha[] = [{ ...fichaBase, columnaId: 'col-abierto-1' }];
      const resultado = deriveEstadoTrato('trato-1', fichas, columnas);
      expect(resultado).toBe('ABIERTO');
    });

    it('retorna GANADO cuando la ficha del trato está en columna con estadoTrato GANADO', () => {
      const fichas: Ficha[] = [{ ...fichaBase, columnaId: 'col-ganado' }];
      const resultado = deriveEstadoTrato('trato-1', fichas, columnas);
      expect(resultado).toBe('GANADO');
    });

    it('retorna PERDIDO cuando la ficha del trato está en columna con estadoTrato PERDIDO', () => {
      const fichas: Ficha[] = [{ ...fichaBase, columnaId: 'col-perdido' }];
      const resultado = deriveEstadoTrato('trato-1', fichas, columnas);
      expect(resultado).toBe('PERDIDO');
    });
  });

  // ---------------------------------------------------------------------------
  // Edge cases
  // ---------------------------------------------------------------------------

  describe('edge cases — retorna null', () => {
    it('retorna null cuando el trato no tiene ninguna ficha', () => {
      const fichas: Ficha[] = [];
      const resultado = deriveEstadoTrato('trato-sin-ficha', fichas, columnas);
      expect(resultado).toBeNull();
    });

    it('retorna null cuando la ficha tiene columnaId que no corresponde a ninguna columna del tablero', () => {
      const fichas: Ficha[] = [
        { ...fichaBase, tratoId: 'trato-huerfano', columnaId: 'col-inexistente' },
      ];
      const resultado = deriveEstadoTrato('trato-huerfano', fichas, columnas);
      expect(resultado).toBeNull();
    });

    it('retorna null cuando la columna encontrada tiene estadoTrato null (tablero de TAREAS)', () => {
      const columnasConEstadoNull: ColumnaTablero[] = [
        {
          id: 'col-tarea',
          nombre: 'En curso',
          color: '#3B82F6',
          limiteWip: null,
          nota: null,
          estadoTarea: null,
          estadoTrato: null,
          totalValorEstimado: 0,
        },
      ];
      const fichas: Ficha[] = [{ ...fichaBase, columnaId: 'col-tarea' }];
      const resultado = deriveEstadoTrato('trato-1', fichas, columnasConEstadoNull);
      expect(resultado).toBeNull();
    });

    it('retorna null cuando el array de fichas está vacío', () => {
      const resultado = deriveEstadoTrato('trato-1', [], columnas);
      expect(resultado).toBeNull();
    });

    it('retorna null cuando el array de columnas está vacío pero hay ficha', () => {
      const fichas: Ficha[] = [{ ...fichaBase }];
      const resultado = deriveEstadoTrato('trato-1', fichas, []);
      expect(resultado).toBeNull();
    });
  });

  // ---------------------------------------------------------------------------
  // Múltiples fichas para el mismo trato
  // ---------------------------------------------------------------------------

  describe('múltiples fichas para el mismo trato', () => {
    it('usa la primera ficha encontrada cuando hay múltiples fichas de tipo TRATO con el mismo tratoId', () => {
      // Comportamiento definido: find() retorna la PRIMERA ficha que coincide.
      // La ficha más antigua (la que aparece primero en el array) determina el estado.
      // Decisión documentada: consistencia con Array.find() — orden del caller define la prioridad.
      const fichas: Ficha[] = [
        { ...fichaBase, id: 'ficha-primera', columnaId: 'col-abierto-1', creadoEn: '2026-01-01T00:00:00Z' },
        { ...fichaBase, id: 'ficha-segunda', columnaId: 'col-ganado', creadoEn: '2026-01-02T00:00:00Z' },
      ];
      const resultado = deriveEstadoTrato('trato-1', fichas, columnas);
      expect(resultado).toBe('ABIERTO'); // primera ficha = col-abierto-1 → ABIERTO
    });
  });

  // ---------------------------------------------------------------------------
  // Solo considera fichas de tipo TRATO, no TAREA
  // ---------------------------------------------------------------------------

  describe('filtro por tipoFicha', () => {
    it('ignora fichas de tipo TAREA aunque tengan el mismo tratoId (imposible en back, pero defensivo)', () => {
      const fichas: Ficha[] = [
        {
          ...fichaBase,
          tipoFicha: 'TAREA',
          tratoId: 'trato-1',
          columnaId: 'col-ganado',
        },
      ];
      const resultado = deriveEstadoTrato('trato-1', fichas, columnas);
      // No hay ficha de tipo TRATO para este trato → null
      expect(resultado).toBeNull();
    });
  });
});
