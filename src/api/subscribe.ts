import { RequestHandler } from 'express';
import { manager } from '@core';
import { HttpError } from '@utils/errors';
import { Chat, Message } from '@interfaces/api-types';

const SUBSCRIBE_TIMEOUT = 10000;

type PostInput = {
  chatId: Chat['id'];
  lastMessageId?: Message['id'];
};
type PostOutput = {
  messages: Message[];
};

export const post: RequestHandler<Record<string, never>, PostOutput, PostInput> = (req, res) => {
  const { chatId, lastMessageId } = req.body;

  const chat = manager.getChat(chatId);

  if (chat) {
    let unreceivedMessages: Message[] | null = [];

    if (lastMessageId) {
      unreceivedMessages = chat.getUnreceivedMessages(req.session.userId as string, lastMessageId);
    }

    if (unreceivedMessages === null) {
      throw new HttpError(403, 'Not joined to this chat');
    } else if (unreceivedMessages.length) {
      res.json({ messages: unreceivedMessages });
    } else {
      let timerId: NodeJS.Timeout;

      const watcherId = chat.subscribe(req.session.userId as string, (data) => {
        clearTimeout(timerId);
        res.json(data);
        chat.unsubscribe(watcherId as string);
      });

      if (watcherId !== null) {
        timerId = setTimeout(() => {
          res.json({ messages: [] });
          chat.unsubscribe(watcherId as string);
        }, SUBSCRIBE_TIMEOUT);

        res.on('close', () => {
          clearTimeout(timerId);
          chat.unsubscribe(watcherId as string);
        });
      } else {
        throw new HttpError(403, 'Not joined to this chat');
      }
    }
  } else {
    throw new HttpError(404, 'Chat not found');
  }
};
