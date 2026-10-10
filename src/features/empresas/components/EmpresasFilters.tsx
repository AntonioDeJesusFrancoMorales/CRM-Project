import { useEffect, useRef, type ReactNode } from 'react';
import { Bookmark, PanelTopClose, PanelTopOpen, Search, X } from 'lucide-react';
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
import type { EmpresaFilters as EmpresaFilterState } from '../lib/empresaFilters';

interface EmpresasFiltersProps {
  open: boolean;
  filters: EmpresaFilterState;
  presets: Array<ListPreset<EmpresaFilterState>>;
  resultCount: number;
  totalCount: number;
  hasActiveFilters: boolean;
  includePrivateData: boolean;
  children: ReactNode;
  onToggle: () => void;
  onChange: (patch: Partial<EmpresaFilterState>) => void;
  onApplyPreset: (presetId: string) => void;
  onSavePreset: () => void;
  onDeletePreset: (presetId: string) => void;
  onClear: () => void;
}

export function EmpresasFilters({
  open,
  filters,
  presets,
  resultCount,
  totalCount,
  hasActiveFilters,
  includePrivateData,
  children,
  onToggle,
  onChange,
  onApplyPreset,
  onSavePreset,
  onDeletePreset,
  onClear,
}: EmpresasFiltersProps) {
  const filterPanelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const filterPanel = filterPanelRef.current;
    if (!filterPanel) return;
    if (open) {
      filterPanel.removeAttribute('inert');
    } else {
      filterPanel.setAttribute('inert', '');
    }
  }, [open]);

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
        ref={filterPanelRef}
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
                  placeholder={
                    includePrivateData
                      ? 'Buscar por nombre, sector, teléfono o sitio web...'
                      : 'Buscar por nombre o sector...'
                  }
                  aria-label="Buscar empresas"
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
              {children}
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <p className="tabular-nums">
                  Mostrando {resultCount} de {totalCount} empresas
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
