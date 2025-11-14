export const COMMON_CONFIG = {
  PORT: process.env.PORT || 8080,
  CORS_URL: process.env.CORS_URL || 'http://localhost:3000',
  MONGO_URL: process.env.MONGO_URL || 'mongodb://127.0.0.1/',
  MONGO_DB_NAME: process.env.MONGO_DB_NAME || 'chat-db',
  REDIS_URL: process.env.REDIS_URL || '', // redis://127.0.0.1/
  REDIS_CHANNEL_NAME: process.env.REDIS_CHANNEL_NAME || 'chat-broadcast-sync',
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || 'jwt-access-secret',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'jwt-refresh-secret',
};
