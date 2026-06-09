import { cn } from '@/lib/utils';

/**
 * Placeholder animado para estados de carga.
 * Reemplaza textos tipo "Cargando..." por un esqueleto que conserva el layout.
 */
function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-muted', className)}
      {...props}
    />
  );
}

export { Skeleton };
