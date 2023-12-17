import { RequestHandler } from 'express';
import { WebsocketRequestHandler } from 'express-ws';
import { HttpError } from '@utils/errors';

export const checkSessionMiddleware: RequestHandler = (req, res, next) => {
  if (!req.session.userId) {
    throw new HttpError(401, 'Unauthorized');
  }

  next();
};

export const wsCheckSessionMiddleware: WebsocketRequestHandler = (ws, req, next) => {
  if (!req.session.userId) {
    return ws.terminate();
  }

  next();
};
