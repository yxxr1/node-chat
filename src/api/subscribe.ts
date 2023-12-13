import { RequestHandler } from 'express'
import { manager } from '@core'
import { HttpError } from '@utils/errors';
import { Chat, Message } from '@interfaces/api-types';

const SUBSCRIBE_TIMEOUT = 10000;

type PostInput = {
  chatId: Chat['id'];
  lastMessageId?: Message['id'] | null;
};
type PostOutput = {
  messages: Message[];
};

export const post: RequestHandler<{}, PostOutput, PostInput> = (req, res) => {
  const { chatId, lastMessageId } = req.body;

  const chat = manager.getChat(chatId);

  if (chat) {
    let unreceivedMessages: Message[] = [];

    if (lastMessageId) {
      const lastMessageIndex = chat.messages.findIndex(({ id }) => id === lastMessageId);
      unreceivedMessages = lastMessageIndex === -1 ? [] : chat.messages.slice(lastMessageIndex + 1);
    }

    if (unreceivedMessages.length) {
      res.json({ messages: unreceivedMessages });
    } else {
      let watcherId: string;

      const timerId = setTimeout(() => {
        res.json({ messages: [] });
        chat.unsubscribe(watcherId);
      }, SUBSCRIBE_TIMEOUT);

      res.on('close', () => {
        clearTimeout(timerId);

        chat.unsubscribe(watcherId);
      });

      watcherId = chat.subscribe(req.session.userId as string, (data: PostOutput) => {
        clearTimeout(timerId);
        res.json(data);
      });
    }
  } else {
    throw new HttpError(404, 'Chat not found');
  }

}
