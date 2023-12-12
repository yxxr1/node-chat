import { RequestHandler } from 'express'
import { manager } from '@core'
import { HttpError } from '@utils/errors';
import { Chat, Message } from '@interfaces/api-types';

const SUBSCRIBE_TIMEOUT = 10000;

type PostInput = {
  chatId: Chat['id'];
};
type PostOutput = {
  messages: Message[];
};

export const post: RequestHandler<{}, PostOutput, PostInput> = (req, res) => {
  const { chatId } = req.body;

  const chat = manager.getChat(chatId);

  if (chat) {
    let watcherId: string;

    const timerId = setTimeout(() => {
      res.json({ messages: [] });
      chat.unsubscribe(watcherId);
    }, SUBSCRIBE_TIMEOUT);

    res.on('close', () => {
      clearTimeout(timerId);

      chat.unsubscribe(watcherId);
    });

    watcherId = chat.subscribe(req.session.userId as string, (status, data: PostOutput) => {
      clearTimeout(timerId);
      res.statusCode = status;
      res.json(data);
    });
  } else {
    throw new HttpError(404, 'Chat not found');
  }

}
