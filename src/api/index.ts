import { Express } from 'express';
import { body, query } from 'express-validator';
import { checkSessionMiddleware } from '@middleware';
import { getNameChain, getIdChain } from '@utils/validation';
import { CONNECTION_METHODS, UI_THEMES } from '@const/settings';
import { get as userGet, post as userPost } from '@api/user';
import { get as chatsGet, post as chatsPost } from '@api/chats';
import { post as joinPost } from '@api/join';
import { post as quitPost } from '@api/quit';
import { post as subscribePost } from '@api/subscribe';
import { post as publishPost } from '@api/publish';
import { post as authPost } from '@api/auth';
import { post as messagesPost, DIRECTIONS } from '@api/messages';
import { MAX_MESSAGE_LENGTH } from '@const/limits';

export const initApi = (app: Express) => {
  app.post('/auth', getNameChain('name', true), authPost);
  app.post(
    '/user',
    checkSessionMiddleware,
    getNameChain('name'),
    body('settings.connectionMethod')
      .matches(`^(${CONNECTION_METHODS.HTTP}|${CONNECTION_METHODS.WS})$`)
      .withMessage(`Available connections methods are '${CONNECTION_METHODS.HTTP}', '${CONNECTION_METHODS.WS}'`)
      .optional(),
    body('settings.theme')
      .matches(`^(${UI_THEMES.LIGHT}|${UI_THEMES.DARK})$`)
      .withMessage(`Available themes are '${UI_THEMES.LIGHT}', '${UI_THEMES.DARK}'`)
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
  app.post(
    '/messages',
    checkSessionMiddleware,
    getIdChain('chatId'),
    getIdChain('lastMessageId').optional(),
    body('direction')
      .default(DIRECTIONS.NEXT)
      .matches(`^(${DIRECTIONS.PREV}|${DIRECTIONS.NEXT})$`)
      .withMessage(`Direction must be '${DIRECTIONS.PREV}' or '${DIRECTIONS.NEXT}'`),
    messagesPost,
  );
};
