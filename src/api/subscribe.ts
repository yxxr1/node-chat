import { RequestHandler } from 'express'
import { manager } from '@core'
import { HttpError } from '@utils/errors';

export const post: RequestHandler = (req, res) => {
  const { chatId } = req.body;

  const chat = manager.getChat(chatId);

  if (chat) {
    chat.subscribe(req.session.userId as string, res);
  } else {
    throw new HttpError(404, 'Chat not found');
  }

}
