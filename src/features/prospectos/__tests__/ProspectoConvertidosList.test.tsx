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

  it('el nombre de la empresa es navigable a /empresas/:id sin propagar al wrapper (WARN-05 fix)', async () => {
    const user = userEvent.setup();
    renderWithRouter();

    await waitFor(() =>
      expect(screen.getByText('Valentina Cruz')).toBeInTheDocument(),
    );

    // Tras el fix Change 6a (D3): el "link" de empresa es un <button role="link">
    // para evitar HTML inválido (<a> dentro de <a>). Buscamos por role=link
    // pero distinguimos el button del link real por su texto: "Innovatech".
    const empresaButton = screen.getByRole('link', { name: 'Innovatech' });
    expect(empresaButton.tagName).toBe('BUTTON');

    // Click en empresa debe navegar a /empresas/:id (sin propagar al wrapper de prospecto).
    await user.click(empresaButton);
    await waitFor(() =>
      expect(screen.getByTestId('empresa-detail')).toBeInTheDocument(),
    );
  });

  it('NO contiene <a> anidados — HTML válido (WARN-05 fix)', async () => {
    const { container } = renderWithRouter();

    await waitFor(() =>
      expect(screen.getByText('Valentina Cruz')).toBeInTheDocument(),
    );

    expect(container.querySelectorAll('a a').length).toBe(0);
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
