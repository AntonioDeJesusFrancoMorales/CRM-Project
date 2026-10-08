import { useMutation, type UseMutationResult } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import type { AgentMessageRequest, AgentMessageResponse } from '@/api/types';

export function useSendAssistantMessage(): UseMutationResult<
  AgentMessageResponse,
  Error,
  AgentMessageRequest
> {
  return useMutation<AgentMessageResponse, Error, AgentMessageRequest>({
    mutationFn: (payload) =>
      apiClient.post<AgentMessageResponse>(endpoints.agent.messages(), payload),
    retry: false,
  });
}
