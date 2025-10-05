import { Application } from 'express-ws';
import { wsCheckSessionMiddleware } from '@middleware';
import { wsHandler } from '@controllers/ws';

export const initWs = (app: Application) => {
  app.ws('/ws', wsCheckSessionMiddleware, wsHandler);
};
