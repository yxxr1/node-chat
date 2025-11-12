import type { RequestHandler } from 'express';
import { manager, CHAT_SUBSCRIBE_TYPES } from '@/services/chat';
import { ChatNotFound, NotJoinedChat } from '@/utils/errors';
import { getTokenData, validateParams } from '@/utils/validation';
import type { Chat, Message, SubscribedChatPayload } from '@/controllers/types';

const SUBSCRIBE_TIMEOUT = 10000;

type Input = {
  chatId: Chat['id'];
  lastMessageId?: Message['id'];
};
type Output = SubscribedChatPayload;

export const subscribeChat: RequestHandler<Record<string, never>, Output, Input> = async (req, res) => {
  const { chatId, lastMessageId } = validateParams<Input>(req);
  const { id: userId } = getTokenData(req);

  const chat = manager.getChat(chatId);

  if (chat) {
    let unreceivedMessages: Message[] | null = [];

    if (lastMessageId) {
      unreceivedMessages = await chat.getMessages(userId, lastMessageId);
    }

    if (unreceivedMessages === null) {
      throw new NotJoinedChat();
    } else if (unreceivedMessages.length) {
      res.json({ chatId, messages: unreceivedMessages });
    } else {
      let timerId: NodeJS.Timeout;

      const watcherId = await chat.subscribeIfJoined(
        userId,
        ({ payload }) => {
          clearTimeout(timerId);
          res.json(payload);
          chat.unsubscribe(watcherId as string);
        },
        CHAT_SUBSCRIBE_TYPES.NEW_MESSAGES,
        () => {
          clearTimeout(timerId);
          res.json({ chatId, messages: [] });
          chat.unsubscribe(watcherId as string);
        },
      );

      if (watcherId !== null) {
        timerId = setTimeout(() => {
          res.json({ chatId, messages: [] });
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
