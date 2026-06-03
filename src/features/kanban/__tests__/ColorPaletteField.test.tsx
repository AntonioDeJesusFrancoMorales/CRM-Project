// Tests del componente presentacional ColorPaletteField.
// Verifica: renderizado de swatches, selección dispara onChange, aria-label por color,
// indicador de seleccionado y estado deshabilitado.

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ColorPaletteField } from '../components/ColorPaletteField';
import { COLUMN_PALETTE } from '../lib/columnPalette';

describe('ColorPaletteField — renderizado de swatches', () => {
  it('renderiza un botón por cada color de la paleta', () => {
    render(<ColorPaletteField value={null} onChange={vi.fn()} />);
    // Hay 10 colores en la paleta
    const botones = screen.getAllByRole('button');
    expect(botones).toHaveLength(COLUMN_PALETTE.length);
  });

  it('cada botón tiene aria-label no vacío', () => {
    render(<ColorPaletteField value={null} onChange={vi.fn()} />);
    const botones = screen.getAllByRole('button');
    botones.forEach((btn) => {
      expect(btn.getAttribute('aria-label')).toBeTruthy();
    });
  });
});

describe('ColorPaletteField — selección', () => {
  it('click en un swatch llama onChange con el color correspondiente', async () => {
    const onChange = vi.fn();
    render(<ColorPaletteField value={null} onChange={onChange} />);

    const primerColor = COLUMN_PALETTE[0]!;
    // El aria-label del primer color es 'Gris pizarra'
    const boton = screen.getByRole('button', { name: /gris pizarra/i });
    await userEvent.click(boton);

    expect(onChange).toHaveBeenCalledOnce();
    expect(onChange).toHaveBeenCalledWith(primerColor);
  });

  it('click en distintos swatches llama onChange con el color correcto cada vez', async () => {
    const onChange = vi.fn();
    render(<ColorPaletteField value={null} onChange={onChange} />);

    const botonAzul = screen.getByRole('button', { name: /azul/i });
    await userEvent.click(botonAzul);
    expect(onChange).toHaveBeenLastCalledWith('#60a5fa');

    const botonRojo = screen.getByRole('button', { name: /rojo/i });
    await userEvent.click(botonRojo);
    expect(onChange).toHaveBeenLastCalledWith('#f87171');
  });
});

describe('ColorPaletteField — indicación de seleccionado', () => {
  it('el botón del color seleccionado tiene aria-pressed=true', () => {
    const colorSeleccionado = COLUMN_PALETTE[2]!; // '#34d399'
    render(<ColorPaletteField value={colorSeleccionado} onChange={vi.fn()} />);

    const boton = screen.getByRole('button', { name: /verde esmeralda/i });
    expect(boton).toHaveAttribute('aria-pressed', 'true');
  });

  it('los botones NO seleccionados tienen aria-pressed=false', () => {
    const colorSeleccionado = COLUMN_PALETTE[2]!;
    render(<ColorPaletteField value={colorSeleccionado} onChange={vi.fn()} />);

    const botones = screen.getAllByRole('button');
    const noSeleccionados = botones.filter((b) => b.getAttribute('aria-pressed') === 'false');
    expect(noSeleccionados).toHaveLength(COLUMN_PALETTE.length - 1);
  });

  it('sin value ningún botón tiene aria-pressed=true', () => {
    render(<ColorPaletteField value={null} onChange={vi.fn()} />);
    const botones = screen.getAllByRole('button');
    botones.forEach((b) => {
      expect(b.getAttribute('aria-pressed')).toBe('false');
    });
  });
});

describe('ColorPaletteField — estado deshabilitado', () => {
  it('cuando disabled=true los botones no disparan onChange al hacer click', async () => {
    const onChange = vi.fn();
    render(<ColorPaletteField value={null} onChange={onChange} disabled />);

    const botones = screen.getAllByRole('button');
    for (const btn of botones) {
      expect(btn).toBeDisabled();
    }

    await userEvent.click(botones[0]!);
    expect(onChange).not.toHaveBeenCalled();
  });
});

describe('ColorPaletteField — accesibilidad', () => {
  it('tiene role="group" con aria-label descriptivo', () => {
    render(<ColorPaletteField value={null} onChange={vi.fn()} />);
    expect(screen.getByRole('group', { name: /paleta/i })).toBeInTheDocument();
  });
});
