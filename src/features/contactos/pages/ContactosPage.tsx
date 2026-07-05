// ContactosPage — lista de contactos con tabs por estadoRelación.
// KPIs derivados de la lista: Total, Activos, Prospectos (ocultos en error).
// TableSkeleton durante loading. Tabla vacía muestra mensaje interno cuando el tab no tiene contactos.
// Los tabs filtran client-side; la lista completa viene de useContactos().

import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router';
import { Plus, Search, Trash2, Users, TrendingUp, UserCheck } from 'lucide-react';
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
import { TableSkeleton } from '@/components/shared/TableSkeleton';
import {
  createListPreset,
  loadListPresets,
  saveListPresets,
  type ListPreset,
} from '@/features/list-presets/lib/listPresets';
import type { Contacto } from '@/api/types';
import { useContactos } from '../hooks/useContactos';
import { useEmpresas } from '@/features/empresas/hooks/useEmpresas';
import { useUsuarios } from '@/features/usuarios/hooks/useUsuarios';
import { ContactosTable } from '../components/ContactosTable';
import { ContactoFormDialog } from '../components/ContactoFormDialog';
import { ContactoDeleteDialog } from '../components/ContactoDeleteDialog';
import { ContactosImportExport } from '../components/ContactosImportExport';
import {
  applyContactoFilters,
  createEmptyContactoFilters,
  hasActiveContactoFilters,
  type ContactoFilters,
} from '../lib/contactoFilters';

type EstadoRelacion = 'PROSPECTO' | 'ACTIVO' | 'INACTIVO';

const TABS: { value: EstadoRelacion; label: string }[] = [
  { value: 'PROSPECTO', label: 'Prospecto' },
  { value: 'ACTIVO', label: 'Activo' },
  { value: 'INACTIVO', label: 'Inactivo' },
];

const DEFAULT_TAB: EstadoRelacion = 'PROSPECTO';
const PRESETS_STORAGE_KEY = 'crm:list-presets:contactos';

function isEstadoRelacion(value: string | null): value is EstadoRelacion {
  return value === 'PROSPECTO' || value === 'ACTIVO' || value === 'INACTIVO';
}

/** KPIs de la cartera de contactos calculados con la lista plana. */
function computeKpis(contactos: Contacto[]) {
  const total = contactos.length;
  const activos = contactos.filter((c) => c.estadoRelacion === 'ACTIVO').length;
  const prospectos = contactos.filter(
    (c) => c.estadoRelacion === 'PROSPECTO',
  ).length;
  return { total, activos, prospectos };
}

export function ContactosPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const rawTab = searchParams.get('tab');
  const activeTab: EstadoRelacion = isEstadoRelacion(rawTab) ? rawTab : DEFAULT_TAB;

  const [filters, setFilters] = useState<ContactoFilters>(() => createEmptyContactoFilters());
  const [presets, setPresets] = useState<Array<ListPreset<ContactoFilters>>>(() =>
    loadListPresets<ContactoFilters>(PRESETS_STORAGE_KEY),
  );
  const [savePresetOpen, setSavePresetOpen] = useState(false);
  const [presetName, setPresetName] = useState('');

  const { data: contactos, isLoading, isError, refetch } = useContactos({
    ...filters,
    estadoRelacion: activeTab,
  });
  const { data: empresas = [] } = useEmpresas();
  const { data: usuarios = [] } = useUsuarios();

  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Contacto | null>(null);
  const [deleting, setDeleting] = useState<Contacto | null>(null);

  const kpis = useMemo(() => computeKpis(contactos ?? []), [contactos]);

  function handleTabChange(value: string) {
    setSearchParams({ tab: value }, { replace: true });
  }

  const filteredContactos = useMemo(
    () => applyContactoFilters(contactos ?? [], filters),
    [contactos, filters],
  );
  const filtered = filteredContactos.filter((c) => c.estadoRelacion === activeTab);
  const hasFilters = hasActiveContactoFilters(filters);
  const origenOptions = useMemo(() => {
    const values = new Set<string>();
    for (const contacto of contactos ?? []) {
      const value = contacto.comoNosConocio?.trim();
      if (value) values.add(value);
    }
    return Array.from(values).sort((a, b) => a.localeCompare(b));
  }, [contactos]);

  function updateFilters(patch: Partial<ContactoFilters>) {
    setFilters((current) => ({ ...current, ...patch }));
  }

  function clearFilters() {
    setFilters(createEmptyContactoFilters());
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
  }

  function handleDeletePreset(presetId: string) {
    persistPresets(presets.filter((preset) => preset.id !== presetId));
    toast.success('Vista eliminada');
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Contactos"
        description="Gestiona prospectos, clientes activos e inactivos."
        actions={
          <div className="flex flex-wrap gap-2">
            <ContactosImportExport contactos={contactos ?? []} />
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
              Nuevo contacto
            </Button>
          </div>
        }
      />

      {/* Fila de KPIs de la cartera (oculta en error de carga) */}
      {!isError && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard
            label="Total de contactos"
            value={String(kpis.total)}
            icon={Users}
            loading={isLoading}
          />
          <StatCard
            label="Activos"
            value={String(kpis.activos)}
            hint="Con estadoRelación ACTIVO"
            icon={UserCheck}
            loading={isLoading}
          />
          <StatCard
            label="Prospectos"
            value={String(kpis.prospectos)}
            hint="Con estadoRelación PROSPECTO"
            icon={TrendingUp}
            loading={isLoading}
          />
        </div>
      )}

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
            No fue posible cargar los contactos. Intenta de nuevo.
          </p>
          <Button variant="outline" onClick={() => void refetch()}>
            Reintentar
          </Button>
        </div>
      )}

      {!isLoading && !isError && (
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <div className="space-y-4 rounded-lg border p-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <TabsList>
              {TABS.map((tab) => (
                <TabsTrigger key={tab.value} value={tab.value}>
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>

            {/* Barra de búsqueda */}
            <div className="relative max-w-sm w-full sm:w-auto">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                placeholder="Buscar por nombre, correo, teléfono o cargo..."
                value={filters.search}
                onChange={(e) => updateFilters({ search: e.target.value })}
                className="pl-9"
                aria-label="Buscar contactos"
              />
            </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
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

              <Select
                value={filters.empresaId ?? 'todas'}
                onValueChange={(value) =>
                  updateFilters({ empresaId: value === 'todas' ? undefined : value })
                }
              >
                <SelectTrigger className="w-52" aria-label="Empresa">
                  <SelectValue placeholder="Empresa" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas las empresas</SelectItem>
                  {empresas.map((empresa) => (
                    <SelectItem key={empresa.id} value={empresa.id}>
                      {empresa.nombre}
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
                value={filters.comoNosConocio ?? 'todos'}
                onValueChange={(value) =>
                  updateFilters({ comoNosConocio: value === 'todos' ? undefined : value })
                }
              >
                <SelectTrigger className="w-56" aria-label="Cómo nos conoció">
                  <SelectValue placeholder="Cómo nos conoció" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los orígenes</SelectItem>
                  {origenOptions.map((origen) => (
                    <SelectItem key={origen} value={origen}>
                      {origen}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <span>
                Mostrando {filtered.length} de {contactos?.length ?? 0} contactos
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

          {TABS.map((tab) => (
            <TabsContent key={tab.value} value={tab.value} className="mt-4">
              <div className="rounded-md border">
                <ContactosTable
                  contactos={tab.value === activeTab ? filtered : []}
                  onEdit={(c) => setEditing(c)}
                  onDelete={(c) => setDeleting(c)}
                  onCreate={() => setCreateOpen(true)}
                />
              </div>
            </TabsContent>
          ))}
        </Tabs>
      )}

      <ContactoFormDialog
        mode="create"
        open={createOpen}
        onOpenChange={setCreateOpen}
      />

      {editing && (
        <ContactoFormDialog
          mode="edit"
          contacto={editing}
          open={true}
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
