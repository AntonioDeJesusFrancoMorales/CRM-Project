import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { ContactoForm } from '../components/ContactoForm';
import { CONTACTO_EMPTY_DEFAULTS } from '../schemas/contacto.schema';
import type { ContactoCreateInput } from '../schemas/contacto.schema';

function renderForm(props: Partial<Parameters<typeof ContactoForm>[0]> = {}) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
  const defaults: Parameters<typeof ContactoForm>[0] = {
    mode: 'create',
    onSubmit: vi.fn(),
    ...props,
  };
  return render(
    <QueryClientProvider client={queryClient}>
      <ContactoForm {...defaults} />
    </QueryClientProvider>,
  );
}

describe('ContactoForm', () => {
  it('renderiza el campo requerido (nombre)', async () => {
    renderForm();
    await waitFor(() => {
      expect(screen.getByLabelText(/^nombre/i)).toBeInTheDocument();
    });
    // apellido no existe en el back — no debe haber campo apellido en el form
    expect(screen.queryByLabelText(/apellido/i)).not.toBeInTheDocument();
  });

  it('comoNosConocio renderiza datalist con sugerencias', async () => {
    const { container } = renderForm();
    await waitFor(() => {
      expect(screen.getByLabelText(/nombre/i)).toBeInTheDocument();
    });
    const datalist = container.querySelector('#como-nos-conocio-options');
    expect(datalist).not.toBeNull();
    expect(datalist!.querySelectorAll('option').length).toBeGreaterThan(0);
  });

  it('submit sin nombre muestra mensaje de error de validación', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    renderForm({ onSubmit });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /crear contacto/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /crear contacto/i }));

    await waitFor(() => {
      expect(screen.getByText(/el nombre es requerido/i)).toBeInTheDocument();
    });
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submit válido llama onSubmit con los valores correctos', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    // empresaId requerido (@NotNull en el back) sólo en creación.
    // En edición se muestra como campo inmutable, pero no forma parte del payload.
    renderForm({
      mode: 'edit',
      onSubmit,
      defaultValues: {
        nombre: 'Ana',
        empresaId: 'a1111111-aaaa-1111-aaaa-111111111111',
        estadoRelacion: 'PROSPECTO',
      },
    });

    await waitFor(() => {
      expect(screen.getByLabelText(/^nombre/i)).toBeInTheDocument();
    });

    // El nombre ya está pre-cargado — click directo en submit
    await user.click(screen.getByRole('button', { name: /guardar cambios/i }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledOnce();
    });

    const primeraLlamada = onSubmit.mock.calls[0];
    if (!primeraLlamada) throw new Error('onSubmit no fue invocado');
    const submitted = primeraLlamada[0] as ContactoCreateInput;
    expect(submitted.nombre).toBe('Ana');
    expect(submitted).not.toHaveProperty('empresaId');
  });

  it('modo create envía empresaId y estadoRelacion por defecto', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    renderForm({ onSubmit });

    await waitFor(() => {
      expect(screen.getByRole('combobox', { name: 'Empresa' })).toBeEnabled();
    });

    await user.type(screen.getByLabelText(/^nombre/i), 'Ana');
    await user.click(screen.getByRole('combobox', { name: 'Empresa' }));
    await user.click(await screen.findByRole('option', { name: /innovatech solutions/i }));
    await user.click(screen.getByRole('button', { name: /crear contacto/i }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledOnce());

    const primeraLlamada = onSubmit.mock.calls[0];
    if (!primeraLlamada) throw new Error('onSubmit no fue invocado');
    const submitted = primeraLlamada[0] as ContactoCreateInput;
    expect(submitted.empresaId).toBe('a1111111-aaaa-1111-aaaa-111111111111');
    expect(submitted.estadoRelacion).toBe('PROSPECTO');
  });

  it('modo edit inicializa con defaultValues', async () => {
    const defaultValues: Partial<ContactoCreateInput> = {
      ...CONTACTO_EMPTY_DEFAULTS,
      nombre: 'Carlos',
      correo: 'carlos@ejemplo.com',
    };
    renderForm({ mode: 'edit', defaultValues });

    await waitFor(() => {
      expect(screen.getByLabelText(/^nombre/i)).toHaveValue('Carlos');
    });
    expect(screen.getByDisplayValue('carlos@ejemplo.com')).toBeInTheDocument();
  });

  it('modo create siempre inicializa estadoRelacion como PROSPECTO', async () => {
    renderForm({ mode: 'create' });

    await waitFor(() => {
      expect(screen.getByLabelText(/nombre/i)).toBeInTheDocument();
    });

    // El trigger del select de estado debe existir y estar deshabilitado en modo create
    const estadoTrigger = screen.getByRole('combobox', { name: /estado/i });
    expect(estadoTrigger).toBeInTheDocument();
    expect(estadoTrigger).toBeDisabled();
  });
});
