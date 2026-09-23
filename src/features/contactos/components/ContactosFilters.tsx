import { Bookmark, PanelTopClose, PanelTopOpen, Search, SlidersHorizontal, X } from 'lucide-react';
import type { Empresa, Usuario } from '@/api/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SavedViewChips } from '@/components/shared/SavedViewChips';
import type { ListPreset } from '@/features/list-presets/lib/listPresets';
import type { ContactoFilters } from '../lib/contactoFilters';

interface ContactosFiltersProps {
  open: boolean;
  filters: ContactoFilters;
  presets: Array<ListPreset<ContactoFilters>>;
  empresas: Empresa[];
  usuarios: Usuario[];
  origenOptions: string[];
  resultCount: number;
  totalCount: number;
  hasActiveFilters: boolean;
  onToggle: () => void;
  onChange: (patch: Partial<ContactoFilters>) => void;
  onApplyPreset: (presetId: string) => void;
  onSavePreset: () => void;
  onDeletePreset: (presetId: string) => void;
  onClear: () => void;
}

export function ContactosFilters({
  open,
  filters,
  presets,
  empresas,
  usuarios,
  origenOptions,
  resultCount,
  totalCount,
  hasActiveFilters,
  onToggle,
  onChange,
  onApplyPreset,
  onSavePreset,
  onDeletePreset,
  onClear,
}: ContactosFiltersProps) {
  return (
    <>
      <div className="mx-auto flex w-full max-w-[1400px] justify-start">
        <Button
          variant="outline"
          size="sm"
          onClick={onToggle}
          aria-pressed={open}
          aria-expanded={open}
          className="text-muted-foreground"
        >
          {open ? (
            <PanelTopClose data-icon="inline-start" aria-hidden="true" />
          ) : (
            <PanelTopOpen data-icon="inline-start" aria-hidden="true" />
          )}
          {open ? 'Ocultar filtros' : 'Mostrar filtros'}
        </Button>
      </div>

      <div
        aria-hidden={!open}
        className={`mx-auto grid w-full max-w-[1400px] transition-[grid-template-rows,opacity,margin] duration-300 ease-in-out motion-reduce:transition-none ${
          open ? 'grid-rows-[1fr] opacity-100' : '-mb-5 grid-rows-[0fr] opacity-0'
        }`}
      >
        <div className="min-h-0 overflow-hidden">
          <section className="rounded-lg border border-border bg-card">
            <div className="flex flex-col gap-2 border-b border-border p-3 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search
                  className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <Input
                  type="search"
                  value={filters.search}
                  onChange={(event) => onChange({ search: event.target.value })}
                  placeholder="Buscar por nombre, correo, teléfono o cargo..."
                  aria-label="Buscar contactos"
                  className="h-8 pl-8"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Select value="sin-preset" onValueChange={onApplyPreset}>
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

                <Button type="button" variant="outline" size="sm" onClick={onSavePreset}>
                  <Bookmark data-icon="inline-start" aria-hidden="true" />
                  Guardar vista
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={onClear}
                  disabled={!hasActiveFilters}
                >
                  <X data-icon="inline-start" aria-hidden="true" />
                  Limpiar filtros
                </Button>
              </div>
            </div>

            <div className="flex flex-col gap-2 p-3">
              <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden="true" />
                Filtros
              </div>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
                <FilterSelect
                  label="Empresa"
                  ariaLabel="Empresa"
                  value={filters.empresaId ?? 'todas'}
                  onValueChange={(value) =>
                    onChange({ empresaId: value === 'todas' ? undefined : value })
                  }
                  items={[
                    { value: 'todas', label: 'Todas las empresas' },
                    ...empresas.map((empresa) => ({ value: empresa.id, label: empresa.nombre })),
                  ]}
                />
                <FilterSelect
                  label="Responsable"
                  ariaLabel="Responsable"
                  value={filters.responsableId ?? 'todos'}
                  onValueChange={(value) =>
                    onChange({ responsableId: value === 'todos' ? undefined : value })
                  }
                  items={[
                    { value: 'todos', label: 'Todos los responsables' },
                    ...usuarios
                      .filter((usuario) => usuario.activo)
                      .map((usuario) => ({ value: usuario.id, label: usuario.nombre })),
                  ]}
                />
                <FilterSelect
                  label="Cómo nos conoció"
                  ariaLabel="Cómo nos conoció"
                  value={filters.comoNosConocio ?? 'todos'}
                  onValueChange={(value) =>
                    onChange({ comoNosConocio: value === 'todos' ? undefined : value })
                  }
                  items={[
                    { value: 'todos', label: 'Todos los orígenes' },
                    ...origenOptions.map((origen) => ({ value: origen, label: origen })),
                  ]}
                />
              </div>

              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <p className="tabular-nums">
                  Mostrando {resultCount} de {totalCount} contactos
                </p>
                {presets.length > 0 && (
                  <>
                    <span aria-hidden="true">·</span>
                    <SavedViewChips
                      items={presets}
                      onApply={onApplyPreset}
                      onDelete={onDeletePreset}
                    />
                  </>
                )}
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}

interface FilterSelectProps {
  label: string;
  ariaLabel: string;
  value: string;
  items: Array<{ value: string; label: string }>;
  onValueChange: (value: string) => void;
}

function FilterSelect({ label, ariaLabel, value, items, onValueChange }: FilterSelectProps) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[11px] font-medium text-muted-foreground">{label}</span>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className="h-8 w-full" aria-label={ariaLabel}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {items.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </label>
  );
}
