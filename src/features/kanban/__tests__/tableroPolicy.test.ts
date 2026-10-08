import { describe, expect, it } from 'vitest';
import {
  canDeleteTablero,
  getBaseTableroIds,
  type TableroProtectionRecord,
} from '../lib/tableroPolicy';

function board(
  id: string,
  tipoTablero: TableroProtectionRecord['tipoTablero'],
  creadoEn: string,
): TableroProtectionRecord {
  return { id, tipoTablero, creadoEn };
}

describe('tableroPolicy', () => {
  it('protects the oldest board of each supported type', () => {
    const baseIds = getBaseTableroIds([
      board('tratos-old', 'TRATOS', '2024-01-01T00:00:00Z'),
      board('tratos-extra', 'TRATOS', '2025-01-01T00:00:00Z'),
      board('tareas-old', 'TAREAS', '2024-02-01T00:00:00Z'),
      board('tareas-extra', 'TAREAS', '2025-02-01T00:00:00Z'),
    ]);

    expect([...baseIds].sort()).toEqual(['tareas-old', 'tratos-old']);
    expect(canDeleteTablero({ id: 'tratos-old' }, baseIds)).toBe(false);
    expect(canDeleteTablero({ id: 'tratos-extra' }, baseIds)).toBe(true);
  });

  it('uses id as deterministic tie-breaker when creation timestamps match', () => {
    const baseIds = getBaseTableroIds([
      board('z-board', 'TRATOS', '2024-01-01T00:00:00Z'),
      board('a-board', 'TRATOS', '2024-01-01T00:00:00Z'),
    ]);

    expect([...baseIds]).toEqual(['a-board']);
  });
});
