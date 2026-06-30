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
  Trash2,
  TrendingUp,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';
import type { Empresa } from '@/api/types';
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
import { PageHeader } from '@/components/shared/PageHeader';
import { StatCard } from '@/components/shared/StatCard';
import { EmptyState } from '@/components/shared/EmptyState';
import { TableSkeleton } from '@/components/shared/TableSkeleton';
import {
  createListPreset,
  loadListPresets,
  saveListPresets,
  type ListPreset,
} from '@/features/list-presets/lib/listPresets';
import { useUsuarios } from '@/features/usuarios/hooks/useUsuarios';
import { useEmpresas } from '../hooks/useEmpresas';
import { EmpresasTable } from '../components/EmpresasTable';
import { EmpresaFormDialog } from '../components/EmpresaFormDialog';
import { EmpresaDeleteDialog } from '../components/EmpresaDeleteDialog';
import {
  applyEmpresaFilters,
  createEmptyEmpresaFilters,
  hasActiveEmpresaFilters,
  type EmpresaFilters,
} from '../lib/empresaFilters';

const PRESETS_STORAGE_KEY = 'crm:list-presets:empresas';

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
  const [filters, setFilters] = useState<EmpresaFilters>(() => createEmptyEmpresaFilters());
  const [presets, setPresets] = useState<Array<ListPreset<EmpresaFilters>>>(() =>
    loadListPresets<EmpresaFilters>(PRESETS_STORAGE_KEY),
  );
  const [savePresetOpen, setSavePresetOpen] = useState(false);
  const [presetName, setPresetName] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Empresa | null>(null);
  const [deleting, setDeleting] = useState<Empresa | null>(null);

  const { data: empresas, isLoading, isError, refetch } = useEmpresas();
  const { data: usuarios = [] } = useUsuarios();

  const kpis = useMemo(() => computeKpis(empresas ?? []), [empresas]);
  const filteredEmpresas = useMemo(
    () => applyEmpresaFilters(empresas ?? [], filters),
    [empresas, filters],
  );
  const hasFilters = hasActiveEmpresaFilters(filters);
  const sectorOptions = useMemo(() => {
    const values = new Set<string>();
    for (const empresa of empresas ?? []) {
      const value = empresa.sector?.trim();
      if (value) values.add(value);
    }
    return Array.from(values).sort((a, b) => a.localeCompare(b));
  }, [empresas]);

  function updateFilters(patch: Partial<EmpresaFilters>) {
    setFilters((current) => ({ ...current, ...patch }));
  }

  function clearFilters() {
    setFilters(createEmptyEmpresaFilters());
  }

  function persistPresets(nextPresets: Array<ListPreset<EmpresaFilters>>) {
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

    persistPresets([...presets, createListPreset(name, filters)]);
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

      {/* Filtros frontend-only */}
      <div className="space-y-4 rounded-lg border p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative max-w-sm flex-1">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              placeholder="Buscar por nombre, sector, teléfono o web..."
              value={filters.search}
              onChange={(e) => updateFilters({ search: e.target.value })}
              className="pl-9"
              aria-label="Buscar empresas"
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
          <Select
            value={filters.estadoRelacion ?? 'todos'}
            onValueChange={(value) =>
              updateFilters({
                estadoRelacion: value === 'todos' ? undefined : (value as Empresa['estadoRelacion']),
              })
            }
          >
            <SelectTrigger className="w-44" aria-label="Estado">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los estados</SelectItem>
              <SelectItem value="PROSPECTO">Prospecto</SelectItem>
              <SelectItem value="ACTIVO">Activo</SelectItem>
              <SelectItem value="INACTIVO">Inactivo</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filters.sector ?? 'todos'}
            onValueChange={(value) =>
              updateFilters({ sector: value === 'todos' ? undefined : value })
            }
          >
            <SelectTrigger className="w-48" aria-label="Sector">
              <SelectValue placeholder="Sector" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los sectores</SelectItem>
              {sectorOptions.map((sector) => (
                <SelectItem key={sector} value={sector}>
                  {sector}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.responsableId ?? 'todos'}
            onValueChange={(value) =>
              updateFilters({ responsableId: value === 'todos' ? undefined : value })
            }
          >
            <SelectTrigger className="w-52" aria-label="Responsable">
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

          <Select
            value={filters.web ?? 'todas'}
            onValueChange={(value) =>
              updateFilters({ web: value === 'todas' ? undefined : (value as EmpresaFilters['web']) })
            }
          >
            <SelectTrigger className="w-44" aria-label="Sitio web">
              <SelectValue placeholder="Sitio web" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas las webs</SelectItem>
              <SelectItem value="con-web">Con sitio web</SelectItem>
              <SelectItem value="sin-web">Sin sitio web</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <span>
            Mostrando {filteredEmpresas.length} de {empresas?.length ?? 0} empresas
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
            empresas={filteredEmpresas}
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
              placeholder="Ej: Prospectos tecnología"
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
