const GENIE_SPACE_ID = process.env.GENIE_SPACE_ID;

interface GenieConversation {
  conversation_id: string;
  title: string;
  created_timestamp: number;
}

interface GenieMessage {
  message_id: string;
  content: string;
  conversation_id: string;
  space_id: string;
}

export interface GenieFeedbackIds {
  spaceId: string;
  conversationId: string;
  messageId: string;
}

/**
 * Find the Genie conversation and message that matches a query.
 * Searches recent conversations in the Genie Space to correlate
 * with the app's tool call.
 */
export async function findGenieMessage(
  queryText: string,
  session: { accessToken?: string } | null,
): Promise<GenieFeedbackIds | null> {
  if (!GENIE_SPACE_ID || !session?.accessToken) return null;

  const rawHost = process.env.DATABRICKS_HOST;
  if (!rawHost) return null;
  const host = rawHost.startsWith('http') ? rawHost : `https://${rawHost}`;

  try {
    const convResponse = await fetch(
      `${host}/api/2.0/genie/spaces/${GENIE_SPACE_ID}/conversations?page_size=10`,
      {
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          'Content-Type': 'application/json',
        },
      },
    );

    if (!convResponse.ok) {
      console.warn(
        '[Genie Feedback] Failed to list conversations:',
        convResponse.status,
      );
      return null;
    }

    const convData = await convResponse.json();
    const conversations: GenieConversation[] =
      convData.conversations || [];

    // Search conversations for a message matching the query text
    for (const conv of conversations) {
      const msgResponse = await fetch(
        `${host}/api/2.0/genie/spaces/${GENIE_SPACE_ID}/conversations/${conv.conversation_id}/messages`,
        {
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
            'Content-Type': 'application/json',
          },
        },
      );

      if (!msgResponse.ok) continue;

      const msgData = await msgResponse.json();
      const messages: GenieMessage[] = msgData.messages || [];

      for (const msg of messages) {
        if (
          msg.content &&
          queryText &&
          msg.content
            .toLowerCase()
            .includes(queryText.toLowerCase().substring(0, 50))
        ) {
          return {
            spaceId: GENIE_SPACE_ID,
            conversationId: conv.conversation_id,
            messageId: msg.message_id,
          };
        }
      }
    }

    return null;
  } catch (error) {
    console.error(
      '[Genie Feedback] Error finding Genie message:',
      error,
    );
    return null;
  }
}

/**
 * Submit feedback to the Genie Space monitoring system.
 */
export async function submitGenieFeedback(
  ids: GenieFeedbackIds,
  rating: 'POSITIVE' | 'NEGATIVE',
  session: { accessToken?: string } | null,
): Promise<boolean> {
  if (!session?.accessToken) return false;

  const rawHost = process.env.DATABRICKS_HOST;
  if (!rawHost) return false;
  const host = rawHost.startsWith('http') ? rawHost : `https://${rawHost}`;

  try {
    const response = await fetch(
      `${host}/api/2.0/genie/spaces/${ids.spaceId}/conversations/${ids.conversationId}/messages/${ids.messageId}/feedback`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ rating }),
      },
    );

    if (response.ok) {
      console.log(
        `[Genie Feedback] Submitted ${rating} feedback for message ${ids.messageId}`,
      );
      return true;
    }

    console.warn(
      `[Genie Feedback] Failed to submit feedback: ${response.status}`,
    );
    return false;
  } catch (error) {
    console.error(
      '[Genie Feedback] Error submitting feedback:',
      error,
    );
    return false;
  }
}
