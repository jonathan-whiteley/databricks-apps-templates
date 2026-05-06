import useSWR from 'swr';
import { useCallback } from 'react';
import { fetcher } from '@/lib/utils';
import { useAppConfig } from '@/contexts/AppConfigContext';
import type { ChatMessage } from '@chat-template/core';

interface Vote {
  chatId: string;
  messageId: string;
  isUpvoted: 'up' | 'down';
}

export function useFeedback({
  chatId,
  messages,
}: {
  chatId: string;
  messages?: ChatMessage[];
}) {
  const { feedbackEnabled } = useAppConfig();

  const { data: votes, mutate } = useSWR<Vote[]>(
    feedbackEnabled ? `/api/feedback/chat/${chatId}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
    },
  );

  const submitVote = useCallback(
    async (messageId: string, isUpvoted: 'up' | 'down') => {
      // Extract genie_query from tool call parts if available
      const message = messages?.find((m) => m.id === messageId);
      const genieQuery = message?.parts
        ?.filter(
          (p): p is { type: string; input?: Record<string, unknown> } =>
            typeof p === 'object' &&
            p !== null &&
            'type' in p &&
            p.type === 'tool-databricks-tool-call',
        )
        ?.map((p) => p.input?.genie_query as string | undefined)
        ?.find(Boolean);

      const optimisticVotes = [
        ...(votes?.filter((v) => v.messageId !== messageId) ?? []),
        { chatId, messageId, isUpvoted },
      ];
      mutate(optimisticVotes, false);

      try {
        await fetch('/api/feedback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chatId,
            messageId,
            isUpvoted,
            genieQuery,
          }),
        });
        mutate();
      } catch (error) {
        console.error('Failed to submit vote:', error);
        mutate();
      }
    },
    [chatId, messages, votes, mutate],
  );

  const getVote = useCallback(
    (messageId: string): 'up' | 'down' | undefined => {
      return votes?.find((v) => v.messageId === messageId)?.isUpvoted;
    },
    [votes],
  );

  return { votes, submitVote, getVote, feedbackEnabled };
}
