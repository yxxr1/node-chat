import { Router } from 'express';
import { checkSessionMiddleware, sseMiddleware } from '@middleware';
import { getIdChain } from '@utils/validation';
import { asyncHandler } from '@utils/errors';
import { chatsSubscribeSSE, subscribeSSE } from '@controllers/sse';

export const router = Router();

router.get('/chats-subscribe', checkSessionMiddleware, sseMiddleware, chatsSubscribeSSE);
router.get(
  '/subscribe',
  checkSessionMiddleware,
  sseMiddleware,
  getIdChain('chatId', 'query'),
  getIdChain('lastMessageId', 'query').optional(),
  getIdChain('last-event-id', 'header').optional(),
  asyncHandler(subscribeSSE),
);
