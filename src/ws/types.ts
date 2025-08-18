import * as WebSocket from 'ws';
import { SessionData } from 'express-session';
import { PublishPayload, SubscribePayload } from '@ws/methods';
import { SubscribedChat, WatchChats } from '@interfaces/subscribe-data';

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
  payload: SubscribedChat;
};
export type WatchChatsMessage = {
  type: 'WATCH_CHATS';
  payload: WatchChats;
};

export type WSMessageHandler<Payload, Context = void, Return = void> = (
  payload: Payload,
  session: SessionData,
  ws: WebSocket,
  context: Context,
) => Return;
