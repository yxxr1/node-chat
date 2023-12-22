import { RequestHandler } from 'express';
import { manager } from '@core';
import { ChatNotFound, NotJoinedChat } from '@utils/errors';
import { Chat, Message } from '@interfaces/api-types';
import { validateParams } from '@utils/validation';

type PostInput = {
  chatId: Chat['id'];
  message: string;
};
type PostOutput = Message;

export const post: RequestHandler<Record<string, never>, PostOutput, PostInput> = (req, res) => {
  const { chatId, message } = validateParams<PostInput>(req);

  const chat = manager.getChat(chatId);

  if (chat) {
    const result = chat.publish(message, req.session.userId as string, req.session.name as string);

    if (result === null) {
      throw new NotJoinedChat();
    }

    res.statusCode = 201;
    res.json(result);
  } else {
    throw new ChatNotFound();
  }
};
