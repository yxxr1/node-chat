import { RequestHandler } from 'express';
import { manager } from '@core';
import { HttpError } from '@utils/errors';
import { Chat, Message } from '@interfaces/api-types';
import { MAX_MESSAGE_LENGTH } from '@const/limits';

type PostInput = {
  chatId: Chat['id'];
  message: string;
};
type PostOutput = Message;

export const post: RequestHandler<Record<string, never>, PostOutput, PostInput> = (req, res) => {
  const { chatId } = req.body;
  const messageText = req.body.message.trim();

  if (!messageText.length || messageText.length > MAX_MESSAGE_LENGTH) {
    throw new HttpError(400, 'Incorrect message');
  }

  const chat = manager.getChat(chatId);

  if (chat) {
    const message = chat.publish(messageText, req.session.userId as string, req.session.name as string);

    if (message === null) {
      throw new HttpError(403, 'Not joined to this chat');
    }

    res.statusCode = 201;
    res.json(message);
  } else {
    throw new HttpError(404, 'Chat not found');
  }
};
