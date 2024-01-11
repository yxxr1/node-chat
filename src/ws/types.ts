import * as WebSocket from 'ws';
import { SessionData } from 'express-session';
import { Chat, Message } from '@interfaces/api-types';

export type WSMessage =
  | {
      type: 'SUBSCRIBED_CHAT';
      payload: {
        chatId: Chat['id'];
        messages: Message[];
      };
    }
  | {
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
