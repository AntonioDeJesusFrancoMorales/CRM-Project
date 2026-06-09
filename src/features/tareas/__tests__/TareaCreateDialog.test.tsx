// Test e2e del mapeo de error 422 en la creación de tarea.
// Usa enums del back (GENERAL/SEGUIMIENTO/… y BAJA/MEDIA/ALTA/URGENTE).

import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router';

import { TareaCreateDialog } from '../components/TareaCreateDialog';
import { server } from '@/test/server';

const TRATO_FIJO = 'd1111111-dddd-1111-dddd-111111111111';

function renderDialog() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <TareaCreateDialog open={true} onOpenChange={() => {}} tratoIdFijo={TRATO_FIJO} />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('TareaCreateDialog — mapeo de error 422', () => {
  it('mapea los field errors 422 del backend al campo correspondiente del formulario', async () => {
    server.use(
      http.post('/api/tareas/create', () =>
        HttpResponse.json(
          {
            status: 422,
            error: 'VALIDATION_ERROR',
            message: 'Datos inválidos',
            details: [{ field: 'titulo', message: 'Ya existe una tarea con ese título' }],
          },
          { status: 422 },
        ),
      ),
    );

    const user = userEvent.setup();
    renderDialog();

    const dialog = await screen.findByRole('dialog');

    // Completar los campos requeridos para pasar la validación Zod y disparar el POST.
    // El trato viene fijo (tratoIdFijo), por lo que su Select está deshabilitado.
    await user.type(within(dialog).getByRole('textbox', { name: /título/i }), 'Demo con cliente');

    const responsableSelect = within(dialog).getByRole('combobox', { name: /responsable/i });
    await user.click(responsableSelect);
    await user.click(await screen.findByRole('option', { name: /maría/i }));

    // Tipo — opciones en español: General, Seguimiento, Negociación, Cierre
    const tipoSelect = within(dialog).getByRole('combobox', { name: /tipo/i });
    await user.click(tipoSelect);
    await user.click(await screen.findByRole('option', { name: /general/i }));

    // Prioridad — opciones en español: Baja, Media, Alta, Urgente
    const prioridadSelect = within(dialog).getByRole('combobox', { name: /prioridad/i });
    await user.click(prioridadSelect);
    await user.click(await screen.findByRole('option', { name: /media/i }));

    // Fecha límite (requerida) — despliega el DateTimePicker inline y elige un día.
    // La hora toma el default (09:00), produciendo un LocalDateTime válido.
    const fechaTrigger = within(dialog).getByRole('button', { name: /fecha límite/i });
    await user.click(fechaTrigger);
    const dias = await within(dialog).findAllByLabelText(/^\d{4}-\d{2}-\d{2}$/);
    await user.click(dias[14]!);

    await user.click(within(dialog).getByRole('button', { name: /crear tarea/i }));

    // El field error del 422 debe quedar mapeado y visible en el campo título.
    expect(
      await screen.findByText('Ya existe una tarea con ese título'),
    ).toBeInTheDocument();
  });
});
