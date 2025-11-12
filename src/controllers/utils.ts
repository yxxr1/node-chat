import type { Response } from 'express';
import { REFRESH_TOKEN_EXPIRES } from '@/services/token';

export const setRefreshTokenCookie = (res: Response, token: string) =>
  res.cookie('refreshToken', token, { httpOnly: true, maxAge: REFRESH_TOKEN_EXPIRES * 1000 });

export const resetRefreshTokenCookie = (res: Response) => res.cookie('refreshToken', undefined);
