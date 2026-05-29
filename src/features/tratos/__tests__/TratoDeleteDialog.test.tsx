// TratoDeleteDialog — test de comportamiento de cierre del dialog.
// Cubre: click en "Cancelar" cierra el dialog y NO invoca onConfirm.

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { TratoDeleteDialog } from '../components/TratoDeleteDialog';

// Props reales del componente: open, onOpenChange, nombre, onConfirm, isDeleting?

function renderDialog(overrides: Partial<Parameters<typeof TratoDeleteDialog>[0]> = {}) {
  const defaults: Parameters<typeof TratoDeleteDialog>[0] = {
    open: true,
    onOpenChange: vi.fn(),
    nombre: 'Implementación CRM Innovatech',
    onConfirm: vi.fn(),
    isDeleting: false,
    ...overrides,
  };
  return { ...render(<TratoDeleteDialog {...defaults} />), props: defaults };
}

describe('TratoDeleteDialog', () => {
  it('al hacer click en "Cancelar", llama onOpenChange(false) y NO invoca onConfirm', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    const onConfirm = vi.fn();

    renderDialog({ onOpenChange, onConfirm });

    const btnCancelar = screen.getByRole('button', { name: /cancelar/i });
    expect(btnCancelar).toBeInTheDocument();

    await user.click(btnCancelar);

    // AlertDialogCancel dispara onOpenChange(false) al cerrar el AlertDialog.
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('muestra el nombre del trato en la descripción del dialog', () => {
    renderDialog({ nombre: 'Portal B2B Innovatech' });

    expect(screen.getByText(/portal b2b innovatech/i)).toBeInTheDocument();
  });
});
