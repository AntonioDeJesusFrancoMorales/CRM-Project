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
