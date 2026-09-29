import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';

import { ContactosTable } from '../components/ContactosTable';
import type { Contacto } from '@/api/types';

const contactoBase: Contacto = {
  id: 'c0333333-cccc-0003-cccc-000000000003',
  nombre: 'Sofía',
  correo: 'sofia.mendoza@example.com',
  telefono: '+52 961 333 0003',
  empresaId: 'a1111111-aaaa-1111-aaaa-111111111111',
  estadoRelacion: 'ACTIVO',
  cargo: null,
  comoNosConocio: 'Conferencia de tecnología 2025',
  responsableId: null,
  creadoPor: null,
  creadoEn: '2026-02-15T08:00:00.000Z',
  actualizadoEn: '2026-03-01T11:00:00.000Z',
};

const contactos: Contacto[] = [
  contactoBase,
  {
    id: 'c0111111-cccc-0001-cccc-000000000001',
    nombre: 'Lucía',
    correo: null,
    telefono: null,
    empresaId: 'a1111111-aaaa-1111-aaaa-111111111111',
    estadoRelacion: 'PROSPECTO',
    cargo: null,
    comoNosConocio: null,
    responsableId: null,
    creadoPor: null,
    creadoEn: '2026-01-15T09:00:00.000Z',
    actualizadoEn: '2026-01-15T09:00:00.000Z',
  },
];

function renderTable(items: Contacto[] = contactos) {
  const onEdit = vi.fn();
  const onDelete = vi.fn();
  const view = render(
    <MemoryRouter>
      <ContactosTable contactos={items} onEdit={onEdit} onDelete={onDelete} />
    </MemoryRouter>,
  );
  return { onEdit, onDelete, ...view };
}

describe('ContactosTable', () => {
  it('renderiza una fila por cada contacto del array', () => {
    renderTable();
    expect(screen.getByText('Sofía')).toBeInTheDocument();
    expect(screen.getByText('Lucía')).toBeInTheDocument();
  });

  it('nombre es un link que apunta a /contactos/:id', () => {
    renderTable();
    const link = screen.getByRole('link', { name: 'Sofía' });
    expect(link).toHaveAttribute('href', `/contactos/${contactoBase.id}`);
  });

  it('muestra estadoRelacion como badge con texto visible', () => {
    renderTable();
    // Badge ACTIVO de Sofía
    expect(screen.getByText('Activo')).toBeInTheDocument();
    // Badge PROSPECTO de Lucía
    expect(screen.getByText('Prospecto')).toBeInTheDocument();
  });

  it('tabla vacía renderiza mensaje de vacío', () => {
    renderTable([]);
    expect(screen.getByText(/no hay contactos/i)).toBeInTheDocument();
  });

  it('las acciones de editar y eliminar llaman los callbacks correctos', async () => {
    const user = userEvent.setup();
    const { onEdit } = renderTable();

    // Abrir el menú de acciones de la primera fila (Sofía)
    const [primerTrigger] = screen.getAllByRole('button', { name: /acciones/i });
    if (!primerTrigger) throw new Error('no se encontró el botón de acciones de la primera fila');
    await user.click(primerTrigger);

    const editarBtn = await screen.findByRole('menuitem', { name: /editar/i });
    await user.click(editarBtn);
    expect(onEdit).toHaveBeenCalledWith(contactoBase);
  });

  it('muestra comoNosConocio cuando está disponible', () => {
    renderTable();
    expect(screen.getByText('Conferencia de tecnología 2025')).toBeInTheDocument();
  });

  it('usa la rueda para desplazarse horizontalmente solo cuando hay overflow', () => {
    const { container } = renderTable();
    const scrollContainer = container.querySelector('.table-scroll-container');
    if (!(scrollContainer instanceof HTMLDivElement)) {
      throw new Error('Expected the table scroll container');
    }

    Object.defineProperty(scrollContainer, 'clientWidth', { configurable: true, value: 100 });
    Object.defineProperty(scrollContainer, 'scrollWidth', { configurable: true, value: 300 });

    const overflowingWheel = new WheelEvent('wheel', { deltaY: 60, cancelable: true });
    scrollContainer.dispatchEvent(overflowingWheel);

    expect(scrollContainer.scrollLeft).toBe(60);
    expect(overflowingWheel.defaultPrevented).toBe(true);

    Object.defineProperty(scrollContainer, 'clientWidth', { configurable: true, value: 300 });
    scrollContainer.scrollLeft = 0;
    const verticalWheel = new WheelEvent('wheel', { deltaY: 60, cancelable: true });
    scrollContainer.dispatchEvent(verticalWheel);

    expect(scrollContainer.scrollLeft).toBe(0);
    expect(verticalWheel.defaultPrevented).toBe(false);
  });

  it('removes the wheel listener when the table unmounts', () => {
    const { container, unmount } = renderTable();
    const scrollContainer = container.querySelector('.table-scroll-container');
    if (!(scrollContainer instanceof HTMLDivElement)) {
      throw new Error('Expected the table scroll container');
    }

    Object.defineProperty(scrollContainer, 'clientWidth', { configurable: true, value: 100 });
    Object.defineProperty(scrollContainer, 'scrollWidth', { configurable: true, value: 300 });
    unmount();

    const wheel = new WheelEvent('wheel', { deltaY: 60, cancelable: true });
    fireEvent(scrollContainer, wheel);
    expect(scrollContainer.scrollLeft).toBe(0);
    expect(wheel.defaultPrevented).toBe(false);
  });
});
