import type { ComponentProps } from 'react';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface RefreshIconProps {
  isRefreshing?: boolean;
  className?: string;
}

export function RefreshIcon({ isRefreshing = false, className }: RefreshIconProps) {
  return (
    <RefreshCw
      className={cn(isRefreshing && 'animate-spin', className)}
      aria-hidden="true"
    />
  );
}

type RefreshButtonProps = Omit<
  ComponentProps<typeof Button>,
  'children' | 'onClick' | 'aria-label'
> & {
  resourceLabel: string;
  onRefresh: () => void;
  isRefreshing?: boolean;
};

export function RefreshButton({
  resourceLabel,
  onRefresh,
  isRefreshing = false,
  className,
  variant = 'outline',
  size = 'icon',
  ...props
}: RefreshButtonProps) {
  const label = isRefreshing ? `Recargando ${resourceLabel}` : `Recargar ${resourceLabel}`;

  return (
    <>
      <Button
        {...props}
        variant={variant}
        size={size}
        className={className}
        onClick={onRefresh}
        disabled={isRefreshing || props.disabled}
        aria-label={label}
        aria-busy={isRefreshing}
      >
        <RefreshIcon isRefreshing={isRefreshing} />
      </Button>
      <span role="status" aria-live="polite" className="sr-only">
        {isRefreshing ? `${label}...` : ''}
      </span>
    </>
  );
}
