import type { PageResponse } from './types';

export type ListResponse<T> = T[] | PageResponse<T>;

export function isPageResponse<T>(value: ListResponse<T>): value is PageResponse<T> {
  return !Array.isArray(value) && Array.isArray(value.items);
}

export function listItems<T>(value: ListResponse<T>): T[] {
  return isPageResponse(value) ? value.items : value;
}

export interface ToPageResponseOptions<T> {
  /** Applies the requested ordering before local pagination or to server items. */
  sortItems?: (items: T[]) => T[];
}

export function toPageResponse<T>(
  value: ListResponse<T>,
  page: number,
  pageSize: number,
  options?: ToPageResponseOptions<T>,
): PageResponse<T> {
  if (isPageResponse(value)) {
    return options?.sortItems
      ? { ...value, items: options.sortItems(value.items) }
      : value;
  }

  const sortedValue = options?.sortItems ? options.sortItems(value) : value;
  const start = page * pageSize;
  const items = sortedValue.slice(start, start + pageSize);
  const totalPages = sortedValue.length === 0 ? 0 : Math.ceil(sortedValue.length / pageSize);
  return {
    items,
    totalItems: sortedValue.length,
    page,
    pageSize,
    totalPages,
    hasNext: page + 1 < totalPages,
    hasPrevious: page > 0,
  };
}
