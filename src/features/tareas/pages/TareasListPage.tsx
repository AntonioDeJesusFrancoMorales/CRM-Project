// TareasListPage — homologa TratosListPage.
// 6 filtros aplicados client-side sobre el array completo (W1 fix, ADR-048).
// Botón "Nueva tarea" → TareaCreateDialog sin tratoIdFijo (Select de trato editable y requerido).
// Tabs Lista/Kanban: los filtros viven arriba de tabs y aplican a Lista y Kanban.
// useTabSync preserva ?responsable_id= (y otros params) al cambiar de tab.

import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router';
import {
  AlertTriangle,
  Bookmark,
  CheckCircle2,
  LayoutGrid,
  ListTodo,
  List as ListIcon,
  MoreVertical,
  PanelTopClose,
  PanelTopOpen,
  Plus,
  RefreshCw,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { cn } from '@/lib/utils';
import { useTabSync } from '@/lib/useTabSync';
import {
  createListPreset,
  loadListPresets,
  saveListPresets,
  type ListPreset,
} from '@/features/list-presets/lib/listPresets';
import { useTareas, useTareasPage } from '../hooks/useTareas';
import { useUsuarios } from '@/features/usuarios/hooks/useUsuarios';
import { useTratos } from '@/features/tratos/hooks/useTratos';
import { TareasTable } from '../components/TareasTable';
import { TareaCreateDialog } from '../components/TareaCreateDialog';
import { PRIORIDAD_OPTIONS, TIPO_TAREA_OPTIONS } from '../schemas/tarea.schema';
import { KanbanTabContent } from '@/features/kanban/components/KanbanTabContent';
import type { PrioridadTarea, Tarea, TipoTarea } from '@/api/types';
import { useTareaWorkflowStates } from '../hooks/useTareaWorkflowStates';
import {
  applyTareaFilters,
  createEmptyTareaFilters,
  hasActiveTareaFilters,
  type TareaFilters,
  type VencimientoTareaFilter,
} from '../lib/tareaFilters';

const PRESETS_STORAGE_KEY = 'crm:list-presets:tareas';

/**
 * KPIs derivados de la lista plana de tareas, sólo con datos reales del back.
 * - total: cantidad de tareas.
 * - completadas: con fechaCompletada (campo real del back).
 * - vencidas: fechaLimite ya pasó y NO completada.
 * No deriva del estado local (localStorage) para no depender de un dato volátil.
 */
function computeKpis(tareas: Tarea[]) {
  const ahora = new Date();
  const total = tareas.length;
  const completadas = tareas.filter((t) => t.fechaCompletada !== null).length;
  const vencidas = tareas.filter(
    (t) => t.fechaCompletada === null && new Date(t.fechaLimite) < ahora,
  ).length;
  return { total, completadas, vencidas };
}

export function TareasListPage() {
  const [searchParams] = useSearchParams();
  const [filters, setFilters] = useState<TareaFilters>(() =>
    createEmptyTareaFilters({ responsableId: searchParams.get('responsable_id') ?? undefined }),
  );
  const [presets, setPresets] = useState<Array<ListPreset<TareaFilters>>>(() =>
    loadListPresets<TareaFilters>(PRESETS_STORAGE_KEY),
  );
  const [createOpen, setCreateOpen] = useState(false);
  const [savePresetOpen, setSavePresetOpen] = useState(false);
  const [presetName, setPresetName] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const paging = useListPageState({ initialSortBy: 'creadoEn' });

  // Sincroniza el tab activo con ?tab= en la URL. Preserva otros params (?responsable_id=, etc.).
  // Kanban es el tab por defecto — URL limpia cuando activo = "kanban"; ?tab=lista cuando activo = "lista".
  const [tab, setTab] = useTabSync(['lista', 'kanban'], 'kanban');

  const { data: tareasPage, isLoading, isError, refetch } = useTareasPage(paging.query);
  const { data: todasLasTareas } = useTareas();
  const { data: usuarios = [] } = useUsuarios();
  const { data: tratos = [] } = useTratos();
  const {
    workflowByTareaId,
    workflowColumns,
    isLoading: isLoadingWorkflow,
  } = useTareaWorkflowStates(todasLasTareas ?? []);

  const usuariosById = Object.fromEntries(usuarios.map((u) => [u.id, u.nombre]));
  const tratosById = Object.fromEntries(tratos.map((t) => [t.id, t.nombre]));

  // KPIs sobre el array COMPLETO (no sobre los filtros) — métrica de la cartera.
  const kpis = useMemo(() => computeKpis(todasLasTareas ?? []), [todasLasTareas]);

  const tareasFiltradas = useMemo(
    () => applyTareaFilters(todasLasTareas ?? [], filters, new Date(), workflowByTareaId),
    [todasLasTareas, filters, workflowByTareaId],
  );
  const tareasPagina = tareasPage?.items ?? [];
  const tareasLista = useMemo(
    () => applyTareaFilters(tareasPagina, filters, new Date(), workflowByTareaId),
    [tareasPagina, filters, workflowByTareaId],
  );
  const filteredTareaIds = useMemo(
    () => tareasFiltradas.map((tarea) => tarea.id),
    [tareasFiltradas],
  );
  const hasFilters = hasActiveTareaFilters(filters);

  function updateFilters(patch: Partial<TareaFilters>) {
    setFilters((current) => ({ ...current, ...patch }));
    paging.resetPage();
  }

  function clearFilters() {
    setFilters(createEmptyTareaFilters());
    paging.resetPage();
  }

  function handleEstadoChange(value: string) {
    if (value === 'todos') updateFilters({ estado: undefined });
    else updateFilters({ estado: value });
  }

  function handleVencimientoChange(value: string) {
    updateFilters({ vencimiento: value === 'todas' ? undefined : (value as VencimientoTareaFilter) });
  }

  function persistPresets(nextPresets: Array<ListPreset<TareaFilters>>) {
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

  return (
    <div className="flex flex-col gap-5 p-4 sm:p-6">
      {/* Header */}
      <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-semibold tracking-tight text-foreground">Tareas</h2>
          <p className="text-sm text-muted-foreground">Gestiona las tareas del CRM.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
            Nueva tarea
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

      {/* Fila de KPIs de la cartera (oculta en error de carga) */}
      {!isError && (
        <div className="mx-auto grid w-full max-w-[1400px] grid-cols-1 gap-3 sm:grid-cols-3">
          <PipelineKpiCard
            label="Total de tareas"
            value={String(kpis.total)}
            icon={ListTodo}
            loading={isLoading}
          />
          <PipelineKpiCard
            label="Completadas"
            value={String(kpis.completadas)}
            hint="Con fecha de completado"
            icon={CheckCircle2}
            loading={isLoading}
          />
          <PipelineKpiCard
            label="Vencidas"
            value={String(kpis.vencidas)}
            hint="Fecha límite pasada y sin completar"
            icon={AlertTriangle}
            loading={isLoading}
          />
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
              placeholder="Buscar por título..."
              value={filters.search}
              onChange={(e) => updateFilters({ search: e.target.value })}
              className="pl-9"
              aria-label="Buscar tareas"
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

          <Button type="button" variant="ghost" size="sm" onClick={clearFilters} disabled={!hasFilters}>
            <X className="mr-2 h-3.5 w-3.5" aria-hidden="true" />
            Limpiar filtros
          </Button>
            </div>

            <div className="flex flex-col gap-2 p-3">
              <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden="true" />
                Filtros
              </div>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-6">
          <label className="flex flex-col gap-1">
            <span className="text-[11px] font-medium text-muted-foreground">Estado</span>
          <Select value={filters.estado ?? 'todos'} onValueChange={handleEstadoChange}>
            <SelectTrigger className="h-8 w-full" aria-label="Estado">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los estados</SelectItem>
              {workflowColumns.map((columna) => (
                <SelectItem key={columna.id} value={columna.id}>
                  {columna.nombre ?? 'Sin nombre'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-[11px] font-medium text-muted-foreground">Prioridad</span>
          <Select
            value={filters.prioridad ?? 'todas'}
            onValueChange={(value) =>
              updateFilters({ prioridad: value === 'todas' ? undefined : (value as PrioridadTarea) })
            }
          >
            <SelectTrigger className="h-8 w-full" aria-label="Prioridad">
              <SelectValue placeholder="Prioridad" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas las prioridades</SelectItem>
              {PRIORIDAD_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-[11px] font-medium text-muted-foreground">Tipo</span>
          <Select
            value={filters.tipo ?? 'todos'}
            onValueChange={(value) =>
              updateFilters({ tipo: value === 'todos' ? undefined : (value as TipoTarea) })
            }
          >
            <SelectTrigger className="h-8 w-full" aria-label="Tipo">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los tipos</SelectItem>
              {TIPO_TAREA_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-[11px] font-medium text-muted-foreground">Vencimiento</span>
          <Select value={filters.vencimiento ?? 'todas'} onValueChange={handleVencimientoChange}>
            <SelectTrigger className="h-8 w-full" aria-label="Vencimiento">
              <SelectValue placeholder="Vencimiento" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas las fechas</SelectItem>
              <SelectItem value="vencidas">Vencidas</SelectItem>
              <SelectItem value="proximas">Próximas (7 días)</SelectItem>
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
                .filter((u) => u.activo)
                .map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.nombre}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-[11px] font-medium text-muted-foreground">Trato</span>
          <Select
            value={filters.tratoId ?? 'todos'}
            onValueChange={(value) =>
              updateFilters({ tratoId: value === 'todos' ? undefined : value })
            }
          >
            <SelectTrigger className="h-8 w-full" aria-label="Trato">
              <SelectValue placeholder="Trato" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los tratos</SelectItem>
              {tratos.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          </label>
        </div>

        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <p className="text-xs text-muted-foreground tabular-nums">
            Mostrando <span className="font-medium text-foreground">{tareasLista.length}</span> de{' '}
            <span className="font-medium text-foreground">{tareasPage?.totalItems ?? 0}</span> tareas
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
          {(isLoading || isLoadingWorkflow) && (
            <div className="overflow-hidden rounded-lg border border-border bg-card">
              <TableSkeleton columns={8} rows={6} />
            </div>
          )}

          {/* Error */}
          {isError && (
            <div className="py-12 text-center space-y-3">
              <p className="text-sm text-destructive">
                No fue posible cargar las tareas. Intenta de nuevo.
              </p>
              <Button variant="outline" onClick={() => void refetch()}>
                Reintentar
              </Button>
            </div>
          )}

          {/* Empty state rico: no hay tareas registradas en absoluto */}
          {!isLoading && !isLoadingWorkflow && !isError && tareasPage && tareasPage.totalItems === 0 && (
            <EmptyState
              icon={ListTodo}
              title="Aún no hay tareas"
              description="Creá tu primera tarea para empezar a darle seguimiento al trabajo del equipo."
              action={
                <Button onClick={() => setCreateOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
                  Nueva tarea
                </Button>
              }
            />
          )}

          {/* Tabla */}
          {!isLoading && !isLoadingWorkflow && !isError && tareasPage && tareasPage.totalItems > 0 && (
            <div className="overflow-hidden rounded-lg border border-border bg-card">
              <TareasTable
                tareas={tareasLista}
                tratosById={tratosById}
                usuariosById={usuariosById}
                workflowByTareaId={workflowByTareaId}
                workflowColumns={workflowColumns}
                sort={paging.sort}
                onSort={paging.setSort}
              />
              <ListPagination
                page={tareasPage.page}
                pageSize={tareasPage.pageSize}
                totalItems={tareasPage.totalItems}
                totalPages={tareasPage.totalPages}
                hasNext={tareasPage.hasNext}
                hasPrevious={tareasPage.hasPrevious}
                onPageChange={paging.setPage}
                onPageSizeChange={paging.setPageSize}
              />
            </div>
          )}
        </TabsContent>

        {/* Tab Kanban: KanbanTabContent tipo TAREAS */}
        <TabsContent value="kanban" className="mt-4 w-full px-0">
          <KanbanTabContent tipo="TAREAS" allowedEntityIds={filteredTareaIds} />
        </TabsContent>
      </Tabs>

      {/* Dialog crear tarea — sin tratoIdFijo (Select editable y requerido) */}
      <TareaCreateDialog open={createOpen} onOpenChange={setCreateOpen} />

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
              placeholder="Ej: Tareas urgentes"
              aria-label="Nombre de la vista"
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setSavePresetOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={!presetName.trim()}>
                Guardar vista
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
