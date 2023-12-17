import { WSMessageHandler } from '@ws/types';
import { manager } from '@core';
import { Chat, Message } from '@interfaces/api-types';
import { WatcherId } from '@interfaces/core';
import { WSMessage } from '@ws/types';

export type SubscribePayload = {
  chatId: Chat['id'];
  lastMessageId: Message['id'];
};

type Context = {
  onWatcherClosed: () => void;
};

export const subscribe: WSMessageHandler<SubscribePayload, Context, boolean> = (
  { chatId, lastMessageId },
  { userId },
  ws,
  { onWatcherClosed },
) => {
  const chat = manager.getChat(chatId);

  if (chat) {
    const unreceivedMessages = chat.getUnreceivedMessages(userId, lastMessageId);

    if (unreceivedMessages !== null && unreceivedMessages.length) {
      const message: WSMessage = {
        type: 'SUBSCRIBED_CHAT',
        payload: {
          messages: unreceivedMessages,
          chatId: chat.id,
        },
      };

      ws.send(JSON.stringify(message));
    }

    const unsubscribeWatcher = () => {
      chat.unsubscribe(watcherId as WatcherId);
    };

    const watcherId = chat.subscribe(userId, (data, isUnsubscribed) => {
      if (isUnsubscribed) {
        ws.removeEventListener('error', unsubscribeWatcher);
        ws.removeEventListener('close', unsubscribeWatcher);
        onWatcherClosed();
      } else {
        const message: WSMessage = {
          type: 'SUBSCRIBED_CHAT',
          payload: {
            ...data,
            chatId: chat.id,
          },
        };

        ws.send(JSON.stringify(message));
      }
    });

    if (watcherId !== null) {
      ws.on('error', unsubscribeWatcher);
      ws.on('close', unsubscribeWatcher);

      return true;
    }
  }

  return false;
};
