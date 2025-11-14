import type { RequestHandler } from 'express';
import { manager } from '@/services/chat';
import { ChatNotFound, NotJoinedChat } from '@/utils/errors';
import type { Chat, Message } from '@/controllers/types';
import { getTokenData, validateParams } from '@/utils/validation';

type Input = {
  chatId: Chat['id'];
  message: string;
};
type Output = Message;

export const publishMessage: RequestHandler<Record<string, never>, Output, Input> = async (req, res) => {
  const { chatId, message } = validateParams<Input>(req);
  const { id: userId } = getTokenData(req);

  const chat = manager.getChat(chatId);

  if (chat) {
    const result = await chat.publish(message, userId);

    if (result === null) {
      throw new NotJoinedChat();
    }

    res.statusCode = 201;
    res.json(result);
  } else {
    throw new ChatNotFound();
  }
};
