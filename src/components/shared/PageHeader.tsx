import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  /** Título principal de la página. */
  title: string;
  /** Subtítulo / descripción opcional bajo el título. */
  description?: string;
  /** Acciones alineadas a la derecha (botones, etc.). */
  actions?: ReactNode;
  className?: string;
}

/**
 * Encabezado estándar de página: título + descripción a la izquierda,
 * acciones a la derecha. Responsive (apila en mobile).
 */
export function PageHeader({
  title,
  description,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        'flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between',
        className,
      )}
    >
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </header>
  );
}
