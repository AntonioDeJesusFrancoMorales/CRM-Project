// TratoInfoTab — tests de componente presentacional puro (sin hooks, sin MSW).
// Cubre: display condicional de motivoPerdida (S1 del verify).

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';

import { TratoInfoTab } from '../components/TratoInfoTab';
import type { Trato } from '@/api/types';

// Trato base sin motivoPerdida.
const tratoBase: Trato = {
  id: 'd1111111-dddd-1111-dddd-111111111111',
  contactoId: 'b1111111-bbbb-1111-bbbb-111111111111',
  responsableId: '22222222-2222-2222-2222-222222222222',
  nombre: 'Implementación CRM Innovatech',
  valorEstimado: 250000,
  probabilidad: 70,
  fechaCierreEsperada: '2026-06-30',
  tipoContrato: 'SERVICIO',
  motivoPerdida: null,
  creadoEn: '2026-04-05T10:00:00.000Z',
  actualizadoEn: '2026-05-08T15:00:00.000Z',
};

// Trato con motivoPerdida no-null (fixture d5555555).
const tratoConMotivoPerdida: Trato = {
  id: 'd5555555-dddd-5555-dddd-555555555555',
  contactoId: 'b1111111-bbbb-1111-bbbb-111111111111',
  responsableId: '11111111-1111-1111-1111-111111111111',
  nombre: 'Automatización logística Maya',
  valorEstimado: 75000,
  probabilidad: 0,
  fechaCierreEsperada: '2026-01-31',
  tipoContrato: 'OTRO',
  motivoPerdida: 'Presupuesto insuficiente del cliente',
  creadoEn: '2025-12-01T08:00:00.000Z',
  actualizadoEn: '2026-01-31T18:00:00.000Z',
};

// TratoInfoTab usa <Link> de react-router, así que necesita MemoryRouter.
function renderTab(props: Partial<Parameters<typeof TratoInfoTab>[0]> & { trato: Trato }) {
  return render(
    <MemoryRouter>
      <TratoInfoTab {...props} />
    </MemoryRouter>,
  );
}

describe('TratoInfoTab', () => {
  it('muestra el label "Motivo de pérdida" y el texto cuando motivoPerdida no es null', () => {
    renderTab({
      trato: tratoConMotivoPerdida,
      contactoNombre: 'Carlos',
      contactoId: 'b1111111-bbbb-1111-bbbb-111111111111',
      responsableNombre: 'Antonio Franco',
    });

    // El label aparece como texto uppercase (CSS lo puede transformar, pero el DOM lo tiene literal).
    expect(screen.getByText(/motivo de pérdida/i)).toBeInTheDocument();
    expect(screen.getByText('Presupuesto insuficiente del cliente')).toBeInTheDocument();
  });

  it('NO muestra el label "Motivo de pérdida" cuando motivoPerdida es null', () => {
    renderTab({
      trato: tratoBase,
      contactoNombre: 'Carlos',
      contactoId: 'b1111111-bbbb-1111-bbbb-111111111111',
      responsableNombre: 'María González',
    });

    expect(screen.queryByText(/motivo de pérdida/i)).not.toBeInTheDocument();
  });
});
