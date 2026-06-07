import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  /** Ícono ilustrativo en un círculo suave. */
  icon?: LucideIcon;
  /** Título del estado vacío. */
  title: string;
  /** Texto descriptivo opcional. */
  description?: string;
  /** Acción opcional (botón/CTA). */
  action?: ReactNode;
  className?: string;
}

/**
 * Estado vacío reutilizable: ícono + título + descripción + acción,
 * centrado dentro de un contenedor con borde punteado.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-lg border border-dashed px-6 py-16 text-center',
        className,
      )}
    >
      {Icon && (
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-accent text-accent-foreground">
          <Icon className="h-6 w-6" aria-hidden="true" />
        </div>
      )}
      <h3 className="text-base font-semibold">{title}</h3>
      {description && (
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          {description}
        </p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
