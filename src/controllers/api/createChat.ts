import { RequestHandler } from 'express';
import { manager, Chat } from '@/services/chat';
import { HttpError } from '@/utils/errors';
import { getTokenData, validateParams } from '@/utils/validation';
import type { Chat as ChatType } from '@/controllers/types';

type Input = {
  name: ChatType['name'];
};
type Output = ChatType;

export const createChat: RequestHandler<Record<string, never>, Output, Input> = async (req, res) => {
  const { name } = validateParams<Input>(req);
  const { id: userId } = getTokenData(req);

  const chat = await Chat.createChat(name, userId);

  if (chat === null) {
    throw new HttpError(403, 'Already exists');
  }

  await manager.addChat(chat);

  res.json(await chat.getChatEntity());
};
