import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { RefreshIcon } from '@/components/shared/RefreshButton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ListPagination } from '@/components/shared/ListPagination';
import { TableSkeleton } from '@/components/shared/TableSkeleton';
import { useListPageState } from '@/components/shared/useListPageState';
import {
  createListPreset,
  loadListPresets,
  saveListPresets,
  type ListPreset,
} from '@/features/list-presets/lib/listPresets';
import type { Contacto } from '@/api/types';
import { useTabSync } from '@/lib/useTabSync';
import { useContactos, useContactosPage } from '../hooks/useContactos';
import { useEmpresas } from '@/features/empresas/hooks/useEmpresas';
import { useUsuarios } from '@/features/usuarios/hooks/useUsuarios';
import { ContactoDeleteDialog } from '../components/ContactoDeleteDialog';
import { ContactoFormDialog } from '../components/ContactoFormDialog';
import { ContactosFilters } from '../components/ContactosFilters';
import { ContactosHeader } from '../components/ContactosHeader';
import { ContactosImportExport } from '../components/ContactosImportExport';
import { ContactosKpis } from '../components/ContactosKpis';
import { ContactosTable } from '../components/ContactosTable';
import {
  applyContactoFilters,
  createEmptyContactoFilters,
  hasActiveContactoFilters,
  type ContactoFilters,
} from '../lib/contactoFilters';

type EstadoRelacion = 'PROSPECTO' | 'ACTIVO' | 'INACTIVO';

const TABS: Array<{ value: EstadoRelacion; label: string }> = [
  { value: 'PROSPECTO', label: 'Prospecto' },
  { value: 'ACTIVO', label: 'Activo' },
  { value: 'INACTIVO', label: 'Inactivo' },
];

const TAB_VALUES = TABS.map((tab) => tab.value) as readonly EstadoRelacion[];
const DEFAULT_TAB: EstadoRelacion = 'PROSPECTO';
const PRESETS_STORAGE_KEY = 'crm:list-presets:contactos';
const EMPTY_CONTACTOS: Contacto[] = [];

function computeKpis(contactos: Contacto[]) {
  return {
    total: contactos.length,
    activos: contactos.filter((contacto) => contacto.estadoRelacion === 'ACTIVO').length,
    prospectos: contactos.filter((contacto) => contacto.estadoRelacion === 'PROSPECTO').length,
  };
}

export function ContactosPage() {
  const [activeTabValue, setActiveTab] = useTabSync(TAB_VALUES, DEFAULT_TAB);
  const activeTab = activeTabValue as EstadoRelacion;
  const [filters, setFilters] = useState<ContactoFilters>(() => createEmptyContactoFilters());
  const [presets, setPresets] = useState<Array<ListPreset<ContactoFilters>>>(() =>
    loadListPresets<ContactoFilters>(PRESETS_STORAGE_KEY),
  );
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [savePresetOpen, setSavePresetOpen] = useState(false);
  const [presetName, setPresetName] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Contacto | null>(null);
  const [deleting, setDeleting] = useState<Contacto | null>(null);
  const paging = useListPageState({ initialSortBy: 'creadoEn' });

  const {
    data: contactosPage,
    isLoading: pageLoading,
    isError: pageError,
    isFetching: pageFetching,
    refetch: refetchPage,
  } = useContactosPage(paging.query);
  const {
    data: todosLosContactos,
    isLoading: allLoading,
    isError: allError,
    isFetching: allFetching,
    refetch: refetchAll,
  } = useContactos();
  const { data: empresas = [] } = useEmpresas();
  const { data: usuarios = [] } = useUsuarios();

  const isLoading = pageLoading || allLoading;
  const isError = pageError || allError;
  const isRefreshing = pageFetching || allFetching;
  const contactos = contactosPage?.items ?? EMPTY_CONTACTOS;
  const kpis = useMemo(() => computeKpis(todosLosContactos ?? []), [todosLosContactos]);
  const filteredContactos = useMemo(
    () => applyContactoFilters(contactos, filters),
    [contactos, filters],
  );
  const visibleContactos = filteredContactos.filter(
    (contacto) => contacto.estadoRelacion === activeTab,
  );
  const totalCount = contactosPage?.totalItems ?? todosLosContactos?.length ?? 0;
  const hasFilters = hasActiveContactoFilters(filters);
  const origenOptions = useMemo(() => {
    const values = new Set<string>();
    for (const contacto of todosLosContactos ?? []) {
      const origen = contacto.comoNosConocio?.trim();
      if (origen) values.add(origen);
    }
    return Array.from(values).sort((left, right) => left.localeCompare(right));
  }, [todosLosContactos]);

  function updateFilters(patch: Partial<ContactoFilters>) {
    setFilters((current) => ({ ...current, ...patch }));
    paging.resetPage();
  }

  function clearFilters() {
    setFilters(createEmptyContactoFilters());
    paging.resetPage();
  }

  function persistPresets(nextPresets: Array<ListPreset<ContactoFilters>>) {
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

  function handleRefresh() {
    void Promise.all([refetchPage(), refetchAll()]);
  }

  return (
    <div className="flex flex-col gap-5 p-4 sm:p-6">
      <ContactosHeader
        importExport={<ContactosImportExport contactos={todosLosContactos ?? []} />}
        onRefresh={handleRefresh}
        onCreate={() => setCreateOpen(true)}
        isRefreshing={isRefreshing}
      />

      {!isError && (
        <ContactosKpis
          total={kpis.total}
          activos={kpis.activos}
          prospectos={kpis.prospectos}
          loading={isLoading}
        />
      )}

      {!isLoading && !isError && (
        <>
          <ContactosFilters
            open={filtersOpen}
            filters={filters}
            presets={presets}
            empresas={empresas}
            usuarios={usuarios}
            origenOptions={origenOptions}
            resultCount={visibleContactos.length}
            totalCount={totalCount}
            hasActiveFilters={hasFilters}
            onToggle={() => setFiltersOpen((open) => !open)}
            onChange={updateFilters}
            onApplyPreset={handleApplyPreset}
            onSavePreset={handleSavePreset}
            onDeletePreset={handleDeletePreset}
            onClear={clearFilters}
          />

          <Tabs
            value={activeTab}
            onValueChange={(value) => {
              setActiveTab(value);
              paging.resetPage();
            }}
            className="gap-4"
          >
            <div className="mx-auto w-full max-w-[1400px]">
              <TabsList className="h-auto w-full justify-start gap-1 rounded-none border-b border-border bg-transparent p-0">
                {TABS.map((tab) => (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className="flex-none rounded-none border-b-2 border-transparent px-3 py-2 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                  >
                    {tab.label}
                    <span
                      aria-hidden="true"
                      className="ml-1.5 text-xs tabular-nums text-muted-foreground"
                    >
                      {
                        (todosLosContactos ?? []).filter(
                          (contacto) => contacto.estadoRelacion === tab.value,
                        ).length
                      }
                    </span>
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            {TABS.map((tab) => (
              <TabsContent
                key={tab.value}
                value={tab.value}
                className="mx-auto mt-0 w-full max-w-[1400px]"
              >
                <div className="overflow-hidden rounded-lg border border-border bg-card">
                  <ContactosTable
                    contactos={tab.value === activeTab ? visibleContactos : []}
                    empresas={empresas}
                    usuarios={usuarios}
                    onEdit={setEditing}
                    onDelete={setDeleting}
                    onCreate={() => setCreateOpen(true)}
                    sort={paging.sort}
                    onSort={paging.setSort}
                  />
                  {tab.value === activeTab && contactosPage && (
                    <ListPagination
                      page={contactosPage.page}
                      pageSize={contactosPage.pageSize}
                      totalItems={contactosPage.totalItems}
                      totalPages={contactosPage.totalPages}
                      hasNext={contactosPage.hasNext}
                      hasPrevious={contactosPage.hasPrevious}
                      onPageChange={paging.setPage}
                      onPageSizeChange={paging.setPageSize}
                    />
                  )}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </>
      )}

      {isLoading && (
        <div className="mx-auto w-full max-w-[1400px] overflow-hidden rounded-lg border border-border bg-card">
          <TableSkeleton columns={9} rows={6} />
        </div>
      )}

      {isError && (
        <div className="mx-auto w-full max-w-[1400px] rounded-lg border border-border bg-card p-10 text-center">
          <p className="mb-3 text-sm text-destructive">
            No fue posible cargar los contactos. Intenta de nuevo.
          </p>
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={isRefreshing}
            aria-busy={isRefreshing}
          >
            <RefreshIcon isRefreshing={isRefreshing} />
            {isRefreshing ? 'Cargando...' : 'Reintentar'}
          </Button>
        </div>
      )}

      <ContactoFormDialog
        mode="create"
        open={createOpen}
        onOpenChange={setCreateOpen}
        existingContactos={todosLosContactos}
      />

      {editing && (
        <ContactoFormDialog
          mode="edit"
          contacto={editing}
          open={true}
          existingContactos={todosLosContactos}
          onOpenChange={(open) => {
            if (!open) setEditing(null);
          }}
        />
      )}

      <ContactoDeleteDialog
        contacto={deleting}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
      />

      <Dialog open={savePresetOpen} onOpenChange={setSavePresetOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Guardar vista</DialogTitle>
            <DialogDescription>
              Guarda los filtros actuales como una vista local para reutilizarlos después.
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
              placeholder="Ej: Prospectos referidos"
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
