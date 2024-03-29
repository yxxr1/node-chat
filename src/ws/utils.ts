import { Request } from 'express';

type MessageHandler = {
  [type: string]: (payload: any) => void;
};

const isObject = (value: any) => value && typeof value === 'object';

export const getMessageHandler = (handlers: MessageHandler, req: Request) => (data: string) => {
  try {
    const message: any = JSON.parse(data);

    if (isObject(message)) {
      const { type, payload } = message;

      if (typeof type === 'string' && isObject(payload)) {
        req.session.reload(() => {
          handlers[type]?.(payload);
        });
      }
    }
  } catch (e: unknown) {
    console.error('ws error: ', (e as Error).message);
  }
};
