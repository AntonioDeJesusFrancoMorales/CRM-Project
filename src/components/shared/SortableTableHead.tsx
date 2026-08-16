import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react';
import type { ReactNode } from 'react';
import type { SortDirection } from '@/api/types';
import { Button } from '@/components/ui/button';
import { TableHead } from '@/components/ui/table';
import { cn } from '@/lib/utils';

interface SortableTableHeadProps {
  children: ReactNode;
  sortDirection?: SortDirection;
  onSort: () => void;
  className?: string;
  align?: 'left' | 'right';
}

export function SortableTableHead({
  children,
  sortDirection,
  onSort,
  className,
  align = 'left',
}: SortableTableHeadProps) {
  const Icon = sortDirection === 'asc' ? ArrowUp : sortDirection === 'desc' ? ArrowDown : ChevronsUpDown;

  return (
    <TableHead className={className}>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onSort}
        className={cn(
          '-ml-3 h-8 gap-1 px-2 text-muted-foreground hover:text-foreground',
          align === 'right' && 'ml-auto -mr-3',
        )}
      >
        <span>{children}</span>
        <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      </Button>
    </TableHead>
  );
}
