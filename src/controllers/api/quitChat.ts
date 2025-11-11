import { RequestHandler } from 'express';
import { manager } from '@services/chat';
import { ChatNotFound, NotJoinedChat } from '@utils/errors';
import { getTokenData, validateParams } from '@utils/validation';
import type { Chat } from '@controllers/types';

type Input = {
  chatId: Chat['id'];
};
type Output = {
  chatId: Chat['id'];
};

export const quitChat: RequestHandler<Record<string, never>, Output, Input> = async (req, res) => {
  const { chatId } = validateParams<Input>(req);
  const { id: userId } = getTokenData(req);

  const chat = manager.getChat(chatId);

  if (chat) {
    const count = await chat.quit(userId);

    if (count === null) {
      throw new NotJoinedChat();
    }

    if (count === 0) {
      await manager.deleteChat(chatId);
    }

    res.json({ chatId });
  } else {
    throw new ChatNotFound();
  }
};
