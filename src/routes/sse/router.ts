import { Router } from 'express';
import { checkSessionMiddleware, sseMiddleware } from '@middleware';
import { getIdChain } from '@utils/validation';
import { asyncHandler } from '@utils/errors';
import { get as chatsSubscribeGet } from '@controllers/sse/chatsSubscribe';
import { get as subscribeGet } from '@controllers/sse/subscribe';

export const router = Router();

router.get('/chats-subscribe', checkSessionMiddleware, sseMiddleware, chatsSubscribeGet);
router.get(
  '/subscribe',
  checkSessionMiddleware,
  sseMiddleware,
  getIdChain('chatId', 'query'),
  getIdChain('lastMessageId', 'query').optional(),
  getIdChain('last-event-id', 'header').optional(),
  asyncHandler(subscribeGet),
);
