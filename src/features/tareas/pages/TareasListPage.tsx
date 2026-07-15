// TareasListPage — homologa TratosListPage.
// 6 filtros aplicados client-side sobre el array completo (W1 fix, ADR-048).
// Botón "Nueva tarea" → TareaCreateDialog sin tratoIdFijo (Select de trato editable y requerido).
// Tabs Lista/Kanban: los filtros viven arriba de tabs y aplican a Lista y Kanban.
// useTabSync preserva ?responsable_id= (y otros params) al cambiar de tab.

import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router';
import {
  AlertTriangle,
  CheckCircle2,
  ListTodo,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatCard } from '@/components/shared/StatCard';
import { EmptyState } from '@/components/shared/EmptyState';
import { TableSkeleton } from '@/components/shared/TableSkeleton';
import { useTabSync } from '@/lib/useTabSync';
import {
  createListPreset,
  loadListPresets,
  saveListPresets,
  type ListPreset,
} from '@/features/list-presets/lib/listPresets';
import { useTareas } from '../hooks/useTareas';
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

  // Sincroniza el tab activo con ?tab= en la URL. Preserva otros params (?responsable_id=, etc.).
  // Kanban es el tab por defecto — URL limpia cuando activo = "kanban"; ?tab=lista cuando activo = "lista".
  const [tab, setTab] = useTabSync(['lista', 'kanban'], 'kanban');

  const { data: todasLasTareas, isLoading, isError, refetch } = useTareas(filters);
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

  const tareas = useMemo(
    () => applyTareaFilters(todasLasTareas ?? [], filters, new Date(), workflowByTareaId),
    [todasLasTareas, filters, workflowByTareaId],
  );
  const filteredTareaIds = useMemo(() => tareas.map((tarea) => tarea.id), [tareas]);
  const hasFilters = hasActiveTareaFilters(filters);

  function updateFilters(patch: Partial<TareaFilters>) {
    setFilters((current) => ({ ...current, ...patch }));
  }

  function clearFilters() {
    setFilters(createEmptyTareaFilters());
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
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Tareas"
        description="Gestiona las tareas del CRM."
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
            Nueva tarea
          </Button>
        }
      />

      {/* Fila de KPIs de la cartera (oculta en error de carga) */}
      {!isError && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard
            label="Total de tareas"
            value={String(kpis.total)}
            icon={ListTodo}
            loading={isLoading}
          />
          <StatCard
            label="Completadas"
            value={String(kpis.completadas)}
            hint="Con fecha de completado"
            icon={CheckCircle2}
            loading={isLoading}
          />
          <StatCard
            label="Vencidas"
            value={String(kpis.vencidas)}
            hint="Fecha límite pasada y sin completar"
            icon={AlertTriangle}
            loading={isLoading}
          />
        </div>
      )}

      {/* Filtros compartidos Lista/Kanban */}
      <div className="space-y-4 rounded-lg border p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative max-w-sm flex-1">
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
            <SelectTrigger className="w-56" aria-label="Vistas guardadas">
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

          <Button type="button" variant="outline" onClick={handleSavePreset}>
            Guardar vista
          </Button>

          <Button type="button" variant="ghost" onClick={clearFilters} disabled={!hasFilters}>
            Limpiar filtros
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Select value={filters.estado ?? 'todos'} onValueChange={handleEstadoChange}>
            <SelectTrigger className="w-40" aria-label="Estado">
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

          <Select
            value={filters.prioridad ?? 'todas'}
            onValueChange={(value) =>
              updateFilters({ prioridad: value === 'todas' ? undefined : (value as PrioridadTarea) })
            }
          >
            <SelectTrigger className="w-40" aria-label="Prioridad">
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

          <Select
            value={filters.tipo ?? 'todos'}
            onValueChange={(value) =>
              updateFilters({ tipo: value === 'todos' ? undefined : (value as TipoTarea) })
            }
          >
            <SelectTrigger className="w-40" aria-label="Tipo">
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

          <Select value={filters.vencimiento ?? 'todas'} onValueChange={handleVencimientoChange}>
            <SelectTrigger className="w-40" aria-label="Vencimiento">
              <SelectValue placeholder="Vencimiento" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas las fechas</SelectItem>
              <SelectItem value="vencidas">Vencidas</SelectItem>
              <SelectItem value="proximas">Próximas (7 días)</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filters.responsableId ?? 'todos'}
            onValueChange={(value) =>
              updateFilters({ responsableId: value === 'todos' ? undefined : value })
            }
          >
            <SelectTrigger className="w-48" aria-label="Responsable">
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

          <Select
            value={filters.tratoId ?? 'todos'}
            onValueChange={(value) =>
              updateFilters({ tratoId: value === 'todos' ? undefined : value })
            }
          >
            <SelectTrigger className="w-48" aria-label="Trato">
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
        </div>

        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <span>
            Mostrando {tareas.length} de {todasLasTareas?.length ?? 0} tareas
          </span>
          {presets.map((preset) => (
            <Button
              key={preset.id}
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => handleDeletePreset(preset.id)}
              aria-label={`Eliminar vista ${preset.name}`}
              className="h-7 px-2 text-muted-foreground"
            >
              <Trash2 className="mr-1 h-3.5 w-3.5" aria-hidden="true" />
              {preset.name}
            </Button>
          ))}
        </div>
      </div>

      {/* Tabs Lista / Kanban */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="lista">Lista</TabsTrigger>
          <TabsTrigger value="kanban">Kanban</TabsTrigger>
        </TabsList>

        {/* Tab Lista: tabla filtrada */}
        <TabsContent value="lista" className="mt-4 space-y-4">
          {/* Loading: esqueleto de tabla en vez de texto plano */}
          {(isLoading || isLoadingWorkflow) && (
            <div className="rounded-md border">
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
          {!isLoading && !isLoadingWorkflow && !isError && todasLasTareas && todasLasTareas.length === 0 && (
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
          {!isLoading && !isLoadingWorkflow && !isError && todasLasTareas && todasLasTareas.length > 0 && (
            <div className="rounded-md border">
              <TareasTable
                tareas={tareas}
                tratosById={tratosById}
                usuariosById={usuariosById}
                workflowByTareaId={workflowByTareaId}
                workflowColumns={workflowColumns}
              />
            </div>
          )}
        </TabsContent>

        {/* Tab Kanban: KanbanTabContent tipo TAREAS */}
        <TabsContent value="kanban" className="mt-4">
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
