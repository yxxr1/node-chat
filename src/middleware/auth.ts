import { RequestHandler } from 'express';
import { WebsocketRequestHandler } from 'express-ws';
import { HttpError } from '@/utils/errors';
import { tokenService } from '@/services/token';
import { UserDto } from '@/services/user';

export const authMiddleware: RequestHandler = (req, res, next) => {
  const accessToken = req.headers.authorization?.split(' ')[1];

  if (accessToken) {
    const data = tokenService.verifyToken<UserDto>(accessToken);

    if (data) {
      req.tokenData = data;
      return next();
    }
  }

  throw new HttpError(401, 'Unauthorized');
};

export const authByRefreshTokenMiddleware: RequestHandler = (req, res, next) => {
  const { refreshToken } = req.cookies;

  if (refreshToken) {
    const data = tokenService.verifyToken<UserDto>(refreshToken, true);

    if (data) {
      req.tokenData = data;
      return next();
    }
  }

  throw new HttpError(401, 'Unauthorized');
};

export const wsAuthMiddleware: WebsocketRequestHandler = (ws, req, next) => {
  const { refreshToken } = req.cookies;

  if (refreshToken) {
    const data = tokenService.verifyToken<UserDto>(refreshToken, true);

    if (data) {
      req.tokenData = data;
      return next();
    }
  }

  ws.terminate();
};
