// TratoForm — tests de renderizado y comportamiento del formulario.
// Cubre: mapeo de serverErrors (422) a campos via react-hook-form setError.

import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { TratoForm } from '../components/TratoForm';
import type { TratoCreateInput } from '../schemas/trato.schema';

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

  return render(
    <QueryClientProvider client={queryClient}>
      <TratoForm {...defaults} />
    </QueryClientProvider>,
  );
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
});
