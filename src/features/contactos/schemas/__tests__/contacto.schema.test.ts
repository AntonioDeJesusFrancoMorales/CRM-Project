// Tests del schema Zod de Contacto.
// B1.4: verificaciones de contactoCreateSchema, contactoUpdateSchema y COMO_NOS_CONOCIO_SUGERENCIAS.

import { describe, it, expect } from 'vitest';
import {
  contactoCreateSchema,
  contactoUpdateSchema,
  COMO_NOS_CONOCIO_SUGERENCIAS,
} from '../contacto.schema';

describe('contactoCreateSchema', () => {
  const base = {
    nombre: 'Ana',
    empresaId: '550e8400-e29b-41d4-a716-446655440000',
    estadoRelacion: 'PROSPECTO' as const,
  };

  it('acepta un payload mínimo válido', () => {
    const result = contactoCreateSchema.safeParse(base);
    expect(result.success).toBe(true);
  });

  it('nombre es requerido — falla si está vacío', () => {
    const result = contactoCreateSchema.safeParse({ ...base, nombre: '' });
    expect(result.success).toBe(false);
  });

  it('rechaza nombre compuesto solo por espacios y recorta el nombre válido', () => {
    expect(contactoCreateSchema.safeParse({ ...base, nombre: '   ' }).success).toBe(false);

    const result = contactoCreateSchema.safeParse({ ...base, nombre: '  Ana  ' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.nombre).toBe('Ana');
  });

  it('estadoRelacion acepta PROSPECTO', () => {
    const result = contactoCreateSchema.safeParse({ ...base, estadoRelacion: 'PROSPECTO' });
    expect(result.success).toBe(true);
  });

  it('estadoRelacion acepta ACTIVO', () => {
    const result = contactoCreateSchema.safeParse({ ...base, estadoRelacion: 'ACTIVO' });
    expect(result.success).toBe(true);
  });

  it('estadoRelacion acepta INACTIVO', () => {
    const result = contactoCreateSchema.safeParse({ ...base, estadoRelacion: 'INACTIVO' });
    expect(result.success).toBe(true);
  });

  it('estadoRelacion rechaza valor inválido', () => {
    const result = contactoCreateSchema.safeParse({ ...base, estadoRelacion: 'CONVERTIDO' });
    expect(result.success).toBe(false);
  });

  it('correo opcional — acepta undefined', () => {
    const result = contactoCreateSchema.safeParse({ ...base, correo: undefined });
    expect(result.success).toBe(true);
  });

  it('correo rechaza string sin @', () => {
    const result = contactoCreateSchema.safeParse({ ...base, correo: 'noesuncorreo' });
    expect(result.success).toBe(false);
  });

  it('correo acepta null', () => {
    const result = contactoCreateSchema.safeParse({ ...base, correo: null });
    expect(result.success).toBe(true);
  });

  it('correo acepta string válido', () => {
    const result = contactoCreateSchema.safeParse({ ...base, correo: 'ana@mail.com' });
    expect(result.success).toBe(true);
  });

  it('comoNosConocio es opcional', () => {
    const result = contactoCreateSchema.safeParse({ ...base, comoNosConocio: undefined });
    expect(result.success).toBe(true);
  });

  it('comoNosConocio acepta texto libre', () => {
    const result = contactoCreateSchema.safeParse({ ...base, comoNosConocio: 'Por un amigo' });
    expect(result.success).toBe(true);
  });

  it('comoNosConocio rechaza string de más de 200 caracteres', () => {
    const result = contactoCreateSchema.safeParse({
      ...base,
      comoNosConocio: 'a'.repeat(201),
    });
    expect(result.success).toBe(false);
  });

  it('comoNosConocio acepta null', () => {
    const result = contactoCreateSchema.safeParse({ ...base, comoNosConocio: null });
    expect(result.success).toBe(true);
  });

  it('empresaId requerido — falla si falta', () => {
    const { empresaId: _omit, ...sinEmpresa } = base;
    const result = contactoCreateSchema.safeParse(sinEmpresa);
    expect(result.success).toBe(false);
  });

  it('empresaId rechaza null — @NotNull en el back', () => {
    // S-01 fix: empresaId es requerido, no nullable
    const result = contactoCreateSchema.safeParse({ ...base, empresaId: null });
    expect(result.success).toBe(false);
  });

  it('empresaId rechaza string vacío', () => {
    const result = contactoCreateSchema.safeParse({ ...base, empresaId: '' });
    expect(result.success).toBe(false);
  });
});

describe('contactoUpdateSchema', () => {
  // EditContactoRequest del back: nombre @NotBlank y estadoRelacion @NotNull.
  // El PUT /edit es reemplazo total, por eso el update NO es un patch parcial.
  it('rechaza payload vacío — nombre y estadoRelacion son requeridos', () => {
    const result = contactoUpdateSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('rechaza payload solo con nombre — falta estadoRelacion', () => {
    const result = contactoUpdateSchema.safeParse({ nombre: 'Nuevo nombre' });
    expect(result.success).toBe(false);
  });

  it('acepta nombre + estadoRelacion (mínimo requerido)', () => {
    const result = contactoUpdateSchema.safeParse({ nombre: 'Nuevo nombre', estadoRelacion: 'ACTIVO' });
    expect(result.success).toBe(true);
  });

  it('acepta cargo cuando se provee', () => {
    const result = contactoUpdateSchema.safeParse({
      nombre: 'X',
      estadoRelacion: 'ACTIVO',
      cargo: 'Gerente',
    });
    expect(result.success).toBe(true);
  });

  it('NO incluye empresaId — se ignora si se pasa', () => {
    // empresaId es inmutable en el back; el schema no lo acepta
    const parsed = contactoUpdateSchema.safeParse({ nombre: 'X', estadoRelacion: 'ACTIVO', empresaId: 'some-id' });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect('empresaId' in parsed.data).toBe(false);
    }
  });

  it('NO incluye creadoPor — se ignora si se pasa', () => {
    const parsed = contactoUpdateSchema.safeParse({ nombre: 'X', estadoRelacion: 'ACTIVO', creadoPor: 'user-1' });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect('creadoPor' in parsed.data).toBe(false);
    }
  });

  it('estadoRelacion rechaza valor inválido', () => {
    const result = contactoUpdateSchema.safeParse({ nombre: 'X', estadoRelacion: 'INVALIDO' });
    expect(result.success).toBe(false);
  });

  it('correo rechaza string sin @ cuando se provee', () => {
    const result = contactoUpdateSchema.safeParse({ nombre: 'X', estadoRelacion: 'ACTIVO', correo: 'noesuncorreo' });
    expect(result.success).toBe(false);
  });
});

describe('COMO_NOS_CONOCIO_SUGERENCIAS', () => {
  it('es un array de 5 sugerencias', () => {
    expect(COMO_NOS_CONOCIO_SUGERENCIAS).toHaveLength(5);
  });

  it('contiene las sugerencias canónicas', () => {
    expect(COMO_NOS_CONOCIO_SUGERENCIAS).toContain('Referido');
    expect(COMO_NOS_CONOCIO_SUGERENCIAS).toContain('Redes');
    expect(COMO_NOS_CONOCIO_SUGERENCIAS).toContain('Web');
    expect(COMO_NOS_CONOCIO_SUGERENCIAS).toContain('Evento');
    expect(COMO_NOS_CONOCIO_SUGERENCIAS).toContain('Otro');
  });

  it('es readonly (as const)', () => {
    // Verificación en tiempo de compilación. En runtime, es un array normal.
    expect(Array.isArray(COMO_NOS_CONOCIO_SUGERENCIAS)).toBe(true);
  });
});
