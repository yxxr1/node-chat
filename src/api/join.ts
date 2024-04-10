import { RequestHandler } from 'express';
import { manager } from '@core';
import { ChatNotFound } from '@utils/errors';
import { validateParams } from '@utils/validation';
import { Chat } from '@interfaces/api-types';

type PostInput = {
  chatId: Chat['id'];
};
type PostOutput = Chat;

export const post: RequestHandler<Record<string, never>, PostOutput, PostInput> = async (req, res) => {
  const { chatId } = validateParams<PostInput>(req);

  const chat = manager.getChat(chatId);

  if (chat) {
    await chat.join(req.session.userId as string, req.session.name as string);
    res.json(await chat.getChatEntity(req.session.userId as string));
  } else {
    throw new ChatNotFound();
  }
};
