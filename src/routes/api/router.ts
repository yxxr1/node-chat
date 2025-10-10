import { Router } from 'express';
import { body, query } from 'express-validator';
import { checkSessionMiddleware } from '@middleware';
import { getNameChain, getIdChain, getSettingsChains } from '@utils/validation';
import { asyncHandler } from '@utils/errors';
import {
  getUser,
  editUser,
  getChats,
  createChat,
  chatsSubscribe,
  joinChat,
  quitChat,
  subscribeChat,
  publishMessage,
  auth,
  getMessages,
  MESSAGES_DIRECTIONS,
} from '@controllers/api';
import { MAX_MESSAGE_LENGTH } from '@const/limits';

export const router = Router();

router.post('/auth', getNameChain('name', true), ...getSettingsChains(), asyncHandler(auth));
router.post('/user', checkSessionMiddleware, getNameChain('name'), ...getSettingsChains(), asyncHandler(editUser));
router.get('/user', checkSessionMiddleware, asyncHandler(getUser));
router.post('/chats', checkSessionMiddleware, getNameChain('name'), asyncHandler(createChat));
router.get('/chats', checkSessionMiddleware, asyncHandler(getChats));
router.get('/chats-subscribe', checkSessionMiddleware, asyncHandler(chatsSubscribe));
router.post('/join', checkSessionMiddleware, getIdChain('chatId'), asyncHandler(joinChat));
router.post('/quit', checkSessionMiddleware, getIdChain('chatId'), asyncHandler(quitChat));
router.get(
  '/subscribe',
  checkSessionMiddleware,
  getIdChain('chatId', 'query'),
  getIdChain('lastMessageId', 'query').optional(),
  asyncHandler(subscribeChat),
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
  asyncHandler(publishMessage),
);
router.get(
  '/messages',
  checkSessionMiddleware,
  getIdChain('chatId', 'query'),
  getIdChain('lastMessageId', 'query').optional(),
  query('direction')
    .default(MESSAGES_DIRECTIONS.NEXT)
    .matches(`^(${MESSAGES_DIRECTIONS.PREV}|${MESSAGES_DIRECTIONS.NEXT})$`)
    .withMessage(`Direction must be '${MESSAGES_DIRECTIONS.PREV}' or '${MESSAGES_DIRECTIONS.NEXT}'`),
  asyncHandler(getMessages),
);
