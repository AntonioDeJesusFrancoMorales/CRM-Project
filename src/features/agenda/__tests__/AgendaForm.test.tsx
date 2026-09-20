import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { AgendaForm } from '../components/AgendaForm';
import type { AgendaCreateInput } from '../schemas/agenda.schema';

const validMeeting: AgendaCreateInput = {
  tipo: 'REUNION',
  asunto: 'Reunión de seguimiento',
  descripcion: null,
  fecha: '2026-09-20',
  horaInicio: '09:00',
  horaFin: '10:00',
  tareaId: null,
  tratoId: null,
  ubicacion: 'Sala 3',
  linkVideollamada: null,
  recordatorioHabilitado: false,
  minutosAntes: null,
};

function renderForm(props: Partial<Parameters<typeof AgendaForm>[0]> = {}) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
  });
  const values: Parameters<typeof AgendaForm>[0] = {
    mode: 'create',
    defaultValues: validMeeting,
    onSubmit: vi.fn(),
    ...props,
  };
  return render(
    <QueryClientProvider client={queryClient}>
      <AgendaForm {...values} />
    </QueryClientProvider>,
  );
}

describe('AgendaForm', () => {
  it('cambia los campos condicionales y limpia el valor que deja de aplicar', async () => {
    const user = userEvent.setup();
    renderForm();

    expect(screen.getByLabelText('Ubicación')).toHaveValue('Sala 3');
    expect(screen.queryByLabelText('Link de videollamada')).not.toBeInTheDocument();

    await user.click(screen.getByRole('radio', { name: 'Llamada' }));
    expect(screen.queryByLabelText('Ubicación')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Link de videollamada')).toHaveValue('');

    await user.click(screen.getByRole('radio', { name: 'Reunión' }));
    expect(screen.getByLabelText('Ubicación')).toHaveValue('');
  });

  it('valida el link requerido al cambiar a llamada', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    renderForm({ onSubmit });

    await user.click(screen.getByRole('radio', { name: 'Llamada' }));
    await user.click(screen.getByRole('button', { name: 'Crear evento' }));

    expect(await screen.findByText('El link de videollamada es obligatorio para llamadas')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('mantiene estable el campo de minutos y lo limpia al deshabilitar el recordatorio', async () => {
    const user = userEvent.setup();
    renderForm();
    const reminder = screen.getByRole('switch', { name: 'Habilitar recordatorio por email' });
    const minutes = screen.getByLabelText('Minutos antes');

    expect(minutes).toBeDisabled();
    expect(minutes).toHaveValue(null);

    await user.click(reminder);
    expect(minutes).toBeEnabled();

    await user.type(minutes, '15');
    expect(minutes).toHaveValue(15);

    await user.click(reminder);
    expect(minutes).toBeDisabled();
    expect(minutes).toHaveValue(null);
  });

  it('normaliza campos ocultos antes de enviar datos antiguos', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    renderForm({
      onSubmit,
      defaultValues: { ...validMeeting, linkVideollamada: 'https://legacy.example.com' },
    });

    await user.click(screen.getByRole('button', { name: 'Crear evento' }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ tipo: 'REUNION', ubicacion: 'Sala 3', linkVideollamada: null }),
    );
  });
});
