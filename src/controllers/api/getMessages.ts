import { RequestHandler } from 'express';
import { manager } from '@services/chat';
import { ChatNotFound, NotJoinedChat } from '@utils/errors';
import { validateParams } from '@utils/validation';
import type { Chat, Message } from '@controllers/types';

export const DIRECTIONS = {
  PREV: 'PREV',
  NEXT: 'NEXT',
} as const;

const DIRECTION_MAP: Record<(typeof DIRECTIONS)[keyof typeof DIRECTIONS], 1 | -1> = {
  [DIRECTIONS.PREV]: -1,
  [DIRECTIONS.NEXT]: 1,
};

type Input = {
  chatId: Chat['id'];
  lastMessageId: Message['id'];
  direction: (typeof DIRECTIONS)[keyof typeof DIRECTIONS];
};
type Output = {
  messages: Message[];
};

export const getMessages: RequestHandler<Record<string, never>, Output, Input> = async (req, res) => {
  const { chatId, lastMessageId, direction } = validateParams<Input>(req);

  const chat = manager.getChat(chatId);

  if (chat) {
    const messages = await chat.getMessages(req.session.userId as string, lastMessageId, DIRECTION_MAP[direction]);

    if (messages === null) {
      throw new NotJoinedChat();
    }

    res.json({ messages });
  } else {
    throw new ChatNotFound();
  }
};
