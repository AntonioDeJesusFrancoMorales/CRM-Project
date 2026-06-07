// TratosListPage — lista plana de tratos con tabs Lista/Kanban.
// Búsqueda client-side por nombre. Sin filtros estado/cliente/prospecto/responsable.
// Resolución de contactos para TratosTable vía useContactos().
// Tab "Lista" = tabla + búsqueda. Tab "Kanban" = KanbanTabContent tipo="TRATOS".
// useTabSync sincroniza el tab activo con ?tab= en la URL (URL limpia cuando activo = "kanban" — default).

import { useMemo, useState } from 'react';
import {
  Handshake,
  Layers,
  Plus,
  Receipt,
  Search,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { toast } from 'sonner';
import type { Trato } from '@/api/types';
import { isHttpError } from '@/api/http-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatCard } from '@/components/shared/StatCard';
import { EmptyState } from '@/components/shared/EmptyState';
import { TableSkeleton } from '@/components/shared/TableSkeleton';
import { formatCurrency } from '@/lib/format';
import { useTabSync } from '@/lib/useTabSync';
import { useTratos } from '../hooks/useTratos';
import { useDeleteTrato } from '../hooks/useDeleteTrato';
import { useContactos } from '@/features/contactos/hooks/useContactos';
import { useUsuarios } from '@/features/usuarios/hooks/useUsuarios';
import { TratosTable } from '../components/TratosTable';
import { TratoCreateDialog } from '../components/TratoCreateDialog';
import { TratoEditDialog } from '../components/TratoEditDialog';
import { TratoDeleteDialog } from '../components/TratoDeleteDialog';
import { KanbanTabContent } from '@/features/kanban/components/KanbanTabContent';

/** KPIs del pipeline calculados sólo con la lista plana de tratos. */
function computeKpis(tratos: Trato[]) {
  const total = tratos.length;
  const pipeline = tratos.reduce((acc, t) => acc + (t.valorEstimado ?? 0), 0);
  const ponderado = tratos.reduce(
    (acc, t) => acc + (t.valorEstimado ?? 0) * ((t.probabilidad ?? 0) / 100),
    0,
  );
  const ticketPromedio = total > 0 ? pipeline / total : 0;
  return { total, pipeline, ponderado, ticketPromedio };
}

export function TratosListPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Trato | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Trato | null>(null);

  const [tab, setTab] = useTabSync(['lista', 'kanban'], 'kanban');

  const { data: tratos, isLoading, isError, refetch } = useTratos();
  const { data: contactos = [] } = useContactos();
  const { data: usuarios = [] } = useUsuarios();
  const deleteMutation = useDeleteTrato();

  const kpis = useMemo(() => computeKpis(tratos ?? []), [tratos]);

  function handleConfirmDelete() {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget.id, {
      onSuccess: () => setDeleteTarget(null),
      onError: (err) => {
        // 409: el trato tiene tareas asociadas; mostramos el mensaje del back.
        if (isHttpError(err) && err.status === 409) {
          toast.error(err.message);
        }
        setDeleteTarget(null);
      },
    });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Tratos"
        description="Gestiona los tratos comerciales del CRM."
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
            Nuevo trato
          </Button>
        }
      />

      {/* Fila de KPIs del pipeline (oculta en error de carga) */}
      {!isError && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Total de tratos"
            value={String(kpis.total)}
            icon={Layers}
            loading={isLoading}
          />
          <StatCard
            label="Valor pipeline"
            value={formatCurrency(kpis.pipeline)}
            hint="Suma del valor estimado"
            icon={Wallet}
            loading={isLoading}
          />
          <StatCard
            label="Valor ponderado"
            value={formatCurrency(kpis.ponderado)}
            hint="Estimado × probabilidad"
            icon={TrendingUp}
            loading={isLoading}
          />
          <StatCard
            label="Ticket promedio"
            value={formatCurrency(kpis.ticketPromedio)}
            icon={Receipt}
            loading={isLoading}
          />
        </div>
      )}

      {/* Tabs Lista / Kanban */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="lista">Lista</TabsTrigger>
          <TabsTrigger value="kanban">Kanban</TabsTrigger>
        </TabsList>

        {/* Tab Lista: búsqueda + tabla actual */}
        <TabsContent value="lista" className="mt-4 space-y-4">
          {/* Barra de búsqueda */}
          <div className="flex items-center gap-3">
            <div className="relative max-w-sm flex-1">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                placeholder="Buscar por nombre..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
                aria-label="Buscar tratos"
              />
            </div>
          </div>

          {/* Loading: esqueleto de tabla en vez de texto plano */}
          {isLoading && (
            <div className="rounded-md border">
              <TableSkeleton columns={7} rows={6} />
            </div>
          )}

          {/* Error */}
          {isError && (
            <div className="py-12 text-center space-y-3">
              <p className="text-sm text-destructive">
                No fue posible cargar los tratos. Intenta de nuevo.
              </p>
              <Button variant="outline" onClick={() => void refetch()}>
                Reintentar
              </Button>
            </div>
          )}

          {/* Empty state rico: no hay tratos registrados */}
          {!isLoading && !isError && tratos && tratos.length === 0 && (
            <EmptyState
              icon={Handshake}
              title="Aún no hay tratos"
              description="Creá tu primer trato para empezar a darle seguimiento a tu pipeline comercial."
              action={
                <Button onClick={() => setCreateOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
                  Nuevo trato
                </Button>
              }
            />
          )}

          {/* Tabla */}
          {!isLoading && !isError && tratos && tratos.length > 0 && (
            <div className="rounded-md border">
              <TratosTable
                tratos={tratos}
                contactos={contactos}
                usuarios={usuarios}
                searchTerm={searchTerm}
                onEdit={(trato) => setEditTarget(trato)}
                onDelete={(trato) => setDeleteTarget(trato)}
              />
            </div>
          )}
        </TabsContent>

        {/* Tab Kanban: KanbanTabContent tipo TRATOS */}
        <TabsContent value="kanban" className="mt-4">
          <KanbanTabContent tipo="TRATOS" />
        </TabsContent>
      </Tabs>

      {/* Dialog crear trato */}
      <TratoCreateDialog open={createOpen} onOpenChange={setCreateOpen} />

      {/* Dialog editar trato */}
      {editTarget && (
        <TratoEditDialog
          open={!!editTarget}
          onOpenChange={(open) => !open && setEditTarget(null)}
          trato={editTarget}
        />
      )}

      {/* Dialog eliminar trato */}
      <TratoDeleteDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        nombre={deleteTarget?.nombre ?? ''}
        onConfirm={handleConfirmDelete}
        isDeleting={deleteMutation.isPending}
      />
    </div>
  );
}
