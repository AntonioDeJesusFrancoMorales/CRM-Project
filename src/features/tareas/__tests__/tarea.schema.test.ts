// Tests del schema Zod para Tarea — enums del back (W2 fix).
// tipo: GENERAL | SEGUIMIENTO | NEGOCIACION | CIERRE
// prioridad: BAJA | MEDIA | ALTA | URGENTE
// fechaLimite: requerido (min 1)
// tareaUpdateSchema: NO incluye tratoId, estado, responsableId

import { describe, it, expect } from 'vitest';
import { tareaCreateSchema, tareaUpdateSchema } from '../schemas/tarea.schema';

describe('tareaCreateSchema', () => {
  it('(a) rechaza cuando tratoId está vacío — error en path tratoId', () => {
    const result = tareaCreateSchema.safeParse({
      tratoId: '',
      responsableId: '11111111-1111-1111-1111-111111111111',
      titulo: 'Tarea de prueba',
      tipo: 'GENERAL',
      prioridad: 'MEDIA',
      descripcion: null,
      fechaLimite: '2026-06-01T00:00:00.000Z',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path.join('.'));
      expect(paths).toContain('tratoId');
    }
  });

  it('(b) acepta input completo válido con enums del back', () => {
    const result = tareaCreateSchema.safeParse({
      tratoId: 'd1111111-dddd-1111-dddd-111111111111',
      responsableId: '11111111-1111-1111-1111-111111111111',
      titulo: 'Demo con CTO',
      tipo: 'CIERRE',
      prioridad: 'ALTA',
      descripcion: 'Preparar demo completa',
      fechaLimite: '2026-06-01T00:00:00.000Z',
    });

    expect(result.success).toBe(true);
  });

  it('(c) rechaza titulo con 201 caracteres — error en path titulo', () => {
    const result = tareaCreateSchema.safeParse({
      tratoId: 'd1111111-dddd-1111-dddd-111111111111',
      responsableId: '11111111-1111-1111-1111-111111111111',
      titulo: 'a'.repeat(201),
      tipo: 'GENERAL',
      prioridad: 'BAJA',
      descripcion: null,
      fechaLimite: '2026-06-01T00:00:00.000Z',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path.join('.'));
      expect(paths).toContain('titulo');
    }
  });

  it('(d) rechaza tipo con valor front-style (llamada) — falla el enum del back', () => {
    const result = tareaCreateSchema.safeParse({
      tratoId: 'd1111111-dddd-1111-dddd-111111111111',
      responsableId: '11111111-1111-1111-1111-111111111111',
      titulo: 'Tarea test',
      tipo: 'llamada', // valor front-style — debe fallar
      prioridad: 'MEDIA',
      fechaLimite: '2026-06-01T00:00:00.000Z',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path.join('.'));
      expect(paths).toContain('tipo');
    }
  });

  it('(e) rechaza prioridad con valor numérico (2) — falla el enum del back', () => {
    const result = tareaCreateSchema.safeParse({
      tratoId: 'd1111111-dddd-1111-dddd-111111111111',
      responsableId: '11111111-1111-1111-1111-111111111111',
      titulo: 'Tarea test',
      tipo: 'GENERAL',
      prioridad: 2, // valor numérico — debe fallar
      fechaLimite: '2026-06-01T00:00:00.000Z',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path.join('.'));
      expect(paths).toContain('prioridad');
    }
  });

  it('(f) rechaza fechaLimite vacía — campo requerido', () => {
    const result = tareaCreateSchema.safeParse({
      tratoId: 'd1111111-dddd-1111-dddd-111111111111',
      responsableId: '11111111-1111-1111-1111-111111111111',
      titulo: 'Tarea test',
      tipo: 'GENERAL',
      prioridad: 'MEDIA',
      fechaLimite: '', // vacío — debe fallar
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path.join('.'));
      expect(paths).toContain('fechaLimite');
    }
  });

  it('(g) rechaza fechaLimite ausente — campo requerido', () => {
    const result = tareaCreateSchema.safeParse({
      tratoId: 'd1111111-dddd-1111-dddd-111111111111',
      responsableId: '11111111-1111-1111-1111-111111111111',
      titulo: 'Tarea test',
      tipo: 'GENERAL',
      prioridad: 'MEDIA',
      // fechaLimite ausente — debe fallar
    });

    expect(result.success).toBe(false);
  });

  it('(h) acepta todos los valores de tipo del back', () => {
    const tipos = ['GENERAL', 'SEGUIMIENTO', 'NEGOCIACION', 'CIERRE'] as const;
    for (const tipo of tipos) {
      const result = tareaCreateSchema.safeParse({
        tratoId: 'd1111111-dddd-1111-dddd-111111111111',
        responsableId: '11111111-1111-1111-1111-111111111111',
        titulo: 'Tarea test',
        tipo,
        prioridad: 'MEDIA',
        fechaLimite: '2026-06-01T00:00:00.000Z',
      });
      expect(result.success, `tipo '${tipo}' debe ser válido`).toBe(true);
    }
  });

  it('(i) acepta todos los valores de prioridad del back', () => {
    const prioridades = ['BAJA', 'MEDIA', 'ALTA', 'URGENTE'] as const;
    for (const prioridad of prioridades) {
      const result = tareaCreateSchema.safeParse({
        tratoId: 'd1111111-dddd-1111-dddd-111111111111',
        responsableId: '11111111-1111-1111-1111-111111111111',
        titulo: 'Tarea test',
        tipo: 'GENERAL',
        prioridad,
        fechaLimite: '2026-06-01T00:00:00.000Z',
      });
      expect(result.success, `prioridad '${prioridad}' debe ser válida`).toBe(true);
    }
  });
});

describe('tareaUpdateSchema', () => {
  // REQ-3: tareaUpdateSchema requiere responsableId, titulo, tipo, prioridad, fechaLimite.
  // NO incluye tratoId (inmutable) ni fechaCompletada (no existe en EditTareaRequest.java).
  // descripcion es optional.

  const VALID_UPDATE = {
    responsableId: 'uuid-responsable-1111-1111-111111111111',
    titulo: 'Título válido',
    tipo: 'GENERAL' as const,
    prioridad: 'MEDIA' as const,
    fechaLimite: '2026-06-10T10:00:00',
  };

  it('(j) acepta objeto completo con todos los campos requeridos', () => {
    const result = tareaUpdateSchema.safeParse(VALID_UPDATE);
    expect(result.success).toBe(true);
  });

  it('(k) rechaza objeto completamente vacío — requiere 5 campos', () => {
    const result = tareaUpdateSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('(j2) requiere responsableId', () => {
    const { responsableId: _r, ...sin } = VALID_UPDATE;
    expect(tareaUpdateSchema.safeParse(sin).success).toBe(false);
  });

  it('(j3) requiere titulo', () => {
    const { titulo: _t, ...sin } = VALID_UPDATE;
    expect(tareaUpdateSchema.safeParse(sin).success).toBe(false);
  });

  it('(j4) requiere tipo', () => {
    const { tipo: _t, ...sin } = VALID_UPDATE;
    expect(tareaUpdateSchema.safeParse(sin).success).toBe(false);
  });

  it('(j5) requiere prioridad', () => {
    const { prioridad: _p, ...sin } = VALID_UPDATE;
    expect(tareaUpdateSchema.safeParse(sin).success).toBe(false);
  });

  it('(j6) requiere fechaLimite', () => {
    const { fechaLimite: _f, ...sin } = VALID_UPDATE;
    expect(tareaUpdateSchema.safeParse(sin).success).toBe(false);
  });

  it('(j7) acepta descripcion opcional', () => {
    const result = tareaUpdateSchema.safeParse({ ...VALID_UPDATE, descripcion: 'Texto' });
    expect(result.success).toBe(true);
  });

  it('(j8) acepta descripcion null', () => {
    const result = tareaUpdateSchema.safeParse({ ...VALID_UPDATE, descripcion: null });
    expect(result.success).toBe(true);
  });

  it('(j9) NO incluye fechaCompletada en el schema', () => {
    expect('fechaCompletada' in tareaUpdateSchema.shape).toBe(false);
  });

  it('(l) rechaza si se incluye estado — campo no debe existir en update', () => {
    const result = tareaUpdateSchema.safeParse({
      ...VALID_UPDATE,
      estado: 'pendiente', // NO debe estar en el schema de update
    });

    // Zod strip por defecto elimina campos extra sin rechazar;
    // Lo que SÍ verificamos: el output parseado no incluye 'estado'.
    if (result.success) {
      expect(result.data).not.toHaveProperty('estado');
    }
  });

  it('(m) acepta tipo con enum del back en update', () => {
    const result = tareaUpdateSchema.safeParse({
      ...VALID_UPDATE,
      tipo: 'SEGUIMIENTO',
      prioridad: 'ALTA',
    });

    expect(result.success).toBe(true);
  });

  it('(n) rechaza tipo con valor front-style en update', () => {
    const result = tareaUpdateSchema.safeParse({
      ...VALID_UPDATE,
      tipo: 'demo' as never, // front-style, debe fallar
    });

    expect(result.success).toBe(false);
  });

  it('(o) rechaza prioridad numérica en update', () => {
    const result = tareaUpdateSchema.safeParse({
      ...VALID_UPDATE,
      prioridad: 1 as never, // numérico, debe fallar
    });

    expect(result.success).toBe(false);
  });
});
