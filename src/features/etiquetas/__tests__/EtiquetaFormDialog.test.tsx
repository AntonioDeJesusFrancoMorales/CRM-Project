// Tests de EtiquetaFormDialog — create y edit.
// Regresión: el modo edit mostraba el tipo inmutable con <FormLabel> (requiere FormField)
// y crasheaba con "useFormField should be used within <FormField>". Acá se cubre que
// el edit renderiza sin romper y muestra el tipo como badge de solo lectura.

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { Etiqueta } from '@/api/types';
import { EtiquetaFormDialog } from '../components/EtiquetaFormDialog';

const ETIQUETA: Etiqueta = {
  id: 'c1111111-cccc-1111-cccc-111111111111',
  nombre: 'Prioritario',
  tipoEtiqueta: 'TRATO',
  color: '#EF4444',
  creadoEn: '2026-04-01T08:00:00',
};

function buildQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
  });
}

function renderDialog(ui: React.ReactElement) {
  return render(<QueryClientProvider client={buildQueryClient()}>{ui}</QueryClientProvider>);
}

describe('EtiquetaFormDialog — create', () => {
  it('(a) renderiza el título y los campos de creación', () => {
    renderDialog(
      <EtiquetaFormDialog mode="create" open onOpenChange={vi.fn()} defaultTipo="TRATO" />,
    );
    expect(screen.getByText('Nueva etiqueta')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /crear etiqueta/i })).toBeInTheDocument();
  });
});

describe('EtiquetaFormDialog — edit (regresión useFormField)', () => {
  it('(b) renderiza sin crashear y precarga el nombre', () => {
    renderDialog(
      <EtiquetaFormDialog mode="edit" open onOpenChange={vi.fn()} etiqueta={ETIQUETA} />,
    );
    expect(screen.getByText('Editar etiqueta')).toBeInTheDocument();
    // nombre precargado en el input
    expect(screen.getByDisplayValue('Prioritario')).toBeInTheDocument();
  });

  it('(c) muestra el tipo como badge de solo lectura (inmutable)', () => {
    renderDialog(
      <EtiquetaFormDialog mode="edit" open onOpenChange={vi.fn()} etiqueta={ETIQUETA} />,
    );
    expect(screen.getByText('Trato')).toBeInTheDocument();
    expect(screen.getByText(/no se puede cambiar/i)).toBeInTheDocument();
  });
});
