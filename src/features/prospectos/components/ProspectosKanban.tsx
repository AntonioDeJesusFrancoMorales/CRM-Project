import { useMemo } from 'react';
import type { Empresa, Prospecto, Usuario } from '@/api/types';
import { KanbanColumn } from './KanbanColumn';

// ADR-022: 3 columnas fijas para estados activos
// ADR-023: filtrado client-side de convertidos; búsqueda client-side por nombre_contacto
// Design sección 4: ProspectosKanban es Container pero delega mutaciones al padre
// porque useUpdateProspecto(id) necesita id estático y el id varía por card.

const COLUMNAS: Array<{ key: 'frio' | 'tibio' | 'caliente'; label: string }> = [
  { key: 'frio', label: 'Frío' },
  { key: 'tibio', label: 'Tibio' },
  { key: 'caliente', label: 'Caliente' },
];

interface ProspectosKanbanProps {
  prospectos: Prospecto[];
  empresas: Empresa[];
  usuarios: Usuario[];
  searchQuery: string;
  onEstadoChange: (id: string, nuevoEstado: 'frio' | 'tibio' | 'caliente') => void;
  onEdit: (prospecto: Prospecto) => void;
  onDelete: (prospecto: Prospecto) => void;
  onConvertir: (prospecto: Prospecto) => void;
  onViewDetail: (prospecto: Prospecto) => void;
}

export function ProspectosKanban({
  prospectos,
  empresas,
  usuarios,
  searchQuery,
  onEstadoChange,
  onEdit,
  onDelete,
  onConvertir,
  onViewDetail,
}: ProspectosKanbanProps) {
  const empresasById = useMemo(
    () => Object.fromEntries(empresas.map((e) => [e.id, e])),
    [empresas],
  );

  const usuariosById = useMemo(
    () => Object.fromEntries(usuarios.map((u) => [u.id, u])),
    [usuarios],
  );

  // ADR-023: excluir convertidos y aplicar búsqueda client-side case-insensitive
  const activos = useMemo(() => {
    const sinConvertidos = prospectos.filter(
      (p) => p.estado_posible_cliente !== 'convertido',
    );
    if (!searchQuery.trim()) return sinConvertidos;
    const q = searchQuery.toLowerCase();
    return sinConvertidos.filter((p) =>
      p.nombre_contacto.toLowerCase().includes(q),
    );
  }, [prospectos, searchQuery]);

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {COLUMNAS.map(({ key, label }) => (
        <KanbanColumn
          key={key}
          label={label}
          prospectos={activos.filter((p) => p.estado_posible_cliente === key)}
          empresasById={empresasById}
          usuariosById={usuariosById}
          onEstadoChange={onEstadoChange}
          onEdit={onEdit}
          onDelete={onDelete}
          onConvertir={onConvertir}
          onViewDetail={onViewDetail}
        />
      ))}
    </div>
  );
}
