// Tests de componente para FichaForm — Strict TDD Batch 4.2 (RED).
// FichaForm generalizado: tipoFicha ('TRATO'|'TAREA'), items precargados, campo entidadId.
// Layer: Component (RTL + zodResolver, sin MSW — lógica del form pura).

import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { FichaForm } from '../components/FichaForm';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function renderForm(
  props: Partial<Parameters<typeof FichaForm>[0]> & {
    tipoFicha?: 'TRATO' | 'TAREA';
    items?: Array<{ id: string; label: string }>;
  } = {},
) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });

  const defaultItems = [
    { id: 'id-1', label: 'Item Uno' },
    { id: 'id-2', label: 'Item Dos' },
  ];

  const defaults = {
    columnaId: 'col-1',
    tipoFicha: 'TRATO' as const,
    items: defaultItems,
    onSubmit: vi.fn(),
    ...props,
  };

  return render(
    <QueryClientProvider client={qc}>
      <FichaForm {...defaults} />
    </QueryClientProvider>,
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('FichaForm — tipoFicha TRATO muestra label "Trato"', () => {
  it('(a) con tipoFicha="TRATO" el label del selector dice "Trato"', () => {
    renderForm({ tipoFicha: 'TRATO' });
    expect(screen.getByText(/^Trato/i)).toBeInTheDocument();
  });

  it('(b) con tipoFicha="TRATO" el placeholder del selector contiene "trato"', () => {
    renderForm({ tipoFicha: 'TRATO' });
    expect(screen.getByText(/selecciona un trato/i)).toBeInTheDocument();
  });
});

describe('FichaForm — tipoFicha TAREA muestra label "Tarea"', () => {
  it('(c) con tipoFicha="TAREA" el label del selector dice "Tarea"', () => {
    renderForm({ tipoFicha: 'TAREA', items: [{ id: 't-1', label: 'Mi Tarea' }] });
    expect(screen.getByText(/^Tarea/i)).toBeInTheDocument();
  });

  it('(d) con tipoFicha="TAREA" el placeholder del selector contiene "tarea"', () => {
    renderForm({ tipoFicha: 'TAREA', items: [{ id: 't-1', label: 'Mi Tarea' }] });
    expect(screen.getByText(/selecciona una tarea/i)).toBeInTheDocument();
  });
});

describe('FichaForm — items precargados se muestran como opciones', () => {
  it('(e) los items pasados como prop aparecen en el selector', async () => {
    const user = userEvent.setup();
    const items = [
      { id: 'x-1', label: 'Trato Alpha' },
      { id: 'x-2', label: 'Trato Beta' },
    ];
    renderForm({ tipoFicha: 'TRATO', items });

    // Abrir el selector del trato
    const trigger = screen.getByRole('combobox', { name: /trato/i });
    await user.click(trigger);

    // Buscar por role option (Radix Select abre un listbox)
    const options = screen.getAllByRole('option');
    const labels = options.map((o) => o.textContent);
    expect(labels).toContain('Trato Alpha');
    expect(labels).toContain('Trato Beta');
  });
});

describe('FichaForm — entidadId requerido', () => {
  it('(f) enviar sin seleccionar entidadId muestra error de validacion', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    renderForm({ onSubmit });

    // Hacer clic en "Crear ficha" sin seleccionar nada
    const submitBtn = screen.getByRole('button', { name: /crear ficha/i });
    await user.click(submitBtn);

    await waitFor(() => {
      // El mensaje de error debe aparecer — buscarlo en el elemento de error del form
      const errorMsgs = screen.getAllByText(/selecciona un trato/i);
      // Debe haber al menos 2: el placeholder + el error (o solo el error si el trigger cambió)
      // Lo importante es que existe un <p> de error (FormMessage)
      const errorEl = errorMsgs.find((el) => el.tagName === 'P');
      expect(errorEl).toBeInTheDocument();
    });

    expect(onSubmit).not.toHaveBeenCalled();
  });
});

describe('FichaForm — serverErrors en campo entidadId', () => {
  it('(g) serverErrors con field "entidadId" muestra el mensaje bajo el selector', () => {
    renderForm({
      serverErrors: [{ field: 'entidadId', message: 'El trato ya tiene ficha' }],
    });

    expect(screen.getByText('El trato ya tiene ficha')).toBeInTheDocument();
  });
});
