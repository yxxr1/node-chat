import {Response} from 'express'
import {Request} from '../interfaces'

import Chat from '../core/chat'
import {addChat, getAllChats} from '../core';
import Message from "../core/message";

export interface ChatI {
  id: string,
  name: string,
  messages: Message[]
}
interface CreateParams {
  name: string
}

module.exports.post = (req: Request, res: Response) => {
  const params: CreateParams = req.body;
  if (params.name.length < 3 || params.name.length > 16 || !/[a-zA-Zа-я0-9]/.test(params.name)) {
    throw new Error();
  }

  const chats = getAllChats();
  if( chats.find(({name}) => name === params.name) ){
    throw new Error();
  } else {
    const chat = new Chat(params.name, req.session.userId);
    addChat(chat);

    const response: ChatI = {id: chat.id, name: chat.name, messages: []}
    res.json(response);
  }
}

interface GetResponse {
  chats: ChatI[]
}

module.exports.get = (req: Request, res: Response) => {
  const _chats = getAllChats();
  const chats: ChatI[] = _chats.map(({id, name}: Chat) => ({id, name, messages: []}));
  const response: GetResponse = {chats}
  res.json(response);
}