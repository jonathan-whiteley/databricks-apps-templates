import {
  Router,
  type Request,
  type Response,
  type Router as RouterType,
} from 'express';
import {
  authMiddleware,
  requireAuth,
} from '../middleware/auth';
import {
  getVotesByChatId,
  upsertVote,
} from '@chat-template/db';
import { checkChatAccess } from '@chat-template/core';
import { ChatSDKError } from '@chat-template/core/errors';
import {
  findGenieMessage,
  submitGenieFeedback,
} from '../lib/genie-feedback';

export const feedbackRouter: RouterType = Router();
feedbackRouter.use(authMiddleware);

/**
 * POST /api/feedback - Submit feedback for a message
 */
feedbackRouter.post('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const { chatId, messageId, isUpvoted, genieQuery } = req.body;

    if (!chatId || !messageId || !isUpvoted) {
      const error = new ChatSDKError('bad_request:api');
      const response = error.toResponse();
      return res.status(response.status).json(response.json);
    }

    if (!['up', 'down'].includes(isUpvoted)) {
      const error = new ChatSDKError('bad_request:api');
      const response = error.toResponse();
      return res.status(response.status).json(response.json);
    }

    const { allowed } = await checkChatAccess(chatId, req.session?.user.id);
    if (!allowed) {
      const error = new ChatSDKError('forbidden:chat');
      const response = error.toResponse();
      return res.status(response.status).json(response.json);
    }

    await upsertVote({ chatId, messageId, isUpvoted });

    // Fire-and-forget Genie feedback submission
    if (genieQuery) {
      findGenieMessage(genieQuery, req.session)
        .then((ids) => {
          if (ids) {
            const rating =
              isUpvoted === 'up' ? 'POSITIVE' : 'NEGATIVE';
            submitGenieFeedback(ids, rating, req.session);
          }
        })
        .catch((err) => {
          console.error('[Feedback] Genie feedback error:', err);
        });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    if (error instanceof ChatSDKError) {
      const response = error.toResponse();
      return res.status(response.status).json(response.json);
    }
    console.error('Error submitting feedback:', error);
    return res.status(500).json({ error: 'Failed to submit feedback' });
  }
});

/**
 * GET /api/feedback/chat/:chatId - Get feedback for a chat
 */
feedbackRouter.get(
  '/chat/:chatId',
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const { chatId } = req.params;

      const { allowed } = await checkChatAccess(chatId, req.session?.user.id);
      if (!allowed) {
        const error = new ChatSDKError('forbidden:chat');
        const response = error.toResponse();
        return res.status(response.status).json(response.json);
      }

      const votes = await getVotesByChatId({ chatId });
      return res.status(200).json(votes);
    } catch (error) {
      if (error instanceof ChatSDKError) {
        const response = error.toResponse();
        return res.status(response.status).json(response.json);
      }
      console.error('Error getting feedback:', error);
      return res.status(500).json({ error: 'Failed to get feedback' });
    }
  },
);
