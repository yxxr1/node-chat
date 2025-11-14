import { Router } from 'express';
import { wsAuthMiddleware } from '@/middleware/auth';
import { wsHandler } from '@/controllers/ws';

export const router = Router();

router.ws('/', wsAuthMiddleware, wsHandler);
