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

describe('permisoRecursoSchema', () => {
  const base = {
    acciones: ['LEER'] as const,
    idsPermitidos: null,
    gruposLectura: [],
    gruposEscritura: [],
  };

  it('rechaza alcances incompatibles con el recurso', () => {
    expect(
      rolCreateSchema.safeParse({
        nombre: 'Ventas',
        permisos: [{ ...base, recurso: 'ROL', alcance: 'PROPIOS_O_ASIGNADOS' }],
      }).success,
    ).toBe(false);
  });

  it('rechaza IDs no UUID y permite IDs UUID solo con TABLEROS_PERMITIDOS', () => {
    expect(
      rolCreateSchema.safeParse({
        nombre: 'Ventas',
        permisos: [{ ...base, recurso: 'TABLERO', alcance: 'TABLEROS_PERMITIDOS', idsPermitidos: ['no-uuid'] }],
      }).success,
    ).toBe(false);

    expect(
      rolCreateSchema.safeParse({
        nombre: 'Ventas',
        permisos: [{
          ...base,
          recurso: 'TABLERO',
          alcance: 'TABLEROS_PERMITIDOS',
          idsPermitidos: ['11111111-1111-4111-8111-111111111111'],
        }],
      }).success,
    ).toBe(true);
  });

  it('mantiene la escritura sensible dentro de la lectura', () => {
    expect(
      rolCreateSchema.safeParse({
        nombre: 'Ventas',
        permisos: [{
          ...base,
          recurso: 'TRATO',
          alcance: 'TODO_COMPARTIDO',
          gruposLectura: [],
          gruposEscritura: ['FINANCIERO'],
        }],
      }).success,
    ).toBe(false);
  });
});
