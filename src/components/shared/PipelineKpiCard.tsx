import type { ComponentType } from 'react';
import { Card } from '@/components/ui/card';

interface PipelineKpiCardProps {
  label: string;
  value: string;
  hint?: string;
  icon: ComponentType<{ className?: string }>;
  loading?: boolean;
}

export function PipelineKpiCard({ label, value, hint, icon: Icon, loading }: PipelineKpiCardProps) {
  return (
    <Card className="rounded-lg p-4 shadow-none">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
          <Icon className="h-4 w-4" aria-hidden="true" />
        </span>
      </div>
      <div className="mt-2 flex flex-col gap-0.5">
        <p className="text-2xl font-semibold tracking-tight tabular-nums text-foreground">
          {loading ? '—' : value}
        </p>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </div>
    </Card>
  );
}
