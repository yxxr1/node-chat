import * as WebSocket from 'ws';
import { SessionData } from 'express-session';
import { Chat, Message } from '@interfaces/api-types';
import { PublishPayload, SubscribePayload } from '@ws/methods';

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
  payload: {
    chatId: Chat['id'];
    messages: Message[];
  };
};
export type WatchChatsMessage = {
  type: 'WATCH_CHATS';
  payload: {
    newChats: Chat[];
    deletedChatsIds: Chat['id'][];
    updatedChats: Chat[];
  };
};

export type WSMessageHandler<Payload, Context = void, Return = void> = (
  payload: Payload,
  session: SessionData,
  ws: WebSocket,
  context: Context,
) => Return;
