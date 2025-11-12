import { RequestHandler } from 'express';
import { manager } from '@/services/chat';
import { ChatNotFound } from '@/utils/errors';
import { getTokenData, validateParams } from '@/utils/validation';
import type { Chat } from '@/controllers/types';

type Input = {
  chatId: Chat['id'];
};
type Output = Chat;

export const joinChat: RequestHandler<Record<string, never>, Output, Input> = async (req, res) => {
  const { chatId } = validateParams<Input>(req);
  const { id: userId } = getTokenData(req);

  const chat = manager.getChat(chatId);

  if (chat) {
    await chat.join(userId);
    res.json(await chat.getChatEntity(userId));
  } else {
    throw new ChatNotFound();
  }
};
