import { TrendingUp, UserCheck, Users } from 'lucide-react';
import { PipelineKpiCard } from '@/components/shared/PipelineKpiCard';

interface ContactosKpisProps {
  total: number;
  activos: number;
  prospectos: number;
  loading: boolean;
}

export function ContactosKpis({ total, activos, prospectos, loading }: ContactosKpisProps) {
  return (
    <div className="mx-auto grid w-full max-w-[1400px] grid-cols-1 gap-3 sm:grid-cols-3">
      <PipelineKpiCard
        label="Total de contactos"
        value={String(total)}
        hint="En tu cartera"
        icon={Users}
        loading={loading}
      />
      <PipelineKpiCard
        label="Activos"
        value={String(activos)}
        hint="Con relación activa"
        icon={UserCheck}
        loading={loading}
      />
      <PipelineKpiCard
        label="Prospectos"
        value={String(prospectos)}
        hint="En etapa prospecto"
        icon={TrendingUp}
        loading={loading}
      />
    </div>
  );
}
