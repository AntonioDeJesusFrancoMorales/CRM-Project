import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ComoNosConocioInput } from '../components/ComoNosConocioInput';
import { COMO_NOS_CONOCIO_SUGERENCIAS } from '../schemas/contacto.schema';

describe('ComoNosConocioInput', () => {
  it('renderiza un input con atributo list apuntando al datalist', () => {
    const { container } = render(
      <ComoNosConocioInput value="" onChange={vi.fn()} />,
    );
    // Un input con list="" tiene role "combobox" en jsdom
    const input = container.querySelector('input');
    expect(input).not.toBeNull();
    expect(input).toHaveAttribute('list', 'como-nos-conocio-options');
  });

  it('renderiza el datalist con las sugerencias de COMO_NOS_CONOCIO_SUGERENCIAS', () => {
    const { container } = render(
      <ComoNosConocioInput value="" onChange={vi.fn()} />,
    );
    const datalist = container.querySelector('#como-nos-conocio-options');
    expect(datalist).not.toBeNull();
    const options = datalist!.querySelectorAll('option');
    expect(options).toHaveLength(COMO_NOS_CONOCIO_SUGERENCIAS.length);
    COMO_NOS_CONOCIO_SUGERENCIAS.forEach((sugerencia, i) => {
      expect(options[i]).toHaveValue(sugerencia);
    });
  });

  it('tiene maxLength de 200', () => {
    const { container } = render(<ComoNosConocioInput value="" onChange={vi.fn()} />);
    const input = container.querySelector('input');
    expect(input).toHaveAttribute('maxLength', '200');
  });

  it('acepta texto libre sin validación de pertenencia al array', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    const { container } = render(<ComoNosConocioInput value="" onChange={handleChange} />);
    const input = container.querySelector('input')!;
    await user.type(input, 'Por recomendación de un amigo');
    // Solo verificamos que no lanza error — el onChange se llama
    expect(handleChange).toHaveBeenCalled();
  });

  it('value null se renderiza como string vacío', () => {
    const { container } = render(<ComoNosConocioInput value={null} onChange={vi.fn()} />);
    expect(container.querySelector('input')).toHaveValue('');
  });

  it('value undefined se renderiza como string vacío', () => {
    const { container } = render(<ComoNosConocioInput value={undefined} onChange={vi.fn()} />);
    expect(container.querySelector('input')).toHaveValue('');
  });
});
