import { RequestHandler } from 'express';
import { manager } from '@core';
import { HttpError } from '@utils/errors';
import { validateParams } from '@utils/validation';
import { Message, Chat } from '@interfaces/api-types';

type PostInput = {
  chatId: Chat['id'];
};
type PostOutput = {
  messages: Message[];
};

export const post: RequestHandler<Record<string, never>, PostOutput, PostInput> = (req, res) => {
  const { chatId } = validateParams<PostInput>(req);

  const chat = manager.getChat(chatId);

  if (chat) {
    const messages = chat.join(req.session.userId as string, req.session.name as string);
    res.json({ messages });
  } else {
    throw new HttpError(404, 'Chat not found');
  }
};
