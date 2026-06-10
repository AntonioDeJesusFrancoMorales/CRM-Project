// EtiquetasListPage — CRUD del catálogo global de etiquetas (estilo Roles).
// Filtro segmentado por tipo (Tratos | Tareas): el back las separa por TipoEtiqueta y
// una ficha solo acepta etiquetas de su mismo tipo. El tipo activo preselecciona el
// tipo al crear. KPIs derivados de la lista. TableSkeleton en loading, EmptyState rico.

import { useMemo, useState } from 'react';
import { Plus, Tag, Tags } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatCard } from '@/components/shared/StatCard';
import { EmptyState } from '@/components/shared/EmptyState';
import { TableSkeleton } from '@/components/shared/TableSkeleton';
import { cn } from '@/lib/utils';
import type { Etiqueta, TipoEtiqueta } from '@/api/types';
import { useEtiquetas } from '../hooks/useEtiquetas';
import { EtiquetasTable } from '../components/EtiquetasTable';
import { EtiquetaFormDialog } from '../components/EtiquetaFormDialog';
import { EtiquetaDeleteDialog } from '../components/EtiquetaDeleteDialog';

const TIPOS: { value: TipoEtiqueta; label: string }[] = [
  { value: 'TRATO', label: 'Tratos' },
  { value: 'TAREA', label: 'Tareas' },
];

export function EtiquetasListPage() {
  const [tipo, setTipo] = useState<TipoEtiqueta>('TRATO');
  const { data: etiquetas, isPending, isError, refetch } = useEtiquetas(tipo);

  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Etiqueta | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Etiqueta | null>(null);

  const total = useMemo(() => etiquetas?.length ?? 0, [etiquetas]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Etiquetas"
        description="Gestioná las etiquetas que clasifican los tratos y las tareas en los tableros."
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
            Nueva etiqueta
          </Button>
        }
      />

      {/* Filtro segmentado por tipo */}
      <div className="inline-flex rounded-md border p-0.5" role="tablist" aria-label="Filtrar por tipo">
        {TIPOS.map((t) => (
          <button
            key={t.value}
            type="button"
            role="tab"
            aria-selected={tipo === t.value}
            onClick={() => setTipo(t.value)}
            className={cn(
              'rounded px-4 py-1.5 text-sm font-medium transition-colors',
              tipo === t.value ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {!isError && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <StatCard
            label={`Etiquetas de ${tipo === 'TRATO' ? 'tratos' : 'tareas'}`}
            value={String(total)}
            icon={Tags}
            loading={isPending}
          />
        </div>
      )}

      {isPending && (
        <div className="rounded-md border">
          <TableSkeleton columns={4} rows={5} />
        </div>
      )}

      {isError && (
        <div className="py-12 text-center space-y-3">
          <p className="text-sm text-destructive">No fue posible cargar las etiquetas.</p>
          <Button variant="outline" onClick={() => void refetch()}>
            Reintentar
          </Button>
        </div>
      )}

      {!isPending && !isError && etiquetas && etiquetas.length === 0 && (
        <EmptyState
          icon={Tag}
          title="Aún no hay etiquetas"
          description={`Creá tu primera etiqueta de ${tipo === 'TRATO' ? 'tratos' : 'tareas'} para empezar a clasificar las fichas en los tableros.`}
          action={
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
              Nueva etiqueta
            </Button>
          }
        />
      )}

      {!isPending && !isError && etiquetas && etiquetas.length > 0 && (
        <div className="rounded-md border">
          <EtiquetasTable
            etiquetas={etiquetas}
            onEdit={(e) => setEditTarget(e)}
            onDelete={(e) => setDeleteTarget(e)}
          />
        </div>
      )}

      {/* Crear — el tipo activo del filtro preselecciona el tipo del form */}
      <EtiquetaFormDialog
        mode="create"
        open={createOpen}
        onOpenChange={setCreateOpen}
        defaultTipo={tipo}
      />

      {editTarget && (
        <EtiquetaFormDialog
          mode="edit"
          open={!!editTarget}
          onOpenChange={(v) => {
            if (!v) setEditTarget(null);
          }}
          etiqueta={editTarget}
        />
      )}

      <EtiquetaDeleteDialog
        open={!!deleteTarget}
        onOpenChange={(v) => {
          if (!v) setDeleteTarget(null);
        }}
        etiqueta={deleteTarget}
      />
    </div>
  );
}
