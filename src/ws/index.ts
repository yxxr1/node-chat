import { Application, WebsocketRequestHandler } from 'express-ws';
import { SessionData } from 'express-session';
import { wsCheckSessionMiddleware } from '@middleware';
import { manager } from '@core';
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
        if (
          isId(payload.chatId) &&
          (isId(payload.lastMessageId) || payload.lastMessageId === undefined || payload.lastMessageId === null)
        ) {
          subscribe(payload, req.session as SessionData, ws, { connectionManager });
        }
      },
    }),
  );

  const unsubscribeWatcher = () => {
    manager.unsubscribe(managerWatcherId);
  };

  const managerWatcherId = manager.subscribe(userId as string, (data) => {
    if (data === null) {
      ws.removeEventListener('error', unsubscribeWatcher);
      ws.removeEventListener('close', unsubscribeWatcher);
    } else {
      const message: WSMessage = {
        type: 'WATCH_CHATS',
        payload: data,
      };

      ws.send(JSON.stringify(message));
    }
  });

  ws.on('error', unsubscribeWatcher);
  ws.on('close', unsubscribeWatcher);
};

export const initWs = (app: Application) => {
  app.ws('/ws', wsCheckSessionMiddleware, wsHandler);
};
