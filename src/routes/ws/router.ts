import { Router } from 'express';
import { wsCheckSessionMiddleware } from '@middleware';
import { wsHandler } from '@controllers/ws';

export const router = Router();

router.ws('/', wsCheckSessionMiddleware, wsHandler);
