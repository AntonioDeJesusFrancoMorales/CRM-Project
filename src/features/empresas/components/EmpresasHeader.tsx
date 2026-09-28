import { Plus, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmpresasHeaderProps {
  onRefresh: () => void;
  onCreate: () => void;
  isRefreshing?: boolean;
}

export function EmpresasHeader({ onRefresh, onCreate, isRefreshing = false }: EmpresasHeaderProps) {
  return (
    <header className="mx-auto flex w-full max-w-[1400px] flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Empresas</h1>
        <p className="text-sm text-muted-foreground">Gestiona las empresas vinculadas al CRM.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={onRefresh}
          disabled={isRefreshing}
          aria-label={isRefreshing ? 'Recargando empresas' : 'Recargar empresas'}
          aria-busy={isRefreshing}
        >
          <RefreshCw className={isRefreshing ? 'animate-spin' : undefined} aria-hidden="true" />
        </Button>
        <span role="status" aria-live="polite" className="sr-only">
          {isRefreshing ? 'Recargando empresas...' : ''}
        </span>
        <Button size="sm" onClick={onCreate}>
          <Plus data-icon="inline-start" aria-hidden="true" />
          Nueva empresa
        </Button>
      </div>
    </header>
  );
}
