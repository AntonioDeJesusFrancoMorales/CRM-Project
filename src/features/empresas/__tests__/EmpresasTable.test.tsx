import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { Empresa } from '@/api/types';
import { EmpresasTable } from '../components/EmpresasTable';

const longName = 'Empresa con un nombre extraordinariamente largo para validar el ancho de la tabla';

const empresa: Empresa = {
  id: 'empresa-larga',
  nombre: longName,
  sector: 'Tecnología',
  telefono: null,
  paginaWeb: 'https://example.com',
  facebook: null,
  instagram: null,
  twitter: null,
  estadoRelacion: 'ACTIVO',
  responsableId: null,
  creadoPor: null,
  notas: null,
  creadoEn: '2026-01-20T11:00:00.000Z',
  actualizadoEn: '2026-04-12T15:22:00.000Z',
};

describe('EmpresasTable', () => {
  it('uses a fixed layout and preserves the full name in a title tooltip', () => {
    render(
      <EmpresasTable
        empresas={[empresa]}
        onView={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    expect(screen.getByRole('table')).toHaveClass('table-fixed');
    expect(screen.getByRole('button', { name: longName })).toHaveAttribute('title', longName);
    expect(screen.getByRole('button', { name: longName })).toHaveClass('truncate');
  });
});
