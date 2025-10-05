import { manager, CHAT_SUBSCRIBE_TYPES } from '@services/chat';
import type { Chat, Message } from '@controllers/types';
import type { WatcherId } from '@services/chat/types';
import { WSConnectionManager } from '../manager';
import type { SubscribedChatMessage, WSMessageHandler } from '../types';

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
        const message: SubscribedChatMessage = {
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

      const watcherId = await chat.subscribeIfJoined(
        userId,
        ({ payload }) => {
          const message: SubscribedChatMessage = {
            type: 'SUBSCRIBED_CHAT',
            payload,
          };

          ws.send(JSON.stringify(message));
        },
        CHAT_SUBSCRIBE_TYPES.NEW_MESSAGES,
        () => {
          ws.removeEventListener('error', unsubscribeWatcher);
          ws.removeEventListener('close', unsubscribeWatcher);
          connectionManager.deleteSubscribed(chat.id);
        },
      );

      if (watcherId !== null) {
        ws.on('error', unsubscribeWatcher);
        ws.on('close', unsubscribeWatcher);

        connectionManager.addSubscribed(chat.id);
      }
    }
  }
};
