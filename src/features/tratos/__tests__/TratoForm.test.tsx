// TratoForm — tests de renderizado y comportamiento del formulario.
// Cubre: mapeo de serverErrors (422) a campos via react-hook-form setError.

import { describe, it, expect, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import userEvent from '@testing-library/user-event';

import { TratoForm } from '../components/TratoForm';
import type { TratoCreateInput } from '../schemas/trato.schema';

const validDefaults: Partial<TratoCreateInput> = {
  contactoId: 'c1111111-cccc-1111-cccc-111111111111',
  responsableId: '11111111-1111-1111-1111-111111111111',
  nombre: 'Valid deal',
  tipoContrato: 'SERVICIO',
  valorEstimado: null,
  probabilidad: null,
  fechaCierreEsperada: '2099-12-31',
};

// serverErrors: Array<{ field: string; message: string }> — prop real de TratoForm.

function renderForm(props: Partial<Parameters<typeof TratoForm>[0]> = {}) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });

  const defaults: Parameters<typeof TratoForm>[0] = {
    mode: 'create',
    onSubmit: vi.fn(),
    ...props,
  };

  const rendered = render(
    <QueryClientProvider client={queryClient}>
      <TratoForm {...defaults} />
    </QueryClientProvider>,
  );

  return {
    ...rendered,
    rerenderForm: (nextProps: Partial<Parameters<typeof TratoForm>[0]> = {}) => {
      rendered.rerender(
        <QueryClientProvider client={queryClient}>
          <TratoForm {...defaults} {...nextProps} />
        </QueryClientProvider>,
      );
    },
  };
}

describe('TratoForm', () => {
  it('muestra el error de servidor en el campo "nombre" cuando serverErrors lo incluye', async () => {
    const serverErrors: Array<{ field: string; message: string }> = [
      { field: 'nombre', message: 'El nombre ya existe en el sistema' },
    ];

    renderForm({
      mode: 'edit',
      defaultValues: {
        contactoId: 'b1111111-bbbb-1111-bbbb-111111111111',
        responsableId: '22222222-2222-2222-2222-222222222222',
        nombre: 'Trato duplicado',
        tipoContrato: 'SERVICIO',
      } as Partial<TratoCreateInput>,
      serverErrors,
    });

    // react-hook-form llama setError en el useEffect cuando serverErrors cambia.
    await waitFor(() => {
      expect(screen.getByText('El nombre ya existe en el sistema')).toBeInTheDocument();
    });
  });

  it('muestra múltiples errores de servidor en sus campos correspondientes', async () => {
    const serverErrors: Array<{ field: string; message: string }> = [
      { field: 'nombre', message: 'Nombre inválido por el servidor' },
      { field: 'responsableId', message: 'Responsable no encontrado' },
    ];

    renderForm({
      mode: 'create',
      serverErrors,
    });

    await waitFor(() => {
      expect(screen.getByText('Nombre inválido por el servidor')).toBeInTheDocument();
    });
    expect(screen.getByText('Responsable no encontrado')).toBeInTheDocument();
  });

  it('en modo create renderiza el botón "Crear trato"', async () => {
    renderForm({ mode: 'create' });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /crear trato/i })).toBeInTheDocument();
    });
  });

  it('en modo edit renderiza el botón "Guardar cambios"', async () => {
    renderForm({ mode: 'edit' });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /guardar cambios/i })).toBeInTheDocument();
    });
  });

  it('invokes the parent callback only once for two synchronous valid submits', async () => {
    const onSubmit = vi.fn();
    renderForm({ onSubmit, defaultValues: validDefaults });

    const submitButton = screen.getByRole('button', { name: /crear trato/i });
    const form = submitButton.closest('form');
    if (!form) throw new Error('Expected the submit button to belong to a form');

    act(() => {
      fireEvent.submit(form);
      fireEvent.submit(form);
    });

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
  });

  it.each([
    ['create', /crear trato/i],
    ['edit', /guardar cambios/i],
  ] as const)('allows a later submit after %s isSubmitting settles', async (mode, buttonName) => {
    const onSubmit = vi.fn();
    const { rerenderForm } = renderForm({ mode, onSubmit, defaultValues: validDefaults });
    const submitButton = screen.getByRole('button', { name: buttonName });
    const form = submitButton.closest('form');
    if (!form) throw new Error('Expected the submit button to belong to a form');

    fireEvent.submit(form);
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));

    rerenderForm({ isSubmitting: true });
    await waitFor(() => expect(submitButton).toBeDisabled());
    rerenderForm({ isSubmitting: false });
    await waitFor(() => expect(submitButton).toBeEnabled());

    fireEvent.submit(form);
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(2));
  });

  it('does not lock after validation failure', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    renderForm({ onSubmit, defaultValues: validDefaults });

    const nameInput = screen.getByPlaceholderText(/implementación crm innovatech/i);
    await user.clear(nameInput);
    await user.click(screen.getByRole('button', { name: /crear trato/i }));
    expect(onSubmit).not.toHaveBeenCalled();

    await user.type(nameInput, 'Valid deal after retry');
    await user.click(screen.getByRole('button', { name: /crear trato/i }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
  });
});
