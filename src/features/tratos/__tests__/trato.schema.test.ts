// Tests del schema Zod para Trato — ADR-042 XOR cliente_id/prospecto_id.
// Valida exactamente uno entre cliente_id y prospecto_id según el toggle `asociacion`.

import { describe, it, expect } from 'vitest';
import { tratoCreateSchema } from '../schemas/trato.schema';

describe('tratoCreateSchema — XOR cliente_id/prospecto_id', () => {
  it('valida happy path con asociacion=cliente y cliente_id lleno', () => {
    const result = tratoCreateSchema.safeParse({
      asociacion: 'cliente',
      cliente_id: 'c1111111-cccc-1111-cccc-111111111111',
      prospecto_id: '',
      nombre: 'Demo CTO',
      responsable_id: '11111111-1111-1111-1111-111111111111',
      valor_estimado: 50000,
      probabilidad: 70,
      fecha_cierre_esperada: '2026-06-30',
      tipo_contrato: 'precio_fijo',
    });

    expect(result.success).toBe(true);
  });

  it('valida happy path con asociacion=prospecto y prospecto_id lleno', () => {
    const result = tratoCreateSchema.safeParse({
      asociacion: 'prospecto',
      cliente_id: '',
      prospecto_id: 'b1111111-bbbb-1111-bbbb-111111111111',
      nombre: 'Lead nuevo',
      responsable_id: '11111111-1111-1111-1111-111111111111',
    });

    expect(result.success).toBe(true);
  });

  it('rechaza cuando asociacion=cliente y cliente_id está vacío (error en cliente_id)', () => {
    const result = tratoCreateSchema.safeParse({
      asociacion: 'cliente',
      cliente_id: '',
      prospecto_id: '',
      nombre: 'Demo CTO',
      responsable_id: '11111111-1111-1111-1111-111111111111',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path.join('.'));
      expect(paths).toContain('cliente_id');
    }
  });

  it('rechaza cuando asociacion=cliente y ambos llenos (error en prospecto_id)', () => {
    const result = tratoCreateSchema.safeParse({
      asociacion: 'cliente',
      cliente_id: 'c1111111-cccc-1111-cccc-111111111111',
      prospecto_id: 'b1111111-bbbb-1111-bbbb-111111111111',
      nombre: 'Demo CTO',
      responsable_id: '11111111-1111-1111-1111-111111111111',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path.join('.'));
      expect(paths).toContain('prospecto_id');
    }
  });

  it('rechaza cuando asociacion=prospecto y ambos llenos (error en cliente_id)', () => {
    const result = tratoCreateSchema.safeParse({
      asociacion: 'prospecto',
      cliente_id: 'c1111111-cccc-1111-cccc-111111111111',
      prospecto_id: 'b1111111-bbbb-1111-bbbb-111111111111',
      nombre: 'Demo CTO',
      responsable_id: '11111111-1111-1111-1111-111111111111',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path.join('.'));
      expect(paths).toContain('cliente_id');
    }
  });

  it('rechaza nombre vacío con error en path nombre', () => {
    const result = tratoCreateSchema.safeParse({
      asociacion: 'cliente',
      cliente_id: 'c1111111-cccc-1111-cccc-111111111111',
      prospecto_id: '',
      nombre: '',
      responsable_id: '11111111-1111-1111-1111-111111111111',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path.join('.'));
      expect(paths).toContain('nombre');
    }
  });
});
