import { Router } from 'express';
import { body } from 'express-validator';
import { checkSessionMiddleware } from '@middleware';
import { getNameChain, getIdChain, getSettingsChains } from '@utils/validation';
import { asyncHandler } from '@utils/errors';
import { get as userGet, post as userPost } from '@controllers/api/user';
import { get as chatsGet, post as chatsPost } from '@controllers/api/chats';
import { get as chatsSubscribeGet } from '@controllers/api/chatsSubscribe';
import { post as joinPost } from '@controllers/api/join';
import { post as quitPost } from '@controllers/api/quit';
import { post as subscribePost } from '@controllers/api/subscribe';
import { post as publishPost } from '@controllers/api/publish';
import { post as authPost } from '@controllers/api/auth';
import { post as messagesPost, DIRECTIONS } from '@controllers/api/messages';
import { MAX_MESSAGE_LENGTH } from '@const/limits';

export const router = Router();

router.post('/auth', getNameChain('name', true), ...getSettingsChains(), asyncHandler(authPost));
router.post('/user', checkSessionMiddleware, getNameChain('name'), ...getSettingsChains(), asyncHandler(userPost));
router.get('/user', checkSessionMiddleware, asyncHandler(userGet));
router.post('/chats', checkSessionMiddleware, getNameChain('name'), asyncHandler(chatsPost));
router.get('/chats', checkSessionMiddleware, asyncHandler(chatsGet));
router.get('/chats-subscribe', checkSessionMiddleware, asyncHandler(chatsSubscribeGet));
router.post('/join', checkSessionMiddleware, getIdChain('chatId'), asyncHandler(joinPost));
router.post('/quit', checkSessionMiddleware, getIdChain('chatId'), asyncHandler(quitPost));
router.post(
  '/subscribe',
  checkSessionMiddleware,
  getIdChain('chatId'),
  getIdChain('lastMessageId').optional(),
  asyncHandler(subscribePost),
);
router.post(
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
router.post(
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
