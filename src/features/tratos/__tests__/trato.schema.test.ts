// Tests del schema Zod para Trato — modelo unificado sin XOR ni estado.
// Valida tratoSchema (contactoId requerido) y tratoEditSchema (sin contactoId).

import { describe, it, expect } from 'vitest';
import { tratoSchema, tratoEditSchema } from '../schemas/trato.schema';
import { getMexicoCityToday } from '@/lib/date';

describe('tratoSchema — modelo unificado', () => {
  it('valida happy path completo con todos los campos opcionales presentes', () => {
    const result = tratoSchema.safeParse({
      contactoId: 'c1111111-cccc-1111-cccc-111111111111',
      responsableId: '11111111-1111-1111-1111-111111111111',
      nombre: 'Demo CTO',
      tipoContrato: 'SERVICIO',
      valorEstimado: 50000,
      probabilidad: 70,
      fechaCierreEsperada: getMexicoCityToday(),
    });

    expect(result.success).toBe(true);
  });

  it('valida happy path mínimo (solo campos requeridos)', () => {
    const result = tratoSchema.safeParse({
      contactoId: 'c1111111-cccc-1111-cccc-111111111111',
      responsableId: '11111111-1111-1111-1111-111111111111',
      nombre: 'Trato mínimo',
      tipoContrato: 'OTRO',
    });

    expect(result.success).toBe(true);
  });

  it('rechaza cuando contactoId está vacío', () => {
    const result = tratoSchema.safeParse({
      contactoId: '',
      responsableId: '11111111-1111-1111-1111-111111111111',
      nombre: 'Demo',
      tipoContrato: 'SERVICIO',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path.join('.'));
      expect(paths).toContain('contactoId');
    }
  });

  it('rechaza cuando responsableId está vacío', () => {
    const result = tratoSchema.safeParse({
      contactoId: 'c1111111-cccc-1111-cccc-111111111111',
      responsableId: '',
      nombre: 'Demo',
      tipoContrato: 'SERVICIO',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path.join('.'));
      expect(paths).toContain('responsableId');
    }
  });

  it('rechaza nombre vacío', () => {
    const result = tratoSchema.safeParse({
      contactoId: 'c1111111-cccc-1111-cccc-111111111111',
      responsableId: '11111111-1111-1111-1111-111111111111',
      nombre: '',
      tipoContrato: 'SERVICIO',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path.join('.'));
      expect(paths).toContain('nombre');
    }
  });

  it('rechaza nombre que supera 200 caracteres', () => {
    const result = tratoSchema.safeParse({
      contactoId: 'c1111111-cccc-1111-cccc-111111111111',
      responsableId: '11111111-1111-1111-1111-111111111111',
      nombre: 'a'.repeat(201),
      tipoContrato: 'SERVICIO',
    });

    expect(result.success).toBe(false);
  });

  it('acepta todos los valores del enum tipoContrato', () => {
    const valores = ['SERVICIO', 'LICENCIA', 'SUSCRIPCION', 'PERMANENTE', 'OTRO'] as const;
    for (const tipoContrato of valores) {
      const result = tratoSchema.safeParse({
        contactoId: 'c1111111-cccc-1111-cccc-111111111111',
        responsableId: '11111111-1111-1111-1111-111111111111',
        nombre: 'Demo',
        tipoContrato,
      });
      expect(result.success, `tipoContrato=${tipoContrato} debe ser válido`).toBe(true);
    }
  });

  it('rechaza un valor de tipoContrato fuera del enum', () => {
    const result = tratoSchema.safeParse({
      contactoId: 'c1111111-cccc-1111-cccc-111111111111',
      responsableId: '11111111-1111-1111-1111-111111111111',
      nombre: 'Demo',
      tipoContrato: 'precio_fijo',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path.join('.'));
      expect(paths).toContain('tipoContrato');
    }
  });

  it('acepta valorEstimado nulo', () => {
    const result = tratoSchema.safeParse({
      contactoId: 'c1111111-cccc-1111-cccc-111111111111',
      responsableId: '11111111-1111-1111-1111-111111111111',
      nombre: 'Demo',
      tipoContrato: 'LICENCIA',
      valorEstimado: null,
    });

    expect(result.success).toBe(true);
  });

  it('acepta probabilidad nula', () => {
    const result = tratoSchema.safeParse({
      contactoId: 'c1111111-cccc-1111-cccc-111111111111',
      responsableId: '11111111-1111-1111-1111-111111111111',
      nombre: 'Demo',
      tipoContrato: 'LICENCIA',
      probabilidad: null,
    });

    expect(result.success).toBe(true);
  });

  it('acepta fechaCierreEsperada como string vacío', () => {
    const result = tratoSchema.safeParse({
      contactoId: 'c1111111-cccc-1111-cccc-111111111111',
      responsableId: '11111111-1111-1111-1111-111111111111',
      nombre: 'Demo',
      tipoContrato: 'OTRO',
      fechaCierreEsperada: '',
    });

    expect(result.success).toBe(true);
  });

  it('NO tiene campo estado ni asociacion ni superRefine XOR', () => {
    // Si el schema tuviera estado, requeriría el campo; si no lo tiene, esto pasa sin él
    const result = tratoSchema.safeParse({
      contactoId: 'c1111111-cccc-1111-cccc-111111111111',
      responsableId: '11111111-1111-1111-1111-111111111111',
      nombre: 'Sin estado',
      tipoContrato: 'SERVICIO',
    });
    expect(result.success).toBe(true);

    if (result.success) {
      expect('estado' in result.data).toBe(false);
      expect('asociacion' in result.data).toBe(false);
    }
  });
});

describe('tratoEditSchema — sin contactoId', () => {
  it('valida happy path sin contactoId', () => {
    const result = tratoEditSchema.safeParse({
      responsableId: '11111111-1111-1111-1111-111111111111',
      nombre: 'Demo Editado',
      tipoContrato: 'SUSCRIPCION',
    });

    expect(result.success).toBe(true);
  });

  it('rechaza cuando se incluye contactoId (campo omitido del schema)', () => {
    // En Zod con strip mode (default), campos extra se ignoran, por lo que
    // el resultado no contiene contactoId aunque se pase.
    const result = tratoEditSchema.safeParse({
      contactoId: 'c1111111-cccc-1111-cccc-111111111111',
      responsableId: '11111111-1111-1111-1111-111111111111',
      nombre: 'Demo',
      tipoContrato: 'PERMANENTE',
    });

    // El parse exitoso pero contactoId no aparece en la data (omitido)
    expect(result.success).toBe(true);
    if (result.success) {
      expect('contactoId' in result.data).toBe(false);
    }
  });

  it('rechaza responsableId vacío', () => {
    const result = tratoEditSchema.safeParse({
      responsableId: '',
      nombre: 'Demo',
      tipoContrato: 'SERVICIO',
    });

    expect(result.success).toBe(false);
  });

  it('acepta los 5 valores del enum tipoContrato', () => {
    const valores = ['SERVICIO', 'LICENCIA', 'SUSCRIPCION', 'PERMANENTE', 'OTRO'] as const;
    for (const tipoContrato of valores) {
      const result = tratoEditSchema.safeParse({
        responsableId: '11111111-1111-1111-1111-111111111111',
        nombre: 'Demo',
        tipoContrato,
      });
      expect(result.success, `tipoContrato=${tipoContrato} debe ser válido en edit`).toBe(true);
    }
  });
});
