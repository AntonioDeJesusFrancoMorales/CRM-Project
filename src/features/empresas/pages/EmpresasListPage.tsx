// EmpresasListPage — lista plana de empresas con búsqueda client-side.
// KPIs derivados de la lista: Total, Activas, Prospectos.
// TableSkeleton durante loading. EmptyState rico cuando vacío.
// Los KPIs se ocultan en isError para no mostrar ceros engañosos.

import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Building2,
  Layers,
  Plus,
  Search,
  TrendingUp,
  Users,
} from 'lucide-react';
import type { Empresa } from '@/api/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatCard } from '@/components/shared/StatCard';
import { EmptyState } from '@/components/shared/EmptyState';
import { TableSkeleton } from '@/components/shared/TableSkeleton';
import { useEmpresas } from '../hooks/useEmpresas';
import { EmpresasTable } from '../components/EmpresasTable';
import { EmpresaFormDialog } from '../components/EmpresaFormDialog';
import { EmpresaDeleteDialog } from '../components/EmpresaDeleteDialog';

/** KPIs de la cartera calculados sólo con la lista plana de empresas. */
function computeKpis(empresas: Empresa[]) {
  const total = empresas.length;
  const activas = empresas.filter((e) => e.estadoRelacion === 'ACTIVO').length;
  const prospectos = empresas.filter(
    (e) => e.estadoRelacion === 'PROSPECTO',
  ).length;
  return { total, activas, prospectos };
}

export function EmpresasListPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Empresa | null>(null);
  const [deleting, setDeleting] = useState<Empresa | null>(null);

  const { data: empresas, isLoading, isError, refetch } = useEmpresas();

  const kpis = useMemo(() => computeKpis(empresas ?? []), [empresas]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Empresas"
        description="Gestiona las empresas vinculadas al CRM."
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
            Nueva empresa
          </Button>
        }
      />

      {/* Fila de KPIs de la cartera (oculta en error de carga) */}
      {!isError && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard
            label="Total de empresas"
            value={String(kpis.total)}
            icon={Layers}
            loading={isLoading}
          />
          <StatCard
            label="Activas"
            value={String(kpis.activas)}
            hint="Con estadoRelación ACTIVO"
            icon={TrendingUp}
            loading={isLoading}
          />
          <StatCard
            label="Prospectos"
            value={String(kpis.prospectos)}
            hint="Con estadoRelación PROSPECTO"
            icon={Users}
            loading={isLoading}
          />
        </div>
      )}

      {/* Barra de búsqueda */}
      <div className="flex items-center gap-3">
        <div className="relative max-w-sm flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            placeholder="Buscar por nombre o sector..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
            aria-label="Buscar empresas"
          />
        </div>
      </div>

      {/* Loading: esqueleto de tabla en vez de texto plano */}
      {isLoading && (
        <div className="rounded-md border">
          <TableSkeleton columns={6} rows={5} />
        </div>
      )}

      {/* Error */}
      {isError && (
        <div className="py-12 text-center space-y-3">
          <p className="text-sm text-destructive">
            No fue posible cargar las empresas. Intenta de nuevo.
          </p>
          <Button variant="outline" onClick={() => void refetch()}>
            Reintentar
          </Button>
        </div>
      )}

      {/* Empty state rico: no hay empresas registradas */}
      {!isLoading && !isError && empresas && empresas.length === 0 && (
        <EmptyState
          icon={Building2}
          title="Aún no hay empresas"
          description="Agregá tu primera empresa para comenzar a gestionar tu cartera de clientes y prospectos."
          action={
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
              Nueva empresa
            </Button>
          }
        />
      )}

      {/* Tabla */}
      {!isLoading && !isError && empresas && empresas.length > 0 && (
        <div className="rounded-md border">
          <EmpresasTable
            empresas={empresas}
            searchTerm={searchTerm}
            onView={(empresa) => navigate(`/empresas/${empresa.id}`)}
            onEdit={(empresa) => setEditing(empresa)}
            onDelete={(empresa) => setDeleting(empresa)}
          />
        </div>
      )}

      {/* Dialog crear empresa */}
      <EmpresaFormDialog
        mode="create"
        open={createOpen}
        onOpenChange={setCreateOpen}
      />

      {/* Dialog editar empresa */}
      {editing && (
        <EmpresaFormDialog
          mode="edit"
          empresa={editing}
          open={true}
          onOpenChange={(open) => {
            if (!open) setEditing(null);
          }}
        />
      )}

      {/* Dialog eliminar empresa */}
      <EmpresaDeleteDialog
        empresa={deleting}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
      />
    </div>
  );
}
