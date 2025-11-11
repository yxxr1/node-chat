import jwt, { JwtPayload } from 'jsonwebtoken';
import { COMMON_CONFIG } from '@config/common';
import { ACCESS_TOKEN_EXPIRES, REFRESH_TOKEN_EXPIRES } from './const';
import { TokenPair } from './types';

export class TokenService {
  generateTokens<T extends object>(payload: T): TokenPair {
    return {
      accessToken: jwt.sign({ ...payload }, COMMON_CONFIG.JWT_ACCESS_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRES }),
      refreshToken: jwt.sign({ ...payload }, COMMON_CONFIG.JWT_REFRESH_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRES }),
    };
  }

  verifyToken<T extends object>(token: string, isRefresh: boolean = false): (JwtPayload & T) | null {
    try {
      const secret = [COMMON_CONFIG.JWT_ACCESS_SECRET, COMMON_CONFIG.JWT_REFRESH_SECRET][Number(isRefresh)];
      return jwt.verify(token, secret) as JwtPayload & T;
    } catch {
      return null;
    }
  }
}

export const tokenService = new TokenService();
