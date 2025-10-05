import * as WebSocket from 'ws';
import type { SessionData } from 'express-session';
import type { SubscribedChatPayload, WatchChatsPayload } from '@controllers/types';
import type { PublishPayload, SubscribePayload } from './methods';

export type IncomingMessagesPayloads = {
  PUBLISH_MESSAGE: PublishPayload;
  SUBSCRIBE_CHAT: SubscribePayload;
};
export type IncomingMessageTypes = keyof IncomingMessagesPayloads;
export type WSIncomingMessage = {
  type: IncomingMessageTypes;
  payload: PublishPayload | SubscribePayload;
};

export type SubscribedChatMessage = {
  type: 'SUBSCRIBED_CHAT';
  payload: SubscribedChatPayload;
};
export type WatchChatsMessage = {
  type: 'WATCH_CHATS';
  payload: WatchChatsPayload;
};

export type WSMessageHandler<Payload, Context = void, Return = void> = (
  payload: Payload,
  session: SessionData,
  ws: WebSocket,
  context: Context,
) => Return;
