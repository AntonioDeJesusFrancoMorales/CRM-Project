// EmpresasListPage — lista plana de empresas con búsqueda client-side.
// KPIs derivados de la lista: Total, Activas, Prospectos.
// TableSkeleton durante loading. EmptyState rico cuando vacío.
// Los KPIs se ocultan en isError para no mostrar ceros engañosos.

import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
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
import { TableSkeleton } from '@/components/shared/TableSkeleton';
import { ListPagination } from '@/components/shared/ListPagination';
import { useListPageState } from '@/components/shared/useListPageState';
import {
  createListPreset,
  loadListPresets,
  saveListPresets,
  type ListPreset,
} from '@/features/list-presets/lib/listPresets';
import { useUsuarios } from '@/features/usuarios/hooks/useUsuarios';
import { useEmpresas, useEmpresasPage } from '../hooks/useEmpresas';
import { EmpresasTable } from '../components/EmpresasTable';
import { EmpresasHeader } from '../components/EmpresasHeader';
import { EmpresasFilters } from '../components/EmpresasFilters';
import { EmpresasKpis } from '../components/EmpresasKpis';
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
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Empresa | null>(null);
  const [deleting, setDeleting] = useState<Empresa | null>(null);
  const paging = useListPageState({ initialSortBy: 'creadoEn' });

  const { data: empresasPage, isLoading, isError, refetch } = useEmpresasPage(paging.query);
  const { data: todasLasEmpresas } = useEmpresas();
  const { data: usuarios = [] } = useUsuarios();
  const empresas = empresasPage?.items ?? [];

  const kpis = useMemo(() => computeKpis(todasLasEmpresas ?? []), [todasLasEmpresas]);
  const filteredEmpresas = useMemo(
    () => applyEmpresaFilters(empresas, filters),
    [empresas, filters],
  );
  const hasFilters = hasActiveEmpresaFilters(filters);
  const sectorOptions = useMemo(() => {
    const values = new Set<string>();
    for (const empresa of todasLasEmpresas ?? []) {
      const value = empresa.sector?.trim();
      if (value) values.add(value);
    }
    return Array.from(values).sort((a, b) => a.localeCompare(b));
  }, [todasLasEmpresas]);

  function updateFilters(patch: Partial<EmpresaFilters>) {
    setFilters((current) => ({ ...current, ...patch }));
    paging.resetPage();
  }

  function clearFilters() {
    setFilters(createEmptyEmpresaFilters());
    paging.resetPage();
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
    paging.resetPage();
  }

  function handleDeletePreset(presetId: string) {
    persistPresets(presets.filter((preset) => preset.id !== presetId));
    toast.success('Vista eliminada');
  }

  return (
    <div className="flex flex-col gap-5 p-4 sm:p-6">
      <EmpresasHeader
        onRefresh={() => void refetch()}
        onCreate={() => setCreateOpen(true)}
      />

      {!isError && (
        <EmpresasKpis
          total={kpis.total}
          activas={kpis.activas}
          prospectos={kpis.prospectos}
          loading={isLoading}
        />
      )}

      {!isLoading && !isError && (
        <EmpresasFilters
          open={filtersOpen}
          filters={filters}
          presets={presets}
          resultCount={filteredEmpresas.length}
          totalCount={empresasPage?.totalItems ?? todasLasEmpresas?.length ?? 0}
          hasActiveFilters={hasFilters}
          onToggle={() => setFiltersOpen((open) => !open)}
          onChange={updateFilters}
          onApplyPreset={handleApplyPreset}
          onSavePreset={handleSavePreset}
          onDeletePreset={handleDeletePreset}
          onClear={clearFilters}
        >
          <div className="flex flex-wrap items-center gap-3">
            <Select
              value={filters.estadoRelacion ?? 'todos'}
              onValueChange={(value) =>
                updateFilters({
                  estadoRelacion:
                    value === 'todos' ? undefined : (value as Empresa['estadoRelacion']),
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
                updateFilters({
                  web: value === 'todas' ? undefined : (value as EmpresaFilters['web']),
                })
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
        </EmpresasFilters>
      )}

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

      {/* Tabla */}
      {!isLoading && !isError && empresasPage && (
        <div className="mx-auto w-full max-w-[1400px] overflow-hidden rounded-lg border border-border bg-card">
          <EmpresasTable
            empresas={filteredEmpresas}
            onView={(empresa) => navigate(`/empresas/${empresa.id}`)}
            onEdit={(empresa) => setEditing(empresa)}
            onDelete={(empresa) => setDeleting(empresa)}
            onCreate={() => setCreateOpen(true)}
            isEmptyDataset={empresasPage.totalItems === 0}
            sort={paging.sort}
            onSort={paging.setSort}
          />
          <ListPagination
            page={empresasPage.page}
            pageSize={empresasPage.pageSize}
            totalItems={empresasPage.totalItems}
            totalPages={empresasPage.totalPages}
            hasNext={empresasPage.hasNext}
            hasPrevious={empresasPage.hasPrevious}
            onPageChange={paging.setPage}
            onPageSizeChange={paging.setPageSize}
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
