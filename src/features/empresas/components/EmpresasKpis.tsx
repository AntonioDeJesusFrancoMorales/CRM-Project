import { Building2, TrendingUp, UserCheck } from 'lucide-react';
import { PipelineKpiCard } from '@/components/shared/PipelineKpiCard';

interface EmpresasKpisProps {
  total: number;
  activas: number;
  prospectos: number;
  loading: boolean;
}

export function EmpresasKpis({ total, activas, prospectos, loading }: EmpresasKpisProps) {
  return (
    <div className="mx-auto grid w-full max-w-[1400px] grid-cols-1 gap-3 sm:grid-cols-3">
      <PipelineKpiCard
        label="Total de empresas"
        value={String(total)}
        hint="En tu cartera"
        icon={Building2}
        loading={loading}
      />
      <PipelineKpiCard
        label="Activas"
        value={String(activas)}
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
