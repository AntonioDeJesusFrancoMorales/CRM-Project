import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import type { Bot } from '@/api/types';

export const botsKeys = {
  all: ['bots'] as const,
  detail: (id: string) => ['bots', 'detail', id] as const,
};

export function useBots(): UseQueryResult<Bot[]> {
  return useQuery<Bot[]>({
    queryKey: botsKeys.all,
    queryFn: () => apiClient.get<Bot[]>(endpoints.bots.getAll()),
  });
}
