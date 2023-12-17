import * as WebSocket from 'ws';
import { SessionData } from 'express-session';
import { PublishPayload } from '@ws/publish';
import { SubscribePayload } from '@ws/subscribe';
import { ChatSubscribeData, ManagerSubscribeData } from '@core';
import { Chat } from '@interfaces/api-types';

export type WSMessage =
  | {
      type: 'PUBLISH_MESSAGE';
      payload: PublishPayload;
    }
  | {
      type: 'SUBSCRIBE_CHAT';
      payload: SubscribePayload;
    }
  | {
      type: 'SUBSCRIBED_CHAT';
      payload: ChatSubscribeData & { chatId: Chat['id'] };
    }
  | {
      type: 'WATCH_CHATS';
      payload: ManagerSubscribeData;
    };

export type WSMessageHandler<Payload, Context = void, Return = void> = (
  payload: Payload,
  session: SessionData,
  ws: WebSocket,
  context: Context,
) => Return;
