import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import type { AgentMessageRequest, AgentMessageResponse } from '@/api/types';
import { agendasKeys } from '@/features/agenda/hooks/useAgendas';

export function useSendAssistantMessage(): UseMutationResult<
  AgentMessageResponse,
  Error,
  AgentMessageRequest
> {
  const queryClient = useQueryClient();
  return useMutation<AgentMessageResponse, Error, AgentMessageRequest>({
    mutationFn: (payload) =>
      apiClient.post<AgentMessageResponse>(endpoints.agent.messages(), payload),
    retry: false,
    // Agent replies do not include structured effects; refresh agenda after every successful turn.
    onSuccess: () => queryClient.invalidateQueries({ queryKey: agendasKeys.all }),
  });
}
