import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RefreshButton } from '@/components/shared/RefreshButton';

interface EmpresasHeaderProps {
  onRefresh: () => void;
  onCreate?: () => void;
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
        <RefreshButton
          resourceLabel="empresas"
          onRefresh={onRefresh}
          isRefreshing={isRefreshing}
        />
        {onCreate && (
          <Button size="sm" onClick={onCreate}>
            <Plus data-icon="inline-start" aria-hidden="true" />
            Nueva empresa
          </Button>
        )}
      </div>
    </header>
  );
}
