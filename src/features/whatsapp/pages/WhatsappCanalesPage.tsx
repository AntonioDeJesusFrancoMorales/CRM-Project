import { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useEmpresas } from '@/features/empresas/hooks/useEmpresas';
import { useCanales } from '../hooks/useCanales';
import { CanalesTable } from '../components/CanalesTable';

export function WhatsappCanalesPage() {
  const [empresaId, setEmpresaId] = useState<string>('');

  const { data: empresas, isLoading: loadingEmpresas } = useEmpresas();
  const { data: canales = [], isLoading: loadingCanales } = useCanales(empresaId);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Canales WhatsApp</h1>
          <p className="text-sm text-muted-foreground">Gestiona las instancias de Evolution API por empresa.</p>
        </div>
        <div className="w-56">
          {loadingEmpresas ? (
            <Skeleton className="h-9 w-full" />
          ) : (
            <Select value={empresaId} onValueChange={setEmpresaId}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="Seleccionar empresa..." />
              </SelectTrigger>
              <SelectContent>
                {(empresas ?? []).map((e) => (
                  <SelectItem key={e.id} value={e.id} className="text-sm">
                    {e.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {!empresaId ? (
        <p className="text-sm text-muted-foreground text-center py-12">
          Selecciona una empresa para ver sus canales.
        </p>
      ) : loadingCanales ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
        </div>
      ) : (
        <CanalesTable canales={canales} empresaId={empresaId} />
      )}
    </div>
  );
}
