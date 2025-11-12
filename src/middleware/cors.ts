import type { RequestHandler } from 'express';
import { COMMON_CONFIG } from '@/config/common';

export const corsMiddleware: RequestHandler = (req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', COMMON_CONFIG.CORS_URL);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Headers', 'content-type,authorization');
  next();
};
