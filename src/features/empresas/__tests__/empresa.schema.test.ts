// Tests RED→GREEN para empresaCreateSchema y empresaUpdateSchema.
// REQ-2: pagina_web → paginaWeb (camelCase).
// Fase 2.4 del change alinear-contrato-fixes.

import { describe, it, expect } from 'vitest';
import { empresaCreateSchema, empresaUpdateSchema } from '../schemas/empresa.schema';

describe('empresaCreateSchema — paginaWeb camelCase (REQ-2)', () => {
  it('acepta paginaWeb (camelCase)', () => {
    const result = empresaCreateSchema.safeParse({ nombre: 'Acme', paginaWeb: 'https://acme.com' });
    expect(result.success).toBe(true);
  });

  it('NO tiene el campo pagina_web (snake_case) en el schema', () => {
    const schema = empresaCreateSchema;
    expect('pagina_web' in schema.shape).toBe(false);
    expect('paginaWeb' in schema.shape).toBe(true);
  });

  it('el campo paginaWeb es opcional', () => {
    const result = empresaCreateSchema.safeParse({ nombre: 'Solo nombre' });
    expect(result.success).toBe(true);
  });

  it('paginaWeb acepta una URL completa y un dominio sin esquema', () => {
    const result = empresaCreateSchema.safeParse({ nombre: 'X', paginaWeb: 'https://ejemplo.com' });
    expect(result.success).toBe(true);

    const bareDomain = empresaCreateSchema.safeParse({ nombre: 'X', paginaWeb: 'www.ejemplo.com' });
    expect(bareDomain.success).toBe(true);
  });

  it('paginaWeb acepta string vacío', () => {
    const result = empresaCreateSchema.safeParse({ nombre: 'X', paginaWeb: '' });
    expect(result.success).toBe(true);
  });

  it('paginaWeb rechaza URL inválida (sin http)', () => {
    const result = empresaCreateSchema.safeParse({ nombre: 'X', paginaWeb: 'no-es-url' });
    expect(result.success).toBe(false);
  });

  it('paginaWeb rechaza esquemas no web con un mensaje en español', () => {
    const result = empresaCreateSchema.safeParse({ nombre: 'X', paginaWeb: 'ftp://ejemplo.com' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe('La página web debe ser una URL válida.');
    }
  });

  it('rejects a whitespace-only required name and trims optional text', () => {
    expect(empresaCreateSchema.safeParse({ nombre: '   ' }).success).toBe(false);

    const result = empresaCreateSchema.safeParse({ nombre: '  Acme  ', sector: '   ' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.nombre).toBe('Acme');
      expect(result.data.sector).toBe('');
    }
  });

  it('accepts social profile URLs and handles', () => {
    const result = empresaCreateSchema.safeParse({
      nombre: 'X',
      facebook: 'https://facebook.com/empresa',
      instagram: '@qa_example_01',
      twitter: '@qa_example_01',
    });
    expect(result.success).toBe(true);
  });
});

describe('empresaUpdateSchema — deriva de empresaCreateSchema.partial()', () => {
  it('paginaWeb es opcional en update', () => {
    const result = empresaUpdateSchema.safeParse({ nombre: 'Renombrada' });
    expect(result.success).toBe(true);
  });

  it('NO tiene pagina_web en update schema', () => {
    expect('pagina_web' in empresaUpdateSchema.shape).toBe(false);
    expect('paginaWeb' in empresaUpdateSchema.shape).toBe(true);
  });
});
