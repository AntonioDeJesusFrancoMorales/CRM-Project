import { describe, expect, it } from 'vitest';
import type { Empresa } from '@/api/types';
import {
  DUPLICATE_EMPRESA_NAME_MESSAGE,
  hasDuplicateEmpresaName,
  mapEmpresaServerError,
} from '../lib/empresaValidation';

const empresas: Empresa[] = [
  {
    id: 'empresa-1',
    nombre: 'Innovatech Solutions',
    sector: null,
    telefono: null,
    paginaWeb: null,
    facebook: null,
    instagram: null,
    twitter: null,
    estadoRelacion: 'ACTIVO',
    responsableId: null,
    creadoPor: null,
    notas: null,
    creadoEn: '',
    actualizadoEn: '',
  },
];

describe('empresa validation helpers', () => {
  it('compares duplicate names after trimming and case normalization', () => {
    expect(hasDuplicateEmpresaName(empresas, '  innovatech solutions  ')).toBe(true);
    expect(hasDuplicateEmpresaName(empresas, 'innovatech solutions', 'empresa-1')).toBe(false);
    expect(hasDuplicateEmpresaName(empresas, '   ')).toBe(false);
    expect(DUPLICATE_EMPRESA_NAME_MESSAGE).toBe('Ya existe una empresa con este nombre.');
  });

  it('maps the backend name alias and English required message', () => {
    expect(mapEmpresaServerError({ field: 'name', message: 'name is required' })).toEqual({
      field: 'nombre',
      message: 'El nombre es requerido',
    });
  });

  it('maps both website aliases to the Spanish field-level message', () => {
    expect(
      mapEmpresaServerError({
        field: 'pagina_web',
        message: 'El campo pagina_web tiene un formato de URL inválido.',
      }),
    ).toEqual({
      field: 'paginaWeb',
      message: 'La página web debe ser una URL válida.',
    });
    expect(
      mapEmpresaServerError({ field: 'paginaWeb', message: 'must be a valid URL' }),
    ).toEqual({
      field: 'paginaWeb',
      message: 'La página web debe ser una URL válida.',
    });
  });

  it('preserves useful messages for other known fields', () => {
    expect(mapEmpresaServerError({ field: 'telefono', message: 'El teléfono ya existe' })).toEqual({
      field: 'telefono',
      message: 'El teléfono ya existe',
    });
  });
});
