import { RequestHandler } from 'express';
import { manager } from '@services/chat';
import { ChatNotFound, NotJoinedChat } from '@utils/errors';
import { validateParams } from '@utils/validation';
import type { Chat } from '@controllers/types';

type PostInput = {
  chatId: Chat['id'];
};
type PostOutput = {
  chatId: Chat['id'];
};

export const post: RequestHandler<Record<string, never>, PostOutput, PostInput> = async (req, res) => {
  const { chatId } = validateParams<PostInput>(req);

  const chat = manager.getChat(chatId);

  if (chat) {
    const count = await chat.quit(req.session.userId as string, req.session.name as string);

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
