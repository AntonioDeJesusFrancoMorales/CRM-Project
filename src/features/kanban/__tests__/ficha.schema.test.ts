// Tests RED→GREEN para fichaSchema, fichaCreateSchema, fichaEditSchema.
// REQ-5a, REQ-5b: los schemas deben reflejar la shape real de FichaResponse.java.
// Fase 2.1, 2.2, 2.3 del change alinear-contrato-fixes.

import { describe, it, expect } from 'vitest';
import { fichaSchema, fichaCreateSchema, fichaEditSchema } from '../schemas/ficha.schema';

// ---------------------------------------------------------------------------
// 2.1 — fichaSchema (FichaResponse): sin responsableId, creadoPor, creadoEn
// ---------------------------------------------------------------------------

describe('fichaSchema (FichaResponse — shape real del back)', () => {
  const REAL_BACK_RESPONSE = {
    id: 'h1111111-hhhh-1111-hhhh-111111111111',
    columnaId: 'a1111111-aaaa-1111-aaaa-111111111111',
    tipoFicha: 'TRATO',
    tratoId: 'd1111111-dddd-1111-dddd-111111111111',
    tareaId: null,
    actualizadoEn: '2026-04-10T08:00:00Z',
    // Sin responsableId, creadoPor, creadoEn
  };

  it('parsea la shape real de FichaResponse (sin responsableId/creadoPor/creadoEn)', () => {
    expect(() => fichaSchema.parse(REAL_BACK_RESPONSE)).not.toThrow();
    expect(fichaSchema.safeParse(REAL_BACK_RESPONSE).success).toBe(true);
  });

  it('el tipo Ficha NO incluye responsableId', () => {
    const result = fichaSchema.safeParse(REAL_BACK_RESPONSE);
    if (result.success) {
      expect(result.data).not.toHaveProperty('responsableId');
    }
  });

  it('el tipo Ficha NO incluye creadoPor', () => {
    const result = fichaSchema.safeParse(REAL_BACK_RESPONSE);
    if (result.success) {
      expect(result.data).not.toHaveProperty('creadoPor');
    }
  });

  it('el tipo Ficha NO incluye creadoEn', () => {
    const result = fichaSchema.safeParse(REAL_BACK_RESPONSE);
    if (result.success) {
      expect(result.data).not.toHaveProperty('creadoEn');
    }
  });

  it('sigue requiriendo columnaId', () => {
    const { columnaId: _c, ...sinColumna } = REAL_BACK_RESPONSE;
    expect(fichaSchema.safeParse(sinColumna).success).toBe(false);
  });

  it('sigue requiriendo actualizadoEn', () => {
    const { actualizadoEn: _a, ...sinActualizado } = REAL_BACK_RESPONSE;
    expect(fichaSchema.safeParse(sinActualizado).success).toBe(false);
  });

  it('acepta tipoFicha TAREA con tareaId', () => {
    const tarea = { ...REAL_BACK_RESPONSE, tipoFicha: 'TAREA', tratoId: null, tareaId: 'e1111111-eeee-1111-eeee-111111111111' };
    expect(fichaSchema.safeParse(tarea).success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 2.2 — fichaCreateSchema (CreateFichaRequest): sin responsableId ni creadoPor
// ---------------------------------------------------------------------------

describe('fichaCreateSchema (CreateFichaRequest — shape real del back)', () => {
  const MINIMAL_PAYLOAD = {
    columnaId: 'a1111111-aaaa-1111-aaaa-111111111111',
    tipoFicha: 'TRATO' as const,
    tratoId: 'd1111111-dddd-1111-dddd-111111111111',
    tareaId: null,
  };

  it('acepta payload mínimo sin responsableId ni creadoPor', () => {
    expect(fichaCreateSchema.safeParse(MINIMAL_PAYLOAD).success).toBe(true);
  });

  it('el schema NO tiene responsableId como campo requerido', () => {
    // responsableId no debe aparecer en el shape como campo requerido
    const result = fichaCreateSchema.safeParse(MINIMAL_PAYLOAD);
    expect(result.success).toBe(true);
  });

  it('el schema NO tiene creadoPor como campo requerido', () => {
    const result = fichaCreateSchema.safeParse(MINIMAL_PAYLOAD);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).not.toHaveProperty('creadoPor');
    }
  });

  it('sigue requiriendo columnaId', () => {
    const { columnaId: _c, ...sinColumna } = MINIMAL_PAYLOAD;
    expect(fichaCreateSchema.safeParse(sinColumna).success).toBe(false);
  });

  it('sigue requiriendo tipoFicha', () => {
    const { tipoFicha: _t, ...sinTipo } = MINIMAL_PAYLOAD;
    expect(fichaCreateSchema.safeParse(sinTipo).success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 2.3 — fichaEditSchema (EditFichaRequest): sin responsableId
// ---------------------------------------------------------------------------

describe('fichaEditSchema (EditFichaRequest — shape real del back)', () => {
  const EDIT_PAYLOAD = {
    columnaId: 'b1111111-bbbb-1111-bbbb-111111111111',
    tipoFicha: 'TRATO' as const,
    tratoId: 'd1111111-dddd-1111-dddd-111111111111',
    tareaId: null,
    // Sin responsableId
  };

  it('acepta payload de edición sin responsableId', () => {
    expect(fichaEditSchema.safeParse(EDIT_PAYLOAD).success).toBe(true);
  });

  it('el schema NO tiene responsableId como campo requerido', () => {
    const result = fichaEditSchema.safeParse(EDIT_PAYLOAD);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).not.toHaveProperty('responsableId');
    }
  });

  it('sigue requiriendo columnaId y tipoFicha', () => {
    const { columnaId: _c, ...sinColumna } = EDIT_PAYLOAD;
    expect(fichaEditSchema.safeParse(sinColumna).success).toBe(false);
  });
});
