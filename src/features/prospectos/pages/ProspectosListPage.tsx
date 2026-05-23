import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Plus, Search } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Prospecto } from '@/api/types';
import { apiClient } from '@/api/client';
import { useProspectos } from '../hooks/useProspectos';
import { useEmpresas } from '@/features/empresas/hooks/useEmpresas';
import { useUsuarios } from '@/features/usuarios/hooks/useUsuarios';
import { useClientes } from '../hooks/useClientes';
import { ProspectosKanban } from '../components/ProspectosKanban';
import { ProspectoConvertidosList } from '../components/ProspectoConvertidosList';
import { ProspectoFormDialog } from '../components/ProspectoFormDialog';
import { ProspectoDeleteDialog } from '../components/ProspectoDeleteDialog';
import { ConvertirProspectoDialog } from '../components/ConvertirProspectoDialog';
import { prospectosKeys } from '../hooks/useProspectos';

// Design sección 3: Container — orquesta hooks + estado UI local
// ADR-022: tabs Activos (Kanban) / Convertidos
// ADR-023: filtrado client-side por estado; búsqueda client-side por nombre
// ADR-028: Select inline de estado vía ProspectoCard → onEstadoChange callback

export function ProspectosListPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: prospectos, isLoading, isError } = useProspectos();
  const { data: empresas = [] } = useEmpresas();
  const { data: usuarios = [] } = useUsuarios();
  const { data: clientes = [] } = useClientes();

  const [searchQuery, setSearchQuery] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Prospecto | null>(null);
  const [deleting, setDeleting] = useState<Prospecto | null>(null);
  const [convirtiendo, setConvirtiendo] = useState<Prospecto | null>(null);

  // ADR-028: mutation para cambio de estado in-place desde ProspectoCard
  // La ProspectosListPage recibe (id, nuevoEstado) y hace el PATCH directamente.
  // useMutation con variables dinámicas porque el id cambia por card.
  const estadoMutation = useMutation({
    mutationFn: ({ id, estado }: { id: string; estado: 'frio' | 'tibio' | 'caliente' }) =>
      apiClient.patch<Prospecto>(`/prospectos/${id}`, { estado_posible_cliente: estado }),
    onSuccess: (updated) => {
      void queryClient.invalidateQueries({ queryKey: prospectosKeys.list() });
      void queryClient.invalidateQueries({ queryKey: prospectosKeys.detail(updated.id) });
    },
    onError: () => {
      toast.error('No fue posible actualizar el estado del prospecto');
    },
  });

  function handleEstadoChange(id: string, nuevoEstado: 'frio' | 'tibio' | 'caliente') {
    estadoMutation.mutate({ id, estado: nuevoEstado });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Prospectos</h1>
          <p className="text-sm text-muted-foreground">
            Gestiona el pipeline de prospectos del CRM.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
          Nuevo prospecto
        </Button>
      </header>

      {/* Barra de búsqueda (ADR-023: filtrado client-side) */}
      <div className="relative max-w-sm">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          placeholder="Buscar por nombre..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
          aria-label="Buscar prospectos"
        />
      </div>

      {/* Loading / Error */}
      {isLoading && (
        <p className="py-12 text-center text-sm text-muted-foreground">
          Cargando prospectos...
        </p>
      )}

      {isError && (
        <p className="py-12 text-center text-sm text-destructive">
          No fue posible cargar los prospectos. Intenta de nuevo.
        </p>
      )}

      {/* Tabs Activos / Convertidos (ADR-022) */}
      {!isLoading && !isError && prospectos && (
        <Tabs defaultValue="activos">
          <TabsList>
            <TabsTrigger value="activos">Activos</TabsTrigger>
            <TabsTrigger value="convertidos">Convertidos</TabsTrigger>
          </TabsList>

          {/* Tab Activos — Kanban 3 columnas */}
          <TabsContent value="activos" className="mt-4">
            <ProspectosKanban
              prospectos={prospectos}
              empresas={empresas}
              usuarios={usuarios}
              searchQuery={searchQuery}
              onEstadoChange={handleEstadoChange}
              onEdit={(prospecto) => setEditing(prospecto)}
              onDelete={(prospecto) => setDeleting(prospecto)}
              onConvertir={(prospecto) => setConvirtiendo(prospecto)}
              onViewDetail={(prospecto) => navigate(`/prospectos/${prospecto.id}`)}
            />
          </TabsContent>

          {/* Tab Convertidos — lista con sección "este mes" + Collapsible */}
          <TabsContent value="convertidos" className="mt-4">
            <ProspectoConvertidosList
              prospectos={prospectos}
              clientes={clientes}
              empresas={empresas}
              usuarios={usuarios}
            />
          </TabsContent>
        </Tabs>
      )}

      {/* Dialogs */}
      <ProspectoFormDialog
        mode="create"
        open={createOpen}
        onOpenChange={setCreateOpen}
      />

      {editing && (
        <ProspectoFormDialog
          mode="edit"
          prospecto={editing}
          open={true}
          onOpenChange={(open) => {
            if (!open) setEditing(null);
          }}
        />
      )}

      <ProspectoDeleteDialog
        prospecto={deleting}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
      />

      <ConvertirProspectoDialog
        prospecto={convirtiendo}
        onOpenChange={(open) => {
          if (!open) setConvirtiendo(null);
        }}
      />
    </div>
  );
}
