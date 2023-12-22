import { RequestHandler } from 'express';
import { manager } from '@core';
import { HttpError } from '@utils/errors';
import { validateParams } from '@utils/validation';
import { Chat, Message } from '@interfaces/api-types';

export const DIRECTIONS = {
  PREV: 'PREV',
  NEXT: 'NEXT',
} as const;

const DIRECTION_MAP: Record<(typeof DIRECTIONS)[keyof typeof DIRECTIONS], 1 | -1> = {
  [DIRECTIONS.PREV]: -1,
  [DIRECTIONS.NEXT]: 1,
};

type PostInput = {
  chatId: Chat['id'];
  lastMessageId: Message['id'];
  direction: (typeof DIRECTIONS)[keyof typeof DIRECTIONS];
};
type PostOutput = {
  messages: Message[];
};

export const post: RequestHandler<Record<string, never>, PostOutput, PostInput> = (req, res) => {
  const { chatId, lastMessageId, direction } = validateParams<PostInput>(req);

  const chat = manager.getChat(chatId);

  if (chat) {
    const messages = chat.getMessages(req.session.userId as string, lastMessageId, DIRECTION_MAP[direction]);

    if (messages === null) {
      throw new HttpError(403, 'Not joined to this chat');
    }

    res.json({ messages });
  } else {
    throw new HttpError(404, 'Chat not found');
  }
};
