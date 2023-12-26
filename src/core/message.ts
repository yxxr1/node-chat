import { nanoid } from 'nanoid';
import moment from 'moment';

export const SERVICE_TYPES = {
  CHAT_JOINED: 1,
  CHAT_LEFT: 2,
};

export class Message {
  id: string;
  text: string | null;
  fromId: string;
  fromName: string | null;
  date: number;
  service?: number;
  index: number;

  constructor(text: string | null, fromId: string, fromName: string | null, service?: number) {
    this.id = nanoid();
    this.text = text;
    this.fromId = fromId;
    this.fromName = fromName;
    this.service = service;
    this.date = moment().valueOf();
    this.index = -1;
  }

  setIndex(index: number) {
    this.index = index;
  }
}
