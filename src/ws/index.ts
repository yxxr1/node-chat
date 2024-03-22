import { Application, WebsocketRequestHandler } from 'express-ws';
import { SessionData } from 'express-session';
import { wsCheckSessionMiddleware } from '@middleware';
import { manager, MANAGER_SUBSCRIBE_TYPES } from '@core';
import { isId, isValidMessage } from '@utils/validation';
import { publish, subscribe, PublishPayload, SubscribePayload } from '@ws/methods';
import { WSMessage } from '@ws/types';
import { WSConnectionManager } from '@ws/manager';
import { getMessageHandler } from '@ws/utils';

const wsHandler: WebsocketRequestHandler = (ws, req) => {
  const { userId } = req.session;

  const connectionManager = new WSConnectionManager();

  ws.on(
    'message',
    getMessageHandler(
      {
        PUBLISH_MESSAGE: (payload: PublishPayload) => {
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
        SUBSCRIBE_CHAT: (payload: SubscribePayload) => {
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

  const managerDefaultWatcherId = manager.subscribe(userId as string, ({ type, payload }) => {
    if (type === MANAGER_SUBSCRIBE_TYPES.DEFAULT) {
      const message: WSMessage = {
        type: 'WATCH_CHATS',
        payload: { ...payload, updatedChats: [] },
      };

      ws.send(JSON.stringify(message));
    } else {
      ws.removeEventListener('error', defaultUnsubscribeWatcher);
      ws.removeEventListener('close', defaultUnsubscribeWatcher);
    }
  });

  const managerChatUpdatedWatcherId = manager.subscribe(
    userId as string,
    ({ type, payload }) => {
      if (type === MANAGER_SUBSCRIBE_TYPES.CHAT_UPDATED) {
        const { chatId, onlyForJoined } = payload;
        const chat = manager.getChat(chatId);

        if (chat && (!onlyForJoined || chat.isJoined(userId as string))) {
          const message: WSMessage = {
            type: 'WATCH_CHATS',
            payload: { updatedChats: [chat.getChatEntity(userId as string, false)], newChats: [], deletedChatsIds: [] },
          };

          ws.send(JSON.stringify(message));
        }
      } else {
        ws.removeEventListener('error', chatUpdatedUnsubscribeWatcher);
        ws.removeEventListener('close', chatUpdatedUnsubscribeWatcher);
      }
    },
    MANAGER_SUBSCRIBE_TYPES.CHAT_UPDATED,
  );

  ws.on('error', defaultUnsubscribeWatcher);
  ws.on('close', defaultUnsubscribeWatcher);
  ws.on('error', chatUpdatedUnsubscribeWatcher);
  ws.on('close', chatUpdatedUnsubscribeWatcher);
};

export const initWs = (app: Application) => {
  app.ws('/ws', wsCheckSessionMiddleware, wsHandler);
};
