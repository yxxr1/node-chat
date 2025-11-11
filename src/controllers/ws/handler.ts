import { WebsocketRequestHandler } from 'express-ws';
import { manager, MANAGER_SUBSCRIBE_TYPES } from '@services/chat';
import { getTokenData, isId, isValidMessage } from '@utils/validation';
import { publish, subscribe } from './methods';
import type { WatchChatsMessage } from './types';
import { WSConnectionManager } from './manager';
import { getMessageHandler } from './utils';

export const wsHandler: WebsocketRequestHandler = async (ws, req) => {
  const tokenData = getTokenData(req);
  const { id: userId } = tokenData;

  const connectionManager = new WSConnectionManager();

  const handlerContext = { connectionManager };
  const handlerArgs = [tokenData, ws, handlerContext] as const;

  ws.on(
    'message',
    getMessageHandler({
      PUBLISH_MESSAGE: ({ chatId, message }) => {
        if (isId(chatId) && isValidMessage(message)) {
          const payload = {
            chatId,
            message: message.trim(),
          };

          publish(payload, ...handlerArgs);
        }
      },
      SUBSCRIBE_CHAT: ({ chatId, lastMessageId }) => {
        if (isId(chatId) && (isId(lastMessageId) || lastMessageId === undefined || lastMessageId === null)) {
          const payload = { chatId, lastMessageId };
          subscribe(payload, ...handlerArgs);
        }
      },
    }),
  );

  const defaultUnsubscribeWatcher = () => {
    manager.unsubscribe(managerDefaultWatcherId);
  };
  const chatUpdatedUnsubscribeWatcher = () => {
    manager.unsubscribe(managerChatUpdatedWatcherId);
  };

  const managerDefaultWatcherId = manager.subscribe(
    userId,
    ({ payload }) => {
      const message: WatchChatsMessage = {
        type: 'WATCH_CHATS',
        payload: { ...payload, updatedChats: [] },
      };

      ws.send(JSON.stringify(message));
    },
    MANAGER_SUBSCRIBE_TYPES.CHAT_LIST_UPDATED,
    () => {
      ws.removeEventListener('error', defaultUnsubscribeWatcher);
      ws.removeEventListener('close', defaultUnsubscribeWatcher);
    },
  );

  const managerChatUpdatedWatcherId = manager.subscribe(
    userId,
    async ({ payload }) => {
      const { chatId, onlyForJoined } = payload;

      const chat = manager.getChat(chatId);

      if (chat && (!onlyForJoined || (await chat.isJoined(userId)))) {
        const message: WatchChatsMessage = {
          type: 'WATCH_CHATS',
          payload: { updatedChats: [await chat.getChatEntity(userId, false)], newChats: [], deletedChatsIds: [] },
        };

        ws.send(JSON.stringify(message));
      }
    },
    MANAGER_SUBSCRIBE_TYPES.CHAT_UPDATED,
    () => {
      ws.removeEventListener('error', chatUpdatedUnsubscribeWatcher);
      ws.removeEventListener('close', chatUpdatedUnsubscribeWatcher);
    },
  );

  ws.on('error', defaultUnsubscribeWatcher);
  ws.on('close', defaultUnsubscribeWatcher);
  ws.on('error', chatUpdatedUnsubscribeWatcher);
  ws.on('close', chatUpdatedUnsubscribeWatcher);
};
