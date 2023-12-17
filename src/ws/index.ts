import { Application, WebsocketRequestHandler } from 'express-ws';
import { SessionData } from 'express-session';
import { publish } from '@ws/publish';
import { subscribe } from '@ws/subscribe';
import { wsCheckSessionMiddleware } from '@middleware';
import { manager } from '@core';
import { Chat } from '@interfaces/api-types';
import { WSMessage } from '@ws/types';

const wsHandler: WebsocketRequestHandler = (ws, req) => {
  const { userId } = req.session;

  let subscribedChats: Chat['id'][] = [];

  ws.on('message', (data: string) => {
    const message: WSMessage = JSON.parse(data);

    switch (message.type) {
      case 'PUBLISH_MESSAGE':
        return publish(message.payload, req.session as SessionData, ws);
      case 'SUBSCRIBE_CHAT':
        if (!subscribedChats.includes(message.payload.chatId)) {
          const isSubscribed = subscribe(
            message.payload,
            req.session as SessionData,
            ws,
            {
              onWatcherClosed: () => {
                subscribedChats = subscribedChats.filter((chatId) => chatId !== message.payload.chatId);
              },
            }
          );

          if (isSubscribed) {
            subscribedChats.push(message.payload.chatId);
          }
        }

        return;
    }
  });

  const managerWatcherId = manager.subscribe(userId as string, (data) => {
    const message: WSMessage = {
      type: 'WATCH_CHATS',
      payload: data,
    }

    ws.send(JSON.stringify(message));
  });

  ws.on('error', () => {
    manager.unsubscribe(managerWatcherId);
  });

  ws.on('close', () => {
    manager.unsubscribe(managerWatcherId);
  });
}

export const initWs = (app: Application) => {
  app.ws('/ws', wsCheckSessionMiddleware, wsHandler);
}
