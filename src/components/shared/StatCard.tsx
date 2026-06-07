import type { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface StatCardProps {
  /** Etiqueta corta del KPI (ej: "Valor pipeline"). */
  label: string;
  /** Valor formateado a mostrar. Ignorado si `loading`. */
  value: string;
  /** Ícono opcional, alineado a la derecha en un chip suave. */
  icon?: LucideIcon;
  /** Línea secundaria opcional bajo el valor. */
  hint?: string;
  /** Muestra esqueleto en vez del valor. */
  loading?: boolean;
  className?: string;
}

/**
 * Tarjeta de métrica (KPI): etiqueta + valor destacado + ícono opcional.
 * Pensada para filas de StatCards arriba de una tabla/listado.
 */
export function StatCard({
  label,
  value,
  icon: Icon,
  hint,
  loading = false,
  className,
}: StatCardProps) {
  return (
    <Card className={cn('shadow-sm', className)}>
      <CardContent className="flex items-start justify-between gap-3 p-5">
        <div className="space-y-1.5">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          {loading ? (
            <Skeleton className="h-7 w-24" />
          ) : (
            <p className="text-2xl font-semibold tracking-tight tabular-nums">
              {value}
            </p>
          )}
          {hint && !loading && (
            <p className="text-xs text-muted-foreground">{hint}</p>
          )}
        </div>
        {Icon && (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
            <Icon className="h-5 w-5" aria-hidden="true" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
