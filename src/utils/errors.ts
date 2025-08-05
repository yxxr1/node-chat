import { RequestHandler } from 'express';

export class HttpError extends Error {
  name = 'HttpError';
  status = 0;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export class ChatNotFound extends HttpError {
  name = 'ChatNotFound';

  constructor() {
    super(404, 'Chat not found');
  }
}

export class NotJoinedChat extends HttpError {
  name = 'NotJoinedChat';

  constructor() {
    super(403, 'Not joined to this chat');
  }
}

export const asyncHandler =
  <T>(handler: RequestHandler<T>): RequestHandler<T> =>
  (req, res, next) => {
    return Promise.resolve(handler(req, res, next)).catch(next);
  };
