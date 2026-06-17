import { Skeleton } from '@/components/ui/skeleton';
import { useEmpresas } from '@/features/empresas/hooks/useEmpresas';
import { useAllCanales } from '../hooks/useCanales';
import { CanalesTable } from '../components/CanalesTable';

export function WhatsappCanalesPage() {
  const { data: empresas = [], isLoading: loadingEmpresas } = useEmpresas();
  const { data: canales = [], isLoading: loadingCanales } = useAllCanales();

  const isLoading = loadingEmpresas || loadingCanales;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Canales WhatsApp</h1>
        <p className="text-sm text-muted-foreground">Instancias de Evolution API conectadas al CRM.</p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
        </div>
      ) : (
        <CanalesTable canales={canales} empresas={empresas} />
      )}
    </div>
  );
}
