// TratoEditDialog — test de pre-llenado del form con datos del trato.
// Cubre: el input "Nombre del trato" se pre-llena con el nombre del fixture.
// Nota: TratoForm usa useContactos y useUsuarios, por lo que necesita
// QueryClientProvider + MSW (handlers activos via setupTests.ts).

import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { TratoEditDialog } from '../components/TratoEditDialog';
import type { Trato } from '@/api/types';

// Fixture d1111111 con todos los campos necesarios para el pre-fill.
const trato: Trato = {
  id: 'd1111111-dddd-1111-dddd-111111111111',
  contactoId: 'b1111111-bbbb-1111-bbbb-111111111111',
  responsableId: '22222222-2222-2222-2222-222222222222',
  nombre: 'Implementación CRM Innovatech',
  valorEstimado: 250000,
  probabilidad: 70,
  fechaCierreEsperada: '2026-06-30',
  tipoContrato: 'SERVICIO',
  estado: 'ABIERTO',
  motivoPerdida: null,
  creadoEn: '2026-04-05T10:00:00.000Z',
  actualizadoEn: '2026-05-08T15:00:00.000Z',
};

function renderDialog(open = true) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <TratoEditDialog open={open} onOpenChange={() => {}} trato={trato} />
    </QueryClientProvider>,
  );
}

describe('TratoEditDialog', () => {
  it('pre-llena el input "Nombre del trato" con el nombre del trato recibido', async () => {
    renderDialog();

    // El dialog se abre con el form pre-llenado.
    const inputNombre = await screen.findByRole('textbox', { name: /nombre del trato/i });
    expect(inputNombre).toHaveValue('Implementación CRM Innovatech');
  });

  it('pre-llena el input de valor estimado con el valor del trato', async () => {
    renderDialog();

    // El campo de valor estimado es type="number", buscamos por label.
    await waitFor(() => {
      const inputValor = screen.getByLabelText(/valor estimado/i);
      expect(inputValor).toHaveValue(250000);
    });
  });

  // Nota de diseño: contactoId es INMUTABLE en edición. TratoForm no deshabilita
  // el select de contacto explícitamente en mode="edit" — se comporta igual que en create
  // (solo deshabilitado mientras carga). El formulario simplemente omite contactoId del
  // payload enviado al back (lo descarta en handleSubmit de TratoEditDialog).
});
