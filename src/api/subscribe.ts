import { RequestHandler } from 'express';
import { manager } from '@core';
import { ChatNotFound, NotJoinedChat } from '@utils/errors';
import { validateParams } from '@utils/validation';
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
  const { chatId, lastMessageId } = validateParams<PostInput>(req);

  const chat = manager.getChat(chatId);

  if (chat) {
    let unreceivedMessages: Message[] | null = [];

    if (lastMessageId) {
      unreceivedMessages = chat.getMessages(req.session.userId as string, lastMessageId);
    }

    if (unreceivedMessages === null) {
      throw new NotJoinedChat();
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
        throw new NotJoinedChat();
      }
    }
  } else {
    throw new ChatNotFound();
  }
};
