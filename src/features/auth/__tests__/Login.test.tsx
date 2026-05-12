import { describe, it, expect, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';

import { LoginPage } from '../pages/LoginPage';
import { useAuthStore } from '@/store/authStore';
import { setupTestWrapper } from '@/test/wrappers';
import { server } from '@/test/server';

describe('LoginPage', () => {
  beforeEach(() => {
    useAuthStore.setState({ token: null, usuario: null });
  });

  it('renderiza los campos del formulario', () => {
    const { Wrapper } = setupTestWrapper();
    render(<LoginPage />, { wrapper: Wrapper });

    // shadcn 'new-york' usa <div> para CardTitle (no <h*>), así que asercion por texto.
    expect(screen.getAllByText(/iniciar sesión/i).length).toBeGreaterThan(0);
    expect(screen.getByLabelText(/correo/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/contraseña/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /iniciar sesión/i })).toBeInTheDocument();
  });

  it('muestra error de validación client-side cuando el correo es inválido', async () => {
    const user = userEvent.setup();
    const { Wrapper } = setupTestWrapper();
    const { container } = render(<LoginPage />, { wrapper: Wrapper });

    await user.type(screen.getByLabelText(/correo/i), 'no-es-un-correo');
    await user.type(screen.getByLabelText(/contraseña/i), 'Admin123!');

    // fireEvent.submit es más directo que click(submit-button) en jsdom;
    // dispara el form-submit sin pasar por la simulación de click nativa.
    const form = container.querySelector('form');
    if (!form) throw new Error('form no encontrado');
    fireEvent.submit(form);

    expect(
      await screen.findByText(/correo inválido/i, undefined, { timeout: 3000 }),
    ).toBeInTheDocument();
    expect(useAuthStore.getState().token).toBeNull();
  });

  it('persiste sesión tras login exitoso', async () => {
    const user = userEvent.setup();
    const { Wrapper } = setupTestWrapper();
    render(<LoginPage />, { wrapper: Wrapper });

    await user.type(screen.getByLabelText(/correo/i), 'admin@crm.test');
    await user.type(screen.getByLabelText(/contraseña/i), 'Admin123!');
    await user.click(screen.getByRole('button', { name: /iniciar sesión/i }));

    await waitFor(() => {
      expect(useAuthStore.getState().token).toBeTruthy();
    });
    expect(useAuthStore.getState().usuario?.rol_sistema).toBe('admin');
  });

  it('mapea errores 422 del backend a setError por campo', async () => {
    server.use(
      http.post('/api/v1/auth/login', () =>
        HttpResponse.json(
          {
            status: 422,
            error: 'VALIDATION_ERROR',
            message: 'Datos invalidos',
            details: [{ field: 'email', message: 'El correo no existe en el sistema' }],
          },
          { status: 422 },
        ),
      ),
    );

    const user = userEvent.setup();
    const { Wrapper } = setupTestWrapper();
    render(<LoginPage />, { wrapper: Wrapper });

    await user.type(screen.getByLabelText(/correo/i), 'fantasma@nadie.com');
    await user.type(screen.getByLabelText(/contraseña/i), 'Admin123!');
    await user.click(screen.getByRole('button', { name: /iniciar sesión/i }));

    expect(await screen.findByText(/el correo no existe en el sistema/i)).toBeInTheDocument();
    expect(useAuthStore.getState().token).toBeNull();
  });
});
