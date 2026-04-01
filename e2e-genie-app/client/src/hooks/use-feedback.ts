import useSWR from 'swr';
import { useCallback } from 'react';
import { fetcher } from '@/lib/utils';
import { useAppConfig } from '@/contexts/AppConfigContext';

interface Vote {
  chatId: string;
  messageId: string;
  isUpvoted: 'up' | 'down';
}

export function useFeedback({ chatId }: { chatId: string }) {
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
      const optimisticVotes = [
        ...(votes?.filter((v) => v.messageId !== messageId) ?? []),
        { chatId, messageId, isUpvoted },
      ];
      mutate(optimisticVotes, false);

      try {
        await fetch('/api/feedback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chatId, messageId, isUpvoted }),
        });
        mutate();
      } catch (error) {
        console.error('Failed to submit vote:', error);
        mutate();
      }
    },
    [chatId, votes, mutate],
  );

  const getVote = useCallback(
    (messageId: string): 'up' | 'down' | undefined => {
      return votes?.find((v) => v.messageId === messageId)?.isUpvoted;
    },
    [votes],
  );

  return { votes, submitVote, getVote, feedbackEnabled };
}
