import { Request } from 'express';
import { isObject } from '@utils/common';
import type { IncomingMessagesPayloads, IncomingMessageTypes, WSIncomingMessage } from './types';

type Callback<T = WSIncomingMessage['payload']> = (payload: T) => void;

type MessageHandlers = {
  [K in IncomingMessageTypes]: Callback<IncomingMessagesPayloads[K]>;
};

const isWSIncomingMessage = (data: unknown): data is WSIncomingMessage =>
  isObject(data) && typeof data.type === 'string' && isObject(data.payload);

export const getMessageHandler = (handlers: MessageHandlers, req: Request) => (data: string) => {
  try {
    const message = JSON.parse(data);

    if (isWSIncomingMessage(message)) {
      const { type, payload } = message;

      req.session.reload(() => {
        (handlers[type] as Callback)?.(payload);
      });
    }
  } catch (e: unknown) {
    console.error('ws error: ', (e as Error).message);
  }
};
