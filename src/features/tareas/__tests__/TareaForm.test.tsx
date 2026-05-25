// Tests de TareaForm — Strict TDD fase RED.
// Cubre: modo tratoIdFijo (disabled) vs. global (editable + requerido), validación, onSubmit.

import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { TareaForm } from '../components/TareaForm';
import type { TareaCreateInput } from '../schemas/tarea.schema';
import { TAREA_EMPTY_DEFAULTS } from '../schemas/tarea.schema';

function renderForm(props: Partial<Parameters<typeof TareaForm>[0]> = {}) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });

  const defaults: Parameters<typeof TareaForm>[0] = {
    mode: 'create',
    defaultValues: TAREA_EMPTY_DEFAULTS,
    onSubmit: vi.fn(),
    ...props,
  };

  return render(
    <QueryClientProvider client={queryClient}>
      <TareaForm {...defaults} />
    </QueryClientProvider>,
  );
}

describe('TareaForm — tratoIdFijo', () => {
  it('(a) con tratoIdFijo: Select de trato está deshabilitado y muestra el trato prefijado', async () => {
    renderForm({ tratoIdFijo: 'd1111111-dddd-1111-dddd-111111111111' });

    // El trigger del Select de trato debe estar presente
    await waitFor(() => {
      expect(screen.getByRole('combobox', { name: /trato/i })).toBeInTheDocument();
    });

    const selectTrato = screen.getByRole('combobox', { name: /trato/i });
    // Debe estar deshabilitado cuando tratoIdFijo viene fijo
    expect(selectTrato).toBeDisabled();
  });

  it('(b) sin tratoIdFijo + submit sin trato → error "El trato es requerido"', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    renderForm({ onSubmit });

    // Esperar a que los tratos carguen y el Select quede habilitado
    await waitFor(() => {
      const selectTrato = screen.getByRole('combobox', { name: /trato/i });
      expect(selectTrato).not.toBeDisabled();
    });

    // Intentar enviar sin completar el trato
    const submitBtn = screen.getByRole('button', { name: /crear tarea/i });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/el trato es requerido/i)).toBeInTheDocument();
    });

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('(c) form de edición no expone campo estado directamente en el form', async () => {
    const defaultValues: Partial<TareaCreateInput> = {
      ...TAREA_EMPTY_DEFAULTS,
      trato_id: 'd1111111-dddd-1111-dddd-111111111111',
      titulo: 'Tarea existente',
    };

    renderForm({
      mode: 'edit',
      defaultValues,
      tratoIdFijo: 'd1111111-dddd-1111-dddd-111111111111',
    });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /guardar cambios/i })).toBeInTheDocument();
    });

    // No debe haber un campo/combobox con label "Estado"
    expect(screen.queryByRole('combobox', { name: /^estado/i })).not.toBeInTheDocument();
  });

  it('(d) con tratoIdFijo, no aparece error de validación de trato al hacer submit', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    renderForm({
      tratoIdFijo: 'd1111111-dddd-1111-dddd-111111111111',
      onSubmit,
    });

    // Esperar que el form esté listo: el botón submit debe estar visible
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /crear tarea/i })).toBeInTheDocument();
    });

    // Completar título para pasar validación de campo requerido
    await user.type(screen.getByLabelText(/título/i), 'Demo con cliente');

    // Hacer submit
    await user.click(screen.getByRole('button', { name: /crear tarea/i }));

    // Con tratoIdFijo, el error de trato requerido NO debe aparecer
    await waitFor(() => {
      expect(screen.queryByText(/el trato es requerido/i)).not.toBeInTheDocument();
    });
  });
});
