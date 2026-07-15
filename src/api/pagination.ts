import type { PageResponse } from './types';

export type ListResponse<T> = T[] | PageResponse<T>;

export function isPageResponse<T>(value: ListResponse<T>): value is PageResponse<T> {
  return !Array.isArray(value) && Array.isArray(value.items);
}

export function listItems<T>(value: ListResponse<T>): T[] {
  return isPageResponse(value) ? value.items : value;
}
