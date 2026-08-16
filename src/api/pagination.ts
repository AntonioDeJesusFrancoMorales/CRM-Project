import type { PageResponse } from './types';

export type ListResponse<T> = T[] | PageResponse<T>;

export function isPageResponse<T>(value: ListResponse<T>): value is PageResponse<T> {
  return !Array.isArray(value) && Array.isArray(value.items);
}

export function listItems<T>(value: ListResponse<T>): T[] {
  return isPageResponse(value) ? value.items : value;
}

export function toPageResponse<T>(
  value: ListResponse<T>,
  page: number,
  pageSize: number,
): PageResponse<T> {
  if (isPageResponse(value)) return value;
  const start = page * pageSize;
  const items = value.slice(start, start + pageSize);
  const totalPages = value.length === 0 ? 0 : Math.ceil(value.length / pageSize);
  return {
    items,
    totalItems: value.length,
    page,
    pageSize,
    totalPages,
    hasNext: page + 1 < totalPages,
    hasPrevious: page > 0,
  };
}
