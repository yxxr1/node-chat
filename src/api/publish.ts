import { RequestHandler } from 'express'
import { manager } from '@core'
import { HttpError } from '@utils/errors';
import { Chat, Message } from '@interfaces/api-types';

const MAX_MESSAGE_LENGTH = 1024;

type PostInput = {
  chatId: Chat['id'];
  message: string;
};
type PostOutput = Message;

export const post: RequestHandler<{}, PostOutput, PostInput> = (req, res) => {
  const { chatId } = req.body;
  const message = req.body.message.trim();

  if (!message.length || message.length > MAX_MESSAGE_LENGTH) {
    throw new HttpError(400, 'Incorrect message');
  }

  const chat = manager.getChat(chatId);

  if (chat) {
    const response = chat.publish(message, req.session.userId as string, req.session.name as string);
    res.statusCode = 201;
    res.json(response);
  } else {
    throw new HttpError(404, 'Chat not found');
  }
}
