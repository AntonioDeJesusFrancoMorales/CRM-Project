// KanbanBoard.test.tsx
// Lote 3: sección de fixtures (REQ: fixtures incluyen ganado y perdido)
// Lotes 4+ ampliarán este archivo con tests de integración del board completo.

import { describe, it, expect } from 'vitest';
import { tratosFixture } from '@/mocks/fixtures/tratos';

describe('tratosFixture', () => {
  it('incluye al menos 1 trato con estado ganado', () => {
    const ganados = tratosFixture.filter((t) => t.estado === 'ganado');
    expect(ganados.length).toBeGreaterThanOrEqual(1);
  });

  it('incluye al menos 1 trato con estado perdido', () => {
    const perdidos = tratosFixture.filter((t) => t.estado === 'perdido');
    expect(perdidos.length).toBeGreaterThanOrEqual(1);
  });
});
