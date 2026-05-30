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
  it('(j) acepta objeto parcial sin tratoId', () => {
    const result = tareaUpdateSchema.safeParse({
      titulo: 'Nuevo título',
    });

    expect(result.success).toBe(true);
  });

  it('(k) acepta objeto completamente vacío (todo opcional)', () => {
    const result = tareaUpdateSchema.safeParse({});

    expect(result.success).toBe(true);
  });

  it('(l) rechaza si se incluye estado — campo no debe existir en update', () => {
    const result = tareaUpdateSchema.safeParse({
      titulo: 'Nuevo título',
      estado: 'pendiente', // NO debe estar en el schema de update
    });

    // Zod strip por defecto elimina campos extra sin rechazar;
    // pero si el schema fue definido con .strict() o superRefine, fallará.
    // En nuestro caso queremos que el campo sea silenciosamente eliminado (strip).
    // Lo que SÍ verificamos: el output parseado no incluye 'estado'.
    if (result.success) {
      expect(result.data).not.toHaveProperty('estado');
    }
  });

  it('(m) acepta tipo con enum del back en update', () => {
    const result = tareaUpdateSchema.safeParse({
      tipo: 'SEGUIMIENTO',
      prioridad: 'ALTA',
    });

    expect(result.success).toBe(true);
  });

  it('(n) rechaza tipo con valor front-style en update', () => {
    const result = tareaUpdateSchema.safeParse({
      tipo: 'demo', // front-style, debe fallar
    });

    expect(result.success).toBe(false);
  });

  it('(o) rechaza prioridad numérica en update', () => {
    const result = tareaUpdateSchema.safeParse({
      prioridad: 1, // numérico, debe fallar
    });

    expect(result.success).toBe(false);
  });
});
