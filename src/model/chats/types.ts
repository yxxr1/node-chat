export interface Message {
  id: string;
  text: string | null;
  fromId: string;
  fromName: string | null;
  date: number;
  service?: number;
  index: number;
}

export interface ChatRecord {
  id: string;
  creatorId?: string;
  name: string;
  joinedUsers: string[];
  messages: Message[];
}

export type ChatInfo = Pick<ChatRecord, 'name' | 'creatorId'> & { joinedCount: number };
