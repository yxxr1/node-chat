import { RequestHandler } from 'express';
import { manager } from '@core';
import { ChatNotFound } from '@utils/errors';
import { validateParams } from '@utils/validation';
import { Chat } from '@interfaces/api-types';

type PostInput = {
  chatId: Chat['id'];
};
type PostOutput = Chat;

export const post: RequestHandler<Record<string, never>, PostOutput, PostInput> = (req, res) => {
  const { chatId } = validateParams<PostInput>(req);

  const chat = manager.getChat(chatId);

  if (chat) {
    const messages = chat.join(req.session.userId as string, req.session.name as string);
    res.json({ id: chat.id, name: chat.name, messages });
  } else {
    throw new ChatNotFound();
  }
};
