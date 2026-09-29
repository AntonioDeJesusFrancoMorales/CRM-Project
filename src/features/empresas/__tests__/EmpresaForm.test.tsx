import { describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Empresa } from '@/api/types';
import { EmpresaForm } from '../components/EmpresaForm';
import type { EmpresaCreateInput } from '../schemas/empresa.schema';

const duplicateEmpresa: Empresa = {
  id: 'empresa-1',
  nombre: 'Innovatech Solutions',
  sector: null,
  telefono: null,
  paginaWeb: null,
  facebook: null,
  instagram: null,
  twitter: null,
  estadoRelacion: 'ACTIVO',
  responsableId: null,
  creadoPor: null,
  notas: null,
  creadoEn: '',
  actualizadoEn: '',
};

function renderForm(props: Partial<Parameters<typeof EmpresaForm>[0]> = {}) {
  const onSubmit = vi.fn<(values: EmpresaCreateInput) => void>();
  const defaultProps: Parameters<typeof EmpresaForm>[0] = {
    mode: 'create',
    onSubmit,
    ...props,
  };

  render(<EmpresaForm {...defaultProps} />);
  return { onSubmit };
}

describe('EmpresaForm', () => {
  it('trims values and normalizes website and social handles before submit', async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderForm();

    await user.type(screen.getByLabelText(/nombre/i), '  Acme  ');
    await user.type(screen.getByLabelText(/sector/i), '   ');
    await user.type(screen.getByLabelText(/teléfono/i), '       ');
    await user.type(screen.getByLabelText(/página web/i), ' www.pagina.com ');
    await user.type(screen.getByLabelText(/facebook/i), '@qa_example_01');
    await user.type(screen.getByLabelText(/instagram/i), '@qa_example_01');
    await user.type(screen.getByLabelText(/twitter/i), '@qa_example_01');
    await user.type(screen.getByLabelText(/notas/i), '   ');

    await user.click(screen.getByRole('button', { name: /crear empresa/i }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit).toHaveBeenCalledWith({
      nombre: 'Acme',
      sector: '',
      telefono: '',
      paginaWeb: 'https://www.pagina.com/',
      facebook: 'https://facebook.com/qa_example_01',
      instagram: 'https://instagram.com/qa_example_01',
      twitter: 'https://x.com/qa_example_01',
      estadoRelacion: 'PROSPECTO',
      notas: '',
    });
  });

  it('blocks a duplicate name on create without invoking submit', async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderForm({ existingEmpresas: [duplicateEmpresa] });

    await user.type(screen.getByLabelText(/nombre/i), '  innovatech solutions ');
    await user.click(screen.getByRole('button', { name: /crear empresa/i }));

    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText('Ya existe una empresa con este nombre.')).toBeInTheDocument();
  });

  it('releases the lock after a duplicate so a later valid submit can proceed', async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderForm({ existingEmpresas: [duplicateEmpresa] });
    const nameInput = screen.getByLabelText(/nombre/i);

    await user.type(nameInput, '  innovatech solutions ');
    await user.click(screen.getByRole('button', { name: /crear empresa/i }));

    await user.clear(nameInput);
    await user.type(nameInput, 'Empresa válida');
    await user.click(screen.getByRole('button', { name: /crear empresa/i }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ nombre: 'Empresa válida' }));
  });

  it('allows the current name when editing the same company', async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderForm({
      mode: 'edit',
      defaultValues: {
        nombre: duplicateEmpresa.nombre,
        estadoRelacion: duplicateEmpresa.estadoRelacion,
      },
      existingEmpresas: [duplicateEmpresa],
      currentEmpresaId: duplicateEmpresa.id,
    });

    await user.click(screen.getByRole('button', { name: /guardar cambios/i }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
  });

  it('allows only one submit while the first request is pending', async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderForm();

    await user.type(screen.getByLabelText(/nombre/i), 'Empresa válida');
    const submitButton = screen.getByRole('button', { name: /crear empresa/i });
    const form = submitButton.closest('form');
    if (!form) throw new Error('Expected the submit button to belong to a form');

    act(() => {
      fireEvent.submit(form);
      fireEvent.submit(form);
    });

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
  });

  it('maps the backend name alias and message to the Nombre field', async () => {
    renderForm({ serverErrors: [{ field: 'name', message: 'name is required' }] });

    await waitFor(() => expect(screen.getByText('El nombre es requerido')).toBeInTheDocument());
    expect(screen.getByLabelText(/nombre/i)).toHaveAttribute('aria-invalid', 'true');
  });

  it('maps pagina_web URL errors to the Página web field', async () => {
    renderForm({
      serverErrors: [
        {
          field: 'pagina_web',
          message: 'El campo pagina_web tiene un formato de URL inválido.',
        },
      ],
    });

    await waitFor(() =>
      expect(screen.getByText('La página web debe ser una URL válida.')).toBeInTheDocument(),
    );
    expect(screen.getByLabelText(/página web/i)).toHaveAttribute('aria-invalid', 'true');
  });
});
