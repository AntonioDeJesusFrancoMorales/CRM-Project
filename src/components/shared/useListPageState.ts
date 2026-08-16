import { useState } from 'react';
import type { ListQueryOptions } from '@/api/types';
import { DEFAULT_PAGE_SIZE, toggleSort, type SortState } from './listPaging';

interface UseListPageStateOptions {
  initialSortBy: string;
  initialSortDirection?: SortState['sortDirection'];
}

export function useListPageState({
  initialSortBy,
  initialSortDirection = 'desc',
}: UseListPageStateOptions) {
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [sort, setSort] = useState<SortState>({
    sortBy: initialSortBy,
    sortDirection: initialSortDirection,
  });

  function updatePageSize(nextPageSize: number) {
    setPageSize(nextPageSize);
    setPage(0);
  }

  function updateSort(sortBy: string) {
    setSort((current) => toggleSort(current, sortBy));
    setPage(0);
  }

  function resetPage() {
    setPage(0);
  }

  const query: Required<Pick<ListQueryOptions, 'page' | 'pageSize' | 'sortBy' | 'sortDirection'>> = {
    page,
    pageSize,
    sortBy: sort.sortBy,
    sortDirection: sort.sortDirection,
  };

  return {
    page,
    pageSize,
    sort,
    query,
    setPage,
    setPageSize: updatePageSize,
    setSort: updateSort,
    resetPage,
  };
}
