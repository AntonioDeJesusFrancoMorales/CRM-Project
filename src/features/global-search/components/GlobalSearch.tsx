import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { Building2, CheckSquare, Contact2, Handshake, Loader2, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useEmpresas } from '@/features/empresas/hooks/useEmpresas';
import { useContactos } from '@/features/contactos/hooks/useContactos';
import { useTratos } from '@/features/tratos/hooks/useTratos';
import { useTareas } from '@/features/tareas/hooks/useTareas';
import { usePermissions } from '@/features/permissions/context';
import {
  buildGlobalSearchResults,
  countGlobalSearchResults,
  type GlobalSearchResult,
} from '../lib/search';

const GROUPS = [
  { key: 'empresas', label: 'Empresas', icon: Building2 },
  { key: 'contactos', label: 'Contactos', icon: Contact2 },
  { key: 'tratos', label: 'Tratos', icon: Handshake },
  { key: 'tareas', label: 'Tareas', icon: CheckSquare },
] as const;

function ResultButton({ result, onSelect }: { result: GlobalSearchResult; onSelect: (result: GlobalSearchResult) => void }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(result)}
      className={cn(
        'flex w-full items-center justify-between gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors',
        'hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none',
      )}
      aria-label={`${result.title} (${result.type})`}
    >
      <span className="min-w-0 flex-1">
        <span className="block truncate font-medium">{result.title}</span>
        {result.subtitle && (
          <span className="block truncate text-xs text-muted-foreground">{result.subtitle}</span>
        )}
      </span>
      {result.badge && <Badge variant="outline" className="shrink-0 text-[10px] uppercase">{result.badge}</Badge>}
    </button>
  );
}

export function GlobalSearch() {
  const navigate = useNavigate();
  const permissions = usePermissions();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const empresasQuery = useEmpresas();
  const contactosQuery = useContactos();
  const tratosQuery = useTratos();
  const tareasQuery = useTareas();
  const canReadEmpresas = permissions.allows('EMPRESA', 'LEER');
  const canReadContactos = permissions.allows('CONTACTO', 'LEER');
  const canReadTratos = permissions.allows('TRATO', 'LEER');
  const canReadTareas = permissions.allows('TAREA', 'LEER');
  const canReadContactPrivate = permissions.canReadGroup('CONTACTO', 'CONTACTO_PRIVADO');
  const canReadEmpresaPrivate = permissions.canReadGroup('EMPRESA', 'CONTACTO_PRIVADO');
  const canReadFinancial = permissions.canReadGroup('TRATO', 'FINANCIERO');

  const isLoading = empresasQuery.isLoading || contactosQuery.isLoading || tratosQuery.isLoading || tareasQuery.isLoading;
  const hasError = empresasQuery.isError || contactosQuery.isError || tratosQuery.isError || tareasQuery.isError;
  const trimmedQuery = query.trim();

  const groups = useMemo(
    () => buildGlobalSearchResults({
      empresas: canReadEmpresas ? empresasQuery.data ?? [] : [],
      contactos: canReadContactos ? contactosQuery.data ?? [] : [],
      tratos: canReadTratos ? tratosQuery.data ?? [] : [],
      tareas: canReadTareas ? tareasQuery.data ?? [] : [],
      query,
      includeContactPrivateData: canReadContactPrivate,
      includeEmpresaPrivateData: canReadEmpresaPrivate,
      includeFinancialData: canReadFinancial,
    }),
    [
      canReadContactPrivate,
      canReadContactos,
      canReadEmpresas,
      canReadEmpresaPrivate,
      canReadFinancial,
      canReadTareas,
      canReadTratos,
      contactosQuery.data,
      empresasQuery.data,
      query,
      tareasQuery.data,
      tratosQuery.data,
    ],
  );

  const totalResults = countGlobalSearchResults(groups);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setOpen((current) => !current);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (!open) return;
    const id = window.setTimeout(() => inputRef.current?.focus(), 0);
    return () => window.clearTimeout(id);
  }, [open]);

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen) setQuery('');
  }

  function handleSelect(result: GlobalSearchResult) {
    navigate(result.to);
    handleOpenChange(false);
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="justify-between gap-3 text-muted-foreground sm:min-w-44"
        onClick={() => setOpen(true)}
        aria-label="Abrir búsqueda global"
      >
        <span className="flex items-center gap-2">
          <Search className="h-4 w-4" aria-hidden="true" />
          <span className="hidden sm:inline">Buscar...</span>
        </span>
        <kbd className="hidden rounded border bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground sm:inline-block">Ctrl K</kbd>
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-2xl gap-4 p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>Búsqueda global</DialogTitle>
            <DialogDescription>
              Encuentra empresas, contactos, tratos o tareas sin salir de la pantalla actual.
            </DialogDescription>
          </DialogHeader>

          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input
              ref={inputRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar empresas, contactos, tratos o tareas..."
              className="pl-9"
              aria-label="Buscar en todo Pipely"
            />
          </div>

          {isLoading && (
            <p className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
              Cargando datos para la búsqueda...
            </p>
          )}
          {hasError && (
            <p className="text-xs text-amber-600 dark:text-amber-400">
              Algunos datos no pudieron cargarse. Se muestran los resultados disponibles.
            </p>
          )}

          <ScrollArea className="max-h-[60vh] pr-3">
            {trimmedQuery.length < 2 ? (
              <div className="rounded-md border border-dashed py-8 text-center text-sm text-muted-foreground">
                Escribe al menos 2 caracteres para buscar.
              </div>
            ) : totalResults === 0 ? (
              <div className="rounded-md border border-dashed py-8 text-center text-sm text-muted-foreground">
                No se encontraron resultados para &quot;{trimmedQuery}&quot;.
              </div>
            ) : (
              <div className="space-y-4">
                {GROUPS.map(({ key, label, icon: Icon }) => {
                  const results = groups[key];
                  if (results.length === 0) return null;

                  return (
                    <section key={key} className="space-y-1" aria-label={label}>
                      <h3 className="flex items-center gap-2 px-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                        {label}
                      </h3>
                      <div className="space-y-1">
                        {results.map((result) => (
                          <ResultButton key={`${result.type}-${result.id}`} result={result} onSelect={handleSelect} />
                        ))}
                      </div>
                    </section>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
}
