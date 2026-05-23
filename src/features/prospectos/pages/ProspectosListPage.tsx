import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Plus, Search } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Prospecto } from '@/api/types';
import { apiClient } from '@/api/client';
import { useAuthStore } from '@/store/authStore';
import { useProspectos } from '../hooks/useProspectos';
import { useEmpresas } from '@/features/empresas/hooks/useEmpresas';
import { useUsuarios } from '@/features/usuarios/hooks/useUsuarios';
import { useClientes } from '@/features/clientes/hooks/useClientes';
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
// Lote G — Fix 1: filtros "Solo míos" (server-side) + Select responsable (server-side)
// Lote G — Fix 2: botón "Reintentar" en error state

export function ProspectosListPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const usuario = useAuthStore((s) => s.usuario);

  // Filtros server-side (REQ-PROS-FILTROS-002, REQ-PROS-FILTROS-003)
  const [soloMios, setSoloMios] = useState(false);
  const [responsableIdFiltro, setResponsableIdFiltro] = useState<string | undefined>(undefined);

  // Cuando "Solo míos" está activo, siempre usa el id del usuario en sesión.
  // Cuando está desactivado, usa el valor del Select de responsable (o undefined si "Todos").
  const responsableId = soloMios ? (usuario?.id ?? undefined) : responsableIdFiltro;

  const { data: prospectos, isLoading, isError, refetch } = useProspectos(
    responsableId ? { responsable_id: responsableId } : {},
  );
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

  function handleSoloMiosChange(checked: boolean) {
    setSoloMios(checked);
    // Al activar "Solo míos", limpiamos el Select de responsable para evitar ambigüedad
    if (checked) setResponsableIdFiltro(undefined);
  }

  function handleResponsableChange(value: string) {
    // "todos" es el valor del placeholder — significa "sin filtro"
    const filtro = value === 'todos' ? undefined : value;
    setResponsableIdFiltro(filtro);
    // Desactivar "Solo míos" al elegir un responsable explícito
    if (filtro) setSoloMios(false);
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

      {/* Top-bar de filtros (ADR-023: búsqueda client-side + server-side por responsable) */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Búsqueda client-side (REQ-PROS-FILTROS-001) */}
        <div className="relative max-w-sm flex-1">
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

        {/* Select de responsable (server-side, REQ-PROS-FILTROS-003) */}
        <Select
          value={responsableIdFiltro ?? 'todos'}
          onValueChange={handleResponsableChange}
          disabled={soloMios}
        >
          <SelectTrigger className="w-44" aria-label="Responsable">
            <SelectValue placeholder="Responsable" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            {usuarios.map((u) => (
              <SelectItem key={u.id} value={u.id}>
                {u.nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Toggle "Solo míos" (server-side, REQ-PROS-FILTROS-002) */}
        <label className="flex cursor-pointer items-center gap-2 text-sm select-none">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border border-input accent-primary"
            checked={soloMios}
            onChange={(e) => handleSoloMiosChange(e.target.checked)}
            aria-label="Solo míos"
          />
          Solo míos
        </label>
      </div>

      {/* Loading / Error */}
      {isLoading && (
        <p className="py-12 text-center text-sm text-muted-foreground">
          Cargando prospectos...
        </p>
      )}

      {isError && (
        <div className="py-12 text-center space-y-3">
          <p className="text-sm text-destructive">
            No fue posible cargar los prospectos. Intenta de nuevo.
          </p>
          {/* WARN-04: botón Reintentar (REQ-PROS-LISTADO-001 Scenario: Error) */}
          <Button variant="outline" onClick={() => void refetch()}>
            Reintentar
          </Button>
        </div>
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
