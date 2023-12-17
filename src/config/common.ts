export const COMMON_CONFIG = {
  SESSION_SECRET: process.env.SESSION_SECRET || '123',
  PORT: process.env.PORT || 8080,
  CORS_URL: process.env.CORS_URL || 'http://localhost:3000',
};
