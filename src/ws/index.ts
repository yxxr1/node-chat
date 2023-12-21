import { Application, WebsocketRequestHandler } from 'express-ws';
import { SessionData } from 'express-session';
import { publish } from '@ws/publish';
import { subscribe } from '@ws/subscribe';
import { wsCheckSessionMiddleware } from '@middleware';
import { manager } from '@core';
import { WSMessage } from '@ws/types';
import { PublishPayload } from '@ws/publish';
import { SubscribePayload } from '@ws/subscribe';
import { isId, isValidMessage } from '@utils/validation';
import { WSConnectionManager } from '@ws/manager';
import { getMessageHandler } from '@ws/utils';

const wsHandler: WebsocketRequestHandler = (ws, req) => {
  const { userId } = req.session;

  const connectionManager = new WSConnectionManager();

  ws.on(
    'message',
    getMessageHandler({
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
        if (isId(payload.chatId) && isId(payload.lastMessageId)) {
          subscribe(payload, req.session as SessionData, ws, { connectionManager });
        }
      },
    }),
  );

  const managerWatcherId = manager.subscribe(userId as string, (data) => {
    const message: WSMessage = {
      type: 'WATCH_CHATS',
      payload: data,
    };

    ws.send(JSON.stringify(message));
  });

  ws.on('error', () => {
    manager.unsubscribe(managerWatcherId);
  });

  ws.on('close', () => {
    manager.unsubscribe(managerWatcherId);
  });
};

export const initWs = (app: Application) => {
  app.ws('/ws', wsCheckSessionMiddleware, wsHandler);
};
