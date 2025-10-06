import { WebsocketRequestHandler } from 'express-ws';
import { SessionData } from 'express-session';
import { manager, MANAGER_SUBSCRIBE_TYPES } from '@services/chat';
import { isId, isValidMessage } from '@utils/validation';
import { publish, subscribe } from './methods';
import type { WatchChatsMessage } from './types';
import { WSConnectionManager } from './manager';
import { getMessageHandler } from './utils';

export const wsHandler: WebsocketRequestHandler = async (ws, req) => {
  const { userId } = req.session;

  const connectionManager = new WSConnectionManager();

  ws.on(
    'message',
    getMessageHandler(
      {
        PUBLISH_MESSAGE: ({ chatId, message }) => {
          if (isId(chatId) && isValidMessage(message)) {
            publish(
              {
                chatId,
                message: message.trim(),
              },
              req.session as SessionData,
              ws,
            );
          }
        },
        SUBSCRIBE_CHAT: ({ chatId, lastMessageId }) => {
          if (isId(chatId) && (isId(lastMessageId) || lastMessageId === undefined || lastMessageId === null)) {
            subscribe({ chatId, lastMessageId }, req.session as SessionData, ws, { connectionManager });
          }
        },
      },
      req,
    ),
  );

  const defaultUnsubscribeWatcher = () => {
    manager.unsubscribe(managerDefaultWatcherId);
  };
  const chatUpdatedUnsubscribeWatcher = () => {
    manager.unsubscribe(managerChatUpdatedWatcherId);
  };

  const managerDefaultWatcherId = manager.subscribe(
    userId as string,
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
    userId as string,
    async ({ payload }) => {
      const { chatId, onlyForJoined } = payload;

      const chat = manager.getChat(chatId);

      if (chat && (!onlyForJoined || (await chat.isJoined(userId as string)))) {
        const message: WatchChatsMessage = {
          type: 'WATCH_CHATS',
          payload: { updatedChats: [await chat.getChatEntity(userId as string, false)], newChats: [], deletedChatsIds: [] },
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
