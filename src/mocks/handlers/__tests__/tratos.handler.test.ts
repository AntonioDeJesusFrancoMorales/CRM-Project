// Tests de los handlers MSW de tratos.
// Cubre: DELETE 409 con tareas asociadas, DELETE 204 sin tareas,
// DELETE 404 trato inexistente.
// Verificación D4: la fixture cubre ambos paths (d1111111 con tareas, d3333333 sin tareas).

import { describe, it, expect } from 'vitest';
import { tratosFixture } from '@/mocks/fixtures/tratos';
import { tareasFixture } from '@/mocks/fixtures/tareas';

// IDs del fixture
// d1111111 → "Implementación CRM Innovatech" → tiene 2 tareas (e1111111, e2222222)
// d2222222 → "Renovación licencia anual Innovatech" → SIN tareas
// d3333333 → "Consultoría procesos Maya" → SIN tareas
// Tests de DELETE 204 usan d3333333 para no acoplar con otros tests que puedan usar d2222222.

const TRATO_WITH_TAREAS = 'd1111111-dddd-1111-dddd-111111111111';
const TRATO_WITHOUT_TAREAS = 'd3333333-dddd-3333-dddd-333333333333';
const TRATO_NONEXISTENT = 'ffffffff-ffff-ffff-ffff-ffffffffffff';

// Verificación fixture — invariante D4 que sustenta los tests destructivos.
// Va PRIMERO porque DELETE 204 splice-a TRATO_WITHOUT_TAREAS del fixture (importado por referencia).
describe('fixture verification (D4 invariante)', () => {
  it('d1111111 tiene exactamente 2 tareas en tareasFixture', () => {
    const tareas = tareasFixture.filter((t) => t.tratoId === TRATO_WITH_TAREAS);
    expect(tareas).toHaveLength(2);
  });

  it('d3333333 no tiene tareas en tareasFixture', () => {
    const tareas = tareasFixture.filter((t) => t.tratoId === TRATO_WITHOUT_TAREAS);
    expect(tareas).toHaveLength(0);
  });

  it('d3333333 existe en tratosFixture (precondición DELETE 204)', () => {
    const trato = tratosFixture.find((t) => t.id === TRATO_WITHOUT_TAREAS);
    expect(trato).toBeDefined();
  });
});

describe('tratos MSW handler — DELETE /tratos/:id', () => {
  it('responde 204 cuando el trato no tiene tareas asociadas', async () => {
    const res = await fetch(`/api/tratos/${TRATO_WITHOUT_TAREAS}`, {
      method: 'DELETE',
    });
    expect(res.status).toBe(204);
  });

  it('responde 409 cuando el trato tiene tareas asociadas, con mensaje que incluye conteo', async () => {
    const res = await fetch(`/api/tratos/${TRATO_WITH_TAREAS}`, {
      method: 'DELETE',
    });
    expect(res.status).toBe(409);

    const body = (await res.json()) as {
      status: number;
      error: string;
      message: string;
      details?: Array<{ field: string; message: string }>;
    };
    expect(body.status).toBe(409);
    expect(body.error).toBe('CONFLICT');
    // El mensaje debe mencionar el conteo de tareas (2 tareas en fixture)
    expect(body.message).toMatch(/2 tareas/);
    expect(body.details?.[0]?.field).toBe('trato_id');
  });

  it('responde 404 cuando el trato no existe', async () => {
    const res = await fetch(`/api/tratos/${TRATO_NONEXISTENT}`, {
      method: 'DELETE',
    });
    expect(res.status).toBe(404);
  });
});
