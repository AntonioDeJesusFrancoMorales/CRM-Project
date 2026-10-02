import type { ListQueryOptions, SortDirection } from '@/api/types';

export type SortState = Required<Pick<ListQueryOptions, 'sortBy' | 'sortDirection'>>;

export const DEFAULT_PAGE_SIZE = 25;

export function toggleSort(current: SortState, sortBy: string): SortState {
  if (current.sortBy !== sortBy) return { sortBy, sortDirection: 'asc' };
  return {
    sortBy,
    sortDirection: current.sortDirection === 'asc' ? 'desc' : 'asc',
  };
}

export function sortDirectionFor(sort: SortState, sortBy: string): SortDirection | undefined {
  return sort.sortBy === sortBy ? sort.sortDirection : undefined;
}

export function sortNullableLast<T>(
  items: T[],
  getValue: (item: T) => string | number | null | undefined,
  direction: SortDirection,
): T[] {
  return [...items].sort((left, right) => {
    const leftValue = getValue(left);
    const rightValue = getValue(right);
    const leftMissing = leftValue === null || leftValue === undefined;
    const rightMissing = rightValue === null || rightValue === undefined;

    if (leftMissing || rightMissing) {
      if (leftMissing && rightMissing) return 0;
      return leftMissing ? 1 : -1;
    }

    const comparison =
      typeof leftValue === 'number' && typeof rightValue === 'number'
        ? leftValue - rightValue
        : String(leftValue).localeCompare(String(rightValue));
    return direction === 'desc' ? -comparison : comparison;
  });
}
