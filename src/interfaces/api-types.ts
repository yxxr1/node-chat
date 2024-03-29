import { CONNECTION_METHODS, UI_THEMES } from '@const/settings';

export type UserSettings = {
  connectionMethod: (typeof CONNECTION_METHODS)[keyof typeof CONNECTION_METHODS];
  theme: (typeof UI_THEMES)[keyof typeof UI_THEMES];
};

export type User = {
  id: string;
  name: string;
  settings: UserSettings;
};

export type Message = {
  id: string;
  text: string | null;
  fromId: string;
  fromName: string | null;
  date: number;
  service?: number;
  index: number;
};

export type Chat = {
  id: string;
  name: string;
  messages: Message[];
  joinedCount: number | null;
};
