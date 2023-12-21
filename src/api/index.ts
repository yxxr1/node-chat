import { Express } from 'express';
import { body, query } from 'express-validator';
import { checkSessionMiddleware } from '@middleware';
import { getNameChain, getIdChain } from '@utils/validation';
import { CONNECTION_METHODS } from '@const/settings';
import { get as userGet, post as userPost } from '@api/user';
import { get as chatsGet, post as chatsPost } from '@api/chats';
import { post as joinPost } from '@api/join';
import { post as quitPost } from '@api/quit';
import { post as subscribePost } from '@api/subscribe';
import { post as publishPost } from '@api/publish';
import { post as authPost } from '@api/auth';
import { MAX_MESSAGE_LENGTH } from '@const/limits';

export const initApi = (app: Express) => {
  app.post('/auth', getNameChain('name', true), authPost);
  app.post(
    '/user',
    checkSessionMiddleware,
    getNameChain('name'),
    body('settings').isObject().withMessage('Settings must be an object').optional(),
    body('settings.connectionMethod')
      .matches(`^(${CONNECTION_METHODS.HTTP}|${CONNECTION_METHODS.WS})$`)
      .withMessage(`Available connections methods are '${CONNECTION_METHODS.HTTP}', '${CONNECTION_METHODS.WS}'`)
      .optional(),
    userPost,
  );
  app.get('/user', checkSessionMiddleware, userGet);
  app.post('/chats', checkSessionMiddleware, getNameChain('name'), chatsPost);
  app.get('/chats', checkSessionMiddleware, query('watch').equals('1').optional(), chatsGet);
  app.post('/join', checkSessionMiddleware, getIdChain('chatId'), joinPost);
  app.post('/quit', checkSessionMiddleware, getIdChain('chatId'), quitPost);
  app.post('/subscribe', checkSessionMiddleware, getIdChain('chatId'), getIdChain('lastMessageId').optional(), subscribePost);
  app.post(
    '/publish',
    checkSessionMiddleware,
    getIdChain('chatId'),
    body('message')
      .isString()
      .trim()
      .isLength({ min: 1, max: MAX_MESSAGE_LENGTH })
      .withMessage(`Message must be length from 1 to ${MAX_MESSAGE_LENGTH}`),
    publishPost,
  );
};
