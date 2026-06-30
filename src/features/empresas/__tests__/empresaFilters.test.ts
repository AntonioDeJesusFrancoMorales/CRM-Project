import { describe, expect, it } from 'vitest';
import type { Empresa } from '@/api/types';
import {
  applyEmpresaFilters,
  createEmptyEmpresaFilters,
  hasActiveEmpresaFilters,
} from '../lib/empresaFilters';

const empresas: Empresa[] = [
  {
    id: 'empresa-1',
    nombre: 'Innovatech Solutions',
    sector: 'Tecnología',
    telefono: '+52 961 123 4567',
    paginaWeb: 'https://innovatech.example.com',
    facebook: null,
    instagram: null,
    twitter: null,
    estadoRelacion: 'ACTIVO',
    responsableId: 'user-1',
    creadoPor: null,
    notas: null,
    creadoEn: '2026-01-20T11:00:00.000Z',
    actualizadoEn: '2026-04-12T15:22:00.000Z',
  },
  {
    id: 'empresa-2',
    nombre: 'Distribuidora del Sur',
    sector: 'Logística',
    telefono: null,
    paginaWeb: null,
    facebook: null,
    instagram: null,
    twitter: null,
    estadoRelacion: 'INACTIVO',
    responsableId: null,
    creadoPor: null,
    notas: null,
    creadoEn: '2026-03-01T08:30:00.000Z',
    actualizadoEn: '2026-04-30T17:45:00.000Z',
  },
];

describe('empresaFilters', () => {
  it('detecta filtros activos', () => {
    expect(hasActiveEmpresaFilters(createEmptyEmpresaFilters())).toBe(false);
    expect(hasActiveEmpresaFilters({ ...createEmptyEmpresaFilters(), sector: 'Tecnología' })).toBe(true);
  });

  it('filtra por búsqueda, estado, sector, responsable y web', () => {
    const result = applyEmpresaFilters(empresas, {
      search: 'innova',
      estadoRelacion: 'ACTIVO',
      sector: 'Tecnología',
      responsableId: 'user-1',
      web: 'con-web',
    });

    expect(result.map((empresa) => empresa.id)).toEqual(['empresa-1']);
  });

  it('filtra empresas sin sitio web', () => {
    const result = applyEmpresaFilters(empresas, { search: '', web: 'sin-web' });

    expect(result.map((empresa) => empresa.id)).toEqual(['empresa-2']);
  });
});
