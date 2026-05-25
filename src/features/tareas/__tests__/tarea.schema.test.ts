// Tests del schema Zod para Tarea — trato_id REQUERIDO (ADR Lote B).

import { describe, it, expect } from 'vitest';
import { tareaCreateSchema, tareaUpdateSchema } from '../schemas/tarea.schema';

describe('tareaCreateSchema', () => {
  it('(a) rechaza cuando trato_id está vacío — error en path trato_id', () => {
    const result = tareaCreateSchema.safeParse({
      trato_id: '',
      responsable_id: '11111111-1111-1111-1111-111111111111',
      titulo: 'Tarea de prueba',
      tipo: 'llamada',
      prioridad: 2,
      descripcion: null,
      fecha_limite: null,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path.join('.'));
      expect(paths).toContain('trato_id');
    }
  });

  it('(b) acepta input completo válido', () => {
    const result = tareaCreateSchema.safeParse({
      trato_id: 'd1111111-dddd-1111-dddd-111111111111',
      responsable_id: '11111111-1111-1111-1111-111111111111',
      titulo: 'Demo con CTO',
      tipo: 'demo',
      prioridad: 1,
      descripcion: 'Preparar demo completa',
      fecha_limite: '2026-06-01',
    });

    expect(result.success).toBe(true);
  });

  it('(c) rechaza titulo con 201 caracteres — error en path titulo', () => {
    const result = tareaCreateSchema.safeParse({
      trato_id: 'd1111111-dddd-1111-dddd-111111111111',
      responsable_id: '11111111-1111-1111-1111-111111111111',
      titulo: 'a'.repeat(201),
      tipo: 'llamada',
      prioridad: 2,
      descripcion: null,
      fecha_limite: null,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path.join('.'));
      expect(paths).toContain('titulo');
    }
  });
});

describe('tareaUpdateSchema', () => {
  it('(d) acepta objeto parcial sin trato_id', () => {
    const result = tareaUpdateSchema.safeParse({
      titulo: 'Nuevo título',
      estado: 'en_progreso',
    });

    expect(result.success).toBe(true);
  });

  it('acepta objeto completamente vacío (todo opcional)', () => {
    const result = tareaUpdateSchema.safeParse({});

    expect(result.success).toBe(true);
  });
});
