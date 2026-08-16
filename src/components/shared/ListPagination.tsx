import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ListPaginationProps {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

export function ListPagination({
  page,
  pageSize,
  totalItems,
  totalPages,
  hasNext,
  hasPrevious,
  onPageChange,
  onPageSizeChange,
}: ListPaginationProps) {
  const firstItem = totalItems === 0 ? 0 : page * pageSize + 1;
  const lastItem = Math.min(totalItems, (page + 1) * pageSize);

  return (
    <div className="flex flex-col gap-3 border-t px-4 py-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
      <div>
        Mostrando <span className="font-medium text-foreground">{firstItem}</span>–
        <span className="font-medium text-foreground">{lastItem}</span> de{' '}
        <span className="font-medium text-foreground">{totalItems}</span>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <span>Filas</span>
          <Select
            value={String(pageSize)}
            onValueChange={(value) => onPageSizeChange(Number(value))}
          >
            <SelectTrigger className="h-8 w-20" aria-label="Filas por página">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZE_OPTIONS.map((option) => (
                <SelectItem key={option} value={String(option)}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <span>
          Página <span className="font-medium text-foreground">{totalPages === 0 ? 0 : page + 1}</span> de{' '}
          <span className="font-medium text-foreground">{totalPages}</span>
        </span>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page - 1)}
            disabled={!hasPrevious}
          >
            Anterior
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page + 1)}
            disabled={!hasNext}
          >
            Siguiente
          </Button>
        </div>
      </div>
    </div>
  );
}
