export type User = {
  id: string;
  name: string;
};

export type Message = {
  id: string;
  text: string | null;
  fromId: string;
  fromName: string | null;
  date: Date | string;
  service?: number;
};

export type Chat = {
  id: string;
  name: string;
  messages: Message[];
};
