import { RequestHandler } from 'express';
import { manager } from '@core';
import { HttpError } from '@utils/errors';
import { validateParams } from '@utils/validation';
import { Chat } from '@interfaces/api-types';

type PostInput = {
  chatId: Chat['id'];
};
type PostOutput = {
  chatId: Chat['id'];
};

export const post: RequestHandler<Record<string, never>, PostOutput, PostInput> = (req, res) => {
  const { chatId } = validateParams<PostInput>(req);

  const chat = manager.getChat(chatId);

  if (chat) {
    const count = chat.quit(req.session.userId as string, req.session.name as string);

    if (count === null) {
      throw new HttpError(403, 'Not joined to this chat');
    }

    if (!count) {
      manager.deleteChat(chatId);
    }

    res.json({ chatId });
  } else {
    throw new HttpError(404, 'Chat not found');
  }
};
