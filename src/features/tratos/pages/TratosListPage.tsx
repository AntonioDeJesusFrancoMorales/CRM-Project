// TratosListPage — lista plana de tratos con tabs Lista/Kanban.
// Búsqueda client-side por nombre. Sin filtros estado/cliente/prospecto/responsable.
// Resolución de contactos para TratosTable vía useContactos().
// Tab "Lista" = tabla + búsqueda. Tab "Kanban" = KanbanTabContent tipo="TRATOS".
// useTabSync sincroniza el tab activo con ?tab= en la URL (URL limpia cuando activo = "kanban" — default).

import { useMemo, useState } from 'react';
import {
  Bookmark,
  Handshake,
  LayoutGrid,
  Layers,
  List as ListIcon,
  MoreVertical,
  PanelTopClose,
  PanelTopOpen,
  Plus,
  Receipt,
  RefreshCw,
  Scale,
  Search,
  SlidersHorizontal,
  Wallet,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import type { EstadoTrato, TipoContrato, Trato } from '@/api/types';
import { isHttpError } from '@/api/http-error';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EmptyState } from '@/components/shared/EmptyState';
import { TableSkeleton } from '@/components/shared/TableSkeleton';
import { ListPagination } from '@/components/shared/ListPagination';
import { useListPageState } from '@/components/shared/useListPageState';
import { PipelineKpiCard } from '@/components/shared/PipelineKpiCard';
import { SavedViewChips } from '@/components/shared/SavedViewChips';
import { formatCompactCurrency } from '@/lib/format';
import { cn } from '@/lib/utils';
import { useTabSync } from '@/lib/useTabSync';
import {
  createListPreset,
  loadListPresets,
  saveListPresets,
  type ListPreset,
} from '@/features/list-presets/lib/listPresets';
import { useTratos, useTratosPage } from '../hooks/useTratos';
import { useDeleteTrato } from '../hooks/useDeleteTrato';
import { useContactos } from '@/features/contactos/hooks/useContactos';
import { useUsuarios } from '@/features/usuarios/hooks/useUsuarios';
import { TratosTable } from '../components/TratosTable';
import { TratoCreateDialog } from '../components/TratoCreateDialog';
import { TratoEditDialog } from '../components/TratoEditDialog';
import { TratoDeleteDialog } from '../components/TratoDeleteDialog';
import { KanbanTabContent } from '@/features/kanban/components/KanbanTabContent';
import {
  applyTratoFilters,
  createEmptyTratoFilters,
  hasActiveTratoFilters,
  type CierreEsperadoFilter,
  type TratoFilters,
} from '../lib/tratoFilters';
import { tipoContratoLabels } from '../lib/tipoContrato';

const PRESETS_STORAGE_KEY = 'crm:list-presets:tratos';

const ESTADO_OPTIONS: Array<{ value: EstadoTrato; label: string }> = [
  { value: 'ABIERTO', label: 'Abierto' },
  { value: 'GANADO', label: 'Ganado' },
  { value: 'PERDIDO', label: 'Perdido' },
];

const TIPO_CONTRATO_OPTIONS: TipoContrato[] = [
  'SERVICIO',
  'LICENCIA',
  'SUSCRIPCION',
  'PERMANENTE',
  'OTRO',
];

const CIERRE_OPTIONS: Array<{ value: CierreEsperadoFilter; label: string }> = [
  { value: 'vencidas', label: 'Vencidas' },
  { value: 'proximos-7', label: 'Próximos 7 días' },
  { value: 'proximos-30', label: 'Próximos 30 días' },
  { value: 'sin-fecha', label: 'Sin fecha' },
];

/** KPIs del pipeline calculados sólo con la lista plana de tratos. */
function computeKpis(tratos: Trato[]) {
  const total = tratos.length;
  const open = tratos.filter((t) => t.estado === 'ABIERTO');
  const pipeline = open.reduce((acc, t) => acc + (t.valorEstimado ?? 0), 0);
  const ponderado = tratos.reduce(
    (acc, t) => acc + (t.valorEstimado ?? 0) * ((t.probabilidad ?? 0) / 100),
    0,
  );
  const ticketPromedio = open.length > 0 ? pipeline / open.length : 0;
  return { total, pipeline, ponderado, ticketPromedio, abiertos: open.length };
}

export function TratosListPage() {
  const [filters, setFilters] = useState<TratoFilters>(() => createEmptyTratoFilters());
  const [presets, setPresets] = useState<Array<ListPreset<TratoFilters>>>(() =>
    loadListPresets<TratoFilters>(PRESETS_STORAGE_KEY),
  );
  const [createOpen, setCreateOpen] = useState(false);
  const [savePresetOpen, setSavePresetOpen] = useState(false);
  const [presetName, setPresetName] = useState('');
  const [editTarget, setEditTarget] = useState<Trato | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Trato | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const paging = useListPageState({ initialSortBy: 'creadoEn' });

  const [tab, setTab] = useTabSync(['lista', 'kanban'], 'kanban');

  const { data: tratosPage, isLoading, isError, refetch } = useTratosPage(paging.query);
  const { data: tratos } = useTratos();
  const { data: contactos = [] } = useContactos();
  const { data: usuarios = [] } = useUsuarios();
  const deleteMutation = useDeleteTrato();

  const kpis = useMemo(() => computeKpis(tratos ?? []), [tratos]);
  const filteredTratos = useMemo(
    () => applyTratoFilters(tratos ?? [], filters),
    [tratos, filters],
  );
  const tratosPagina = tratosPage?.items ?? [];
  const tratosLista = useMemo(
    () => applyTratoFilters(tratosPagina, filters),
    [tratosPagina, filters],
  );
  const filteredTratoIds = useMemo(
    () => filteredTratos.map((trato) => trato.id),
    [filteredTratos],
  );
  const hasFilters = hasActiveTratoFilters(filters);

  function updateFilters(patch: Partial<TratoFilters>) {
    setFilters((current) => ({ ...current, ...patch }));
    paging.resetPage();
  }

  function clearFilters() {
    setFilters(createEmptyTratoFilters());
    paging.resetPage();
  }

  function handleNumberFilterChange(key: 'valorMin' | 'valorMax', value: string) {
    const trimmed = value.trim();
    updateFilters({ [key]: trimmed === '' ? undefined : Number(trimmed) });
  }

  function persistPresets(nextPresets: Array<ListPreset<TratoFilters>>) {
    setPresets(nextPresets);
    saveListPresets(PRESETS_STORAGE_KEY, nextPresets);
  }

  function handleSavePreset() {
    setPresetName('');
    setSavePresetOpen(true);
  }

  function handleConfirmSavePreset() {
    const name = presetName.trim();
    if (!name) return;

    const nextPreset = createListPreset(name, filters);
    persistPresets([...presets, nextPreset]);
    setSavePresetOpen(false);
    setPresetName('');
    toast.success('Vista guardada');
  }

  function handleApplyPreset(presetId: string) {
    if (presetId === 'sin-preset') return;
    const preset = presets.find((item) => item.id === presetId);
    if (!preset) return;
    setFilters(preset.filters);
  }

  function handleDeletePreset(presetId: string) {
    persistPresets(presets.filter((preset) => preset.id !== presetId));
    toast.success('Vista eliminada');
  }

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
    <div className="flex flex-col gap-5 p-4 sm:p-6">
      {/* Header */}
      <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-semibold tracking-tight text-foreground">Tratos</h2>
          <p className="text-sm text-muted-foreground">Gestiona los tratos comerciales del CRM.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
            Nuevo trato
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" aria-label="Más acciones">
                <MoreVertical className="h-4 w-4" aria-hidden="true" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={() => void refetch()}>
                  <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />
                  Recargar
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Fila de KPIs del pipeline (oculta en error de carga) */}
      {!isError && (
        <div className="mx-auto grid w-full max-w-[1400px] grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            { label: 'Total de tratos', value: String(kpis.total), hint: `${kpis.abiertos} abiertos`, icon: Layers },
            { label: 'Valor pipeline', value: formatCompactCurrency(kpis.pipeline), hint: 'Tratos abiertos', icon: Wallet },
            { label: 'Valor ponderado', value: formatCompactCurrency(kpis.ponderado), hint: 'Ajustado por probabilidad', icon: Scale },
            { label: 'Ticket promedio', value: formatCompactCurrency(kpis.ticketPromedio), hint: 'Por trato abierto', icon: Receipt },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <PipelineKpiCard
                key={item.label}
                label={item.label}
                value={item.value}
                hint={item.hint}
                icon={Icon}
                loading={isLoading}
              />
            );
          })}
        </div>
      )}

      {/* Filtros compartidos Lista/Kanban */}
      <div className="mx-auto flex w-full max-w-[1400px] justify-start">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setFiltersOpen((current) => !current)}
          aria-pressed={filtersOpen}
          aria-expanded={filtersOpen}
          className="text-muted-foreground"
        >
          {filtersOpen ? (
            <PanelTopClose className="mr-2 h-4 w-4" aria-hidden="true" />
          ) : (
            <PanelTopOpen className="mr-2 h-4 w-4" aria-hidden="true" />
          )}
          {filtersOpen ? 'Ocultar filtros' : 'Mostrar filtros'}
        </Button>
      </div>

      <div
        aria-hidden={!filtersOpen}
        className={cn(
          'mx-auto grid w-full max-w-[1400px] transition-[grid-template-rows,opacity,margin] duration-300 ease-in-out motion-reduce:transition-none',
          filtersOpen ? 'grid-rows-[1fr] opacity-100' : '-mb-5 grid-rows-[0fr] opacity-0',
        )}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="rounded-lg border border-border bg-card">
            <div className="flex flex-col gap-2 border-b border-border p-3 sm:flex-row sm:items-center">
              <div className="relative flex-1">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              placeholder="Buscar por nombre..."
              value={filters.search}
              onChange={(e) => updateFilters({ search: e.target.value })}
              className="pl-9"
              aria-label="Buscar tratos"
            />
              </div>

              <Select value="sin-preset" onValueChange={handleApplyPreset}>
            <SelectTrigger className="h-8 w-full sm:w-44" aria-label="Vistas guardadas">
              <Bookmark className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <SelectValue placeholder="Vistas guardadas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sin-preset">Vistas guardadas</SelectItem>
              {presets.map((preset) => (
                <SelectItem key={preset.id} value={preset.id}>
                  {preset.name}
                </SelectItem>
              ))}
            </SelectContent>
              </Select>

              <Button type="button" variant="outline" size="sm" onClick={handleSavePreset}>
            <Bookmark className="mr-2 h-3.5 w-3.5" aria-hidden="true" />
            Guardar vista
              </Button>

              <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            disabled={!hasFilters}
          >
            <X className="mr-2 h-3.5 w-3.5" aria-hidden="true" />
            Limpiar filtros
              </Button>
            </div>

            <div className="flex flex-col gap-2 p-3">
          <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden="true" />
            Filtros
          </div>
              <div className="grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-7">
          <label className="flex flex-col gap-1">
            <span className="text-[11px] font-medium text-muted-foreground">Estado</span>
          <Select
            value={filters.estado ?? 'todos'}
            onValueChange={(value) =>
              updateFilters({ estado: value === 'todos' ? undefined : (value as EstadoTrato) })
            }
          >
            <SelectTrigger className="h-8 w-full" aria-label="Estado">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los estados</SelectItem>
              {ESTADO_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-[11px] font-medium text-muted-foreground">Tipo de contrato</span>
          <Select
            value={filters.tipoContrato ?? 'todos'}
            onValueChange={(value) =>
              updateFilters({
                tipoContrato: value === 'todos' ? undefined : (value as TipoContrato),
              })
            }
          >
            <SelectTrigger className="h-8 w-full" aria-label="Tipo de contrato">
              <SelectValue placeholder="Tipo de contrato" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los tipos</SelectItem>
              {TIPO_CONTRATO_OPTIONS.map((tipo) => (
                <SelectItem key={tipo} value={tipo}>
                  {tipoContratoLabels[tipo]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-[11px] font-medium text-muted-foreground">Responsable</span>
          <Select
            value={filters.responsableId ?? 'todos'}
            onValueChange={(value) =>
              updateFilters({ responsableId: value === 'todos' ? undefined : value })
            }
          >
            <SelectTrigger className="h-8 w-full" aria-label="Responsable">
              <SelectValue placeholder="Responsable" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los responsables</SelectItem>
              {usuarios
                .filter((usuario) => usuario.activo)
                .map((usuario) => (
                  <SelectItem key={usuario.id} value={usuario.id}>
                    {usuario.nombre}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-[11px] font-medium text-muted-foreground">Contacto</span>
          <Select
            value={filters.contactoId ?? 'todos'}
            onValueChange={(value) =>
              updateFilters({ contactoId: value === 'todos' ? undefined : value })
            }
          >
            <SelectTrigger className="h-8 w-full" aria-label="Contacto">
              <SelectValue placeholder="Contacto" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los contactos</SelectItem>
              {contactos.map((contacto) => (
                <SelectItem key={contacto.id} value={contacto.id}>
                  {contacto.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-[11px] font-medium text-muted-foreground">Valor mín.</span>
          <Input
            type="number"
            min="0"
            inputMode="numeric"
            placeholder="0"
            value={filters.valorMin ?? ''}
            onChange={(event) => handleNumberFilterChange('valorMin', event.target.value)}
            className="no-spinner h-8 w-full"
            aria-label="Valor mínimo"
          />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-[11px] font-medium text-muted-foreground">Valor máx.</span>
          <Input
            type="number"
            min="0"
            inputMode="numeric"
            placeholder="Sin límite"
            value={filters.valorMax ?? ''}
            onChange={(event) => handleNumberFilterChange('valorMax', event.target.value)}
            className="no-spinner h-8 w-full"
            aria-label="Valor máximo"
          />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-[11px] font-medium text-muted-foreground">Cierre esperado</span>
          <Select
            value={filters.cierreEsperado ?? 'todas'}
            onValueChange={(value) =>
              updateFilters({
                cierreEsperado:
                  value === 'todas' ? undefined : (value as CierreEsperadoFilter),
              })
            }
          >
            <SelectTrigger className="h-8 w-full" aria-label="Cierre esperado">
              <SelectValue placeholder="Cierre esperado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas las fechas</SelectItem>
              {CIERRE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          </label>
              </div>

              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <p className="text-xs text-muted-foreground tabular-nums">
            Mostrando <span className="font-medium text-foreground">{tratosLista.length}</span> de{' '}
            <span className="font-medium text-foreground">{tratosPage?.totalItems ?? 0}</span> tratos
          </p>
          <SavedViewChips items={presets} onApply={handleApplyPreset} onDelete={handleDeletePreset} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Lista / Kanban */}
      <Tabs value={tab} onValueChange={setTab} className="gap-4">
        <div className="mx-auto w-full max-w-[1400px]">
          <TabsList>
            <TabsTrigger value="kanban">
              <LayoutGrid className="mr-2 h-4 w-4" aria-hidden="true" />
              Kanban
            </TabsTrigger>
            <TabsTrigger value="lista">
              <ListIcon className="mr-2 h-4 w-4" aria-hidden="true" />
              Lista
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Tab Lista: tabla filtrada */}
        <TabsContent value="lista" className="mx-auto mt-4 w-full max-w-[1400px] space-y-4">
          {/* Loading: esqueleto de tabla en vez de texto plano */}
          {isLoading && (
            <div className="overflow-hidden rounded-lg border border-border bg-card">
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
          {!isLoading && !isError && tratosPage && tratosPage.totalItems === 0 && (
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
          {!isLoading && !isError && tratosPage && tratosPage.totalItems > 0 && (
            <div className="overflow-hidden rounded-lg border border-border bg-card">
              <TratosTable
                tratos={tratosLista}
                contactos={contactos}
                usuarios={usuarios}
                onEdit={(trato) => setEditTarget(trato)}
                onDelete={(trato) => setDeleteTarget(trato)}
                sort={paging.sort}
                onSort={paging.setSort}
              />
              <ListPagination
                page={tratosPage.page}
                pageSize={tratosPage.pageSize}
                totalItems={tratosPage.totalItems}
                totalPages={tratosPage.totalPages}
                hasNext={tratosPage.hasNext}
                hasPrevious={tratosPage.hasPrevious}
                onPageChange={paging.setPage}
                onPageSizeChange={paging.setPageSize}
              />
            </div>
          )}
        </TabsContent>

        {/* Tab Kanban: KanbanTabContent tipo TRATOS */}
        <TabsContent value="kanban" className="mt-4 w-full px-0">
          <KanbanTabContent tipo="TRATOS" allowedEntityIds={filteredTratoIds} />
        </TabsContent>
      </Tabs>

      {/* Dialog crear trato */}
      <TratoCreateDialog open={createOpen} onOpenChange={setCreateOpen} />

      <Dialog open={savePresetOpen} onOpenChange={setSavePresetOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Guardar vista</DialogTitle>
            <DialogDescription>
              Guardá los filtros actuales como una vista local para reutilizarlos después.
            </DialogDescription>
          </DialogHeader>

          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              handleConfirmSavePreset();
            }}
          >
            <Input
              autoFocus
              value={presetName}
              onChange={(event) => setPresetName(event.target.value)}
              placeholder="Ej: Mis tratos abiertos"
              aria-label="Nombre de la vista"
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setSavePresetOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={!presetName.trim()}>
                Guardar vista
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

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
