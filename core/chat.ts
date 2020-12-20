import {Response} from 'express'
import Message from './message'

const REQUEST_TIMEOUT = 10000;

interface MessagesResponse {
  messages: Message[]
}

export default class Chat {
  id: string
  creator?: string
  name: string
  connections: any
  history: Message[]
  _t: any

  constructor(
      name: string,
      creatorId?: string
  ) {
    this.id = Math.random().toString().slice(2);
    this.creator = creatorId;
    this.name = name;
    this.connections = {};
    let history: Message[] = [];
    this.history = history;

    this._t = setInterval(() => {
      console.log(this.id, this.name, Object.keys(this.connections).length)
    }, 2000)
  }

  _closeConnection(userId: string, _messages?: Message[], statusCode?: number){
    if (!this.connections[userId]) return;
    let messages = _messages ? _messages : [];
    const response: MessagesResponse = {messages}
    const {res, timerId} = this.connections[userId];
    res.statusCode = statusCode ? statusCode : 200;
    res.json(response);
    clearInterval(timerId);
    this.connections[userId] = null;
  }

  _broadcast(messages: Message[]){
    Object.keys(this.connections).forEach(key => {
      this._closeConnection(key, messages);
    })
  }

  join(userId: string, userName: string | null, res: Response){
    if (this.connections[userId] === undefined) { // auth
      this.connections[userId] = null;
    }

    const message: Message = new Message(null, userId, userName, 1);
    this._broadcast([message]);

    const response: MessagesResponse = {messages: this.history}
    res.json(response);
  }

  subscribe(userId: string, res: Response){
    const connection = this.connections[userId];
    if (connection !== undefined) {
      if (connection !== null) {
        this._closeConnection(userId);
      }

      const timerId = setTimeout(() => { // no data
        this._closeConnection(userId, [], 204);
      }, REQUEST_TIMEOUT);
      this.connections[userId] = {res, timerId};

      res.on('close', () => {
        clearTimeout(timerId);
        if (this.connections[userId]) this.connections[userId] = null;
      });

    } else { // not joined

      res.statusCode = 403;
      res.end('not in chat');

    }
  }

  publish(text: string, fromId: string, fromName: string | null, res: Response){
    if (this.connections[fromId] !== undefined) {
      const message: Message = new Message(text, fromId, fromName);

      this.history.push(message);

      this._broadcast([message]);

      res.statusCode = 201;
      res.json({});
    } else {
      res.statusCode = 403;
      res.end('not in chat');
    }
  }

  quit(userId: string, userName: string | null){
    if (this.connections[userId]) {
      this._closeConnection(userId);
    }
    delete this.connections[userId];

    const message: Message = new Message(null, userId, userName, 2);
    this._broadcast([message]);

    return Object.keys(this.connections).length;
  }

  _closeChat(){
    Object.keys(this.connections).forEach(key => {
      this._closeConnection(key);
    });
    this.connections = {};
    this.history = [];

    clearInterval(this._t)
  }
}