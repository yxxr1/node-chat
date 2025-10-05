import { Express } from 'express';
import { checkSessionMiddleware, sseMiddleware } from '@middleware';
import { getIdChain } from '@utils/validation';
import { asyncHandler } from '@utils/errors';
import { get as chatsSubscribeGet } from '@controllers/sse/chatsSubscribe';
import { get as subscribeGet } from '@controllers/sse/subscribe';

export const initSSE = (app: Express) => {
  app.get('/chats-subscribe-sse', checkSessionMiddleware, sseMiddleware, chatsSubscribeGet);
  app.get(
    '/subscribe-sse',
    checkSessionMiddleware,
    sseMiddleware,
    getIdChain('chatId', 'query'),
    getIdChain('lastMessageId', 'query').optional(),
    getIdChain('last-event-id', 'header').optional(),
    asyncHandler(subscribeGet),
  );
};
