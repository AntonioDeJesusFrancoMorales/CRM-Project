import type { ReactNode } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RefreshButton } from '@/components/shared/RefreshButton';

interface ContactosHeaderProps {
  importExport: ReactNode;
  onRefresh: () => void;
  onCreate: () => void;
  isRefreshing?: boolean;
}

export function ContactosHeader({
  importExport,
  onRefresh,
  onCreate,
  isRefreshing = false,
}: ContactosHeaderProps) {
  return (
    <header className="mx-auto flex w-full max-w-[1400px] flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Contactos</h1>
        <p className="text-sm text-muted-foreground">
          Gestiona tus contactos y relaciones comerciales.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {importExport}
        <RefreshButton
          resourceLabel="contactos"
          onRefresh={onRefresh}
          isRefreshing={isRefreshing}
        />
        <Button size="sm" onClick={onCreate}>
          <Plus data-icon="inline-start" aria-hidden="true" />
          Nuevo contacto
        </Button>
      </div>
    </header>
  );
}
