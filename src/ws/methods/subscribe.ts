import { WSMessageHandler } from '@ws/types';
import { manager, DEFAULT_TYPE } from '@core';
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

export const subscribe: WSMessageHandler<SubscribePayload, Context> = async (
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
        unreceivedMessages = await chat.getMessages(userId, lastMessageId);
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

      const watcherId = await chat.subscribe(userId, ({ type, payload }) => {
        if (type === DEFAULT_TYPE) {
          const message: WSMessage = {
            type: 'SUBSCRIBED_CHAT',
            payload: {
              ...payload,
              chatId: chat.id,
            },
          };

          ws.send(JSON.stringify(message));
        } else {
          ws.removeEventListener('error', unsubscribeWatcher);
          ws.removeEventListener('close', unsubscribeWatcher);
          connectionManager.deleteSubscribed(chat.id);
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
