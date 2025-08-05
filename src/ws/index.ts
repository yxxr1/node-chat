import { Application, WebsocketRequestHandler } from 'express-ws';
import { SessionData } from 'express-session';
import { wsCheckSessionMiddleware } from '@middleware';
import { manager, MANAGER_SUBSCRIBE_TYPES } from '@core';
import { isId, isValidMessage } from '@utils/validation';
import { publish, subscribe } from '@ws/methods';
import { WatchChatsMessage } from '@ws/types';
import { WSConnectionManager } from '@ws/manager';
import { getMessageHandler } from '@ws/utils';

const wsHandler: WebsocketRequestHandler = async (ws, req) => {
  const { userId } = req.session;

  const connectionManager = new WSConnectionManager();

  ws.on(
    'message',
    getMessageHandler(
      {
        PUBLISH_MESSAGE: (payload) => {
          if (isId(payload.chatId) && isValidMessage(payload.message)) {
            publish(
              {
                ...payload,
                message: payload.message.trim(),
              },
              req.session as SessionData,
              ws,
            );
          }
        },
        SUBSCRIBE_CHAT: (payload) => {
          if (
            isId(payload.chatId) &&
            (isId(payload.lastMessageId) || payload.lastMessageId === undefined || payload.lastMessageId === null)
          ) {
            subscribe(payload, req.session as SessionData, ws, { connectionManager });
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

  const managerDefaultWatcherId = await manager.subscribe(
    userId as string,
    (payload) => {
      const message: WatchChatsMessage = {
        type: 'WATCH_CHATS',
        payload: { ...payload, updatedChats: [] },
      };

      ws.send(JSON.stringify(message));
    },
    MANAGER_SUBSCRIBE_TYPES.DEFAULT,
    () => {
      ws.removeEventListener('error', defaultUnsubscribeWatcher);
      ws.removeEventListener('close', defaultUnsubscribeWatcher);
    },
  );

  const managerChatUpdatedWatcherId = await manager.subscribe(
    userId as string,
    async ({ chatId, onlyForJoined }) => {
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

export const initWs = (app: Application) => {
  app.ws('/ws', wsCheckSessionMiddleware, wsHandler);
};
