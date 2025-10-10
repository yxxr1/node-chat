import { CONNECTION_METHODS, UI_THEMES } from '@const/settings';

export type UserSettings = {
  connectionMethod: (typeof CONNECTION_METHODS)[keyof typeof CONNECTION_METHODS];
  theme: (typeof UI_THEMES)[keyof typeof UI_THEMES];
  isNotificationsEnabled: boolean;
  isShowNotificationMessageText: boolean;
};

export type User = {
  id: string;
  name: string;
  settings: UserSettings;
};

export interface Message {
  id: string;
  text: string | null;
  fromId: string;
  fromName: string | null;
  date: number;
  service?: number;
  index: number;
}

export interface Chat {
  id: string;
  creatorId?: string;
  name: string;
  joinedUsers: string[];
  messages: Message[];
}

export type ChatInfo = Pick<Chat, 'name' | 'creatorId'> & { joinedCount: number };
