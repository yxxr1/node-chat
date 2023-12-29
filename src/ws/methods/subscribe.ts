import { WSMessageHandler } from '@ws/types';
import { manager } from '@core';
import { Chat, Message } from '@interfaces/api-types';
import { WatcherId } from '@interfaces/core';
import { WSMessage } from '@ws/types';
import { WSConnectionManager } from '@ws/manager';

export type SubscribePayload = {
  chatId: Chat['id'];
  lastMessageId?: Message['id'] | null;
};

type Context = {
  connectionManager: WSConnectionManager;
};

export const subscribe: WSMessageHandler<SubscribePayload, Context> = (
  { chatId, lastMessageId },
  { userId },
  ws,
  { connectionManager },
) => {
  if (!connectionManager.isSubscribed(chatId)) {
    const chat = manager.getChat(chatId);

    if (chat) {
      let unreceivedMessages: Message[] | null = [];

      if (lastMessageId) {
        unreceivedMessages = chat.getMessages(userId, lastMessageId);
      }

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
          connectionManager.deleteSubscribed(chat.id);
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

        connectionManager.addSubscribed(chat.id);
      }
    }
  }
};
