import { describe, it, expect } from 'vitest';
import { rolCreateSchema, rolUpdateSchema } from '../schemas/rol.schema';

describe('rolCreateSchema', () => {
  it('acepta nombre válido con descripcion opcional', () => {
    expect(rolCreateSchema.safeParse({ nombre: 'Gerente' }).success).toBe(true);
    expect(
      rolCreateSchema.safeParse({ nombre: 'Gerente', descripcion: 'Manda' }).success,
    ).toBe(true);
  });

  it('rechaza nombre vacío', () => {
    expect(rolCreateSchema.safeParse({ nombre: '' }).success).toBe(false);
  });

  it('rechaza nombre de más de 80 caracteres', () => {
    expect(rolCreateSchema.safeParse({ nombre: 'x'.repeat(81) }).success).toBe(false);
    expect(rolCreateSchema.safeParse({ nombre: 'x'.repeat(80) }).success).toBe(true);
  });
});

describe('rolUpdateSchema', () => {
  it('acepta un objeto vacío (todos los campos opcionales)', () => {
    expect(rolUpdateSchema.safeParse({}).success).toBe(true);
  });

  it('rechaza nombre vacío cuando se provee', () => {
    expect(rolUpdateSchema.safeParse({ nombre: '' }).success).toBe(false);
  });
});
