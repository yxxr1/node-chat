import { Express } from 'express';
import { body } from 'express-validator';
import { checkSessionMiddleware } from '@middleware';
import { getNameChain, getIdChain, getSettingsChains } from '@utils/validation';
import { asyncHandler } from '@utils/errors';
import { get as userGet, post as userPost } from '@api/user';
import { get as chatsGet, post as chatsPost } from '@api/chats';
import { get as chatsSubscribeGet } from '@api/chatsSubscribe';
import { post as joinPost } from '@api/join';
import { post as quitPost } from '@api/quit';
import { post as subscribePost } from '@api/subscribe';
import { post as publishPost } from '@api/publish';
import { post as authPost } from '@api/auth';
import { post as messagesPost, DIRECTIONS } from '@api/messages';
import { MAX_MESSAGE_LENGTH } from '@const/limits';

export const initApi = (app: Express) => {
  app.post('/auth', getNameChain('name', true), ...getSettingsChains(), asyncHandler(authPost));
  app.post('/user', checkSessionMiddleware, getNameChain('name'), ...getSettingsChains(), asyncHandler(userPost));
  app.get('/user', checkSessionMiddleware, asyncHandler(userGet));
  app.post('/chats', checkSessionMiddleware, getNameChain('name'), asyncHandler(chatsPost));
  app.get('/chats', checkSessionMiddleware, asyncHandler(chatsGet));
  app.get('/chats-subscribe', checkSessionMiddleware, asyncHandler(chatsSubscribeGet));
  app.post('/join', checkSessionMiddleware, getIdChain('chatId'), asyncHandler(joinPost));
  app.post('/quit', checkSessionMiddleware, getIdChain('chatId'), asyncHandler(quitPost));
  app.post('/subscribe', checkSessionMiddleware, getIdChain('chatId'), getIdChain('lastMessageId').optional(), asyncHandler(subscribePost));
  app.post(
    '/publish',
    checkSessionMiddleware,
    getIdChain('chatId'),
    body('message')
      .isString()
      .trim()
      .isLength({ min: 1, max: MAX_MESSAGE_LENGTH })
      .withMessage(`Message must be length from 1 to ${MAX_MESSAGE_LENGTH}`),
    asyncHandler(publishPost),
  );
  app.post(
    '/messages',
    checkSessionMiddleware,
    getIdChain('chatId'),
    getIdChain('lastMessageId').optional(),
    body('direction')
      .default(DIRECTIONS.NEXT)
      .matches(`^(${DIRECTIONS.PREV}|${DIRECTIONS.NEXT})$`)
      .withMessage(`Direction must be '${DIRECTIONS.PREV}' or '${DIRECTIONS.NEXT}'`),
    asyncHandler(messagesPost),
  );
};
