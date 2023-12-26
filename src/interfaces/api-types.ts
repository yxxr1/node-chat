export type UserSettings = {
  connectionMethod: 'http' | 'ws';
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
};
