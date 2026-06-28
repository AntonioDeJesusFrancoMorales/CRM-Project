import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createListPreset,
  loadListPresets,
  saveListPresets,
  type ListPreset,
} from '../lib/listPresets';

const STORAGE_KEY = 'crm:test-presets';

interface TestFilters {
  search: string;
}

describe('listPresets', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('devuelve [] cuando no hay storage', () => {
    expect(loadListPresets<TestFilters>(STORAGE_KEY)).toEqual([]);
  });

  it('carga presets válidos', () => {
    const presets: Array<ListPreset<TestFilters>> = [
      {
        id: 'p1',
        name: 'Vista test',
        filters: { search: 'maya' },
        createdAt: '2026-01-01T00:00:00.000Z',
      },
    ];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));

    expect(loadListPresets<TestFilters>(STORAGE_KEY)).toEqual(presets);
  });

  it('tolera JSON inválido', () => {
    localStorage.setItem(STORAGE_KEY, '{bad-json');

    expect(loadListPresets<TestFilters>(STORAGE_KEY)).toEqual([]);
  });

  it('guarda presets en localStorage', () => {
    const presets: Array<ListPreset<TestFilters>> = [
      createListPreset('Vista guardada', { search: 'crm' }),
    ];

    saveListPresets(STORAGE_KEY, presets);

    expect(loadListPresets<TestFilters>(STORAGE_KEY)).toEqual(presets);
  });

  it('ignora errores al guardar', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('storage unavailable');
    });

    expect(() => saveListPresets(STORAGE_KEY, [])).not.toThrow();
  });
});
