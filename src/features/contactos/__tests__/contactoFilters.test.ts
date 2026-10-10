import { describe, expect, it } from 'vitest';
import type { Contacto } from '@/api/types';
import {
  applyContactoFilters,
  createEmptyContactoFilters,
  hasActiveContactoFilters,
} from '../lib/contactoFilters';

const contactos: Contacto[] = [
  {
    id: 'contacto-1',
    nombre: 'Lucía',
    correo: null,
    telefono: '+52 961 111 0001',
    empresaId: 'empresa-1',
    estadoRelacion: 'PROSPECTO',
    cargo: null,
    comoNosConocio: null,
    responsableId: null,
    creadoPor: null,
    creadoEn: '2026-01-15T09:00:00.000Z',
    actualizadoEn: '2026-01-15T09:00:00.000Z',
  },
  {
    id: 'contacto-2',
    nombre: 'Martín',
    correo: 'martin.gutierrez@example.com',
    telefono: '+52 961 222 0002',
    empresaId: 'empresa-2',
    estadoRelacion: 'PROSPECTO',
    cargo: 'Gerente de Compras',
    comoNosConocio: 'Referido',
    responsableId: 'user-1',
    creadoPor: 'user-1',
    creadoEn: '2026-02-01T10:30:00.000Z',
    actualizadoEn: '2026-02-10T14:00:00.000Z',
  },
];

describe('contactoFilters', () => {
  it('detecta filtros activos', () => {
    expect(hasActiveContactoFilters(createEmptyContactoFilters())).toBe(false);
    expect(hasActiveContactoFilters({ ...createEmptyContactoFilters(), search: 'gerente' })).toBe(true);
  });

  it('filtra por búsqueda, empresa, responsable y origen', () => {
    const result = applyContactoFilters(contactos, {
      search: 'gerente',
      empresaId: 'empresa-2',
      responsableId: 'user-1',
      comoNosConocio: 'Referido',
    });

    expect(result.map((contacto) => contacto.id)).toEqual(['contacto-2']);
  });

  it('no usa correo ni teléfono para buscar cuando no se puede leer el grupo privado', () => {
    expect(
      applyContactoFilters(contactos, { search: 'martin.gutierrez@example.com' }, {
        includePrivateData: false,
      }),
    ).toEqual([]);
    expect(
      applyContactoFilters(contactos, { search: '961 222 0002' }, { includePrivateData: false }),
    ).toEqual([]);
  });
});
