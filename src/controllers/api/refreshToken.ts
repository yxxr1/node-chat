import { RequestHandler } from 'express';
import { HttpError } from '@/utils/errors';
import { validateParams } from '@/utils/validation';
import { userService } from '@/services/user';
import type { TokenPair } from '@/controllers/types';
import { setRefreshTokenCookie } from '@/controllers/utils';

type Headers = { refreshToken: string };
type Output = TokenPair;

export const refreshToken: RequestHandler<Record<string, never>, Output> = async (req, res) => {
  const { refreshToken } = validateParams<Headers>(req);

  try {
    const newTokens = await userService.refreshTokens(refreshToken);

    setRefreshTokenCookie(res, newTokens.refreshToken);
    res.json(newTokens);
  } catch (e: unknown) {
    throw new HttpError(401, (e as Error).message);
  }
};
