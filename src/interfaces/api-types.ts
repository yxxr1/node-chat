import { Chat as ChatType } from './db-types';

export type { UserSettings, User, Message } from './db-types';

export type Chat = Pick<ChatType, 'id' | 'name' | 'messages'> & {
  joinedCount: number | null;
};
