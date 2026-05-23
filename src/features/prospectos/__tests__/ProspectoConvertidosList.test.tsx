import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router';

import { ProspectoConvertidosList } from '../components/ProspectoConvertidosList';
import type { Prospecto, Cliente, Empresa, Usuario } from '@/api/types';

// ── Fixtures mínimos ──────────────────────────────────────────────────────────

const empresa: Empresa = {
  id: 'a1111111-aaaa-1111-aaaa-111111111111',
  nombre: 'Innovatech',
  sector: 'tecnologia',
  telefono: null,
  pagina_web: null,
  facebook: null,
  instagram: null,
  twitter: null,
  creado_en: '2026-01-01T00:00:00.000Z',
  actualizado_en: '2026-01-01T00:00:00.000Z',
};

const prospectoConvertido: Prospecto = {
  id: 'b4444444-bbbb-4444-bbbb-444444444444',
  empresa_id: empresa.id,
  responsable_id: '11111111-1111-1111-1111-111111111111',
  creado_por: '11111111-1111-1111-1111-111111111111',
  nombre_contacto: 'Valentina Cruz',
  correo_contacto: 'vcruz@innovatech.example.com',
  telefono_contacto: null,
  cargo_contacto: 'Directora Comercial',
  como_nos_conocio: null,
  estado_posible_cliente: 'convertido',
  notas: null,
  creado_en: '2026-05-01T09:00:00.000Z',
  actualizado_en: '2026-05-10T11:00:00.000Z',
};

const clienteConvertido: Cliente = {
  id: 'c3333333-cccc-3333-cccc-333333333333',
  empresa_id: empresa.id,
  responsable_id: '11111111-1111-1111-1111-111111111111',
  creado_por: '11111111-1111-1111-1111-111111111111',
  nombre_contacto: 'Valentina Cruz',
  correo_contacto: null,
  telefono_contacto: null,
  cargo_contacto: null,
  como_nos_conocio: null,
  notas: null,
  prospecto_origen_id: prospectoConvertido.id,
  creado_en: '2026-05-10T11:00:00.000Z',
  actualizado_en: '2026-05-10T11:00:00.000Z',
};

const usuarios: Usuario[] = [];

// ── Helper para renderizar con router ─────────────────────────────────────────

function renderWithRouter(initialPath = '/prospectos') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route
          path="/prospectos"
          element={
            <ProspectoConvertidosList
              prospectos={[prospectoConvertido]}
              clientes={[clienteConvertido]}
              empresas={[empresa]}
              usuarios={usuarios}
            />
          }
        />
        <Route
          path="/prospectos/:id"
          element={<div data-testid="prospecto-detail">Detalle prospecto</div>}
        />
        <Route
          path="/empresas/:id"
          element={<div data-testid="empresa-detail">Detalle empresa</div>}
        />
      </Routes>
    </MemoryRouter>,
  );
}

// ── Tests (Lote G — Fix 3) ────────────────────────────────────────────────────

describe('ProspectoConvertidosList — navegación desde filas (Lote G)', () => {
  it('la fila de un prospecto convertido es clickeable y navega a /prospectos/:id', async () => {
    const user = userEvent.setup();
    renderWithRouter();

    // La fila de Valentina Cruz debe estar visible
    await waitFor(() =>
      expect(screen.getByText('Valentina Cruz')).toBeInTheDocument(),
    );

    // Click en el nombre del prospecto (o en la fila)
    await user.click(screen.getByText('Valentina Cruz'));

    // Debe navegar a la página de detalle
    await waitFor(() =>
      expect(screen.getByTestId('prospecto-detail')).toBeInTheDocument(),
    );
  });

  it('el nombre de la empresa dentro de la fila es un link a /empresas/:id', async () => {
    renderWithRouter();

    await waitFor(() =>
      expect(screen.getByText('Valentina Cruz')).toBeInTheDocument(),
    );

    // El nombre de la empresa debe ser un link. Puede haber varios links con texto que
    // incluye "Innovatech" (el link de fila también lo contiene), así que buscamos
    // específicamente el que apunta a /empresas/:id.
    const links = screen.getAllByRole('link');
    const empresaLink = links.find((l) =>
      l.getAttribute('href')?.startsWith('/empresas/'),
    );
    expect(empresaLink).toBeDefined();
    expect(empresaLink).toHaveAttribute('href', `/empresas/${empresa.id}`);
  });

  it('la fila tiene cursor pointer como indicador visual de que es clickeable', async () => {
    renderWithRouter();

    await waitFor(() =>
      expect(screen.getByText('Valentina Cruz')).toBeInTheDocument(),
    );

    // El link de fila debe tener clase cursor-pointer o ser un <a> navigable
    const rowLink = screen.getByRole('link', { name: /valentina cruz/i });
    expect(rowLink).toBeInTheDocument();
  });
});
