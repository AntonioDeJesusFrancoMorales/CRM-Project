import { describe, expect, it } from 'vitest';
import { tratosFixture } from '@/mocks/fixtures/tratos';
import {
  applyTratoFilters,
  createEmptyTratoFilters,
  hasActiveTratoFilters,
} from '../lib/tratoFilters';

describe('tratoFilters', () => {
  it('createEmptyTratoFilters no tiene filtros activos', () => {
    expect(hasActiveTratoFilters(createEmptyTratoFilters())).toBe(false);
  });

  it('filtra por búsqueda de nombre', () => {
    const result = applyTratoFilters(tratosFixture, { search: 'maya' });

    expect(result.map((trato) => trato.nombre)).toEqual([
      'Consultoría procesos Maya',
      'Automatización logística Maya',
    ]);
  });

  it('filtra por estado', () => {
    const result = applyTratoFilters(tratosFixture, {
      search: '',
      estado: 'PERDIDO',
    });

    expect(result).toHaveLength(1);
    expect(result[0]?.nombre).toBe('Automatización logística Maya');
  });

  it('filtra por tipo de contrato y responsable', () => {
    const result = applyTratoFilters(tratosFixture, {
      search: '',
      tipoContrato: 'LICENCIA',
      responsableId: '22222222-2222-2222-2222-222222222222',
    });

    expect(result).toHaveLength(1);
    expect(result[0]?.nombre).toBe('Renovación licencia anual Innovatech');
  });

  it('filtra por contacto', () => {
    const result = applyTratoFilters(tratosFixture, {
      search: '',
      contactoId: 'c1111111-cccc-1111-cccc-111111111111',
    });

    expect(result.map((trato) => trato.nombre)).toEqual([
      'Renovación licencia anual Innovatech',
      'Portal B2B Innovatech',
    ]);
  });

  it('filtra por rango de valor y excluye valores null cuando hay rango activo', () => {
    const base = tratosFixture[0]!;
    const result = applyTratoFilters(
      [
        ...tratosFixture,
        {
          ...base,
          id: 'sin-valor',
          nombre: 'Trato sin valor',
          valorEstimado: null,
        },
      ],
      { search: '', valorMin: 100000, valorMax: 260000 },
    );

    expect(result.map((trato) => trato.nombre)).toEqual([
      'Implementación CRM Innovatech',
      'Renovación licencia anual Innovatech',
    ]);
  });

  it('filtra por fechas vencidas y próximas', () => {
    const now = new Date('2026-06-20T00:00:00.000Z');

    const vencidas = applyTratoFilters(
      tratosFixture,
      { search: '', cierreEsperado: 'vencidas' },
      now,
    );
    const proximas30 = applyTratoFilters(
      tratosFixture,
      { search: '', cierreEsperado: 'proximos-30' },
      now,
    );

    expect(vencidas.map((trato) => trato.nombre)).toEqual([
      'Portal B2B Innovatech',
      'Automatización logística Maya',
    ]);
    expect(proximas30.map((trato) => trato.nombre)).toEqual([
      'Implementación CRM Innovatech',
      'Consultoría procesos Maya',
    ]);
  });
});
